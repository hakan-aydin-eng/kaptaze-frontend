# 🏗️ KapTaze Sistem Mimarisi V2 - Unified Data Strategy

## 🎯 TEK VERİTABANI PRENSİBİ
**Tüm veriler MongoDB Atlas'ta saklanır. Hiç localStorage/sessionStorage kullanılmaz.**

## 📊 VERİ AKIŞ DİYAGRAMI
```
Tüm Paneller → MongoDB Atlas (Primary) → Netlify Functions → Frontend
              ↓
         Cache: Memory only (session bazlı, disk değil)
```

## 🔧 PANELLERİN ROLLERİ

### 1️⃣ MÜŞTERI KAYIT (Customer Registration)
- **Amaç**: Restaurant başvuruları toplar
- **Veri Yazma**: MongoDB/applications collection
- **Veri Okuma**: Yok (sadece form)

### 2️⃣ ADMIN PANEL
- **Amaç**: Başvuruları onaylar, tüm sistemin kontrolü
- **Veri Yazma**: applications → restaurantUsers + restaurantProfiles
- **Veri Okuma**: Tüm collections (applications, restaurantUsers, packages)

### 3️⃣ RESTAURANT PANEL  
- **Amaç**: Onaylı restoranlar paket/menu yönetimi
- **Veri Yazma**: packages collection
- **Veri Okuma**: Kendi verileri (user authentication ile)

## 🛡️ GÜVENLİK & AUTHENTICATION
```javascript
// Tek authentication sistemi - JWT tabanlı
const userSession = {
    token: "JWT_TOKEN",
    user: { id, username, role: "admin|restaurant|customer" },
    expires: timestamp
}
// Sadece memory'de saklanır, localStorage YASAK
```

## 📡 API KATMANI
```
/.netlify/functions/
├── auth.js          // Login/logout tüm paneller için
├── applications.js  // Customer başvuruları
├── restaurants.js   // Restaurant CRUD
├── packages.js      // Package/menu CRUD
└── admin.js         // Admin operations
```

## 🔄 VERİ SENKRONİZASYONU
- Real-time: MongoDB change streams
- Cache: Redis (gelecekte)
- Offline: Service Worker (gelecekte)

## 🌍 GLOBAL ERİŞİM
- Merkezi MongoDB cluster (Frankfurt region)
- CDN: Netlify global edge
- Session: Memory based, secure

## 🚫 YASAKLANAN TEKNOLOJILER
- ❌ localStorage
- ❌ sessionStorage  
- ❌ IndexedDB
- ❌ Çoklu veri kaynağı
- ❌ Client-side database

## ✅ KULLANILACAK TEKNOLOJELER
- ✅ MongoDB Atlas (Primary DB)
- ✅ Netlify Functions (API)
- ✅ JWT Authentication
- ✅ Memory-based session
- ✅ Unified error handling