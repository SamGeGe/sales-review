import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <img
          src={process.env.PUBLIC_URL + '/logo.png'}
          alt="logo"
          className="dashboard-logo"
        />
        <h1 className="dashboard-title">营销中心周复盘系统</h1>
        <h2 className="dashboard-subtitle">
          智能复盘，驱动业绩增长
        </h2>
        <p className="dashboard-description">
          利用AI与数据驱动，轻松完成周计划、个人复盘与报告生成，提升团队协作效率，助力营销目标达成。
        </p>
        <Button
          type="primary"
          size="large"
          className="dashboard-button"
          onClick={() => navigate('/review')}
        >
          开始复盘
        </Button>
      </div>

      <style>{`
        .dashboard-page {
          min-height: calc(100vh - 120px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        
        .dashboard-content {
          background: white;
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.10);
          padding: 32px;
          margin: 32px auto;
          max-width: 600px;
          width: 90vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        
        .dashboard-logo {
          width: 120px;
          height: 120px;
          border-radius: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 24px #a5b4fc55;
        }
        
        .dashboard-title {
          font-size: 40px;
          font-weight: 800;
          color: #2563eb;
          margin: 0;
          letter-spacing: 2px;
        }
        
        .dashboard-subtitle {
          font-size: 28px;
          font-weight: 600;
          margin: 24px 0 12px;
          background: linear-gradient(90deg, #06b6d4, #6366f1);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .dashboard-description {
          font-size: 18px;
          color: #334155;
          max-width: 520px;
          text-align: center;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        
        .dashboard-button {
          font-weight: 600;
          font-size: 18px;
          padding: 0 40px;
          border-radius: 24px;
          box-shadow: 0 2px 8px #6366f155;
          height: 48px;
        }
        
        @media (max-width: 768px) {
          .dashboard-content {
            padding: 24px;
            margin: 16px auto;
            max-width: 98vw;
            border-radius: 16px;
          }
          
          .dashboard-logo {
            width: 100px;
            height: 100px;
            margin-bottom: 20px;
          }
          
          .dashboard-title {
            font-size: 32px;
            letter-spacing: 1px;
          }
          
          .dashboard-subtitle {
            font-size: 24px;
            margin: 20px 0 10px;
          }
          
          .dashboard-description {
            font-size: 16px;
            margin-bottom: 24px;
          }
          
          .dashboard-button {
            font-size: 16px;
            padding: 0 32px;
            height: 44px;
          }
        }
        
        @media (max-width: 480px) {
          .dashboard-content {
            padding: 20px;
            margin: 12px auto;
            border-radius: 12px;
          }
          
          .dashboard-logo {
            width: 80px;
            height: 80px;
            margin-bottom: 16px;
          }
          
          .dashboard-title {
            font-size: 28px;
            letter-spacing: 0.5px;
          }
          
          .dashboard-subtitle {
            font-size: 20px;
            margin: 16px 0 8px;
          }
          
          .dashboard-description {
            font-size: 14px;
            margin-bottom: 20px;
          }
          
          .dashboard-button {
            font-size: 14px;
            padding: 0 24px;
            height: 40px;
          }
        }
        
        @media (max-width: 360px) {
          .dashboard-title {
            font-size: 24px;
          }
          
          .dashboard-subtitle {
            font-size: 18px;
          }
          
          .dashboard-description {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 