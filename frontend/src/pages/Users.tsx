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
    <div className="users-page">
      <Card className="users-card">
        <div className="users-header">
          <Title level={3} className="users-title">被复盘人管理</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddModal}
            className="add-user-button"
          >
            添加用户
          </Button>
        </div>

        {error ? (
          <div className="error-container">
            <p>{error}</p>
            <Button onClick={fetchUsers}>重试</Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={Array.isArray(users) ? users : []}
            rowKey="id"
            loading={loading}
            className="users-table"
            scroll={{ x: 600 }}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              responsive: true,
              size: 'small',
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
        className="user-modal"
        width="90vw"
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
            <Space wrap>
              <Button onClick={closeModal}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .users-page {
          padding: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .users-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .users-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .users-title {
          margin: 0 !important;
          font-size: 24px;
          font-weight: 600;
        }
        
        .add-user-button {
          flex-shrink: 0;
        }
        
        .error-container {
          text-align: center;
          padding: 20px;
          color: #ff4d4f;
        }
        
        .users-table {
          overflow-x: auto;
        }
        
        .user-modal .ant-modal-content {
          border-radius: 12px;
        }
        
        @media (max-width: 768px) {
          .users-page {
            padding: 12px;
          }
          
          .users-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          
          .users-title {
            font-size: 20px !important;
            text-align: center;
          }
          
          .add-user-button {
            width: 100%;
          }
          
          .users-table {
            font-size: 12px;
          }
          
          .user-modal {
            width: 95vw !important;
            max-width: 95vw;
          }
        }
        
        @media (max-width: 480px) {
          .users-page {
            padding: 8px;
          }
          
          .users-header {
            gap: 8px;
          }
          
          .users-title {
            font-size: 18px !important;
          }
          
          .users-table {
            font-size: 11px;
          }
          
          .user-modal {
            width: 98vw !important;
            max-width: 98vw;
          }
        }
      `}</style>
    </div>
  );
};

export default Users; 