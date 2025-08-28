# KapTaze Sistem Mimarisi ve Veri Akış Haritası

## 🏗️ Sistem Mimarisi Genel Bakış

```
┌──────────────────────────────────────────────────────────────────────┐
│                          KapTaze Platform Mimarisi                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      FRONTEND KATMANI                        │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐ │   │
│  │  │ Main Portal   │  │ Admin Panel    │  │Restaurant Panel│ │   │
│  │  │ (kaptaze.com) │  │(admin.kaptaze) │  │(restoran.     │ │   │
│  │  │               │  │                │  │ kaptaze)       │ │   │
│  │  └───────────────┘  └────────────────┘  └────────────────┘ │   │
│  │                                                               │   │
│  │  ┌───────────────┐  ┌────────────────┐                      │   │
│  │  │ Customer Reg  │  │ Mobile App     │                      │   │
│  │  │ (Müşteri      │  │ (React Native) │                      │   │
│  │  │  Kayıt)       │  │                │                      │   │
│  │  └───────────────┘  └────────────────┘                      │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│                               ▼                                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      BACKEND KATMANI                         │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │         KapTaze Backend API (Node.js/Express)          │ │   │
│  │  ├────────────────────────────────────────────────────────┤ │   │
│  │  │                                                          │ │   │
│  │  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │ │   │
│  │  │  │ Auth Routes │  │ Admin Routes │  │ Restaurant   │  │ │   │
│  │  │  │ /api/auth   │  │ /api/admin   │  │ Routes       │  │ │   │
│  │  │  └─────────────┘  └──────────────┘  │ /api/restoran│  │ │   │
│  │  │                                       └──────────────┘  │ │   │
│  │  │                                                          │ │   │
│  │  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │ │   │
│  │  │  │Order Routes │  │Public Routes │  │Payment Routes│  │ │   │
│  │  │  │/api/siparis │  │ /public      │  │ /api/odeme   │  │ │   │
│  │  │  └─────────────┘  └──────────────┘  └──────────────┘  │ │   │
│  │  │                                                          │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │              Middleware & Services                      │ │   │
│  │  ├────────────────────────────────────────────────────────┤ │   │
│  │  │  • JWT Authentication  • Rate Limiting                  │ │   │
│  │  │  • CORS Handler        • Error Handler                  │ │   │
│  │  │  • Logger              • Validation                     │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│                               ▼                                      │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      VERİTABANI KATMANI                      │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │              MongoDB Atlas (Cloud Database)             │ │   │
│  │  ├────────────────────────────────────────────────────────┤ │   │
│  │  │                                                          │ │   │
│  │  │  Collections:                                            │ │   │
│  │  │  • users        (Kullanıcılar - Admin/Restaurant)       │ │   │
│  │  │  • consumers    (Mobil Uygulama Kullanıcıları)         │ │   │
│  │  │  • restaurants  (Restoranlar)                           │ │   │
│  │  │  • packages     (Paketler)                              │ │   │
│  │  │  • orders       (Siparişler)                            │ │   │
│  │  │  • applications (Başvurular)                            │ │   │
│  │  │  • bildirimler  (Bildirimler)                          │ │   │
│  │  │  • odemeler     (Ödemeler)                              │ │   │
│  │  │                                                          │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    EXTERNAL SERVICES                         │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │                                                               │   │
│  │  • Iyzico Payment Gateway                                    │   │
│  │  • PayTR Payment Gateway                                     │   │
│  │  • Firebase Cloud Messaging (Push Notifications)             │   │
│  │  • SendGrid Email Service                                    │   │
│  │  • Google Maps API (Konum Servisleri)                        │   │
│  │  • Leaflet Maps (Alternatif Harita)                          │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 📁 KapTaze Frontend Sayfaları ve GitHub Kaynak Yapısı

### 🌐 Ana Portal (Main Portal)
**URL:** https://kaptaze.com/  
**GitHub:** https://github.com/hakan-aydin-eng/kaptaze-frontend/tree/main/web  
**Local Dizin:** `/web/`

```
web/
├── index.html                     # Ana sayfa
├── customer-registration-v2.html  # Müşteri kayıt sayfası
├── admin-login-v3.html           # Admin giriş sayfası
├── admin-pro-dash-v2.html        # Admin dashboard
├── restaurant-login.html         # Restoran giriş
├── restaurant-login-v2.html      # Restoran giriş v2
├── restaurant-panel.html         # Restoran panel
├── css/
│   ├── style.css                # Ana portal stilleri
│   ├── admin.css                # Admin panel stilleri
│   └── restaurant.css           # Restoran panel stilleri
├── js/
│   ├── main.js                  # Ana portal JavaScript
│   ├── main-enhanced.js         # Gelişmiş ana portal JS
│   ├── admin-dashboard-api.js   # Admin API işlemleri
│   ├── admin-dashboard-backend.js # Admin backend bağlantısı
│   ├── admin-dashboard-enhanced.js # Gelişmiş admin JS
│   ├── admin-dashboard-professional.js # Pro admin JS
│   ├── admin-login-v3.js        # Admin giriş JS
│   ├── admin-pro-dash-v2.js     # Admin dashboard JS
│   ├── restaurant-panel.js      # Restoran panel JS
│   ├── restaurant.js            # Restoran işlemleri
│   ├── api-config.js           # API yapılandırması
│   ├── api-service.js          # API servisleri
│   ├── backend-service.js      # Backend servisleri
│   ├── config.js               # Genel yapılandırma
│   ├── database.js             # Veritabanı işlemleri
│   ├── env-inject.template.js  # Ortam değişkenleri şablonu
│   ├── github-integration.js   # GitHub entegrasyonu
│   ├── sendgrid-service.js    # Email servisi
│   ├── shared-storage-service.js # Paylaşımlı depolama
│   └── shared.js               # Ortak fonksiyonlar
├── netlify.toml                # Netlify deployment config
├── package.json                # Node.js bağımlılıkları
└── build-script.js            # Build işlemleri
```

**Özellikler:**
- Landing page ve platform tanıtımı
- Restoran ve müşteri giriş yönlendirmeleri
- Platform özellikleri showcase
- Responsive tasarım
- Tüm frontend sayfalarının tek noktadan yönetimi

### 👤 Müşteri Kayıt (Customer Registration)
**Live URL:** https://kaptaze.com/customer-registration-v2.html  
**GitHub Kaynak:** https://github.com/hakan-aydin-eng/kaptaze-frontend/blob/main/web/customer-registration-v2.html  
**Local Dosya:** `/web/customer-registration-v2.html`

**Özellikler:**
- Müşteri kayıt formu
- Form validasyon
- API entegrasyonu
- Başarılı kayıt sonrası yönlendirme

### 🛡️ Admin Panel
**Giriş URL:** https://kaptaze.com/admin-login-v3.html  
**GitHub Giriş Sayfası:** https://github.com/hakan-aydin-eng/kaptaze-frontend/blob/main/web/admin-login-v3.html  
**Dashboard URL:** https://kaptaze.com/admin-pro-dash-v2.html (Başarılı giriş sonrası)  
**GitHub Dashboard:** https://github.com/hakan-aydin-eng/kaptaze-frontend/blob/main/web/admin-pro-dash-v2.html  
**Local Dosyalar:** 
- `/web/admin-login-v3.html` (Giriş)
- `/web/admin-pro-dash-v2.html` (Dashboard)

**Özellikler:**
- Admin giriş sistemi
- Dashboard istatistikleri
- Kullanıcı yönetimi
- Restoran yönetimi
- Sipariş takibi
- Paket yönetimi
- Sistem ayarları

### 🍽️ Restoran Panel
**Giriş URL:** https://kaptaze.com/restaurant-login-v2.html  
**GitHub Giriş Sayfası:** https://github.com/hakan-aydin-eng/kaptaze-frontend/blob/main/web/restaurant-login-v2.html  
**Dashboard URL:** https://kaptaze.com/restaurant-panel.html (Başarılı giriş sonrası)  
**GitHub Dashboard:** https://github.com/hakan-aydin-eng/kaptaze-frontend/blob/main/web/restaurant-panel.html  
**Local Dosyalar:**
- `/web/restaurant-login.html` (Giriş v1)
- `/web/restaurant-login-v2.html` (Giriş v2)
- `/web/restaurant-panel.html` (Dashboard)

**Özellikler:**
- Restoran giriş sistemi
- Paket yönetimi (CRUD)
- Sipariş takibi
- Müşteri yönetimi
- İstatistikler ve raporlar
- Bildirim sistemi

### 📱 Mobil Uygulama (React Native)
**Dizin:** `/kaptazeuygulama/`

```
kaptazeuygulama/
├── App.js              # Ana uygulama komponenti
├── src/
│   ├── screens/        # Ekran komponetleri
│   │   ├── WelcomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── MainScreen.js
│   │   ├── MapScreen.js
│   │   ├── RestaurantDetailScreen.js
│   │   ├── PurchaseScreen.js
│   │   ├── OrdersScreen.js
│   │   ├── FavoritesScreen.js
│   │   ├── ProfileScreen.js
│   │   └── NearbyScreen.js
│   ├── services/
│   │   └── apiService.js     # API entegrasyonu
│   ├── context/
│   │   ├── AuthContext.js    # Kimlik doğrulama context
│   │   └── UserDataContext.js # Kullanıcı veri yönetimi
│   ├── config/
│   │   └── env.js            # Ortam değişkenleri
│   └── data/
│       └── antalyaRestaurants.js # Demo restoran verileri
├── android/            # Android build dosyaları
└── package.json        # Bağımlılıklar
```

**Özellikler:**
- Kullanıcı kaydı ve girişi
- Konum tabanlı restoran listeleme
- Harita görünümü (Google Maps/Leaflet)
- Restoran detayları ve menüler
- Favori restoran yönetimi
- Sipariş oluşturma ve takibi
- Push bildirimler
- Kullanıcı profil yönetimi

## 🔄 Veri Akış Diyagramı

### 1️⃣ Kullanıcı Kayıt ve Giriş Akışı

```
Müşteri/Restoran
      │
      ▼
