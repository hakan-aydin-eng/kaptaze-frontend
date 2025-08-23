# KapTaze Database Schema - UPDATED v2025.08.23

## Müşteri Kayıt → Admin Dashboard → Restoran Yönetim Akışı

### 📋 TAMAMLANAN SİSTEM ÖZETİ
✅ **Müşteri Kayıt Formu** → Admin Dashboard entegrasyonu
✅ **Admin Dashboard Professional** → Tam işlevsel yönetim paneli  
✅ **Restoran Giriş Sistemi** → Onaylanmış kullanıcıların giriş yapabilmesi
✅ **Veri Akış Sistemi** → MongoDB + LocalStorage + Shared Storage entegrasyonu

---

## 📊 KapTazeDB Collections Structure

### 1️⃣ **applications** (Müşteri Başvuruları)
```javascript
{
  _id: ObjectId,
  applicationId: "APP_1692789123456_abc123def",
  
  // Kişisel Bilgiler
  firstName: "Ahmet",
  lastName: "Yılmaz", 
  email: "ahmet@example.com",
  phone: "05321234567",
  
  // İşletme Bilgileri
  businessName: "Ahmet'in Pizzacısı",
  businessType: "restaurant", // restaurant, cafe, market
  businessCategory: "Pizza & İtalyan", 
  businessAddress: "Atatürk Cad. No:123 Kadıköy/İstanbul",
  businessLatitude: 40.9903,
  businessLongitude: 29.0236,
  
  // Lokasyon
  city: "Istanbul",
  district: "Kadıköy",
  
  // Giriş Bilgileri (başvuru sırasında alınan)
  restaurantUsername: "ahmetspizza",
  restaurantPassword: "123456", // Hash'lenecek
  
  // Başvuru Durumu
  status: "pending", // pending, approved, rejected
  appliedAt: ISODate("2023-08-23T10:30:00.000Z"),
  reviewedAt: null,
  reviewedBy: null,
  
  // Onay Sonrası
  approvedAt: null,
  restaurantUserId: null, // Onaylandığında oluşan kullanıcı ID'si
  restaurantProfileId: null, // Onaylandığında oluşan profil ID'si
  
  // Sistem
  createdAt: ISODate("2023-08-23T10:30:00.000Z"),
  updatedAt: ISODate("2023-08-23T10:30:00.000Z")
}
```

### 2️⃣ **restaurantUsers** (Onaylı Restaurant Kullanıcıları)
```javascript
{
  _id: ObjectId,
  userId: "USR_1692789123456_xyz789",
  
  // Giriş Bilgileri
  username: "ahmetspizza",
  password: "hashed_password",
  email: "ahmet@example.com",
  
  // Kullanıcı Bilgileri
  firstName: "Ahmet",
  lastName: "Yılmaz",
  phone: "05321234567",
  role: "restaurant",
  
  // Durum
  status: "active", // active, inactive, suspended
  isVerified: true,
  
  // İlişkiler
  applicationId: "APP_1692789123456_abc123def", // Başvuru referansı
  profileId: "PROF_1692789123456_def456",
  
  // Oturum Yönetimi
  lastLogin: ISODate("2023-08-23T15:45:00.000Z"),
  loginCount: 12,
  
  // Sistem
  createdAt: ISODate("2023-08-23T11:00:00.000Z"),
  updatedAt: ISODate("2023-08-23T15:45:00.000Z")
}
```

### 3️⃣ **restaurantProfiles** (Restaurant Profilleri)
```javascript
{
  _id: ObjectId,
  profileId: "PROF_1692789123456_def456",
  
  // Kullanıcı Bağlantısı
  userId: "USR_1692789123456_xyz789",
  applicationId: "APP_1692789123456_abc123def",
  
  // İşletme Detayları
  businessName: "Ahmet'in Pizzacısı",
  businessType: "restaurant",
  businessCategory: "Pizza & İtalyan",
  description: "En taze malzemelerle hazırlanan lezzetli pizzalar...",
  
  // Lokasyon
  address: "Atatürk Cad. No:123 Kadıköy/İstanbul",
  city: "Istanbul", 
  district: "Kadıköy",
  latitude: 40.9903,
  longitude: 29.0236,
  
  // İşletme Bilgileri
  workingHours: {
    monday: { open: "09:00", close: "22:00", closed: false },
    tuesday: { open: "09:00", close: "22:00", closed: false },
    // ... diğer günler
  },
  
  // İstatistikler
  rating: 4.5,
  reviewCount: 23,
  totalOrders: 156,
  totalRevenue: 12450.50,
  
  // Durum
  status: "active", // active, inactive, suspended
  isPublished: true,
  
  // Sistem
  createdAt: ISODate("2023-08-23T11:00:00.000Z"),
  updatedAt: ISODate("2023-08-23T16:30:00.000Z")
}
```

