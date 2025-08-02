import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Tag,
  Typography,
  Row,
  Col,
  Divider,
  Tooltip
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  LockOutlined,
  UnlockOutlined,
  RobotOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiService from '../utils/apiService';

const { Title, Text } = Typography;

interface WeekDetailProps {}

interface Report {
  id: number;
  user_name: string;
  review_method: string;
  created_at: string;
  date_range_start: string;
  date_range_end: string;
}

interface WeekData {
  id: number;
  week_number: number;
  year: number;
  date_range_start: string;
  date_range_end: string;
  report_count: number;
}

interface IntegrationReport {
  id: number;
  week_id: number;
  week_number: number;
  date_range: string;
  user_names: string;
  report_content: string;
  file_path: string;
  created_at: string;
  updated_at: string;
}

const WeekDetail: React.FC<WeekDetailProps> = () => {
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [integrationReport, setIntegrationReport] = useState<IntegrationReport | null>(null);
  const [integrationLoading, setIntegrationLoading] = useState(false);
  const [isGeneratingAIReport, setIsGeneratingAIReport] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteModalData, setDeleteModalData] = useState<{
    reportId: number;
    isBatch: boolean;
    count?: number;
    isIntegrationReport?: boolean;
    mouseX?: number;
    mouseY?: number;
  } | null>(null);

  // 监控按钮状态变化
  useEffect(() => {
    console.log('🔍 [前端] isGeneratingAIReport状态变化:', isGeneratingAIReport, new Date().toISOString());
  }, [isGeneratingAIReport]);

  // 强制更新按钮状态的函数
  const forceUpdateButtonState = useCallback(() => {
    console.log('🔍 [前端] 强制更新按钮状态函数被调用');
    setIsGeneratingAIReport(false);
  }, []);

  // 获取周数据
  const fetchWeekData = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getWeekDetail(parseInt(weekId!));
      
      if (response.success) {
        setWeekData(response.data.week);
        setReports(response.data.reports);
      } else {
        message.error('获取周数据失败');
      }
    } catch (error) {
      console.error('获取周数据失败:', error);
      message.error('获取周数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrationReport = async () => {
    try {
      setIntegrationLoading(true);
      console.log('🔍 [前端] 开始获取整合报告，weekId:', weekId);
      const response = await apiService.getIntegrationReport(parseInt(weekId!));
      console.log('🔍 [前端] 获取整合报告响应:', response);
      
      if (response.success && response.data) {
        console.log('🔍 [前端] 设置整合报告数据:', response.data);
        setIntegrationReport(response.data);
      } else {
        console.log('🔍 [前端] 没有找到整合报告，清空状态');
        setIntegrationReport(null);
      }
    } catch (error) {
      console.error('🔍 [前端] 获取整合报告失败:', error);
      setIntegrationReport(null);
    } finally {
      setIntegrationLoading(false);
    }
  };

  useEffect(() => {
    if (weekId) {
      fetchWeekData();
      fetchIntegrationReport();
    }
  }, [weekId]);

  const handleDownloadReport = async (report: Report) => {
    try {
      message.loading('正在生成报告...', 0);
      
      // 使用前端页面显示的参数
      const weekNumber = weekData?.week_number;
      const startDate = dayjs(report.date_range_start).format('YYYY年M月D日');
      const endDate = dayjs(report.date_range_end).format('YYYY年M月D日');
      const dateRange = `${startDate}-${endDate}`;
      const userName = report.user_name;

      const response = await fetch(`${apiService.getBaseUrl()}/api/reports/download/word/${report.id}?week_number=${weekNumber}&date_range=${dateRange}&user_name=${encodeURIComponent(userName)}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(300000) // 5分钟超时
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 使用前端页面显示的参数生成文件名
        const fileName = `${userName}-第${weekNumber}周-${dateRange}复盘明细.docx`;
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        message.destroy();
        message.success('报告下载成功');
      } else {
        const errorText = await response.text();
        console.error('下载失败 - 响应状态:', response.status, response.statusText);
        console.error('下载失败 - 响应内容:', errorText);
        message.destroy();
        message.error(`下载失败: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('下载失败 - 网络错误:', error);
      message.destroy();
      message.error(`下载失败: ${error.message}`);
    }
  };

  const handleDownloadPdf = async (report: Report) => {
    try {
      message.loading('正在生成PDF...', 0);
      
      // 使用前端页面显示的参数
      const weekNumber = weekData?.week_number;
      const startDate = dayjs(report.date_range_start).format('YYYY年M月D日');
      const endDate = dayjs(report.date_range_end).format('YYYY年M月D日');
      const dateRange = `${startDate}-${endDate}`;
      const userName = report.user_name;

      const response = await fetch(`${apiService.getBaseUrl()}/api/reports/download/pdf/${report.id}?week_number=${weekNumber}&date_range=${dateRange}&user_name=${encodeURIComponent(userName)}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(300000) // 5分钟超时
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 使用前端页面显示的参数生成文件名
        const fileName = `${userName}-第${weekNumber}周-${dateRange}复盘明细.pdf`;
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        message.destroy();
        message.success('PDF下载成功');
      } else {
        const errorText = await response.text();
        console.error('PDF下载失败 - 响应状态:', response.status, response.statusText);
        console.error('PDF下载失败 - 响应内容:', errorText);
        message.destroy();
        message.error(`PDF下载失败: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('PDF下载失败 - 网络错误:', error);
      message.destroy();
      message.error(`PDF下载失败: ${error.message}`);
    }
  };

  const handleBatchDownload = async (format: 'word' | 'pdf') => {
    if (selectedReports.length === 0) {
      message.warning('请先选择要下载的报告');
      return;
    }

    try {
      message.loading('正在生成批量文件...', 0);
      
      // 使用前端页面显示的参数
      const weekNumber = weekData?.week_number;
      const startDate = dayjs(weekData?.date_range_start).format('YYYY年M月D日');
      const endDate = dayjs(weekData?.date_range_end).format('YYYY年M月D日');
      const dateRange = `${startDate}-${endDate}`;

      const response = await fetch(`${apiService.getBaseUrl()}/api/reports/batch-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportIds: selectedReports,
          format,
          week_number: weekNumber,
          date_range: dateRange
        }),
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(300000) // 5分钟超时
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 使用前端页面显示的参数生成文件名
        const fileName = `第${weekNumber}周-${dateRange}批量复盘明细.zip`;
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        message.destroy();
        message.success(`批量下载成功，共 ${selectedReports.length} 份报告`);
        setSelectedReports([]);
      } else {
        const errorText = await response.text();
        console.error('批量下载失败 - 响应状态:', response.status, response.statusText);
        console.error('批量下载失败 - 响应内容:', errorText);
        message.destroy();
        message.error(`批量下载失败: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('批量下载失败 - 网络错误:', error);
      message.destroy();
      message.error(`批量下载失败: ${error.message}`);
    }
  };

  const handleGenerateAIReport = async () => {
    if (selectedReports.length === 0) {
      message.warning('请先选择要生成AI整合报告的报告');
      return;
    }
    
    try {
      setIsGeneratingAIReport(true);
      
      // 显示加载状态
      const loadingKey = 'ai-report-loading';
      message.loading({
        content: '正在准备生成AI整合报告...',
        key: loadingKey,
        duration: 0
      });
      
      // 先删除现有的整合报告（如果存在）
      if (integrationReport) {
        console.log('🔍 [前端] 删除现有整合报告，ID:', integrationReport.id);
        try {
          await apiService.deleteIntegrationReport(integrationReport.id);
          console.log('🔍 [前端] 现有整合报告删除成功');
          setIntegrationReport(null);
        } catch (error) {
          console.error('🔍 [前端] 删除现有整合报告失败:', error);
          // 即使删除失败也继续生成新报告
        }
      }
      
      const weekNumber = weekData?.week_number;
      const startDate = dayjs(weekData?.date_range_start).format('YYYY年M月D日');
      const endDate = dayjs(weekData?.date_range_end).format('YYYY年M月D日');
      const dateRange = `${startDate}-${endDate}`;
      const requestBody = {
        reportIds: selectedReports,
        week_number: weekNumber,
        date_range: dateRange
      };
      
      // 使用流式推送
      const response = await fetch(`${apiService.getBaseUrl()}/api/reports/generate-ai-report-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        mode: 'cors', 
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }
      
      let content = '';
      let progressMessage = '';
      let isComplete = false;
      
      // 创建临时的整合报告对象
      const tempIntegrationReport: IntegrationReport = {
        id: 0,
        week_id: parseInt(weekId!),
        week_number: weekNumber || 0,
        date_range: dateRange,
        user_names: '',
        report_content: '',
        file_path: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // 立即显示空的整合报告区域
      setIntegrationReport(tempIntegrationReport);
      
      // 自动滚动到整合报告区域
      setTimeout(() => {
        const integrationReportElement = document.getElementById('integration-report-section');
        if (integrationReportElement) {
          integrationReportElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      while (!isComplete) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('🔍 [前端] 流式读取完成，done=true');
          break;
        }
        
        const chunk = new TextDecoder().decode(value);
        console.log('🔍 [前端] 接收到原始chunk，长度:', chunk.length);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log('🔍 [前端] 解析SSE数据:', data.type);
              
              switch (data.type) {
                case 'start':
                  progressMessage = data.message;
                  message.loading({
                    content: progressMessage,
                    key: loadingKey,
                    duration: 0
                  });
                  break;
                  
                case 'status':
                  progressMessage = data.message;
                  message.loading({
                    content: progressMessage,
                    key: loadingKey,
                    duration: 0
                  });
                  break;
                  
                case 'content':
                  content += data.content; // 累积内容而不是覆盖
                  
                  console.log('🔍 [前端] 接收到内容块，长度:', data.content.length, '总长度:', content.length);
                  
                  // 实时更新整合报告显示
                  setIntegrationReport(prev => {
                    const updated = {
                      ...prev!,
                      report_content: content,
                      created_at: new Date().toISOString()
                    };
                    return updated;
                  });
                  
                  // 更新进度消息
                  if (data.progress) {
                    progressMessage = `正在生成报告内容... ${data.progress}%`;
                  } else {
                    progressMessage = '正在生成报告内容...';
                  }
                  message.loading({
                    content: progressMessage,
                    key: loadingKey,
                    duration: 0
                  });
                  break;
                  
                case 'complete':
                  console.log('🔍 [前端] 收到complete事件:', new Date().toISOString());
                  console.log('🔍 [前端] 当前isGeneratingAIReport状态:', isGeneratingAIReport);
                  
                  message.destroy(loadingKey);
                  message.success(data.message);
                  setSelectedReports([]);
                  
                  console.log('🔍 [前端] 即将设置isGeneratingAIReport为false');
                  setIsGeneratingAIReport(false);
                  console.log('🔍 [前端] 已设置isGeneratingAIReport为false');
                  
                  // 使用强制更新函数
                  forceUpdateButtonState();
                  
                  // 额外确保状态更新
                  setTimeout(() => {
                    console.log('🔍 [前端] setTimeout中再次设置状态');
                    setIsGeneratingAIReport(false);
                    forceUpdateButtonState();
                  }, 50);
                  
                  // 延迟刷新整合报告显示，确保数据库事务完成
                  setTimeout(() => {
                    console.log('🔍 [前端] 延迟刷新整合报告');
                    fetchIntegrationReport().catch(error => {
                      console.error('刷新整合报告失败:', error);
                    });
                  }, 1000);
                  
                  isComplete = true;
                  console.log('🔍 [前端] 设置isComplete为true');
                  break;
                  
                case 'error':
                  message.destroy(loadingKey);
                  message.error(`生成失败: ${data.error}`);
                  setIsGeneratingAIReport(false);
                  isComplete = true;
                  break;
              }
            } catch (error) {
              console.error('解析SSE数据失败:', error);
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error('AI整合报告生成失败:', error);
      message.error(`AI整合报告生成失败: ${error.message}`);
    } finally {
      // 确保按钮状态被重置
      console.log('🔍 [前端] finally块中强制重置按钮状态');
      setIsGeneratingAIReport(false);
      forceUpdateButtonState();
      
      // 额外确保状态更新
      setTimeout(() => {
        console.log('🔍 [前端] setTimeout中再次强制重置按钮状态');
        setIsGeneratingAIReport(false);
        forceUpdateButtonState();
      }, 100);
    }
  };

  const handleDeleteReport = async (reportId: number, event?: React.MouseEvent) => {
    // 获取鼠标位置
    const mouseX = event?.clientX || window.innerWidth / 2;
    const mouseY = event?.clientY || window.innerHeight / 2;
    
    // 设置删除模态框数据
    setDeleteModalData({
      reportId,
      isBatch: false
    });
    setDeleteModalVisible(true);
  };

  const handleBatchDelete = async (event?: React.MouseEvent) => {
    if (selectedReports.length === 0) {
      message.warning('请先选择要删除的复盘报告');
      return;
    }

    // 设置删除模态框数据
    setDeleteModalData({
      reportId: 0,
      isBatch: true,
      count: selectedReports.length
    });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalData) return;

    console.log('🔍 [前端] 开始删除操作:', deleteModalData);

    try {
      if (deleteModalData.isIntegrationReport) {
        // 删除AI整合报告
        console.log('🔍 [前端] 删除AI整合报告，ID:', deleteModalData.reportId);
        const response = await apiService.deleteIntegrationReport(deleteModalData.reportId);
        console.log('🔍 [前端] 删除响应:', response);
        
        if (response.success) {
          console.log('🔍 [前端] 删除成功，开始刷新数据');
          message.success('AI整合报告删除成功');
          
          // 立即清空状态
          setIntegrationReport(null);
          
          // 等待一小段时间确保数据库事务完成
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 刷新整合报告列表
          await fetchIntegrationReport();
          // 强制刷新页面数据
          await fetchWeekData();
          console.log('🔍 [前端] 数据刷新完成');
        } else {
          message.error('删除失败: ' + (response.error || '未知错误'));
        }
      } else if (deleteModalData.isBatch) {
        // 批量删除
        console.log('🔍 [前端] 批量删除报告:', selectedReports);
        const deletePromises = selectedReports.map(id => apiService.deleteReviewReport(id));
        await Promise.all(deletePromises);
        message.success('批量删除成功');
        setSelectedReports([]);
      } else {
        // 单个删除
        console.log('🔍 [前端] 删除单个报告，ID:', deleteModalData.reportId);
        const response = await apiService.deleteReviewReport(deleteModalData.reportId);
        console.log('🔍 [前端] 删除响应:', response);
        
        if (response.success) {
          message.success('复盘报告删除成功');
        } else {
          message.error('删除失败: ' + (response.error || '未知错误'));
        }
      }
      
      // 刷新数据
      await fetchWeekData();
      
      // 关闭模态框
      setDeleteModalVisible(false);
      setDeleteModalData(null);
    } catch (error) {
      console.error('🔍 [前端] 删除失败:', error);
      message.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setDeleteModalData(null);
  };

  const handleDownloadIntegrationReport = async (format: 'word' | 'pdf') => {
    if (!integrationReport) return;
    
    try {
      message.loading(`正在生成${format === 'word' ? 'Word' : 'PDF'}...`, 0);
      
      const blob = await apiService.downloadIntegrationReport(integrationReport.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const fileName = `第${integrationReport.week_number}周-${integrationReport.date_range}AI整合复盘报告.${format === 'pdf' ? 'pdf' : 'docx'}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.destroy();
      message.success(`${format === 'word' ? 'Word' : 'PDF'}下载成功`);
    } catch (error: any) {
      console.error('下载整合报告失败:', error);
      message.destroy();
      message.error(`下载失败: ${error.message}`);
    }
  };

  const handleDeleteIntegrationReport = async (event?: React.MouseEvent) => {
    if (!integrationReport) return;

    // 捕获鼠标位置
    const mouseX = event?.clientX || window.innerWidth / 2;
    const mouseY = event?.clientY || window.innerHeight / 2;

    // 设置删除模态框数据
    setDeleteModalData({
      reportId: integrationReport.id,
      isBatch: false,
      isIntegrationReport: true,
      mouseX: mouseX,
      mouseY: mouseY
    });
    setDeleteModalVisible(true);
  };

  const columns = [
    {
      title: '选择',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      render: (id: number) => (
        <input
          type="checkbox"
          checked={selectedReports.includes(id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedReports([...selectedReports, id]);
            } else {
              setSelectedReports(selectedReports.filter(reportId => reportId !== id));
            }
          }}
        />
      )
    },
    {
      title: '被复盘人',
      dataIndex: 'user_name',
      key: 'user_name',
    },
    {
      title: '复盘时间',
      key: 'date_range',
      render: (record: Report) => {
        const startDate = dayjs(record.date_range_start).format('YYYY-MM-DD');
        const endDate = dayjs(record.date_range_end).format('YYYY-MM-DD');
        return `${startDate} 至 ${endDate}`;
      }
    },
    {
      title: '复盘方式',
      dataIndex: 'review_method',
      key: 'review_method',
      render: (method: string) => {
        const methodMap: { [key: string]: string } = {
          'offline': '线下复盘',
          'online': '线上复盘'
        };
        return methodMap[method] || method;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: Report) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/history/week/${weekId}/report/${record.id}`)}
            >
              查看
            </Button>
          </Tooltip>
          <Tooltip title="下载Word">
            <Button
              icon={<FileWordOutlined />}
              size="small"
              onClick={() => handleDownloadReport(record)}
            >
              Word
            </Button>
          </Tooltip>
          <Tooltip title="下载PDF">
            <Button
              icon={<FilePdfOutlined />}
              size="small"
              onClick={() => handleDownloadPdf(record)}
            >
              PDF
            </Button>
          </Tooltip>
          <Tooltip title="删除">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={(e) => handleDeleteReport(record.id, e)}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!weekData) {
    return <div>未找到周数据</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button onClick={() => navigate('/history')} style={{ marginRight: 16 }}>返回</Button>
            <Title level={3} style={{ margin: 0 }}>
              第{weekData.week_number}周复盘报告 ({dayjs(weekData.date_range_start).format('YYYY-MM-DD')} 至 {dayjs(weekData.date_range_end).format('YYYY-MM-DD')})
            </Title>
          </div>
        </div>
        
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small">
              <div>报告总数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {weekData.report_count}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div>年份</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                {weekData.year}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <div>周数</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                第{weekData.week_number}周
              </div>
            </Card>
          </Col>
        </Row>

        {/* 批量操作 */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <span>已选择 {selectedReports.length} 项</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={handleGenerateAIReport}
                disabled={isGeneratingAIReport}
                loading={isGeneratingAIReport}
              >
                {isGeneratingAIReport ? '生成中...' : '生成 AI 整合报告'}
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleBatchDownload('word')}
              >
                批量下载Word
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => handleBatchDownload('pdf')}
              >
                批量下载PDF
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => handleBatchDelete(e)}
              >
                批量删除
              </Button>
            </div>
          </div>
        </Card>

        {/* 报告列表 */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>报告列表</Title>
            <Button
              size="small"
              onClick={() => {
                if (selectedReports.length === reports.length) {
                  setSelectedReports([]);
                } else {
                  setSelectedReports(reports.map(r => r.id));
                }
              }}
            >
              {selectedReports.length === reports.length ? '取消全选' : '全选'}
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={reports}
            rowKey="id"
            pagination={false}
          />
        </Card>

        {/* AI整合报告 */}
        <Card
          id="integration-report-section"
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>AI整合报告</span>
              <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={fetchIntegrationReport}
                loading={integrationLoading}
              >
                刷新
              </Button>
            </div>
          }
          style={{ marginTop: 16 }}
        >
          {integrationReport ? (
            <div>
              <div style={{
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#fafafa',
                maxHeight: '600px',
                overflow: 'auto'
              }}>
                {integrationReport.report_content ? (
                  <div>
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[]}
                      components={{
                        table: ({node, ...props}) => (
                          <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: '16px' }} {...props} />
                        ),
                        th: ({node, ...props}) => (
                          <th style={{ border: '1px solid #d9d9d9', padding: '8px', backgroundColor: '#f5f5f5', textAlign: 'left' }} {...props} />
                        ),
                        td: ({node, ...props}) => (
                          <td style={{ border: '1px solid #d9d9d9', padding: '8px' }} {...props} />
                        ),
                        // 处理HTML标签
                        p: ({node, children, ...props}) => {
                          // 检查children是否包含HTML标签
                          const childrenArray = React.Children.toArray(children);
                          const hasHtmlTags = childrenArray.some(child => 
                            typeof child === 'string' && child.includes('<br>')
                          );
                          
                          if (hasHtmlTags) {
                            // 将children转换为字符串并处理HTML标签
                            const content = childrenArray.join('');
                            const parts = content.split('<br>');
                            return (
                              <p {...props}>
                                {parts.map((part, index) => (
                                  <React.Fragment key={index}>
                                    {part}
                                    {index < parts.length - 1 && <br />}
                                  </React.Fragment>
                                ))}
                              </p>
                            );
                          }
                          return <p {...props}>{children}</p>;
                        }
                      }}
                    >
                      {integrationReport.report_content.replace(/<br>/g, '\n')}
                    </ReactMarkdown>
                    
                    {/* 操作按钮 - 移到报告内容下方 */}
                    <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8, border: '1px solid #e9ecef' }}>
                      <Text strong style={{ display: 'block', marginBottom: '12px', color: '#495057' }}>
                        报告操作
                      </Text>
                      <Space wrap>
                        <Button
                          icon={<FileWordOutlined />}
                          onClick={() => handleDownloadIntegrationReport('word')}
                          disabled={isGeneratingAIReport || !integrationReport}
                        >
                          下载Word
                        </Button>
                        <Button
                          icon={<FilePdfOutlined />}
                          onClick={() => handleDownloadIntegrationReport('pdf')}
                          disabled={isGeneratingAIReport || !integrationReport}
                        >
                          下载PDF
                        </Button>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(event) => handleDeleteIntegrationReport(event)}
                          disabled={isGeneratingAIReport || !integrationReport}
                        >
                          删除报告
                        </Button>
                      </Space>
                    </div>
                  </div>
                ) : (
                  <div>暂无整合报告内容</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <div>暂无AI整合报告</div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                选择上方的报告，点击"生成 AI 整合报告"来创建
              </div>
            </div>
          )}
        </Card>
      </Card>

      {/* 自定义删除确认对话框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#ff4d4f', fontSize: '16px' }}>⚠️</span>
            <span style={{ fontWeight: 'bold', color: '#262626' }}>确认删除</span>
          </div>
        }
        visible={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{
          danger: true,
          style: { 
            borderRadius: '6px',
            fontWeight: '500'
          }
        }}
        cancelButtonProps={{
          style: { 
            borderRadius: '6px',
            borderColor: '#d9d9d9'
          }
        }}
        centered={false}
        width={400}
        style={{
          top: deleteModalData?.mouseY ? Math.max(20, deleteModalData.mouseY - 150) : Math.max(20, window.innerHeight / 2 - 150),
          left: deleteModalData?.mouseX ? Math.max(20, Math.min(deleteModalData.mouseX - 200, window.innerWidth - 420)) : Math.max(20, window.innerWidth / 2 - 200)
        }}
      >
        {deleteModalData?.isBatch ? (
          <div style={{ padding: '8px 0' }}>
            <p style={{ margin: '0 0 8px 0', color: '#595959' }}>
              确定要删除选中的 <strong style={{ color: '#ff4d4f' }}>{deleteModalData.count}</strong> 份复盘报告吗？
            </p>
            <p style={{ margin: 0, color: '#8c8c8c', fontSize: '13px' }}>
              此操作不可恢复，请谨慎操作。
            </p>
          </div>
        ) : deleteModalData?.isIntegrationReport ? (
          <div style={{ padding: '8px 0' }}>
            <p style={{ margin: '0 0 8px 0', color: '#595959' }}>
              确定要删除这份 <strong style={{ color: '#ff4d4f' }}>AI整合报告</strong> 吗？
            </p>
            <p style={{ margin: 0, color: '#8c8c8c', fontSize: '13px' }}>
              此操作不可恢复，请谨慎操作。
            </p>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            <p style={{ margin: '0 0 8px 0', color: '#595959' }}>
              确定要删除这份复盘报告吗？
            </p>
            <p style={{ margin: 0, color: '#8c8c8c', fontSize: '13px' }}>
              此操作不可恢复，请谨慎操作。
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WeekDetail; 