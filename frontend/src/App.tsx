import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, ConfigProvider } from 'antd';
import Dashboard from './pages/Dashboard';
import Review from './pages/Review';
import History from './pages/History';
import Users from './pages/Users';
import About from './pages/About';
import './App.css';
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import ReactPlugin from '@stagewise-plugins/react';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
dayjs.locale('zh-cn');

const { Header, Content, Footer } = Layout;

const menuItems = [
  { key: 'dashboard', label: '首页', path: '/' },
  { key: 'review', label: '复盘', path: '/review' },
  { key: 'history', label: '历史复盘报告', path: '/history' },
  { key: 'users', label: '用户管理', path: '/users' },
  { key: 'about', label: '关于', path: '/about' },
];

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey = menuItems.find(item => item.path === location.pathname) ?
    menuItems.find(item => item.path === location.pathname)!.key : 'dashboard';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#fff', boxShadow: '0 2px 8px #f0f1f2' }}>
        <img src={process.env.PUBLIC_URL + '/logo.png'} alt="logo" style={{ height: 48, marginRight: 16 }} />
        <span style={{ fontSize: 24, fontWeight: 700, color: '#1890ff', letterSpacing: 2 }}>
          营销中心周复盘系统
        </span>
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          style={{ marginLeft: 'auto', minWidth: 400 }}
          items={menuItems}
          onClick={({ key }) => {
            const item = menuItems.find(i => i.key === key);
            if (item) navigate(item.path);
          }}
        />
      </Header>
      <Content style={{ padding: '40px 24px', background: 'none', flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/review" element={<Review />} />
          <Route path="/history" element={<History />} />
          <Route path="/users" element={<Users />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Content>
      <Footer style={{ textAlign: 'center', color: '#888' }}>
        © {new Date().getFullYear()} 营销中心周复盘系统
      </Footer>
    </Layout>
  );
};

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
      <Router>
        <MainLayout />
      </Router>
    </ConfigProvider>
  );
}

export default App;
