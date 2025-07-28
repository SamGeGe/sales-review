import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Popconfirm, 
  Space,
  Typography 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import apiService from '../utils/apiService';

const { Title } = Typography;

interface User {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getUsers();
      console.log('用户API响应:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        setUsers(response.data);
        setError(null);
        console.log('用户列表设置成功:', response.data);
      } else {
        console.error('用户数据格式错误:', response);
        const errorMsg = '获取用户列表失败：数据格式错误';
        setError(errorMsg);
        message.error(errorMsg);
        setUsers([]);
      }
    } catch (error: any) {
      console.error('获取用户列表失败:', error);
      const errorMsg = `获取用户列表失败: ${error.message}`;
      setError(errorMsg);
      message.error(errorMsg);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Users组件挂载，开始获取用户列表');
    fetchUsers();
  }, []);

  // 添加用户
  const handleAddUser = async (values: { name: string }) => {
    try {
      const response = await apiService.addUser(values.name);
      if (response.success) {
        message.success('用户添加成功');
        setModalVisible(false);
        form.resetFields();
        fetchUsers();
      } else {
        message.error(`添加用户失败: ${response.error}`);
      }
    } catch (error: any) {
      message.error(`添加用户失败: ${error.message}`);
    }
  };

  // 更新用户
  const handleUpdateUser = async (values: { name: string }) => {
    if (!editingUser) return;
    
    try {
      const response = await apiService.updateUser(editingUser.id, values.name);
      if (response.success) {
        message.success('用户更新成功');
        setModalVisible(false);
        setEditingUser(null);
        form.resetFields();
        fetchUsers();
      } else {
        message.error(`更新用户失败: ${response.error}`);
      }
    } catch (error: any) {
      message.error(`更新用户失败: ${error.message}`);
    }
  };

  // 删除用户
  const handleDeleteUser = async (id: number) => {
    try {
      const response = await apiService.deleteUser(id);
      if (response.success) {
        message.success('用户删除成功');
        fetchUsers();
      } else {
        message.error(`删除用户失败: ${response.error}`);
      }
    } catch (error: any) {
      message.error(`删除用户失败: ${error.message}`);
    }
  };

  // 打开编辑模态框
  const openEditModal = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({ name: user.name });
    setModalVisible(true);
  };

  // 打开添加模态框
  const openAddModal = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => {
        if (!text) return '-';
        try {
          const date = new Date(text);
          if (isNaN(date.getTime())) return '-';
          return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        } catch (error) {
          return '-';
        }
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (text: string) => {
        if (!text) return '-';
        try {
          const date = new Date(text);
          if (isNaN(date.getTime())) return '-';
          return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        } catch (error) {
          return '-';
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            description="删除后无法恢复，请谨慎操作。"
            onConfirm={() => handleDeleteUser(record.id)}
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
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={3} style={{ margin: 0 }}>被复盘人管理</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
          >
            添加用户
          </Button>
        </div>

        {error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#ff4d4f' }}>
            <p>{error}</p>
            <Button onClick={fetchUsers}>重试</Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={Array.isArray(users) ? users : []}
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
          />
        )}
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingUser ? handleUpdateUser : handleAddUser}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[
              { required: true, message: '请输入姓名' },
              { min: 1, max: 20, message: '姓名长度应在1-20个字符之间' }
            ]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users; 