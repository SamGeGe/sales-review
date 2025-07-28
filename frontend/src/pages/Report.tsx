import React from 'react';
import { Card, Typography, Button, Space, Divider, message } from 'antd';
import { DownloadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../utils/apiService';

const { Title, Paragraph } = Typography;

const Report: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 从路由状态获取报告数据
  const reportData = location.state;
  
  if (!reportData || !reportData.reportContent) {
    return (
      <div className="responsive-center-card" style={{ maxWidth: 1000 }}>
        <Card>
          <Title level={3} style={{ color: '#ff4d4f' }}>报告不存在</Title>
          <Paragraph>未找到报告内容，请重新生成报告。</Paragraph>
          <Button type="primary" onClick={() => navigate('/review')}>
            返回复盘页面
          </Button>
        </Card>
      </div>
    );
  }

  const { reportContent, reportId, downloadLinks } = reportData;

  // 处理下载
  const handleDownload = async (format: 'word' | 'pdf') => {
    try {
      const url = downloadLinks[format];
      const filename = `周复盘报告-${reportId}.${format === 'word' ? 'docx' : 'pdf'}`;
      
      const success = await apiService.downloadFile(url, filename);
      if (success) {
        message.success(`${format.toUpperCase()}格式报告下载成功！`);
      }
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败，请重试');
    }
  };

  // 将报告内容按章节分割
  const parseReportContent = (content: string) => {
    const sections = content.split(/(?=^### )/m).filter(section => section.trim());
    return sections.map(section => {
      const lines = section.trim().split('\n');
      const title = lines[0].replace('### ', '');
      const body = lines.slice(1).join('\n').trim();
      return { title, body };
    });
  };

  const reportSections = parseReportContent(reportContent);

  return (
    <div className="responsive-center-card" style={{ maxWidth: 1000 }}>
      <Card>
        {/* 头部操作区 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/review')}
            style={{ fontSize: 16 }}
          >
            返回复盘页面
          </Button>
          
          <Space>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => handleDownload('word')}
            >
              下载Word版本
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => handleDownload('pdf')}
            >
              下载PDF版本
            </Button>
          </Space>
        </div>

        {/* 报告标题 */}
        <Title level={2} style={{ textAlign: 'center', color: '#2563eb', marginBottom: 32 }}>
          周复盘报告
        </Title>

        {/* 报告内容 */}
        <div style={{ lineHeight: 1.8, fontSize: 16 }}>
          {reportSections.map((section, index) => (
            <div key={index} style={{ marginBottom: 32 }}>
              <Title level={3} style={{ color: '#2563eb', marginBottom: 16 }}>
                {section.title}
              </Title>
              <div 
                style={{ 
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#fafafa',
                  padding: 20,
                  borderRadius: 8,
                  border: '1px solid #f0f0f0'
                }}
              >
                {section.body}
              </div>
            </div>
          ))}
        </div>

        {/* 底部信息 */}
        <Divider />
        <div style={{ textAlign: 'center', color: '#666', fontSize: 14 }}>
          <p>报告生成时间：{new Date().toLocaleString('zh-CN')}</p>
          <p>报告ID：{reportId}</p>
        </div>
  </Card>
    </div>
);
};

export default Report; 