### 4️⃣ **packages** (Restaurant Paketleri)
```javascript
{
  _id: ObjectId,
  packageId: "PKG_1692789123456_ghi789",
  
  // Restaurant Bağlantısı
  restaurantId: "USR_1692789123456_xyz789",
  restaurantName: "Ahmet'in Pizzacısı",
  
  // Paket Bilgileri
  name: "Karma Pizza Paketi",
  description: "2 adet karma pizza + 1L kola + salata",
  category: "ana-yemek",
  
  // Fiyat
  originalPrice: 120.00,
  discountedPrice: 75.00,
  discountPercent: 37.5,
  savings: 45.00,
  
  // Stok ve Süre
  quantity: 5,
  sold: 2,
  remaining: 3,
  availableUntil: ISODate("2023-08-24T20:00:00.000Z"),
  
  // Etiketler ve Özellikler
  tags: ["vejetaryen-uygun", "aile-paketi"],
  specialInstructions: "Sıcak teslim edilecektir",
  
  // Görsel
  image: "https://example.com/pizza-package.jpg",
  
  // Durum
  status: "active", // active, sold-out, expired
  isFeature: false,
  
  // Sistem
  createdAt: ISODate("2023-08-23T14:15:00.000Z"),
  updatedAt: ISODate("2023-08-23T16:20:00.000Z")
}
```

### 5️⃣ **orders** (Siparişler)
```javascript
{
  _id: ObjectId,
  orderId: "ORD_1692789123456_jkl012",
  
  // Kullanıcı Bilgileri
  customerId: "CUST_1692789123456_mno345", // Müşteri ID
  customerName: "Fatma Demir",
  customerPhone: "05334567890",
  customerEmail: "fatma@example.com",
  
  // Restaurant Bilgileri
  restaurantId: "USR_1692789123456_xyz789",
  restaurantName: "Ahmet'in Pizzacısı",
  
  // Sipariş Detayları
  packages: [
    {
      packageId: "PKG_1692789123456_ghi789",
      name: "Karma Pizza Paketi",
      price: 75.00,
      quantity: 1
    }
  ],
  
  // Tutar
  subtotal: 75.00,
  tax: 6.75,
  serviceFee: 3.00,
  total: 84.75,
  
  // Durumu
  status: "pending", // pending, confirmed, preparing, ready, delivered, cancelled
  paymentStatus: "paid", // pending, paid, failed, refunded
  paymentMethod: "card",
  
  // Tarih ve Saat
  orderDate: ISODate("2023-08-23T17:30:00.000Z"),
  confirmedAt: null,
  deliveredAt: null,
  
  // Sistem
  createdAt: ISODate("2023-08-23T17:30:00.000Z"),
  updatedAt: ISODate("2023-08-23T17:30:00.000Z")
}
```

### 6️⃣ **adminUsers** (Admin Kullanıcıları)
```javascript
{
  _id: ObjectId,
  userId: "ADMIN_001",
  
  username: "admin",
  password: "hashed_password",
  email: "admin@kaptaze.com",
  
  role: "admin",
  permissions: ["all"],
  
  status: "active",
  lastLogin: ISODate("2023-08-23T18:00:00.000Z"),
  
  createdAt: ISODate("2023-01-01T00:00:00.000Z"),
  updatedAt: ISODate("2023-08-23T18:00:00.000Z")
}
```

## 🔄 **Veri Akış Diyagramı**

