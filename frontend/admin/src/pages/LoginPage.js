// KapTaze Admin Login Sayfası - Türkçe
import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Alert, 
  Space,
  Checkbox
} from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import './LoginPage.css';

const { Title, Text } = Typography;

const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    setError('');

    try {
      const result = await onLogin({
        kullaniciAdi: values.username,
        sifre: values.password,
        beniHatirla: values.remember
      });

      if (!result.success) {
        setError(result.message || 'Giriş işlemi başarısız');
      }
    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background */}
      <div className="login-background">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      {/* Login Form */}
      <div className="login-form-container">
        <Card className="login-card">
          {/* Logo ve Başlık */}
          <div className="login-header">
            <div className="logo-section">
              <div className="logo-icon">🌱</div>
              <div className="logo-text">
                <Title level={2} style={{ margin: 0, color: '#16a34a' }}>
                  KapTaze
                </Title>
                <Text type="secondary">Admin Paneli</Text>
              </div>
            </div>
            <Text className="login-subtitle">
              Gıda israfı önleme sistemine hoş geldiniz
            </Text>
          </div>

          {/* Hata Mesajı */}
          {error && (
            <Alert
              message="Giriş Hatası"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: '24px' }}
              onClose={() => setError('')}
            />
          )}

          {/* Giriş Formu */}
          <Form
            form={form}
            name="adminLogin"
            onFinish={handleSubmit}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              label="Kullanıcı Adı"
              rules={[
                { required: true, message: 'Kullanıcı adını girin' },
                { min: 3, message: 'Kullanıcı adı en az 3 karakter olmalı' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="input-icon" />}
                placeholder="Admin kullanıcı adınız"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Şifre"
              rules={[
                { required: true, message: 'Şifrenizi girin' },
                { min: 6, message: 'Şifre en az 6 karakter olmalı' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="Admin şifreniz"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Beni hatırla</Checkbox>
            </Form.Item>

            <Form.Item style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<LoginOutlined />}
                block
                className="login-button"
              >
                {loading ? 'Giriş yapılıyor...' : 'Admin Girişi'}
              </Button>
            </Form.Item>
          </Form>

          {/* Demo Hesap Bilgileri */}
          <div className="demo-info">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Demo hesap bilgileri:
            </Text>
            <div className="demo-credentials">
              <Text code>Kullanıcı: admin</Text>
              <Text code>Şifre: admin123</Text>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <Space direction="vertical" align="center">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                KapTaze © 2024 - Gıda İsrafını Önleme Sistemi
              </Text>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Güvenli admin erişimi
              </Text>
            </Space>
          </div>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="stats-overlay">
        <div className="stat-card">
          <div className="stat-icon">🍽️</div>
          <div className="stat-text">
            <div className="stat-number">1,247</div>
            <div className="stat-label">Aktif Restoran</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-text">
            <div className="stat-number">8,934</div>
            <div className="stat-label">Kurtarılan Paket</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌍</div>
          <div className="stat-text">
            <div className="stat-number">2.4T</div>
            <div className="stat-label">CO₂ Tasarrufu</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;