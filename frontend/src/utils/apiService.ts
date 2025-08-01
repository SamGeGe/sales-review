import { message } from 'antd';
import config from './config';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface StreamEvent {
  type: 'status' | 'content' | 'complete' | 'error';
  message?: string;
  progress?: number;
  content?: string;
  report?: string;
  timestamp?: string;
}

class ApiService {
  private baseURL: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    // 从配置文件读取后端地址
    this.baseURL = config.getFrontend().backend_url;
    this.maxRetries = 3;
    this.retryDelay = 2000; // 2秒
  }

  // 检查后端连接状态
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(5000) // 5秒超时
      });
      return response.ok;
    } catch (error) {
      console.error('后端连接检查失败:', error);
      return false;
    }
  }

  // 带重试的API请求
  async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      // 首先检查连接
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        if (retryCount === 0) {
          message.warning('正在尝试连接后端服务...');
        }
        
        if (retryCount < this.maxRetries) {
          await this.delay(this.retryDelay);
          return this.request(endpoint, options, retryCount + 1);
        } else {
          message.error('无法连接到后端服务，请检查服务是否启动');
          return {
            success: false,
            error: '后端服务连接失败'
          };
        }
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(30000) // 30秒超时
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      
      // 如果后端返回的数据已经包含 success 字段，直接返回
      if (responseData.hasOwnProperty('success')) {
        return responseData;
      }
      
      // 否则包装成标准格式
      return {
        success: true,
        data: responseData
      };

    } catch (error: any) {
      console.error('API请求失败:', error);
      
      // 网络错误或连接失败
      if (error.name === 'TypeError' || error.name === 'AbortError') {
        if (retryCount < this.maxRetries) {
          message.warning(`连接失败，正在重试... (${retryCount + 1}/${this.maxRetries})`);
          await this.delay(this.retryDelay);
          return this.request(endpoint, options, retryCount + 1);
        } else {
          message.error('连接后端服务失败，请检查网络连接或联系管理员');
          return {
            success: false,
            error: '网络连接失败'
          };
        }
      }

      // 其他错误
      message.error(`请求失败: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 流式生成报告
  async generateReportStream(
    reviewData: any,
    onStatus?: (message: string, progress: number) => void,
    onContent?: (content: string) => void,
    onComplete?: (report: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    try {
      // 检查连接
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('后端服务连接失败');
      }

      console.log('🚀 开始流式生成报告...');

      // 发送POST请求并处理流式响应
      const response = await fetch(`${this.baseURL}/api/reports/generate-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify(reviewData),
        signal: AbortSignal.timeout(120000) // 120秒超时
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      console.log('📡 开始读取流式数据...');

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('📡 流式数据读取完成');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamEvent = JSON.parse(line.slice(6));
              console.log('📡 SSE数据:', data.type, data.message || data.content?.substring(0, 50) || '');
              
              switch (data.type) {
                case 'status':
                  if (onStatus && data.message && data.progress !== undefined) {
                    console.log('📊 状态更新:', data.message, data.progress);
                    onStatus(data.message, data.progress);
                  }
                  break;
                  
                case 'content':
                  if (onContent && data.content) {
                    console.log('📝 内容块长度:', data.content.length);
                    accumulatedContent += data.content;
                    onContent(data.content);
                  }
                  break;
                  
                case 'complete':
                  if (onComplete && data.report) {
                    console.log('✅ 报告完成，总长度:', data.report.length);
                    onComplete(data.report);
                  } else if (onComplete && accumulatedContent) {
                    console.log('✅ 使用累计内容作为完整报告，长度:', accumulatedContent.length);
                    onComplete(accumulatedContent);
                  }
                  return;
                  
                case 'error':
                  if (onError && data.message) {
                    console.error('❌ 错误:', data.message);
                    onError(data.message);
                  }
                  return;
              }
            } catch (error) {
              console.error('解析SSE数据失败:', error, '原始数据:', line);
            }
          }
        }
      }

      // 如果流结束但没有收到complete事件，使用累计内容
      if (accumulatedContent && onComplete) {
        console.log('⚠️ 流结束但未收到complete事件，使用累计内容');
        onComplete(accumulatedContent);
      }

    } catch (error: any) {
      console.error('流式报告生成失败:', error);
      // 如果是流中断但内容已经生成，不抛出错误
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        console.log('⚠️ 流被中断，但内容可能已经生成');
        // 不调用onError，让前端自己判断
        return;
      }
      if (onError) {
        onError(error.message);
      }
    }
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 生成AI报告（原有方法，保留兼容性）
  async generateReport(reviewData: any): Promise<ApiResponse> {
    return this.request('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  // 下载文件
  async downloadFile(url: string, filename: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(60000) // 60秒超时
      });
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return true;
    } catch (error: any) {
      console.error('文件下载失败:', error);
      message.error(`下载失败: ${error.message}`);
      return false;
    }
  }

  // 用户管理API
  async getUsers(): Promise<ApiResponse<any[]>> {
    return this.request('/api/users');
  }

  async addUser(name: string): Promise<ApiResponse<any>> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  async updateUser(id: number, name: string): Promise<ApiResponse<any>> {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  }

  async deleteUser(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE'
    });
  }

  // 复盘报告管理API
  async saveReviewReport(reviewData: any): Promise<ApiResponse<any>> {
    return this.request('/api/reports/save', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  async getReviewHistory(): Promise<ApiResponse<any[]>> {
    return this.request('/api/reports/history');
  }

  async getReviewDetail(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/reports/detail/${id}`);
  }

  async deleteReviewReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/reports/${id}`, {
      method: 'DELETE'
    });
  }

  async lockReviewReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/reports/${id}/lock`, {
      method: 'PUT'
    });
  }

  async unlockReviewReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/reports/${id}/unlock`, {
      method: 'PUT'
    });
  }

  // 获取周详情
  async getWeekDetail(weekId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/weeks/${weekId}`);
  }

  // 获取整合报告
  async getIntegrationReport(weekId: number): Promise<ApiResponse<any>> {
    return this.request(`/api/reports/integration-report/${weekId}`);
  }

  // 保存整合报告
  async saveIntegrationReport(data: {
    weekId: number;
    weekNumber: number;
    dateRange: string;
    userNames: string;
    reportContent: string;
    filePath?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/api/reports/integration-report/save', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 锁定整合报告
  async lockIntegrationReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/reports/integration-report/${id}/lock`, {
      method: 'PUT'
    });
  }

  // 解锁整合报告
  async unlockIntegrationReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/reports/integration-report/${id}/unlock`, {
      method: 'PUT'
    });
  }

  // 删除整合报告
  async deleteIntegrationReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/api/reports/integration-report/${id}`, {
      method: 'DELETE'
    });
  }

  // 下载整合报告
  async downloadIntegrationReport(id: number, format: 'word' | 'pdf'): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/api/reports/integration-report/${id}/download/${format}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
      signal: AbortSignal.timeout(300000) // 5分钟超时
    });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    return response.blob();
  }

  // 通用GET请求
  async get(endpoint: string): Promise<ApiResponse<any>> {
    return this.request(endpoint, { method: 'GET' });
  }

  // 通用DELETE请求
  async delete(endpoint: string): Promise<ApiResponse<any>> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // 通用PUT请求
  async put(endpoint: string, data?: any): Promise<ApiResponse<any>> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  // 获取基础URL
  getBaseUrl(): string {
    return this.baseURL;
  }
}

const apiService = new ApiService();
export default apiService; 