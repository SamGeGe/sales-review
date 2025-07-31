import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Descriptions,
  Breadcrumb
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  HistoryOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiService from '../utils/apiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const { Title, Text, Paragraph } = Typography;

interface ReportData {
  id: number;
  user_name: string;
  date_range_start: string;
  date_range_end: string;
  review_method: string;
  last_week_plan: any[];
  last_week_actions: any[];
  week_plan: any[];
  coordination_items: string;
  other_items: string;
  ai_report: string;
  is_locked: number;
  week_number: number;
  created_at: string;
}

const ReportDetail: React.FC = () => {
  const { weekId, reportId } = useParams<{ weekId: string; reportId: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportDetail();
  }, [reportId]);

  const fetchReportDetail = async () => {
    try {
      setLoading(true);
      console.log('🔍 正在获取报告详情，ID:', reportId);
      const response = await apiService.get(`/api/reports/detail/${reportId}`);
      console.log('📡 API响应:', response);
      if (response.success) {
        console.log('✅ 报告数据:', response.data);
        setReport(response.data);
      } else {
        console.error('❌ API返回失败:', response.error);
        message.error('获取报告详情失败');
      }
    } catch (error) {
      console.error('❌ 获取报告详情失败:', error);
      message.error('获取报告详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'word' | 'pdf') => {
    try {
      if (!report) {
        message.error('报告数据不存在');
        return;
      }

      // 获取前端页面显示的参数
      const weekNumber = report.week_number;
      const userName = report.user_name;
      
      // 格式化日期范围
      const startDate = dayjs(report.date_range_start).format('YYYY年M月D日');
      const endDate = dayjs(report.date_range_end).format('YYYY年M月D日');
      const dateRange = `${startDate}-${endDate}`;

      // 构建查询参数
      const params = new URLSearchParams({
        week_number: weekNumber.toString(),
        date_range: dateRange,
        user_name: userName
      });

      const response = await fetch(`${apiService.getBaseUrl()}/api/reports/download/${format}/${reportId}?${params}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileExtension = format === 'word' ? 'docx' : format;
        a.download = `${userName}-第${weekNumber}周-${dateRange}复盘明细.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success(`${format.toUpperCase()}文件下载成功`);
      } else {
        message.error(`下载失败: ${response.statusText}`);
      }
    } catch (error: any) {
      message.error(`下载失败: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await apiService.delete(`/api/reports/${reportId}`);
      if (response.success) {
        message.success('报告删除成功');
        navigate(`/history/week/${weekId}`);
      } else {
        message.error('删除失败');
      }
    } catch (error) {
      console.error('删除报告失败:', error);
      message.error('删除失败');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>报告不存在</div>
        <div style={{ marginTop: 16, fontSize: '12px', color: '#666' }}>
          reportId: {reportId}, weekId: {weekId}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <Button type="link" icon={<HomeOutlined />} onClick={() => navigate('/')}>
            首页
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Button type="link" icon={<HistoryOutlined />} onClick={() => navigate('/history')}>
            历史复盘报告
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Button type="link" icon={<FileTextOutlined />} onClick={() => navigate(`/history/week/${weekId}`)}>
            第{report?.week_number || weekId}周详情
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{report.user_name}的报告</Breadcrumb.Item>
      </Breadcrumb>

      {/* 报告头部信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(`/history/week/${weekId}`)}
              style={{ marginRight: 16 }}
            >
              返回
            </Button>
          </Col>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              {report.user_name} - 第{report.week_number}周复盘报告
            </Title>
          </Col>
        </Row>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownload('word')}
              >
                下载Word
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => handleDownload('pdf')}
              >
                下载PDF
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                删除报告
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 基本信息 */}
      <Card title="基本信息" style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="被复盘人">
            <Text strong>{report.user_name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="复盘时间">
            {dayjs(report.date_range_start).format('YYYY-MM-DD')} 至 {dayjs(report.date_range_end).format('YYYY-MM-DD')}
          </Descriptions.Item>
          <Descriptions.Item label="复盘方式">
            <Tag color={report.review_method === 'online' ? 'blue' : 'green'}>
              {report.review_method === 'online' ? '线上复盘' : '线下复盘'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={report.is_locked ? 'red' : 'green'}>
              {report.is_locked ? '已锁定' : '未锁定'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(report.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 上周复盘计划 */}
      {report.last_week_plan && report.last_week_plan.length > 0 && (
        <Card title="上周复盘计划" style={{ marginBottom: 16 }}>
          {report.last_week_plan.map((plan, index) => (
            <div key={index} style={{ marginBottom: 16 }}>
              <Text strong>任务 {index + 1}：</Text>
              <Paragraph>{plan.task}</Paragraph>
              <Text type="secondary">期望结果：{plan.expectedResult}</Text>
            </div>
          ))}
        </Card>
      )}

      {/* 上周行动复盘 */}
      {report.last_week_actions && report.last_week_actions.length > 0 && (
        <Card title="上周行动复盘" style={{ marginBottom: 16 }}>
          {report.last_week_actions.map((action, index) => (
            <div key={index} style={{ marginBottom: 16 }}>
              <Text strong>{action.day}：</Text>
              <Row gutter={16}>
                <Col span={12}>
                  <Text>上午：{action.morningAction}</Text>
                  <br />
                  <Text type="secondary">结果：{action.morningResult}</Text>
                </Col>
                <Col span={12}>
                  <Text>晚上：{action.eveningAction}</Text>
                  <br />
                  <Text type="secondary">结果：{action.eveningResult}</Text>
                </Col>
              </Row>
            </div>
          ))}
        </Card>
      )}

      {/* 本周行动计划 */}
      {report.week_plan && report.week_plan.length > 0 && (
        <Card title="本周行动计划" style={{ marginBottom: 16 }}>
          {report.week_plan.map((plan, index) => (
            <div key={index} style={{ marginBottom: 16 }}>
              <Text strong>任务 {index + 1}：</Text>
              <Paragraph>{plan.task}</Paragraph>
              <Text type="secondary">期望结果：{plan.expectedResult}</Text>
            </div>
          ))}
        </Card>
      )}

      {/* 需协调事项 */}
      {report.coordination_items && (
        <Card title="需协调事项" style={{ marginBottom: 16 }}>
          <Paragraph>{report.coordination_items}</Paragraph>
        </Card>
      )}

      {/* 其他事项 */}
      {report.other_items && (
        <Card title="其他事项" style={{ marginBottom: 16 }}>
          <Paragraph>{report.other_items}</Paragraph>
        </Card>
      )}

      {/* AI生成的完整报告 */}
      {report.ai_report && (
        <Card title="AI生成报告" style={{ marginBottom: 16 }}>
          <div 
            style={{ 
              backgroundColor: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4,
              lineHeight: 1.6
            }}
          >
            <div style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              color: '#2c3e50'
            }}>
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
                {report.ai_report}
              </ReactMarkdown>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportDetail; 