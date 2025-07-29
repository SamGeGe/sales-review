import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  message, 
  Popconfirm, 
  Space,
  Typography,
  Tag,
  Descriptions,
  Checkbox,
  Row,
  Col
} from 'antd';
import { EyeOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import apiService from '../utils/apiService';
import config from '../utils/config';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface ReviewReport {
  id: number;
  user_name: string;
  date_range_start: string;
  date_range_end: string;
  review_method: string;
  last_week_plan: string;
  last_week_actions: string;
  week_plan: string;
  coordination_items: string;
  other_items: string;
  ai_report: string;
  is_locked: number;
  period_number: number;
  year: number;
  period_display: string;
  created_at: string;
  updated_at: string;
}

const History: React.FC = () => {
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReviewReport | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // 获取历史报告列表
  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await apiService.getReviewHistory();
      console.log('历史报告API响应:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        setReports(response.data);
        console.log('历史报告设置成功:', response.data);
      } else {
        console.error('历史报告数据格式错误:', response);
        message.error('获取历史报告失败：数据格式错误');
        setReports([]);
      }
    } catch (error: any) {
      console.error('获取历史报告失败:', error);
      message.error(`获取历史报告失败: ${error.message}`);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // 删除报告
  const handleDeleteReport = async (id: number) => {
    try {
      const response = await apiService.deleteReviewReport(id);
      if (response.success) {
        message.success('报告删除成功');
        fetchReports();
      } else {
        message.error(`删除报告失败: ${response.error}`);
      }
    } catch (error: any) {
      message.error(`删除报告失败: ${error.message}`);
    }
  };

  // 批量删除报告
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的报告');
      return;
    }

    setBatchLoading(true);
    try {
      const deletePromises = selectedRowKeys.map(id => apiService.deleteReviewReport(Number(id)));
      await Promise.all(deletePromises);
      message.success(`成功删除 ${selectedRowKeys.length} 个报告`);
      setSelectedRowKeys([]);
      fetchReports();
    } catch (error: any) {
      message.error(`批量删除失败: ${error.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  // 批量下载报告
  const handleBatchDownload = async (format: 'word' | 'pdf') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要下载的报告');
      return;
    }

    setBatchLoading(true);
    try {
      const selectedReports = reports.filter(report => selectedRowKeys.includes(report.id));
      
      for (const report of selectedReports) {
        await handleDownload(format, report);
        // 添加延迟避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      message.success(`成功下载 ${selectedRowKeys.length} 个${format.toUpperCase()}文件`);
    } catch (error: any) {
      message.error(`批量下载失败: ${error.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  // 查看报告详情
  const viewReportDetail = (report: ReviewReport) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  // 下载报告
  const handleDownload = async (format: 'word' | 'pdf', report: ReviewReport) => {
    if (!report.ai_report) {
      message.warning('该报告没有AI生成的内容，无法下载');
      return;
    }

    try {
             const response = await fetch(`${config.getFrontend().backend_url}/reports/download/${format}/${report.id}`, {
        method: 'GET',
      });
      
      if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
                 a.download = `${report.user_name}_第${calculatePeriodNumber(reports, report)}周复盘报告.${format}`;
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

  // 解析JSON字符串
  const parseJsonString = (data: any) => {
    try {
      // 如果数据已经是数组，直接返回
      if (Array.isArray(data)) {
        return data;
      }
      
      // 如果是字符串，尝试解析JSON
      if (typeof data === 'string') {
        if (!data || data.trim() === '') {
          return [];
        }
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      // 如果是null或undefined，返回空数组
      if (data === null || data === undefined) {
        return [];
      }
      
      // 其他情况返回空数组
      return [];
    } catch (error) {
      console.error('数据解析失败:', error, '原始数据:', data);
      return [];
    }
  };

  // 判断是否为当前周报告
  const isCurrentWeekReport = (report: ReviewReport) => {
    const now = dayjs();
    const start = dayjs(report.date_range_start);
    const end = dayjs(report.date_range_end);
    return now.isAfter(start) && now.isBefore(end);
  };

  // 判断是否为最近报告（7天内）
  const isRecentReport = (report: ReviewReport) => {
    const now = dayjs();
    const created = dayjs(report.created_at);
    return now.diff(created, 'day') <= 7;
  };

  // 计算期数（按周计算）
  const calculatePeriodNumber = (reports: ReviewReport[], currentReport: ReviewReport) => {
    // 基准日期：2025年1月1日
    const baseDate = dayjs('2025-01-01');
    
    // 获取复盘期间的最后一天
    const reportEndDate = dayjs(currentReport.date_range_end);
    
    // 计算从基准日期到复盘结束日期的天数
    const daysDiff = reportEndDate.diff(baseDate, 'day');
    
    // 计算周数（每周7天）
    const weekNumber = Math.floor(daysDiff / 7) + 1;
    
    return weekNumber;
  };

  // 表格行样式
  const getRowClassName = (record: ReviewReport) => {
    if (isCurrentWeekReport(record)) {
      return 'current-week-row';
    }
    return '';
  };

  // 表格列定义
  const columns = [
    {
      title: '周数',
      dataIndex: 'period_display',
      key: 'period_display',
      width: 120,
      render: (text: string, record: ReviewReport) => {
        const weekNumber = calculatePeriodNumber(reports, record);
        const isCurrent = isCurrentWeekReport(record);
        
        let color = 'blue';
        if (isCurrent) color = 'green';
        
        return (
          <Tag color={color}>
            第{weekNumber}周
            {isCurrent && <span style={{ marginLeft: 4 }}>🔥</span>}
          </Tag>
        );
      },
    },
    {
      title: '被复盘人',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 100,
      render: (text: string, record: ReviewReport) => {
        const isCurrent = isCurrentWeekReport(record);
        
        return (
          <span style={{ 
            fontWeight: isCurrent ? 'bold' : 'normal',
            color: isCurrent ? '#52c41a' : 'inherit'
          }}>
            {text}
          </span>
        );
      },
    },
    {
      title: '复盘时间',
      key: 'date_range',
      width: 200,
      render: (_: any, record: ReviewReport) => {
        const isCurrent = isCurrentWeekReport(record);
        
        return (
          <div style={{ 
            backgroundColor: isCurrent ? '#f6ffed' : 'transparent',
            padding: '4px 8px',
            borderRadius: '4px',
            border: isCurrent ? '1px solid #b7eb8f' : 'none'
          }}>
            <div>{dayjs(record.date_range_start).format('YYYY-MM-DD')}</div>
            <div style={{ color: '#999' }}>至</div>
            <div>{dayjs(record.date_range_end).format('YYYY-MM-DD')}</div>
          </div>
        );
      },
    },
    {
      title: '复盘方式',
      dataIndex: 'review_method',
      key: 'review_method',
      width: 100,
      render: (text: string) => {
        // 将英文转换为中文显示
        const displayText = text === 'offline' ? '线下复盘' : text === 'online' ? '线上复盘' : text;
        return (
          <Tag color={displayText === '线下复盘' ? 'green' : 'orange'}>
            {displayText}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'is_locked',
      key: 'is_locked',
      width: 80,
      render: (locked: number) => (
        <Tag color={locked ? 'red' : 'green'}>
          {locked ? '已锁定' : '未锁定'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string, record: ReviewReport) => {
        const isRecent = isRecentReport(record);
        return (
          <span style={{ 
            color: isRecent ? '#1890ff' : 'inherit',
            fontWeight: isRecent ? '500' : 'normal'
          }}>
            {dayjs(text).format('YYYY-MM-DD HH:mm')}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: ReviewReport) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => viewReportDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload('word', record)}
          >
            Word
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload('pdf', record)}
          >
            PDF
          </Button>
          <Popconfirm
            title="确定要删除这个报告吗？"
            description="删除后无法恢复，请谨慎操作。"
            onConfirm={() => handleDeleteReport(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="history-page">
      <Card className="history-card">
        <div className="history-header">
          <Title level={3} className="history-title">历史复盘报告</Title>
          
          {/* 批量操作按钮 */}
          <div className="batch-operations">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                <Space wrap className="batch-buttons">
                  <Text className="selected-count">已选择 {selectedRowKeys.length} 项</Text>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleBatchDownload('word')}
                    loading={batchLoading}
                    disabled={selectedRowKeys.length === 0}
                    className="batch-button"
                  >
                    <span className="button-text">批量下载Word</span>
                  </Button>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => handleBatchDownload('pdf')}
                    loading={batchLoading}
                    disabled={selectedRowKeys.length === 0}
                    className="batch-button"
                  >
                    <span className="button-text">批量下载PDF</span>
                  </Button>
                  <Popconfirm
                    title={`确定要删除选中的 ${selectedRowKeys.length} 个报告吗？`}
                    description="删除后无法恢复，请谨慎操作。"
                    onConfirm={handleBatchDelete}
                    okText="确定"
                    cancelText="取消"
                    disabled={selectedRowKeys.length === 0}
                  >
                    <Button
                      type="primary"
                      danger
                      icon={<DeleteOutlined />}
                      loading={batchLoading}
                      disabled={selectedRowKeys.length === 0}
                      className="batch-button"
                    >
                      <span className="button-text">批量删除</span>
                    </Button>
                  </Popconfirm>
                </Space>
              </Col>
            </Row>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          rowClassName={getRowClassName}
          rowSelection={{
            selectedRowKeys,
            onChange: (newSelectedRowKeys) => {
              setSelectedRowKeys(newSelectedRowKeys);
            },
          }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSize: 10,
            responsive: true,
            size: 'small',
          }}
          className="history-table"
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 报告详情模态框 */}
      <Modal
        title={`第${selectedReport ? calculatePeriodNumber(reports, selectedReport) : ''}周 - ${selectedReport?.user_name} 复盘报告详情`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width="90vw"
        className="detail-modal"
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download-word"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedReport && handleDownload('word', selectedReport)}
          >
            下载Word
          </Button>,
          <Button
            key="download-pdf"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedReport && handleDownload('pdf', selectedReport)}
          >
            下载PDF
          </Button>,
        ]}
      >
        {selectedReport && (
          <div className="detail-content">
            {/* 基本信息 */}
            <Descriptions title="基本信息" bordered style={{ marginBottom: 24 }} size="small">
              <Descriptions.Item label="周数">第{calculatePeriodNumber(reports, selectedReport)}周</Descriptions.Item>
              <Descriptions.Item label="被复盘人">{selectedReport.user_name}</Descriptions.Item>
              <Descriptions.Item label="复盘时间">
                {dayjs(selectedReport.date_range_start).format('YYYY-MM-DD')} 至 {dayjs(selectedReport.date_range_end).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="复盘方式">
                {selectedReport.review_method === 'offline' ? '线下复盘' : 
                 selectedReport.review_method === 'online' ? '线上复盘' : 
                 selectedReport.review_method}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedReport.is_locked ? 'red' : 'green'}>
                  {selectedReport.is_locked ? '已锁定' : '未锁定'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedReport.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            {/* 上周复盘计划 */}
            <Card title="上周复盘计划" style={{ marginBottom: 16 }} size="small">
              {(() => {
                const lastWeekPlanData = parseJsonString(selectedReport.last_week_plan);
                return lastWeekPlanData.length > 0 ? (
                <Table
                    dataSource={lastWeekPlanData}
                  pagination={false}
                  columns={[
                    { title: '任务', dataIndex: 'task', key: 'task' },
                    { title: '期望结果', dataIndex: 'expectedResult', key: 'expectedResult' },
                    { title: '完成情况', dataIndex: 'completion', key: 'completion' },
                  ]}
                  size="small"
                    scroll={{ x: 400 }}
                />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <div>暂无数据</div>
                  </div>
                );
              })()}
              </Card>

            {/* 上周行动回顾 */}
            <Card title="上周行动回顾" style={{ marginBottom: 16 }} size="small">
              {(() => {
                const lastWeekActionsData = parseJsonString(selectedReport.last_week_actions);
                return lastWeekActionsData.length > 0 ? (
                <Table
                    dataSource={lastWeekActionsData}
                  pagination={false}
                  columns={[
                      { 
                        title: '日期', 
                        dataIndex: 'day', 
                        key: 'day',
                        width: 80
                      },
                      { 
                        title: '上午行动', 
                        dataIndex: 'morningAction', 
                        key: 'morningAction',
                        render: (text: string) => text || '无'
                      },
                      { 
                        title: '上午结果', 
                        dataIndex: 'morningResult', 
                        key: 'morningResult',
                        render: (text: string) => text || '无'
                      },
                      { 
                        title: '下午行动', 
                        dataIndex: 'eveningAction', 
                        key: 'eveningAction',
                        render: (text: string) => text || '无'
                      },
                      { 
                        title: '下午结果', 
                        dataIndex: 'eveningResult', 
                        key: 'eveningResult',
                        render: (text: string) => text || '无'
                      },
                  ]}
                  size="small"
                    scroll={{ x: 600 }}
                />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <div>暂无数据</div>
                  </div>
                );
              })()}
              </Card>

            {/* 本周计划 */}
            <Card title="本周计划" style={{ marginBottom: 16 }} size="small">
              {(() => {
                const weekPlanData = parseJsonString(selectedReport.week_plan);
                return weekPlanData.length > 0 ? (
                <Table
                    dataSource={weekPlanData}
                  pagination={false}
                  columns={[
                    { title: '任务', dataIndex: 'task', key: 'task' },
                    { title: '期望结果', dataIndex: 'expectedResult', key: 'expectedResult' },
                      { title: '完成时间', dataIndex: 'deadline', key: 'deadline' },
                  ]}
                  size="small"
                    scroll={{ x: 400 }}
                />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <div>暂无数据</div>
                  </div>
                );
              })()}
              </Card>

            {/* 协调事项 */}
            {selectedReport.coordination_items && (
              <Card title="协调事项" style={{ marginBottom: 16 }} size="small">
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.coordination_items}</div>
              </Card>
            )}

            {/* 其他事项 */}
            {selectedReport.other_items && (
              <Card title="其他事项" style={{ marginBottom: 16 }} size="small">
                <div style={{ whiteSpace: 'pre-wrap' }}>{selectedReport.other_items}</div>
              </Card>
            )}

            {/* AI生成报告 */}
            {selectedReport.ai_report && (
              <Card title="AI生成报告" size="small">
                <div className="ai-report-content">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
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
                            background: '#f8f9fa',
                            fontWeight: 'bold',
                            color: '#2c3e50',
                            borderBottom: '2px solid #dee2e6',
                            padding: '12px 8px',
                            border: '1px solid #e8e8e8',
                            textAlign: 'left',
                            verticalAlign: 'top'
                          }}
                        />
                      ),
                      td: ({node, ...props}) => (
                        <td 
                          {...props} 
                          style={{
                            border: '1px solid #e8e8e8',
                            padding: '8px',
                            textAlign: 'left',
                            verticalAlign: 'top'
                          }}
                        />
                      ),
                      h1: ({node, ...props}) => (
                        <h1 
                          {...props} 
                          style={{
                            color: '#1890ff',
                            fontSize: '18pt',
                            marginTop: '30px',
                            marginBottom: '20px',
                            borderBottom: '2px solid #1890ff',
                            paddingBottom: '10px',
                            pageBreakAfter: 'avoid'
                          }}
                        />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 
                          {...props} 
                          style={{
                            color: '#1890ff',
                            fontSize: '16pt',
                            marginTop: '25px',
                            marginBottom: '15px',
                            pageBreakAfter: 'avoid'
                          }}
                        />
                      ),
                      h3: ({node, ...props}) => (
                        <h3 
                          {...props} 
                          style={{
                            color: '#1890ff',
                            fontSize: '14pt',
                            marginTop: '20px',
                            marginBottom: '10px',
                            pageBreakAfter: 'avoid'
                          }}
                        />
                      ),
                      p: ({node, ...props}) => (
                        <p 
                          {...props} 
                          style={{
                            marginBottom: '12px',
                            textAlign: 'justify',
                            orphans: '3',
                            widows: '3',
                            fontSize: '12pt',
                            lineHeight: '1.6',
                            color: '#2d3748'
                          }}
                        />
                      ),
                      ul: ({node, ...props}) => (
                        <ul 
                          {...props} 
                          style={{
                            marginBottom: '20px',
                            paddingLeft: '24px',
                            lineHeight: '1.8'
                          }}
                        />
                      ),
                      ol: ({node, ...props}) => (
                        <ol 
                          {...props} 
                          style={{
                            marginBottom: '20px',
                            paddingLeft: '24px',
                            lineHeight: '1.8'
                          }}
                        />
                      ),
                      li: ({node, ...props}) => (
                        <li 
                          {...props} 
                          style={{
                            marginBottom: '8px',
                            fontSize: '12pt',
                            color: '#2d3748'
                          }}
                        />
                      ),
                      strong: ({node, ...props}) => (
                        <strong 
                          {...props} 
                          style={{
                            fontWeight: '600',
                            color: '#3182ce',
                            backgroundColor: '#ebf8ff',
                            padding: '2px 4px',
                            borderRadius: '3px'
                          }}
                        />
                      ),
                      em: ({node, ...props}) => (
                        <em 
                          {...props} 
                          style={{
                            fontStyle: 'italic',
                            color: '#718096',
                            backgroundColor: '#f7fafc',
                            padding: '1px 3px',
                            borderRadius: '2px'
                          }}
                        />
                      ),
                      code: ({node, className, ...props}: any) => {
                        const isInline = !className;
                        return isInline ? (
                          <code 
                            {...props} 
                            style={{
                              backgroundColor: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '11pt',
                              fontFamily: 'Monaco, Consolas, Courier New, monospace',
                              color: '#e53e3e'
                            }}
                          />
                        ) : (
                          <pre 
                            style={{
                              backgroundColor: '#f7fafc',
                              padding: '16px',
                              borderRadius: '6px',
                              fontSize: '11pt',
                              fontFamily: 'Monaco, Consolas, Courier New, monospace',
                              color: '#2d3748',
                              display: 'block',
                              overflow: 'auto',
                              border: '1px solid #e2e8f0',
                              margin: '15px 0'
                            }}
                          >
                            <code {...props} />
                          </pre>
                        );
                      },
                      blockquote: ({node, ...props}) => (
                        <blockquote 
                          {...props} 
                          style={{
                            borderLeft: '4px solid #3182ce',
                            paddingLeft: '16px',
                            margin: '20px 0',
                            backgroundColor: '#f7fafc',
                            padding: '16px',
                            borderRadius: '4px',
                            fontStyle: 'italic',
                            color: '#4a5568'
                          }}
                        />
                      ),
                      hr: ({node, ...props}) => (
                        <hr 
                          {...props} 
                          style={{
                            border: 'none',
                            height: '2px',
                            backgroundColor: '#e2e8f0',
                            margin: '32px 0',
                            borderRadius: '1px'
                          }}
                        />
                      ),
                      a: ({node, ...props}) => (
                        <a 
                          {...props} 
                          style={{
                            color: '#3182ce',
                            textDecoration: 'none',
                            borderBottom: '1px solid #3182ce',
                            paddingBottom: '1px'
                          }}
                        />
                      )
                    }}
                  >
                    {selectedReport.ai_report}
                  </ReactMarkdown>
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .history-page {
          padding: 0;
          max-width: 100%;
        }
        
        .history-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin: 0;
        }
        
        .history-header {
          margin-bottom: 16px;
        }
        
        .history-title {
          margin: 0 0 16px 0 !important;
          font-size: 24px;
          font-weight: 600;
        }
        
        .batch-operations {
          margin-bottom: 16px;
        }
        
        .batch-buttons {
          width: 100%;
          justify-content: flex-start;
        }
        
        .selected-count {
          font-weight: 500;
          color: #666;
        }
        
        .batch-button {
          margin-right: 8px;
          margin-bottom: 8px;
        }
        
        .button-text {
          display: inline;
        }
        
        .history-table {
          overflow-x: auto;
        }
        
        .detail-modal .ant-modal-content {
          border-radius: 12px;
        }
        
        .detail-content {
          max-height: 70vh;
          overflow-y: auto;
        }
        
        .ai-report-content {
          max-height: 400px;
          overflow: auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #2c3e50;
        }
        
        @media (max-width: 768px) {
          .history-title {
            font-size: 20px !important;
          }
          
          .batch-buttons {
            flex-direction: column;
            align-items: stretch;
        }
        
          .batch-button {
            margin-right: 0;
            margin-bottom: 8px;
            width: 100%;
          }
          
          .button-text {
            display: block;
          }
          
          .selected-count {
            text-align: center;
            display: block;
            margin-bottom: 8px;
          }
          
          .history-table {
            font-size: 12px;
          }
          
          .detail-modal {
            width: 95vw !important;
            max-width: 95vw;
        }
        
          .detail-content {
            max-height: 60vh;
          }
          
          .ai-report-content {
            max-height: 300px;
            font-size: 14px;
          }
        }
        
        @media (max-width: 480px) {
          .history-title {
            font-size: 18px !important;
          }
          
          .batch-buttons {
            gap: 8px;
          }
          
          .history-table {
            font-size: 11px;
          }
          
          .detail-modal {
            width: 98vw !important;
            max-width: 98vw;
          }
          
          .detail-content {
            max-height: 50vh;
          }
          
          .ai-report-content {
            max-height: 250px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default History; 