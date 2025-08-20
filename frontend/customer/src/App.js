// KapTaze Customer App - Ana Uygulama Komponenti
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { message } from 'antd';
import { Helmet } from 'react-helmet-async';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Components
import PrivateRoute from './components/PrivateRoute';
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';

// Pages
import HomePage from './pages/HomePage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import NotFoundPage from './pages/NotFoundPage';

// Hooks
import { useAuth } from './hooks/useAuth';

// Styles
import './App.css';

function App() {
  const [loading, setLoading] = useState(true);

  // Uygulama yüklenme durumu
  useEffect(() => {
    const initApp = async () => {
      try {
        // Uygulama başlatma işlemleri
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Türkçe mesaj yapılandırması
        message.config({
          top: 24,
          duration: 3,
          maxCount: 3,
          rtl: false,
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Uygulama başlatma hatası:', error);
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-content">
          <div className="loading-logo">🌱</div>
          <div className="loading-text">KapTaze</div>
          <div className="loading-subtitle">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <CartProvider>
        <div className="App">
          <Helmet>
            <title>KapTaze - Gıda İsrafını Önleme Uygulaması</title>
            <meta name="description" content="Restoranlardan uygun fiyatla yemek paketleri alın ve gıda israfına karşı durun. KapTaze ile çevreyi koruyun ve tasarruf edin." />
            <link rel="canonical" href={window.location.origin} />
          </Helmet>

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<HomePage />} />
              <Route path="restoranlar" element={<RestaurantsPage />} />
              <Route path="restoran/:id" element={<RestaurantDetailPage />} />
              <Route path="giris" element={<LoginPage />} />
              <Route path="kayit" element={<RegisterPage />} />
            </Route>

            {/* Private Routes */}
            <Route path="/hesap" element={<PrivateRoute><UserLayout /></PrivateRoute>}>
              <Route index element={<Navigate to="/hesap/profil" replace />} />
              <Route path="profil" element={<ProfilePage />} />
              <Route path="siparisler" element={<OrdersPage />} />
              <Route path="siparis/:id" element={<OrderDetailPage />} />
            </Route>

            {/* Cart & Checkout */}
            <Route path="/sepet" element={<PublicLayout />}>
              <Route index element={<CartPage />} />
            </Route>
            
            <Route path="/odeme" element={<PrivateRoute><PublicLayout /></PrivateRoute>}>
              <Route index element={<CheckoutPage />} />
            </Route>

            {/* 404 Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;