[Kayıt/Giriş Formu]
      │
      ▼
[Frontend Validasyon]
      │
      ▼
[API Request]
   /auth/register
   /auth/login
      │
      ▼
[Backend Validasyon]
      │
      ▼
[MongoDB İşlemi]
      │
      ├─✓─> [JWT Token Oluştur]
      │          │
      │          ▼
      │     [Response + Token]
      │          │
      │          ▼
      │     [LocalStorage Kayıt]
      │          │
      │          ▼
      │     [Dashboard Yönlendirme]
      │
      └─✗─> [Hata Mesajı]
```

### 2️⃣ Paket Oluşturma ve Listeleme Akışı

```
Restoran Panel
      │
      ▼
[Paket Oluştur Formu]
      │
      ▼
[Form Validasyon]
      │
      ▼
[API Request]
   POST /api/restoran/paket
      │
      ▼
[Auth Middleware]
      │
      ▼
[Backend İşleme]
      │
      ▼
[MongoDB Kayıt]
      │
      ▼
[Response]
      │
      ├─> [Müşteri Uygulaması]
      │         │
      │         ▼
      │    [Paket Listesi Güncelle]
      │
      └─> [Restoran Panel]
               │
               ▼
          [Paket Listesi Güncelle]
```

### 3️⃣ Sipariş Oluşturma Akışı

```
Mobil Uygulama
      │
      ▼
