// KapTaze Admin Paneli - Ana Uygulama
// Tam Türkçe Arayüz ile Modern React Admin Dashboard

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import trTR from 'antd/locale/tr_TR';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';

// Türkçe tarih konfigürasyonu
dayjs.locale('tr');

// Bileşenler
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RestaurantManagement from './pages/RestaurantManagement';
import UserManagement from './pages/UserManagement';
import OrderManagement from './pages/OrderManagement';
import PackageManagement from './pages/PackageManagement';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Layout
import AdminLayout from './layout/AdminLayout';

// Services
import { AuthService } from './services/authService';

// Styles
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Ant Design tema konfigürasyonu
  const themeConfig = {
    algorithm: theme.defaultAlgorithm,
    token: {
      colorPrimary: '#16a34a',
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
      colorInfo: '#3b82f6',
      borderRadius: 8,
      fontSize: 14,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    components: {
      Layout: {
        headerBg: '#ffffff',
        headerHeight: 64,
        siderBg: '#001529',
      },
      Menu: {
        itemSelectedBg: '#16a34a',
        itemSelectedColor: '#ffffff',
        itemHoverBg: 'rgba(22, 163, 74, 0.1)',
      },
      Button: {
        borderRadius: 6,
        controlHeight: 36,
      },
      Card: {
        borderRadius: 12,
        headerBg: '#fafafa',
      }
    }
  };

  // Auth durumu kontrolü
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('kaptaze_admin_token');
      if (token) {
        const userInfo = await AuthService.validateToken(token);
        setUser(userInfo);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth kontrol hatası:', error);
      localStorage.removeItem('kaptaze_admin_token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      const response = await AuthService.login(credentials);
      localStorage.setItem('kaptaze_admin_token', response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.message || 'Giriş işlemi başarısız' 
      };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('kaptaze_admin_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Loading durumu
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #16a34a, #22c55e)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🌱</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>KapTaze Admin</div>
          <div style={{ fontSize: '14px', marginTop: '10px' }}>Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider locale={trTR} theme={themeConfig}>
      <AntApp>
        <Router>
          <div className="kaptaze-admin">
            {!isAuthenticated ? (
              <Routes>
                <Route 
                  path="/giris" 
                  element={<LoginPage onLogin={handleLogin} />} 
                />
                <Route path="*" element={<Navigate to="/giris" />} />
              </Routes>
            ) : (
              <AdminLayout user={user} onLogout={handleLogout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/restoranlar" element={<RestaurantManagement />} />
                  <Route path="/kullanicilar" element={<UserManagement />} />
                  <Route path="/siparisler" element={<OrderManagement />} />
                  <Route path="/paketler" element={<PackageManagement />} />
                  <Route path="/analizler" element={<Analytics />} />
                  <Route path="/ayarlar" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </AdminLayout>
            )}
          </div>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
};

export default App;