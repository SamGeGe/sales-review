import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Table, 
  Button, 
  message, 
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Tooltip,
  Dropdown
} from 'antd';
import { 
  EyeOutlined, 
  CalendarOutlined,
  FileTextOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import apiService from '../utils/apiService';
import dayjs from 'dayjs';

const { Text } = Typography;

interface WeekData {
  id: number;
  week_number: number;
  year: number;
  date_range_start: string;
  date_range_end: string;
  report_count: number;
  locked_count: number;
  unlocked_count: number;
  created_at: string;
  updated_at: string;
}

const History: React.FC = () => {
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动设备
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // 获取周数列表
  const fetchWeeks = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/api/weeks');
      console.log('周数列表API响应:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        setWeeks(response.data);
        console.log('周数列表设置成功:', response.data);
      } else {
        console.error('周数列表数据格式错误:', response);
        message.error('获取周数列表失败：数据格式错误');
        setWeeks([]);
      }
    } catch (error: any) {
      console.error('获取周数列表失败:', error);
      message.error(`获取周数列表失败: ${error.message}`);
      setWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeks();
  }, []);

  // 查看周详情
  const handleViewWeek = (weekId: number) => {
    navigate(`/history/week/${weekId}`);
  };





  // 响应式列配置
  const getColumns = (isMobile: boolean) => [
    {
      title: '周数',
      dataIndex: 'week_number',
      key: 'week_number',
      width: isMobile ? 80 : 100,
      render: (weekNumber: number) => (
        <Tag color="blue" icon={<CalendarOutlined />}>
          第{weekNumber}周
        </Tag>
      ),
    },
    {
      title: '时间范围',
      dataIndex: 'date_range_start',
      key: 'date_range_start',
      width: isMobile ? 120 : 180,
      render: (startDate: string, record: WeekData) => (
        <Tooltip title={`${startDate} 至 ${record.date_range_end}`}>
          <span style={{ fontSize: isMobile ? '12px' : '14px' }}>
            {isMobile 
              ? `${dayjs(startDate).format('MM/DD')} - ${dayjs(record.date_range_end).format('MM/DD')}`
              : `${startDate} 至 ${record.date_range_end}`
            }
          </span>
        </Tooltip>
      ),
    },
    {
      title: '报告统计',
      key: 'statistics',
      width: isMobile ? 100 : 150,
      render: (_: any, record: WeekData) => (
        <Space direction="vertical" size="small">
          <Text style={{ fontSize: isMobile ? '11px' : '12px' }}>
            总报告：{record.report_count} 份
          </Text>
          <Text type="success" style={{ fontSize: isMobile ? '11px' : '12px' }}>
            <LockOutlined /> 已锁定：{record.locked_count} 份
          </Text>
          <Text type="warning" style={{ fontSize: isMobile ? '11px' : '12px' }}>
            <UnlockOutlined /> 未锁定：{record.unlocked_count} 份
          </Text>
        </Space>
      ),
    },
    {
      title: '年份',
      dataIndex: 'year',
      key: 'year',
      width: isMobile ? 60 : 80,
      render: (year: number) => <span style={{ fontSize: isMobile ? '12px' : '14px' }}>{year}</span>,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: isMobile ? 80 : 120,
      render: (text: string) => (
        <Tooltip title={dayjs(text).format('YYYY-MM-DD HH:mm:ss')}>
          <span style={{ fontSize: isMobile ? '11px' : '12px' }}>
            {dayjs(text).format('MM-DD HH:mm')}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: isMobile ? 100 : 160,
      render: (_: any, record: WeekData) => {
        return (
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewWeek(record.id)}
            style={{ 
              borderRadius: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            查看详情
          </Button>
        );
      },
    },
  ];



  // 计算总统计
  const totalStats = weeks.reduce((acc, week) => ({
    totalReports: acc.totalReports + week.report_count,
    totalLocked: acc.totalLocked + week.locked_count,
    totalUnlocked: acc.totalUnlocked + week.unlocked_count,
  }), { totalReports: 0, totalLocked: 0, totalUnlocked: 0 });

  return (
    <div style={{ padding: isMobile ? 12 : 24 }}>
      <Card title="历史复盘报告" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Statistic 
              title="总周数" 
              value={weeks.length} 
              prefix={<CalendarOutlined />}
              valueStyle={{ fontSize: isMobile ? '16px' : '20px' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="总报告数" 
              value={totalStats.totalReports} 
              prefix={<FileTextOutlined />}
              valueStyle={{ fontSize: isMobile ? '16px' : '20px' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="已锁定报告" 
              value={totalStats.totalLocked} 
              valueStyle={{ color: '#cf1322', fontSize: isMobile ? '16px' : '20px' }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="未锁定报告" 
              value={totalStats.totalUnlocked} 
              valueStyle={{ color: '#3f8600', fontSize: isMobile ? '16px' : '20px' }}
            />
          </Col>
        </Row>


      </Card>

      <Card title="周数列表">
        <Table
          columns={getColumns(isMobile)}
          dataSource={weeks}
          rowKey="id"
          pagination={false}
          loading={loading}
          scroll={{ x: isMobile ? 600 : 800 }}
          size={isMobile ? 'small' : 'middle'}
        />
      </Card>
    </div>
  );
};

export default History; 