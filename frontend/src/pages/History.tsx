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
  Descriptions
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

  // 查看报告详情
  const viewReportDetail = (report: ReviewReport) => {
    setSelectedReport(report);
    setDetailModalVisible(true);
  };

  // 下载报告
  const handleDownload = async (format: 'word' | 'pdf', report: ReviewReport) => {
    if (!report.ai_report) {
      message.warning('该报告没有AI生成内容');
      return;
    }

    try {
      message.loading(`正在生成${format.toUpperCase()}文件...`, 0);
      
      // 直接使用报告ID下载
      const downloadUrl = `${config.getFrontend().backend_url}/api/reports/download/${format}/${report.id}`;
      const response = await fetch(downloadUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `第${calculatePeriodNumber(reports, report)}期-${report.user_name}-复盘报告.${format === 'word' ? 'docx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.destroy();
      message.success(`${format.toUpperCase()}文件下载成功`);
      
    } catch (error: any) {
      message.destroy();
      console.error('下载失败:', error);
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
      
      // 其他情况返回空数组
      return [];
    } catch (error) {
      console.error('数据解析失败:', error, '原始数据:', data);
      return [];
    }
  };

  // 判断是否为当前周的报告（用于高亮显示）
  const isCurrentWeekReport = (report: ReviewReport) => {
    const today = dayjs();
    const reportStart = dayjs(report.date_range_start);
    const reportEnd = dayjs(report.date_range_end);
    
    // 检查当前日期是否在报告时间范围内
    return today.isAfter(reportStart.subtract(1, 'day')) && today.isBefore(reportEnd.add(1, 'day'));
  };

  // 判断是否为最近保存的报告（7天内）
  const isRecentReport = (report: ReviewReport) => {
    const reportDate = dayjs(report.created_at);
    const today = dayjs();
    return today.diff(reportDate, 'day') <= 7;
  };

  // 计算期数（根据复盘时间区间分组，同一区间使用相同期数）
  const calculatePeriodNumber = (reports: ReviewReport[], currentReport: ReviewReport) => {
    // 按复盘时间区间分组
    const dateRangeGroups = new Map<string, ReviewReport[]>();
    
    reports.forEach(report => {
      const dateRangeKey = `${report.date_range_start}_${report.date_range_end}`;
      if (!dateRangeGroups.has(dateRangeKey)) {
        dateRangeGroups.set(dateRangeKey, []);
      }
      dateRangeGroups.get(dateRangeKey)!.push(report);
    });
    
    // 按时间区间排序，获取当前报告所在的区间索引
    const sortedDateRanges = Array.from(dateRangeGroups.keys()).sort((a, b) => {
      const [aStart] = a.split('_');
      const [bStart] = b.split('_');
      return dayjs(aStart).valueOf() - dayjs(bStart).valueOf();
    });
    
    const currentDateRangeKey = `${currentReport.date_range_start}_${currentReport.date_range_end}`;
    const periodIndex = sortedDateRanges.findIndex(range => range === currentDateRangeKey);
    
    return periodIndex + 1;
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
      title: '期数',
      dataIndex: 'period_display',
      key: 'period_display',
      width: 120,
      render: (text: string, record: ReviewReport) => {
        const periodNumber = calculatePeriodNumber(reports, record);
        const isCurrent = isCurrentWeekReport(record);
        
        let color = 'blue';
        if (isCurrent) color = 'green';
        
        return (
          <Tag color={color}>
            {periodNumber}
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
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>历史复盘报告</Title>
          <Text type="secondary">按期数显示所有历史复盘报告，支持查看、下载和删除操作</Text>
          
          {/* 图例说明 */}
          <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>🔥 当前周报告</span> | 
              <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>⭐ 最近报告</span> | 
              <span style={{ color: '#1890ff' }}>📋 历史报告</span>
            </Text>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={reports}
          rowKey="id"
          loading={loading}
          rowClassName={getRowClassName}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSize: 10,
          }}
        />
      </Card>

      {/* 报告详情模态框 */}
      <Modal
        title={`第${selectedReport ? calculatePeriodNumber(reports, selectedReport) : ''}期 - ${selectedReport?.user_name} 复盘报告详情`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={1000}
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
          <div>
            {/* 基本信息 */}
            <Descriptions title="基本信息" bordered style={{ marginBottom: 24 }}>
              <Descriptions.Item label="期数">{calculatePeriodNumber(reports, selectedReport)}</Descriptions.Item>
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
            <Card title="上周复盘计划" style={{ marginBottom: 16 }}>
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
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <div>暂无数据</div>
                  </div>
                );
              })()}
            </Card>

            {/* 上周行动回顾 */}
            <Card title="上周行动回顾" style={{ marginBottom: 16 }}>
              {(() => {
                const lastWeekActionsData = parseJsonString(selectedReport.last_week_actions);
                return lastWeekActionsData.length > 0 ? (
                  <Table
                    dataSource={lastWeekActionsData}
                    pagination={false}
                    columns={[
                      { title: '日期', dataIndex: 'day', key: 'day', width: 80 },
                      { title: '白天-动作', dataIndex: 'morningAction', key: 'morningAction' },
                      { title: '白天-结果', dataIndex: 'morningResult', key: 'morningResult' },
                      { title: '晚上-动作', dataIndex: 'eveningAction', key: 'eveningAction' },
                      { title: '晚上-结果', dataIndex: 'eveningResult', key: 'eveningResult' },
                    ]}
                    size="small"
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <div>暂无数据</div>
                  </div>
                );
              })()}
            </Card>

            {/* 本周计划 */}
            <Card title="本周计划" style={{ marginBottom: 16 }}>
              {(() => {
                const weekPlanData = parseJsonString(selectedReport.week_plan);
                return weekPlanData.length > 0 ? (
                  <Table
                    dataSource={weekPlanData}
                    pagination={false}
                    columns={[
                      { title: '任务', dataIndex: 'task', key: 'task' },
                      { title: '期望结果', dataIndex: 'expectedResult', key: 'expectedResult' },
                    ]}
                    size="small"
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    <div>暂无数据</div>
                  </div>
                );
              })()}
            </Card>

            {/* 需协调事项 */}
            {selectedReport.coordination_items && (
              <Card title="需协调事项" style={{ marginBottom: 16 }}>
                <Text>{selectedReport.coordination_items}</Text>
              </Card>
            )}

            {/* 其他事项 */}
            {selectedReport.other_items && (
              <Card title="其他事项" style={{ marginBottom: 16 }}>
                <Text>{selectedReport.other_items}</Text>
              </Card>
            )}

            {/* AI报告 */}
            {selectedReport.ai_report && (
              <Card title="AI生成报告">
                <div style={{ 
                  maxHeight: '400px', 
                  overflow: 'auto',
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
                    {selectedReport.ai_report}
                  </ReactMarkdown>
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>

      <style>{`
        .current-week-row {
          background-color: #f6ffed !important;
          border-left: 3px solid #52c41a;
        }
        
        .current-week-row:hover {
          background-color: #d9f7be !important;
        }
      `}</style>
    </div>
  );
};

export default History; 