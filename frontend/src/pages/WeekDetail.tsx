import React, { useState, useEffect } from 'react';
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
      const response = await apiService.getIntegrationReport(parseInt(weekId!));
      if (response.success) {
        setIntegrationReport(response.data);
      } else {
        setIntegrationReport(null);
      }
    } catch (error) {
      console.error('获取整合报告失败:', error);
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
        content: '正在生成AI整合报告...',
        key: loadingKey,
        duration: 0
      });
      
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
      let isComplete = false;
      let progressMessage = '正在生成AI整合报告...';
      
      // 创建临时整合报告对象用于实时显示
      const tempIntegrationReport = {
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
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
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
                  content = data.content;
                  // 实时更新整合报告显示
                  setIntegrationReport(prev => ({
                    ...prev!,
                    report_content: content,
                    created_at: new Date().toISOString()
                  }));
                  
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
                  message.destroy(loadingKey);
                  message.success(data.message);
                  setSelectedReports([]);
                  
                  // 刷新整合报告显示
                  await fetchIntegrationReport();
                  
                  isComplete = true;
                  break;
                  
                case 'error':
                  message.destroy(loadingKey);
                  message.error(`生成失败: ${data.error}`);
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
      setIsGeneratingAIReport(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这份复盘报告吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await apiService.deleteReviewReport(reportId);
          if (response.success) {
            message.success('复盘报告删除成功');
            fetchWeekData(); // 刷新数据
          } else {
            message.error('删除失败');
          }
        } catch (error) {
          console.error('删除复盘报告失败:', error);
          message.error('删除失败');
        }
      }
    });
  };

  const handleBatchDelete = async () => {
    if (selectedReports.length === 0) {
      message.warning('请先选择要删除的复盘报告');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedReports.length} 份复盘报告吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const deletePromises = selectedReports.map(id => apiService.deleteReviewReport(id));
          await Promise.all(deletePromises);
          message.success('批量删除成功');
          setSelectedReports([]);
          fetchWeekData(); // 刷新数据
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败');
        }
      }
    });
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
              onClick={() => handleDeleteReport(record.id)}
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
                onClick={handleBatchDelete}
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
              <div style={{ marginBottom: 16 }}>
                <Row gutter={16} align="middle">
                  <Col span={24}>
                    <Text strong>生成时间：</Text>
                    {dayjs(integrationReport.created_at).format('YYYY-MM-DD HH:mm')}
                  </Col>
                </Row>
              </div>



              <div style={{
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                padding: '16px',
                backgroundColor: '#fafafa',
                maxHeight: '600px',
                overflow: 'auto'
              }}>
                {integrationReport.report_content ? (
                  <div style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    color: '#2c3e50'
                  }}>
                    {isGeneratingAIReport && (
                      <div style={{
                        padding: '12px',
                        marginBottom: '16px',
                        backgroundColor: '#e6f7ff',
                        border: '1px solid #91d5ff',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#1890ff',
                          animation: 'pulse 1.5s infinite'
                        }} />
                        <span style={{ color: '#1890ff', fontWeight: '500' }}>
                          正在流式生成报告内容...
                        </span>
                      </div>
                    )}
                    
                    {/* 调试信息 */}
                    <details style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>调试信息 - 原始Markdown内容</summary>
                      <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px', backgroundColor: '#fff', padding: '8px', border: '1px solid #ddd' }}>
                        {integrationReport.report_content}
                      </pre>
                    </details>
                    
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                          // 表格样式优化
                          table: ({node, ...props}) => (
                            <table 
                              {...props} 
                              style={{
                                borderCollapse: 'collapse',
                                width: '100%',
                                marginBottom: '24px',
                                border: '2px solid #e8e8e8',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                              }}
                            />
                          ),
                          th: ({node, ...props}) => (
                            <th 
                              {...props} 
                              style={{
                                border: '1px solid #e8e8e8',
                                padding: '16px 12px',
                                backgroundColor: '#f8f9fa',
                                fontWeight: '600',
                                textAlign: 'left',
                                fontSize: '14px',
                                color: '#2c3e50',
                                borderBottom: '2px solid #dee2e6'
                              }}
                            />
                          ),
                          td: ({node, ...props}) => (
                            <td 
                              {...props} 
                              style={{
                                border: '1px solid #e8e8e8',
                                padding: '14px 12px',
                                textAlign: 'left',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                verticalAlign: 'top'
                              }}
                            />
                          ),
                          // 标题样式优化
                          h1: ({node, ...props}) => (
                            <h1 {...props} style={{ 
                              fontSize: '28px', 
                              fontWeight: '700', 
                              marginBottom: '20px', 
                              marginTop: '32px',
                              color: '#1a365d',
                              borderBottom: '3px solid #3182ce',
                              paddingBottom: '8px'
                            }} />
                          ),
                          h2: ({node, ...props}) => (
                            <h2 {...props} style={{ 
                              fontSize: '22px', 
                              fontWeight: '600', 
                              marginBottom: '16px', 
                              marginTop: '28px', 
                              color: '#2d3748',
                              borderLeft: '4px solid #3182ce',
                              paddingLeft: '12px'
                            }} />
                          ),
                          h3: ({node, ...props}) => (
                            <h3 {...props} style={{ 
                              fontSize: '18px', 
                              fontWeight: '600', 
                              marginBottom: '12px', 
                              marginTop: '20px', 
                              color: '#4a5568',
                              backgroundColor: '#f7fafc',
                              padding: '8px 12px',
                              borderRadius: '4px'
                            }} />
                          ),
                          // 段落样式优化
                          p: ({node, ...props}) => (
                            <p {...props} style={{ 
                              marginBottom: '16px', 
                              lineHeight: '1.8',
                              fontSize: '15px',
                              color: '#2d3748'
                            }} />
                          ),
                          // 列表样式优化
                          ul: ({node, ...props}) => (
                            <ul {...props} style={{ 
                              marginBottom: '20px', 
                              paddingLeft: '24px',
                              lineHeight: '1.8'
                            }} />
                          ),
                          ol: ({node, ...props}) => (
                            <ol {...props} style={{ 
                              marginBottom: '20px', 
                              paddingLeft: '24px',
                              lineHeight: '1.8'
                            }} />
                          ),
                          li: ({node, ...props}) => (
                            <li {...props} style={{ 
                              marginBottom: '8px',
                              fontSize: '15px',
                              color: '#2d3748'
                            }} />
                          ),
                          // 强调文本样式优化
                          strong: ({node, ...props}) => (
                            <strong {...props} style={{ 
                              fontWeight: '600', 
                              color: '#3182ce',
                              backgroundColor: '#ebf8ff',
                              padding: '2px 4px',
                              borderRadius: '3px'
                            }} />
                          ),
                          em: ({node, ...props}) => (
                            <em {...props} style={{ 
                              fontStyle: 'italic', 
                              color: '#718096',
                              backgroundColor: '#f7fafc',
                              padding: '1px 3px',
                              borderRadius: '2px'
                            }} />
                          ),
                          // 代码块样式优化
                          code: ({node, className, ...props}: any) => {
                            const isInline = className && !className.includes('language-');
                            if (isInline) {
                              return (
                                <code {...props} style={{
                                  backgroundColor: '#f1f5f9',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                  color: '#e53e3e'
                                }} />
                              );
                            }
                            return (
                              <code {...props} style={{
                                backgroundColor: '#f7fafc',
                                padding: '16px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                color: '#2d3748',
                                display: 'block',
                                overflow: 'auto',
                                border: '1px solid #e2e8f0'
                              }} />
                            );
                          },
                          // 引用块样式优化
                          blockquote: ({node, ...props}) => (
                            <blockquote {...props} style={{
                              borderLeft: '4px solid #3182ce',
                              paddingLeft: '16px',
                              margin: '20px 0',
                              backgroundColor: '#f7fafc',
                              padding: '16px',
                              borderRadius: '4px',
                              fontStyle: 'italic',
                              color: '#4a5568'
                            }} />
                          ),
                          // 分割线样式优化
                          hr: ({node, ...props}) => (
                            <hr {...props} style={{
                              border: 'none',
                              height: '2px',
                              backgroundColor: '#e2e8f0',
                              margin: '32px 0',
                              borderRadius: '1px'
                            }} />
                          ),
                          // 链接样式优化
                          a: ({node, ...props}) => (
                            <a {...props} style={{
                              color: '#3182ce',
                              textDecoration: 'none',
                              borderBottom: '1px solid #3182ce',
                              paddingBottom: '1px'
                            }} />
                          )
                        }}
                      >
                        {integrationReport.report_content}
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
                        </Space>
                      </div>
                    </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>报告内容为空</div>
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>
                      请重新生成AI整合报告
                    </div>
                  </div>
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
    </div>
  );
};

export default WeekDetail; 