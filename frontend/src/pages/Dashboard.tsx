import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      <div className="responsive-center-card">
        <img
          src={process.env.PUBLIC_URL + '/logo.png'}
          alt="logo"
          style={{ width: 120, height: 120, borderRadius: 24, marginBottom: 24, boxShadow: '0 4px 24px #a5b4fc55' }}
        />
        <h1 style={{ fontSize: 40, fontWeight: 800, color: '#2563eb', margin: 0, letterSpacing: 2 }}>营销中心周复盘系统</h1>
        <h2 style={{ fontSize: 28, fontWeight: 600, margin: '24px 0 12px', background: 'linear-gradient(90deg, #06b6d4, #6366f1)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          智能复盘，驱动业绩增长
        </h2>
        <p style={{ fontSize: 18, color: '#334155', maxWidth: 520, textAlign: 'center', marginBottom: 32 }}>
          利用AI与数据驱动，轻松完成周计划、个人复盘与报告生成，提升团队协作效率，助力营销目标达成。
        </p>
        <Button
          type="primary"
          size="large"
          style={{ fontWeight: 600, fontSize: 18, padding: '0 40px', borderRadius: 24, boxShadow: '0 2px 8px #6366f155' }}
          onClick={() => navigate('/review')}
        >
          开始复盘
        </Button>
      </div>
    </div>
  );
};

export default Dashboard; 