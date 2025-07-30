import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Breadcrumb
} from 'antd';
import {
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  HistoryOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiService from '../utils/apiService';

const { Title, Text } = Typography;

interface WeekReport {
  id: number;
  user_name: string;
  review_method: string;
  is_locked: number;
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
  locked_count: number;
  unlocked_count: number;
}

const WeekDetail: React.FC = () => {
  const { weekId } = useParams<{ weekId: string }>();
  const navigate = useNavigate();
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [reports, setReports] = useState<WeekReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReports, setSelectedReports] = useState<number[]>([]);

  useEffect(() => {
    fetchWeekData();
  }, [weekId]);

  const fetchWeekData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/api/weeks/${weekId}`);
      if (response.success) {
        setWeekData(response.data.week);
        setReports(response.data.reports);
      } else {
        message.error('获取周详情失败');
      }
    } catch (error) {
      console.error('获取周详情失败:', error);
      message.error('获取周详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (reportId: number) => {
    navigate(`/history/week/${weekId}/report/${reportId}`);
  };

  const handleDownloadReport = async (reportId: number, format: 'word' | 'pdf') => {
    try {
      const response = await fetch(`${apiService.getBaseUrl()}/api/reports/download/${format}/${reportId}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 优先从响应头获取文件名
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = '';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            fileName = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
          }
        }
        
        // 如果没有从响应头获取到文件名，使用默认格式
        if (!fileName) {
          const fileExtension = format === 'word' ? 'docx' : format;
          fileName = `报告_${reportId}.${fileExtension}`;
        }
        
        a.download = fileName;
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

  const handleDeleteReport = async (reportId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这份报告吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await apiService.delete(`/api/reports/delete/${reportId}`);
          if (response.success) {
            message.success('报告删除成功');
            fetchWeekData(); // 刷新数据
          } else {
            message.error('删除失败');
          }
        } catch (error) {
          console.error('删除报告失败:', error);
          message.error('删除失败');
        }
      }
    });
  };

  const handleToggleLock = async (reportId: number, currentLocked: number) => {
    try {
      const response = await apiService.put(`/api/reviews/${reportId}/lock`, {
        locked: !currentLocked
      });
      if (response.success) {
        message.success(currentLocked ? '报告已解锁' : '报告已锁定');
        fetchWeekData(); // 刷新数据
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      console.error('切换锁定状态失败:', error);
      message.error('操作失败');
    }
  };

  const handleBatchDownload = async (format: 'word' | 'pdf') => {
    if (selectedReports.length === 0) {
      message.warning('请先选择要下载的报告');
      return;
    }

    try {
      message.loading('正在准备批量下载...', 0);
      
      // 调用后端的批量下载接口，传递选中的报告ID
      const reportIdsParam = selectedReports.join(',');
      const response = await fetch(`${apiService.getBaseUrl()}/api/weeks/${weekId}/download/${format}?reportIds=${reportIdsParam}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 从响应头获取文件名
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = '';
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            fileName = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
          }
        }
        
        // 如果没有从响应头获取到文件名，使用默认格式
        if (!fileName) {
          const fileExtension = format === 'word' ? 'docx' : format === 'pdf' ? 'pdf' : 'zip';
          fileName = `第${weekData?.week_number}周_批量下载.${fileExtension}`;
        }
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        message.destroy();
        message.success(`批量下载完成，共下载 ${selectedReports.length} 份报告`);
        setSelectedReports([]);
      } else {
        message.destroy();
        message.error(`批量下载失败: ${response.statusText}`);
      }
    } catch (error: any) {
      message.destroy();
      message.error(`批量下载失败: ${error.message}`);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedReports.length === 0) {
      message.warning('请先选择要删除的报告');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedReports.length} 份报告吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          message.loading('正在删除...', 0);
          
          for (const reportId of selectedReports) {
            await apiService.delete(`/api/reports/delete/${reportId}`);
          }
          
          message.destroy();
          message.success(`批量删除完成，共删除 ${selectedReports.length} 份报告`);
          setSelectedReports([]);
          fetchWeekData(); // 刷新数据
        } catch (error) {
          message.destroy();
          message.error('批量删除失败');
        }
      }
    });
  };

  const columns = [
    {
      title: '被复盘人',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120,
    },
    {
      title: '复盘时间',
      dataIndex: 'date_range_start',
      key: 'date_range_start',
      width: 200,
      render: (text: string, record: WeekReport) => (
        <span>{text} 至 {record.date_range_end}</span>
      ),
    },
    {
      title: '复盘方式',
      dataIndex: 'review_method',
      key: 'review_method',
      width: 120,
      render: (text: string) => (
        <Tag color={text === 'online' ? 'blue' : 'green'}>
          {text === 'online' ? '线上复盘' : '线下复盘'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_locked',
      key: 'is_locked',
      width: 100,
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
      width: 150,
      render: (text: string) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: WeekReport) => {
        const handleDownloadWord = () => handleDownloadReport(record.id, 'word');
        const handleDownloadPdf = () => handleDownloadReport(record.id, 'pdf');
        const handleDelete = () => handleDeleteReport(record.id);
        const handleToggleLockClick = () => handleToggleLock(record.id, record.is_locked);

        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewReport(record.id)}
              style={{ 
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              查看
            </Button>
            <Button
              size="small"
              icon={<FileWordOutlined />}
              onClick={handleDownloadWord}
              style={{ 
                borderRadius: '6px',
                border: '1px solid #d9d9d9',
                backgroundColor: '#fafafa'
              }}
            >
              Word
            </Button>
            <Button
              size="small"
              icon={<FilePdfOutlined />}
              onClick={handleDownloadPdf}
              style={{ 
                borderRadius: '6px',
                border: '1px solid #d9d9d9',
                backgroundColor: '#fafafa'
              }}
            >
              PDF
            </Button>
            <Button
              type={record.is_locked ? "default" : "primary"}
              size="small"
              icon={record.is_locked ? <UnlockOutlined /> : <LockOutlined />}
              onClick={handleToggleLockClick}
              style={{ 
                borderRadius: '6px',
                border: record.is_locked ? '1px solid #d9d9d9' : 'none',
                backgroundColor: record.is_locked ? '#fafafa' : undefined
              }}
            >
              {record.is_locked ? '解锁' : '锁定'}
            </Button>
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              style={{ 
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(220,53,69,0.2)'
              }}
            >
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedReports,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedReports(selectedRowKeys as number[]);
    },
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (!weekData) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>周数据不存在</div>
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
        <Breadcrumb.Item>第{weekData.week_number}周详情</Breadcrumb.Item>
      </Breadcrumb>

      {/* 周数头部信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/history')}
              style={{ marginRight: 16 }}
            >
              返回
            </Button>
          </Col>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              第{weekData.week_number}周复盘报告 
              ({weekData.date_range_start} 至 {weekData.date_range_end})
            </Title>
          </Col>
        </Row>
        
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={6}>
            <Statistic title="总报告数" value={weekData.report_count} />
          </Col>
          <Col span={6}>
            <Statistic title="已锁定" value={weekData.locked_count} valueStyle={{ color: '#cf1322' }} />
          </Col>
          <Col span={6}>
            <Statistic title="未锁定" value={weekData.unlocked_count} valueStyle={{ color: '#3f8600' }} />
          </Col>
          <Col span={6}>
            <Statistic title="年份" value={weekData.year} formatter={(value) => value} />
          </Col>
        </Row>
      </Card>

      {/* 批量操作 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Text>已选择 {selectedReports.length} 项</Text>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleBatchDownload('word')}
            disabled={selectedReports.length === 0}
          >
            批量下载Word
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleBatchDownload('pdf')}
            disabled={selectedReports.length === 0}
          >
            批量下载PDF
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleBatchDelete}
            disabled={selectedReports.length === 0}
          >
            批量删除
          </Button>
        </Space>
      </Card>

      {/* 报告列表 */}
      <Card title="报告列表">
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={reports}
          rowKey="id"
          pagination={false}
          loading={loading}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default WeekDetail; 