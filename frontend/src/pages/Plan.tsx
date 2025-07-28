import React from 'react';
import { Form, Input, Button, Card } from 'antd';

const Plan: React.FC = () => {
  const onFinish = (values: any) => {
    // 这里可对接后端保存接口
    console.log('计划提交:', values);
  };
  return (
    <Card title="周计划填写" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="本周目标" name="goal" rules={[{ required: true, message: '请输入本周目标' }]}> 
          <Input.TextArea rows={3} placeholder="请输入本周目标" />
        </Form.Item>
        <Form.Item label="上周完成情况" name="lastWeek" rules={[{ required: true, message: '请输入上周完成情况' }]}> 
          <Input.TextArea rows={3} placeholder="请输入上周完成情况" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">提交计划</Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Plan; 