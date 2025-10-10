# 🔧 Mobil Uygulama Sorunları - Manuel Düzeltme Rehberi

## 📊 Analiz Sonuçları

### Tespit Edilen Sorunlar:

1. ❌ **Socket.IO Backend'de Kurulmamış**
   - Mobil uygulama bağlanmaya çalışıyor ama backend WebSocket sunmuyor
   - Real-time sipariş güncellemeleri çalışmıyor

2. ❌ **Push Token Endpoint Yok**
   - `/auth/push-token` endpoint'i mevcut değil
   - Backend push notification tokenlarını kaydetmiyor

3. ❌ **Consumer Model'de pushToken Field Yok**
   - Database şemasında push token alanı yok

4. ⚠️ **10 Eski Sipariş backendOrderId Eksik**
   - Local storage'da eski siparişler var
   - Bu siparişler için real-time update dinlenemiyor

5. ⚠️ **Kategori API Boş Dönüyor**
   - `/public/categories` endpoint boş array döndürüyor
   - Muhtemelen database'de veri yok

---

## 🎯 Çözüm Stratejisi

### Öncelik Sırası:
1. **Backend Socket.IO Kurulumu** (En kritik)
2. **Push Token Sistemi** (Bildirimler için gerekli)
3. **Eski Sipariş Temizliği** (Mobil uygulama)
4. **Kategori Verisi** (Düşük öncelik)

---

## 📝 Uygulanacak Değişiklikler

### Backend Dosyaları:
1. **`kaptaze-backend-api/server.js`** - Socket.IO ekle
2. **`kaptaze-backend-api/models/Consumer.js`** - pushToken field ekle
3. **`kaptaze-backend-api/routes/auth.js`** - Push token endpoint ekle

### Mobile App Dosyaları:
4. **`kaptazeuygulama/src/context/UserDataContext.js`** - Eski sipariş temizliği

---

## 🚀 ADIM ADIM UYGULAMA

### ADIM 1: Backend Socket.IO (server.js)

**Dosya Yolu:** `C:\Users\hakan\KapTazeApp\kaptaze-backend-api\server.js`

**DEĞİŞİKLİK 1A:** İmportları güncelle (satır 6-12):

```javascript
// MEVCUT:
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// EKLE (satır 11-12'den sonra):
const http = require('http');
const { Server } = require('socket.io');
```

**DEĞİŞİKLİK 1B:** Server ve Socket.IO oluştur (satır 24'ten sonra):

```javascript
// MEVCUT:
const app = express();

// EKLE:
const server = http.createServer(app);

// Socket.IO Configuration
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('🔌 Socket.IO client connected:', socket.id);

    socket.on('join-restaurant', (restaurantId) => {
        socket.join(`restaurant-${restaurantId}`);
        console.log(`🏪 Socket joined restaurant-${restaurantId}`);
    });

    socket.on('join-consumer', (consumerId) => {
        socket.join(`consumer-${consumerId}`);
        console.log(`👤 Socket joined consumer-${consumerId}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io);
```

**DEĞİŞİKLİK 1C:** Server başlatmayı güncelle (satır 157):

```javascript
// MEVCUT (satır 157):
app.listen(PORT, () => {

// DEĞİŞTİR:
server.listen(PORT, () => {  // app → server
```

**DEĞİŞİKLİK 1D:** Health check güncelle (satır 54-60):

```javascript
// MEVCUT:
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// EKLE (socketIO field):
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        socketIO: 'enabled'  // BU SATIRI EKLE
    });
});
```

---

### ADIM 2: Consumer Model (Consumer.js)

**Dosya Yolu:** `C:\Users\hakan\KapTazeApp\kaptaze-backend-api\models\Consumer.js`

**DEĞİŞİKLİK:** pushToken field ekle (satır 99'dan sonra, deviceInfo'dan sonra):

```javascript
// MEVCUT (satır 94-99):
    // Device info (optional)
    deviceInfo: {
        platform: String,
        version: String,
        deviceId: String
    },

    // EKLE (satır 100-114):
    // Push notification token
    pushToken: {
        token: String,
        platform: {
            type: String,
            enum: ['ios', 'android', 'expo']
        },
        deviceInfo: {
            brand: String,
            model: String,
            osVersion: String
        },
        lastUpdated: {
            type: Date,
            default: Date.now
        }
    },

    // Notification preferences (MEVCUT - DOKUNMA)
    notifications: {
        orders: { type: Boolean, default: true },
        promotions: { type: Boolean, default: true },
        news: { type: Boolean, default: false }
    }