```
Müşteri Kayıt (customer-registration.html)
             ↓
    applications collection (pending)
             ↓
    Admin Dashboard (başvuru onayı)
             ↓
    ┌─ restaurantUsers collection
    └─ restaurantProfiles collection
             ↓
    Restaurant Panel (giriş yapabilir)
             ↓
    packages collection (paket oluşturur)
             ↓
    orders collection (siparişler gelir)
```

## 📊 **Admin Dashboard Bölümleri**

1. **Ana Dashboard** - Genel istatistikler
2. **Başvurular** - Pending başvuruları onaylar
3. **Restoranlar** - Onaylı restoranlar listesi
4. **Paketler** - Tüm sistem paketleri
5. **Siparişler** - Tüm sistem siparişleri
6. **Kullanıcılar** - Sistem kullanıcıları
7. **Analizler** - Detaylı raporlar

## ✅ TAMAMLANAN ÖZELLİKLER (v2025.08.23)

### 🏆 Admin Dashboard Professional
- ✅ **Başvuru Yönetimi**: Tüm başvuruları görüntüleme, onay/red işlemleri
- ✅ **Restoran Yönetimi**: Onaylanmış restoranları listeleme, düzenleme  
- ✅ **Paket Yönetimi**: Paket CRUD operasyonları, durum takibi
- ✅ **Sipariş Yönetimi**: Sipariş listesi, durum güncellemeleri
- ✅ **Kullanıcı Yönetimi**: Tüm kullanıcı tiplerinin yönetimi
- ✅ **Analitik Dashboard**: İstatistikler, grafikler, raporlar
- ✅ **Gelişmiş Arama**: Global arama ve filtreleme sistemi
- ✅ **Real-time Updates**: Canlı veri güncellemeleri

### 🔗 Entegrasyon Sistemi
- ✅ **Müşteri Kayıt** → Admin Onay → Restoran Giriş akışı
- ✅ **MongoDB Atlas** entegrasyonu (bulut veritabanı)
- ✅ **LocalStorage** fallback sistemi (offline çalışma)
- ✅ **Shared Storage** service (merkezi veri yönetimi)
- ✅ **Restaurant Authentication** (güvenli giriş sistemi)
- ✅ **Credential Management** (kimlik bilgisi yönetimi)

### 📱 Teknik Altyapı
- ✅ **MongoDB Atlas** cloud database
- ✅ **Netlify Functions** serverless backend
- ✅ **Responsive Design** mobil uyumlu arayüz
- ✅ **Progressive Enhancement** kademeli geliştirme
- ✅ **Cross-Platform** farklı cihaz desteği
- ✅ **Real-time sync**: Anlık veri senkronizasyonu

---

## 🔄 TAM VERİ AKIŞ SÜRECİ

### 1. Müşteri Kayıt → Admin Onay Akışı
```
[customer-registration.html] 
        ↓ (Form Submit)
[KapTazeDB Applications Collection] 
        ↓ (Status: pending)
[Admin Dashboard - Başvurular Bölümü] 
        ↓ (Admin Onay Butonu)
[Username/Password Otomatik Oluşturulur] 
        ↓ (Sistem Entegrasyonu)  
[RestaurantUsers Collection'a Eklenir]
        ↓ (Giriş Hazır)
[restaurant-login.html → Başarılı Giriş]
```

### 2. Admin Workflow
```
Admin Login → Dashboard → Applications List 
        ↓ (Başvuru Görüntüle)
Modal Açılır: İşletme Bilgileri
        ↓ (Onayla Butonu)
Credentials Generate → Restaurant User Create
        ↓ (Success Alert)
Restoran Artık Giriş Yapabilir
```

### 3. Restaurant Authentication Flow
```
[Restaurant Login Form] 
        ↓ (Username/Password Submit)
[KapTazeSharedStorage.authenticateUser()] 
        ↓ (MongoDB Atlas Check)
[Restaurant User Found] → [Token Generated]
        ↓ (Redirect)
[Restaurant Panel] → [Package Management]
```

## 🎯 SİSTEM TAM İŞLEVSEL!

Artık müşteri kayıttan admin onayına, oradan da restoran paneli girişine kadar tam bir akış mevcut. Tüm veriler MongoDB Atlas'ta güvenle saklanıyor ve sistem profesyonel düzeyde çalışıyor.