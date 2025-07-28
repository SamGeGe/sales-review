import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';

const Login: React.FC = () => {
  const onFinish = (values: any) => {
    // 模拟登录成功，写入 token
    localStorage.setItem('token', 'mock-token');
    message.success('登录成功');
    // 跳转到首页
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 350, boxShadow: '0 2px 8px #f0f1f2' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={process.env.PUBLIC_URL + '/logo.png'} alt="logo" style={{ height: 56, marginBottom: 8 }} />
          <h2 style={{ margin: 0, color: '#1890ff', fontWeight: 700 }}>营销中心周复盘系统</h2>
        </div>
        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}> 
            <Input placeholder="请输入用户名" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}> 
            <Input.Password placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>登录</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 