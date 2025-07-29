import React from 'react';

const About: React.FC = () => (
  <div className="about-page">
    <div className="about-content">
      <h1 className="about-title">关于本系统</h1>
      <p className="about-description">
      <b>营销中心周复盘系统</b> 是一款面向企业营销团队的智能复盘与报告平台，帮助团队高效完成周计划、个人复盘、历史报告查询等核心业务。
    </p>
      <h2 className="about-section-title">系统架构与技术选型</h2>
      <ul className="about-list">
      <li>前端：React + TypeScript + Ant Design，支持响应式布局，适配多终端</li>
      <li>后端：Node.js/Python（可扩展），RESTful API 设计</li>
      <li>数据库：MySQL/PostgreSQL，安全存储复盘数据</li>
      <li>AI能力：集成大模型，自动生成个人与公司级复盘报告</li>
    </ul>
      <h2 className="about-section-title">核心功能</h2>
      <ul className="about-list">
      <li>周计划填写与进度跟踪</li>
      <li>个人复盘与明细填写</li>
      <li>历史复盘报告自动归档与查询</li>
      <li>AI智能分析与报告生成</li>
      <li>权限管理与数据安全</li>
    </ul>
      <h2 className="about-section-title">安全与合规</h2>
      <ul className="about-list">
      <li>用户权限与数据隔离，保障信息安全</li>
      <li>数据传输与存储加密，防止泄露</li>
      <li>操作日志与审计，便于合规追溯</li>
      <li>敏感信息脱敏处理</li>
    </ul>
      <p className="about-footer">
      如需更多信息或定制开发，欢迎联系产品团队。
    </p>
    </div>

    <style>{`
      .about-page {
        padding: 16px;
        max-width: 800px;
        margin: 0 auto;
      }
      
      .about-content {
        background: white;
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.10);
        padding: 32px;
        margin: 32px auto;
        max-width: 800px;
        width: 90vw;
      }
      
      .about-title {
        color: #2563eb;
        font-weight: 700;
        font-size: 32px;
        margin-bottom: 16px;
      }
      
      .about-description {
        font-size: 18px;
        color: #334155;
        margin-bottom: 16px;
        line-height: 1.6;
      }
      
      .about-section-title {
        font-size: 22px;
        color: #6366f1;
        margin: 24px 0 8px;
        font-weight: 600;
      }
      
      .about-list {
        font-size: 16px;
        color: #334155;
        margin-bottom: 16px;
        padding-left: 24px;
        line-height: 1.6;
      }
      
      .about-list li {
        margin-bottom: 8px;
      }
      
      .about-footer {
        font-size: 16px;
        color: #64748b;
        margin-top: 32px;
        text-align: center;
      }
      
      @media (max-width: 768px) {
        .about-page {
          padding: 12px;
        }
        
        .about-content {
          padding: 24px;
          margin: 16px auto;
          max-width: 98vw;
          border-radius: 16px;
        }
        
        .about-title {
          font-size: 28px;
        }
        
        .about-description {
          font-size: 16px;
        }
        
        .about-section-title {
          font-size: 20px;
          margin: 20px 0 6px;
        }
        
        .about-list {
          font-size: 14px;
          padding-left: 20px;
        }
        
        .about-footer {
          font-size: 14px;
          margin-top: 24px;
        }
      }
      
      @media (max-width: 480px) {
        .about-page {
          padding: 8px;
        }
        
        .about-content {
          padding: 20px;
          margin: 12px auto;
          border-radius: 12px;
        }
        
        .about-title {
          font-size: 24px;
        }
        
        .about-description {
          font-size: 14px;
        }
        
        .about-section-title {
          font-size: 18px;
          margin: 16px 0 4px;
        }
        
        .about-list {
          font-size: 13px;
          padding-left: 16px;
        }
        
        .about-footer {
          font-size: 13px;
          margin-top: 20px;
        }
      }
      
      @media (max-width: 360px) {
        .about-title {
          font-size: 22px;
        }
        
        .about-description {
          font-size: 13px;
        }
        
        .about-section-title {
          font-size: 16px;
        }
        
        .about-list {
          font-size: 12px;
        }
        
        .about-footer {
          font-size: 12px;
        }
      }
    `}</style>
  </div>
);

export default About; 