```

---

### ADIM 3: Auth Routes (auth.js)

**Dosya Yolu:** `C:\Users\hakan\KapTazeApp\kaptaze-backend-api\routes\auth.js`

**DEĞİŞİKLİK:** Dosyanın EN SONUNA (module.exports'tan ÖNCE) ekle:

```javascript
// @route   POST /auth/push-token
// @desc    Save or update consumer push notification token
// @access  Private
router.post('/push-token', authenticate, async (req, res, next) => {
    try {
        const { userId, consumerEmail, token, platform, deviceInfo } = req.body;

        console.log('📱 Push token request:', {
            userId,
            consumerEmail,
            token: token ? token.substring(0, 20) + '...' : 'MISSING',
            platform
        });

        // Validation
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Push token is required and must be a string'
            });
        }

        // Find consumer
        let consumer;
        if (userId) {
            consumer = await Consumer.findById(userId);
        } else if (consumerEmail) {
            consumer = await Consumer.findOne({ email: consumerEmail.toLowerCase() });
        }

        if (!consumer) {
            return res.status(404).json({
                success: false,
                error: 'Consumer not found'
            });
        }

        // Update push token
        consumer.pushToken = {
            token: token,
            platform: platform || 'expo',
            deviceInfo: deviceInfo || {},
            lastUpdated: new Date()
        };

        await consumer.save();

        console.log(`✅ Push token saved: ${consumer.email}`);

        res.json({
            success: true,
            message: 'Push token saved successfully',
            data: {
                consumerId: consumer._id,
                platform: consumer.pushToken.platform
            }
        });

    } catch (error) {
        console.error('❌ Push token error:', error);
        next(error);
    }
});

module.exports = router;
```

---

### ADIM 4: Mobile App - Eski Sipariş Temizliği

**Dosya Yolu:** `C:\Users\hakan\KapTazeApp\kaptazeuygulama\src\context\UserDataContext.js`

**DEĞİŞİKLİK:** `loadUserSpecificData` fonksiyonunda (satır 480-510):

`if (savedOrders)` bloğunu şu şekilde güncelle:

```javascript
if (savedOrders) {
    const ordersData = JSON.parse(savedOrders);
    console.log('📦 Parsed orders count:', ordersData.length);

    // 🔧 FIX: Eski siparişleri temizle (backendOrderId olmayanları)
    const validOrders = ordersData.filter(order => {
        if (!order.backendOrderId) {
            console.log(`🗑️ Removing old order: ${order.id || order.pickupCode}`);
            return false;
        }
        return true;
    });

    console.log(`✅ Valid orders: ${validOrders.length}/${ordersData.length}`);
    setOrders(validOrders);

    // Storage'ı güncelle
    if (validOrders.length !== ordersData.length) {
        await AsyncStorage.setItem(userKeys.ORDERS, JSON.stringify(validOrders));
        console.log('💾 Cleaned up old orders from storage');
    }
}
```

---

## ✅ UYGULAMA SONRASI TEST

### 1. Backend Testi

```bash
cd C:\Users\hakan\KapTazeApp\kaptaze-backend-api
node server.js
```

**Beklenen Çıktı:**
```
🚀 KapTaze API Server Started!
📍 Server running on port 3000
🔌 Socket.IO enabled for real-time updates
```

**Test Komutları:**
```bash
# Health check
curl http://localhost:3000/health

# Beklenen response:
{
  "status": "OK",
  "socketIO": "enabled"
}
```

### 2. Mobile App Testi

```bash
cd C:\Users\hakan\KapTazeApp\kaptazeuygulama
npx expo start
```

**Kontrol Edilecek Loglar:**
- ❌ "Mobile Socket.IO connection error" → KALKMALI
- ✅ "Socket.IO client connected" → GÖRÜNMELİ (backend loglarında)
- ✅ "Push token saved successfully" → GÖRÜNMELİ
- ✅ "Valid orders: X/17" → Eski siparişler temizlendi

---

## 🐛 Sorun Giderme

### Socket.IO Hala Bağlanamıyor?
1. Backend'de `server.listen` kullandığından emin ol (app.listen DEĞİL)
2. Socket.IO kurulu mu kontrol et: `npm list socket.io`
3. Backend loglarını kontrol et

### Push Token Hata Veriyor?
1. `/auth/push-token` endpoint'i eklendi mi?
2. Consumer model güncellenmiş mi?
3. Token string olarak gönderiliyor mu?

### Eski Siparişler Hala Görünüyor?
1. Uygulamayı tamamen kapat ve yeniden aç
2. AsyncStorage temizle: Settings → Developer → Clear Cache

---

## 📁 Değiştirilecek Dosyalar Özeti

```
kaptaze-backend-api/
├── server.js                    ← Socket.IO ekle
├── models/Consumer.js          ← pushToken field ekle
└── routes/auth.js              ← /push-token endpoint ekle

kaptazeuygulama/
└── src/context/UserDataContext.js  ← Eski sipariş temizliği
```

---

## 🎯 Sonuç

Bu değişiklikleri uyguladıktan sonra:
- ✅ Socket.IO bağlantısı çalışacak
- ✅ Real-time sipariş güncellemeleri gelecek
- ✅ Push notification tokenları kaydedilecek
- ✅ Eski siparişler temizlenecek

**Backend'i restart ettikten sonra mobile app'i yeniden başlatmayı unutma!**