[Paket Seçimi]
      │
      ▼
[Sepete Ekle]
      │
      ▼
[Ödeme Bilgileri]
      │
      ▼
[API Request]
   POST /api/siparis/olustur
      │
      ▼
[Auth Kontrol]
      │
      ▼
[Stok Kontrol]
      │
      ├─✓─> [Sipariş Oluştur]
      │          │
      │          ▼
      │     [MongoDB Kayıt]
      │          │
      │          ├─> [Push Bildirim]
      │          │      └─> Restoran
      │          │
      │          ├─> [Email Bildirim]
      │          │      └─> Müşteri
      │          │
      │          └─> [Response]
      │                 └─> Sipariş Detay
      │
      └─✗─> [Hata: Stok Yok]
```

## 🛠️ Teknoloji Stack

### Frontend
- **Web:** HTML5, CSS3, JavaScript (Vanilla)
- **Mobile:** React Native, Expo
- **Haritalar:** Google Maps API, Leaflet
- **Styling:** Custom CSS, React Native Styles
- **State Management:** React Context API

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Veritabanı:** MongoDB Atlas
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** express-validator, Joi
- **Security:** Helmet, CORS, Rate Limiting
- **File Upload:** Multer
- **Email:** SendGrid
- **Payment:** Iyzico, PayTR

### DevOps & Deployment
- **Frontend Hosting:** Netlify, Render
- **Backend Hosting:** Render, Railway
- **Database:** MongoDB Atlas (Cloud)
- **Version Control:** Git, GitHub
- **CI/CD:** GitHub Actions, Netlify Auto-deploy
- **Monitoring:** Console logs, Error tracking

## 🔐 Güvenlik Önlemleri

1. **Authentication & Authorization**
   - JWT token tabanlı kimlik doğrulama
   - Role-based access control (Admin, Restaurant, Consumer)
   - Token expiry (24 saat)

2. **API Güvenliği**
   - Rate limiting (15 dk'da max 100 istek)
   - CORS politikaları
   - Helmet.js güvenlik headers
   - Input validation ve sanitization

3. **Veri Güvenliği**
   - Password hashing (bcrypt)
   - Environment variables için .env
   - MongoDB connection string gizleme
   - API key koruması

4. **Frontend Güvenliği**
   - XSS koruması
   - LocalStorage token yönetimi
   - HTTPS zorunluluğu
   - Form validation

## 📊 API Endpoint Listesi

### Auth Endpoints
```
POST /auth/admin/login       - Admin girişi
POST /auth/restaurant/login  - Restoran girişi  
POST /auth/consumer/register - Müşteri kaydı
POST /auth/consumer/login    - Müşteri girişi
POST /auth/logout            - Çıkış
GET  /auth/verify            - Token doğrulama
```

### Admin Endpoints
```
GET  /api/admin/dashboard     - Dashboard verileri
GET  /api/admin/kullanicilar  - Kullanıcı listesi
GET  /api/admin/restoranlar   - Restoran listesi
GET  /api/admin/siparisler    - Sipariş listesi
GET  /api/admin/paketler      - Paket listesi
POST /api/admin/restoran/onayla - Restoran onaylama
DELETE /api/admin/kullanici/:id - Kullanıcı silme
```

### Restaurant Endpoints
```
GET  /api/restoran/istatistikler - İstatistikler
GET  /api/restoran/paketler      - Paket listesi
POST /api/restoran/paket         - Paket oluştur
PUT  /api/restoran/paket/:id     - Paket güncelle
DELETE /api/restoran/paket/:id   - Paket sil
GET  /api/restoran/siparisler    - Sipariş listesi
PUT  /api/restoran/siparis/:id   - Sipariş durumu güncelle
```

### Public Endpoints
```
GET  /public/restaurants      - Restoran listesi
GET  /public/restaurant/:id   - Restoran detayı
GET  /public/packages         - Aktif paketler
GET  /public/categories       - Kategoriler
GET  /health                  - Sistem durumu
```

### Order Endpoints
```
POST /api/siparis/olustur    - Sipariş oluştur
GET  /api/siparis/liste       - Kullanıcı siparişleri
GET  /api/siparis/:id         - Sipariş detayı
PUT  /api/siparis/:id/iptal   - Sipariş iptali
```

## 📈 Sistem Metrikleri ve Performans

### Hedef Metrikler
- **API Response Time:** < 200ms
- **Database Query Time:** < 50ms
- **Frontend Load Time:** < 3s
- **Mobile App Launch:** < 2s
- **Uptime:** %99.9

### Kapasite
- **Concurrent Users:** 1000+
- **Daily Transactions:** 10,000+
- **Data Storage:** 10GB (başlangıç)
- **Monthly Bandwidth:** 100GB

## 🚀 Deployment ve CI/CD

### Production URLs
- **Main:** https://kaptaze.com
- **API:** https://kaptaze-backend-api.onrender.com
- **Admin:** https://kaptaze.com/admin-login-v3.html
- **Restaurant:** https://kaptaze.com/restaurant-panel.html

### Deployment Flow
1. **Development:** Local development & testing
2. **Staging:** Test deployment on Netlify/Render
3. **Production:** Production deployment
4. **Monitoring:** Error tracking & performance monitoring

---

**Doküman Tarihi:** 2025-08-28  
**Versiyon:** 1.0.0  
**Hazırlayan:** KapTaze Development Team