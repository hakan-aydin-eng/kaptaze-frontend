// KapTaze Ana Sayfa - Customer Homepage
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Button,
  Card,
  Row,
  Col,
  Typography,
  Input,
  Space,
  Spin,
  message,
  Carousel,
  Badge,
  Rate,
  Tag
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  StarFilled,
  FireOutlined,
  LeafOutlined,
  ShoppingCartOutlined,
  ArrowRightOutlined,
  GiftOutlined,
  HeartOutlined,
  UserOutlined
} from '@ant-design/icons';

// Services & Hooks
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

// Components
import RestaurantCard from '../components/RestaurantCard';
import PackageCard from '../components/PackageCard';
import LocationSelector from '../components/LocationSelector';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalItems } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [featuredRestaurants, setFeaturedRestaurants] = useState([]);
  const [popularPackages, setPopularPackages] = useState([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalPackages: 0,
    savedFood: 0,
    co2Saved: 0
  });
  const [userLocation, setUserLocation] = useState(null);

  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    loadHomeData();
    getUserLocation();
  }, []);

  // Ana verileri yükle
  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Paralel API çağrıları
      const [
        restaurantsResponse,
        packagesResponse,
        statsResponse
      ] = await Promise.all([
        apiService.getRestaurants({ limit: 6, featured: true }),
        apiService.searchPackages('', { limit: 8, popular: true }),
        apiService.getAppSettings()
      ]);

      if (restaurantsResponse.success) {
        setFeaturedRestaurants(restaurantsResponse.data || []);
      }

      if (packagesResponse.success) {
        setPopularPackages(packagesResponse.data || []);
      }

      if (statsResponse.success && statsResponse.data.stats) {
        setStats(statsResponse.data.stats);
      }

    } catch (error) {
      console.error('Ana sayfa veri yükleme hatası:', error);
      message.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı konumunu al
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          loadNearbyRestaurants(location);
        },
        (error) => {
          console.log('Konum alınamadı:', error);
          // Varsayılan konum (Antalya merkez)
          const defaultLocation = { lat: 36.8969, lng: 30.7133 };
          setUserLocation(defaultLocation);
          loadNearbyRestaurants(defaultLocation);
        }
      );
    }
  };

  // Yakındaki restoranları yükle
  const loadNearbyRestaurants = async (location) => {
    try {
      const response = await apiService.getNearbyPackages(location, 5);
      if (response.success) {
        // Restoranları gruplama
        const restaurants = response.data.reduce((acc, package_item) => {
          const restaurantId = package_item.restoranId;
          if (!acc[restaurantId]) {
            acc[restaurantId] = {
              _id: restaurantId,
              ad: package_item.restoranAdi,
              kategori: package_item.kategori,
              puan: package_item.restoranPuan || 4.0,
              konum: { 
                mesafe: package_item.mesafe,
                adres: package_item.restoranAdres 
              },
              paketSayisi: 1,
              resimUrl: package_item.restoranResim
            };
          } else {
            acc[restaurantId].paketSayisi++;
          }
          return acc;
        }, {});
        
        setNearbyRestaurants(Object.values(restaurants).slice(0, 4));
      }
    } catch (error) {
      console.error('Yakındaki restoranlar yükleme hatası:', error);
    }
  };

  // Arama yap
  const handleSearch = async (value) => {
    if (!value.trim()) {
      message.warning('Lütfen aranacak bir şey yazın');
      return;
    }

    setSearchLoading(true);
    try {
      navigate(`/restoranlar?q=${encodeURIComponent(value.trim())}`);
    } finally {
      setSearchLoading(false);
    }
  };

  // Özellikler listesi
  const features = [
    {
      icon: '🌱',
      title: 'Çevreye Duyarlı',
      description: 'Gıda israfını önleyerek çevre için yapabileceğimiz en iyi şey'
    },
    {
      icon: '💰',
      title: 'Uygun Fiyatlar',
      description: 'Kaliteli yemekleri %50-70 indirimli fiyatlarla alın'
    },
    {
      icon: '🕒',
      title: 'Hızlı Teslimat',
      description: 'Belirlenen saatte hemen teslim alın'
    },
    {
      icon: '⭐',
      title: 'Kaliteli Restoranlar',
      description: 'Sadece seçilmiş ve güvenilir restoranlar'
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: '1rem' }}>
          <Text>Yükleniyor...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <Helmet>
        <title>KapTaze - Gıda İsrafını Önleme Uygulaması</title>
        <meta name="description" content="Restoranlardan uygun fiyatla yemek paketleri alın, gıda israfına karşı durun. Çevre dostu ve tasarruflu yemek deneyimi." />
        <meta name="keywords" content="gıda israfı, restoran, yemek paketi, indirim, çevre, tasarruf" />
      </Helmet>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="container">
            <Row justify="center" align="middle">
              <Col xs={24} sm={20} md={16} lg={12}>
                <div style={{ textAlign: 'center' }}>
                  <Title level={1} className="hero-title" style={{ color: 'white', margin: 0 }}>
                    Gıda İsrafını <br/>
                    <Text style={{ color: '#34d399' }}>Birlikte Önleyelim</Text>
                  </Title>
                  <Paragraph className="hero-subtitle" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem', margin: '1rem 0 2rem' }}>
                    Restoranlardan uygun fiyatla yemek paketleri alın, 
                    çevre için fark yaratın ve tasarruf edin
                  </Paragraph>

                  {/* Arama Çubuğu */}
                  <div style={{ maxWidth: '500px', margin: '0 auto 2rem' }}>
                    <Search
                      placeholder="Restoran veya yemek ara..."
                      allowClear
                      enterButton={
                        <Button type="primary" icon={<SearchOutlined />} loading={searchLoading}>
                          Ara
                        </Button>
                      }
                      size="large"
                      onSearch={handleSearch}
                      style={{
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  </div>

                  {/* İstatistikler */}
                  <div className="hero-stats">
                    <Row gutter={[24, 24]} justify="center">
                      <Col xs={12} sm={6}>
                        <div className="hero-stat">
                          <Text className="hero-stat-number" style={{ color: 'white' }}>
                            {stats.totalRestaurants}+
                          </Text>
                          <Text className="hero-stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            Restoran
                          </Text>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div className="hero-stat">
                          <Text className="hero-stat-number" style={{ color: 'white' }}>
                            {stats.totalPackages}+
                          </Text>
                          <Text className="hero-stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            Paket
                          </Text>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div className="hero-stat">
                          <Text className="hero-stat-number" style={{ color: 'white' }}>
                            {stats.savedFood}kg
                          </Text>
                          <Text className="hero-stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            Kurtarılan Yemek
                          </Text>
                        </div>
                      </Col>
                      <Col xs={12} sm={6}>
                        <div className="hero-stat">
                          <Text className="hero-stat-number" style={{ color: 'white' }}>
                            {stats.co2Saved}kg
                          </Text>
                          <Text className="hero-stat-label" style={{ color: 'rgba(255,255,255,0.8)' }}>
                            CO₂ Tasarrufu
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" style={{ background: 'white' }}>
        <div className="container">
          <div className="section-header">
            <Title level={2} className="section-title">
              Neden KapTaze?
            </Title>
            <Paragraph className="section-subtitle">
              Çevre dostu, ekonomik ve kaliteli yemek deneyimi için tercih edilen platform
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col key={index} xs={24} sm={12} md={6}>
                <Card className="feature-card" hoverable>
                  <div className="feature-icon">{feature.icon}</div>
                  <Title level={4} className="feature-title">
                    {feature.title}
                  </Title>
                  <Paragraph className="feature-description">
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Popular Packages Section */}
      {popularPackages.length > 0 && (
        <section className="section" style={{ background: '#f8fafc' }}>
          <div className="container">
            <div className="section-header">
              <Title level={2} className="section-title">
                🔥 Popüler Paketler
              </Title>
              <Paragraph className="section-subtitle">
                En çok tercih edilen ve değer kazan paketleri keşfedin
              </Paragraph>
            </div>

            <Row gutter={[16, 16]}>
              {popularPackages.slice(0, 8).map((package_item) => (
                <Col key={package_item._id} xs={24} sm={12} md={8} lg={6}>
                  <PackageCard package_item={package_item} />
                </Col>
              ))}
            </Row>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/restoranlar">
                <Button type="primary" size="large" icon={<ArrowRightOutlined />}>
                  Tüm Paketleri Gör
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Restaurants Section */}
      {featuredRestaurants.length > 0 && (
        <section className="section" style={{ background: 'white' }}>
          <div className="container">
            <div className="section-header">
              <Title level={2} className="section-title">
                ⭐ Öne Çıkan Restoranlar
              </Title>
              <Paragraph className="section-subtitle">
                Kaliteli hizmet veren partner restoranlarımızı inceleyin
              </Paragraph>
            </div>

            <Row gutter={[16, 16]}>
              {featuredRestaurants.map((restaurant) => (
                <Col key={restaurant._id} xs={24} sm={12} md={8} lg={8}>
                  <RestaurantCard restaurant={restaurant} />
                </Col>
              ))}
            </Row>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/restoranlar">
                <Button type="default" size="large" icon={<ArrowRightOutlined />}>
                  Tüm Restoranları Gör
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Nearby Restaurants Section */}
      {nearbyRestaurants.length > 0 && (
        <section className="section" style={{ background: '#f8fafc' }}>
          <div className="container">
            <div className="section-header">
              <Title level={2} className="section-title">
                📍 Yakınınızdaki Restoranlar
              </Title>
              <Paragraph className="section-subtitle">
                Konumunuza yakın restoranlardan hemen sipariş verin
              </Paragraph>
            </div>

            <Row gutter={[16, 16]}>
              {nearbyRestaurants.map((restaurant) => (
                <Col key={restaurant._id} xs={24} sm={12} md={6}>
                  <RestaurantCard restaurant={restaurant} showDistance />
                </Col>
              ))}
            </Row>
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="section" style={{ 
        background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
        color: 'white'
      }}>
        <div className="container">
          <Row justify="center" align="middle">
            <Col xs={24} md={16} lg={12}>
              <div style={{ textAlign: 'center' }}>
                <Title level={2} style={{ color: 'white', marginBottom: '1rem' }}>
                  Hemen Başlayın!
                </Title>
                <Paragraph style={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '1.1rem',
                  marginBottom: '2rem' 
                }}>
                  Gıda israfını önleme hareketine katılın, 
                  çevre için değer yaratın ve tasarruf edin
                </Paragraph>
                
                {!user ? (
                  <Space size="middle">
                    <Link to="/kayit">
                      <Button type="default" size="large" icon={<UserOutlined />}>
                        Üye Ol
                      </Button>
                    </Link>
                    <Link to="/restoranlar">
                      <Button 
                        type="primary" 
                        size="large" 
                        style={{ 
                          background: 'white', 
                          borderColor: 'white', 
                          color: '#16a34a' 
                        }}
                        icon={<SearchOutlined />}
                      >
                        Paket Bul
                      </Button>
                    </Link>
                  </Space>
                ) : (
                  <Space size="middle">
                    <Link to="/restoranlar">
                      <Button 
                        type="primary" 
                        size="large" 
                        style={{ 
                          background: 'white', 
                          borderColor: 'white', 
                          color: '#16a34a' 
                        }}
                        icon={<SearchOutlined />}
                      >
                        Paket Bul
                      </Button>
                    </Link>
                    {totalItems > 0 && (
                      <Link to="/sepet">
                        <Badge count={totalItems}>
                          <Button type="default" size="large" icon={<ShoppingCartOutlined />}>
                            Sepetim
                          </Button>
                        </Badge>
                      </Link>
                    )}
                  </Space>
                )}
              </div>
            </Col>
          </Row>
        </div>
      </section>
    </div>
  );
};

export default HomePage;