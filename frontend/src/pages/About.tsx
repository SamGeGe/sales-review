import React from 'react';

const About: React.FC = () => (
  <div className="responsive-center-card">
    <h1 style={{ color: '#2563eb', fontWeight: 700, fontSize: 32, marginBottom: 16 }}>关于本系统</h1>
    <p style={{ fontSize: 18, color: '#334155', marginBottom: 16 }}>
      <b>营销中心周复盘系统</b> 是一款面向企业营销团队的智能复盘与报告平台，帮助团队高效完成周计划、个人复盘、历史报告查询等核心业务。
    </p>
    <h2 style={{ fontSize: 22, color: '#6366f1', margin: '24px 0 8px' }}>系统架构与技术选型</h2>
    <ul style={{ fontSize: 16, color: '#334155', marginBottom: 16, paddingLeft: 24 }}>
      <li>前端：React + TypeScript + Ant Design，支持响应式布局，适配多终端</li>
      <li>后端：Node.js/Python（可扩展），RESTful API 设计</li>
      <li>数据库：MySQL/PostgreSQL，安全存储复盘数据</li>
      <li>AI能力：集成大模型，自动生成个人与公司级复盘报告</li>
    </ul>
    <h2 style={{ fontSize: 22, color: '#6366f1', margin: '24px 0 8px' }}>核心功能</h2>
    <ul style={{ fontSize: 16, color: '#334155', marginBottom: 16, paddingLeft: 24 }}>
      <li>周计划填写与进度跟踪</li>
      <li>个人复盘与明细填写</li>
      <li>历史复盘报告自动归档与查询</li>
      <li>AI智能分析与报告生成</li>
      <li>权限管理与数据安全</li>
    </ul>
    <h2 style={{ fontSize: 22, color: '#6366f1', margin: '24px 0 8px' }}>安全与合规</h2>
    <ul style={{ fontSize: 16, color: '#334155', marginBottom: 16, paddingLeft: 24 }}>
      <li>用户权限与数据隔离，保障信息安全</li>
      <li>数据传输与存储加密，防止泄露</li>
      <li>操作日志与审计，便于合规追溯</li>
      <li>敏感信息脱敏处理</li>
    </ul>
    <p style={{ fontSize: 16, color: '#64748b', marginTop: 32 }}>
      如需更多信息或定制开发，欢迎联系产品团队。
    </p>
  </div>
);

export default About; 