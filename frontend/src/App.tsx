import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, Button, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
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
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// 扩展dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('zh-cn');
// 设置默认时区为北京时间
dayjs.tz.setDefault('Asia/Shanghai');

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
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const selectedKey = menuItems.find(item => item.path === location.pathname) ?
    menuItems.find(item => item.path === location.pathname)!.key : 'dashboard';

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = menuItems.find(i => i.key === key);
    if (item) {
      navigate(item.path);
      setMobileMenuVisible(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <img src={process.env.PUBLIC_URL + '/logo.png'} alt="logo" className="logo" />
            <span className="app-title">营销中心周复盘系统</span>
          </div>
          
          {/* 桌面端菜单 */}
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            className="desktop-menu"
            items={menuItems}
            onClick={handleMenuClick}
          />
          
          {/* 移动端菜单按钮 */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="mobile-menu-button"
            onClick={() => setMobileMenuVisible(true)}
          />
        </div>
      </Header>
      
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/review" element={<Review />} />
          <Route path="/history" element={<History />} />
          <Route path="/users" element={<Users />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Content>
      
      <Footer className="app-footer">
        © {new Date().getFullYear()} 营销中心周复盘系统
      </Footer>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="菜单"
        placement="right"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        className="mobile-drawer"
      >
        <Menu
          mode="vertical"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: 'none' }}
        />
      </Drawer>
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
