// KapTaze Admin Layout - Türkçe Admin Paneli Layout
import React, { useState } from 'react';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Badge, 
  Space, 
  Button,
  Typography,
  Drawer
} from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
  BarChartOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const AdminLayout = ({ children, user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawer, setMobileDrawer] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Menü items
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Özet Panel',
    },
    {
      key: '/restoranlar',
      icon: <ShopOutlined />,
      label: 'Restoranlar',
    },
    {
      key: '/kullanicilar',
      icon: <UserOutlined />,
      label: 'Kullanıcılar',
    },
    {
      key: '/siparisler',
      icon: <ShoppingCartOutlined />,
      label: 'Siparişler',
    },
    {
      key: '/paketler',
      icon: <GiftOutlined />,
      label: 'Paket Yönetimi',
    },
    {
      key: '/analizler',
      icon: <BarChartOutlined />,
      label: 'Analizler',
    },
    {
      key: '/ayarlar',
      icon: <SettingOutlined />,
      label: 'Ayarlar',
    },
  ];

  // Kullanıcı dropdown menüsü
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profil Ayarları',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Sistem Ayarları',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Çıkış Yap',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMobileDrawer(false);
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      onLogout();
    } else if (key === 'profile') {
      navigate('/ayarlar');
    } else if (key === 'settings') {
      navigate('/ayarlar');
    }
  };

  // Mobil menü
  const MobileMenu = () => (
    <Menu
      mode="vertical"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ border: 'none' }}
    />
  );

  return (
    <Layout className="admin-layout">
      {/* Desktop Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth={80}
        className="admin-sider"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Logo */}
        <div className="admin-logo">
          <div className="logo-icon">🌱</div>
          {!collapsed && (
            <div className="logo-text">
              <Title level={4} style={{ color: 'white', margin: 0 }}>
                KapTaze
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}>
                Admin Panel
              </Text>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: '20px' }}
        />
      </Sider>

      {/* Mobil Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🌱</span>
            <div>
              <div style={{ fontWeight: 'bold' }}>KapTaze</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Admin Panel</div>
            </div>
          </div>
        }
        placement="left"
        closable={true}
        onClose={() => setMobileDrawer(false)}
        open={mobileDrawer}
        width={280}
        className="mobile-drawer"
      >
        <MobileMenu />
      </Drawer>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        {/* Header */}
        <Header className="admin-header">
          <div className="header-left">
            {/* Collapse Button */}
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => {
                if (window.innerWidth < 992) {
                  setMobileDrawer(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="collapse-btn"
            />

            {/* Page Title */}
            <Title level={4} style={{ margin: 0, marginLeft: '16px' }}>
              {menuItems.find(item => item.key === location.pathname)?.label || 'KapTaze Admin'}
            </Title>
          </div>

          <div className="header-right">
            <Space size="large">
              {/* Notifications */}
              <Badge count={3} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: '18px' }} />}
                  className="header-btn"
                />
              </Badge>

              {/* User Profile */}
              <Dropdown
                menu={{ 
                  items: userMenuItems,
                  onClick: handleUserMenuClick 
                }}
                trigger={['click']}
              >
                <Space className="user-dropdown">
                  <Avatar 
                    size={36}
                    style={{ 
                      backgroundColor: '#16a34a',
                      cursor: 'pointer'
                    }}
                  >
                    {user?.kullaniciAdi?.[0]?.toUpperCase() || 'A'}
                  </Avatar>
                  <div className="user-info">
                    <div className="user-name">
                      {user?.kullaniciAdi || 'Admin'}
                    </div>
                    <div className="user-role">
                      {user?.rol === 'super_admin' ? 'Süper Admin' : 
                       user?.rol === 'admin' ? 'Admin' : 'Moderatör'}
                    </div>
                  </div>
                  <DownOutlined style={{ fontSize: '12px' }} />
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* Content */}
        <Content className="admin-content">
          <div className="content-wrapper">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;