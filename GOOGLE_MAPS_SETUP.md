# 🗺️ Google Maps API Setup Rehberi - KapTaze

Bu rehber, KapTaze uygulamasında Google Maps'i etkinleştirmek için gerekli adımları açıklar.

## 📋 Gereksinimler

- Google hesabı
- Kredi kartı bilgileri (Google Cloud için)
- Domain erişimi (kaptaze.netlify.app)

## 🚀 Adım Adım Setup

### 1️⃣ Google Cloud Console'a Giriş

1. **Google Cloud Console'a git**: https://console.cloud.google.com/
2. **Yeni proje oluştur**:
   - Project name: `KapTaze-Maps`
   - Project ID: `kaptaze-maps-[otomatik-id]`
   - Organization: Kişisel hesap

### 2️⃣ Faturalama Ayarları

⚠️ **ÖNEMLİ**: Google Maps API ücretli bir servistir.

1. **Billing hesabı oluştur**
2. **Aylık bütçe sınırı koy**: $20-50 arası (güvenlik için)
3. **Alert'ler ayarla**: $10, $30 limitlerinde uyarı

### 3️⃣ API'ları Etkinleştir

**Gerekli API'lar:**
```
✅ Maps JavaScript API
✅ Places API  
✅ Geocoding API
```

**Etkinleştirme:**
1. Navigation → APIs & Services → Library
2. Her bir API'yı ara ve "Enable" butonuna tıkla

### 4️⃣ API Key Oluşturma

1. **Credentials oluştur**:
   - APIs & Services → Credentials
   - Create Credentials → API Key

2. **API Key'i kopyala**: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### 5️⃣ API Key Güvenlik Ayarları

**HTTP Referrer Restrictions:**
```
kaptaze.netlify.app/*
*.netlify.app/*  
localhost:*/*
127.0.0.1:*/*
```

**API Restrictions:**
```
✅ Maps JavaScript API
✅ Places API  
✅ Geocoding API
```

### 6️⃣ KapTaze Uygulamasına Entegrasyon

**Config dosyasını güncelle:**
```javascript
// web/js/config.js
maps: {
    apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Gerçek API key
    // ... diğer ayarlar
}
```

**Veya Environment Variable kullan:**
```bash
export GOOGLE_MAPS_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

## 📊 Maliyet Kontrolü

### Günlük Kullanım Limitleri
- **Maps JavaScript API**: 28,000 free loads/month
- **Places API**: 2,500 free requests/month
- **Geocoding API**: 40,000 free requests/month

### Tahmini Aylık Maliyetler
- **Düşük kullanım** (100 kayıt/ay): ~$0-5
- **Orta kullanım** (500 kayıt/ay): ~$5-15  
- **Yüksek kullanım** (2000 kayıt/ay): ~$15-50

## 🔧 Test Etme

### 1. Local Development
```bash
cd web/
python -m http.server 8000
# http://localhost:8000/customer-registration.html
```

### 2. Production Test
- https://kaptaze.netlify.app/customer-registration.html
- Developer Console'da hata kontrolü
- Harita yüklenme kontrolü

## ⚠️ Güvenlik Önlemleri

### API Key Koruma
1. **GitHub'a API key commit etme!**
2. Environment variables kullan
3. Domain restrictions mutlaka ayarla
4. Düzenli olarak API key'i yenile

### Monitoring
1. Google Cloud Console → Monitoring
2. Günlük API kullanım kontrolü
3. Anomali durumunda alert

## 🚨 Sorun Giderme

### Yaygın Hatalar

**InvalidKeyMapError:**
- API key yanlış veya eksik
- Domain restrictions kontrol et

**RefererNotAllowedMapError:**
- HTTP referrer restrictions kontrol et
- Domain doğru yazılmış mı?

**QuotaExceededError:**
- Günlük/aylık limit aşıldı
- Billing hesabı kontrol et

### Debug Modları

**Browser Console:**
```javascript
// API key test
console.log(window.KapTazeConfig.maps.apiKey);

// Maps yüklendi mi?
console.log(typeof google !== 'undefined');
```

## 📞 Destek

**Google Cloud Support:**
- https://cloud.google.com/support
- Community forums

**KapTaze Technical:**
- GitHub Issues: https://github.com/hakan-aydin-eng/KapTazeApp/issues

---

## 🎯 Sonraki Adımlar

1. ✅ API key oluştur
2. ✅ Domain restrictions ayarla  
3. ✅ Config dosyasını güncelle
4. ✅ Test et
5. ✅ Production'a deploy et

**Tahmini süre:** 30-60 dakika
**Maliyet:** İlk ay ücretsiz (free tier limitleri dahilinde)