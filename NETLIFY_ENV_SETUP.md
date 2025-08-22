# 🌍 Netlify Environment Variables Setup - KapTaze

Bu rehber, Google Maps API key'ini güvenli şekilde Netlify environment variables ile nasıl ayarlayacağınızı açıklar.

## 🔒 Güvenlik Önemi

❌ **YAPMA**: API key'lerini kodda hardcode etme  
✅ **YAP**: Environment variables kullan

## 📋 Netlify Dashboard Setup

### 1️⃣ Netlify Dashboard'a Git
- https://app.netlify.com/
- KapTaze projesini seç

### 2️⃣ Environment Variables Ekle
**Site Settings → Environment Variables**

**Eklenecek değişkenler:**
```bash
GOOGLE_MAPS_API_KEY = AIzaSyBTPj8fON_ie4OjJUFi1FCDCRD6V6d4xWk
API_BASE_URL = https://kaptaze.netlify.app/.netlify/functions  
NODE_ENV = production
ENVIRONMENT = production
```

### 3️⃣ Build Settings Kontrolü
**Site Settings → Build & Deploy**

```toml
[build]
  publish = "web"
  command = "node build-inject-env.js"
```

## 🔧 Nasıl Çalışır?

### Build Process:
1. **Netlify build başlar**
2. **build-inject-env.js** çalışır
3. **Environment variables** `env-inject.js`'e inject edilir  
4. **Placeholders** gerçek değerlerle değiştirilir
5. **Web sayfaları** environment variables'a erişir

### Code Flow:
```javascript
// 1. env-inject.js (build sırasında güncellenir)
window.GOOGLE_MAPS_API_KEY = 'AIzaSyBTPj8fON_ie4OjJUFi1FCDCRD6V6d4xWk';

// 2. config.js (environment variable'ı kullanır)
apiKey: window.GOOGLE_MAPS_API_KEY || null,

// 3. Maps API loading (güvenli şekilde)
const apiKey = window.KapTazeConfig?.maps?.apiKey;
```

## ✅ Environment Variables Test

### Browser Console'da Test:
```javascript
// Environment variables yüklendi mi?
console.log('API Key:', !!window.GOOGLE_MAPS_API_KEY);
console.log('Config:', window.KapTazeConfig.maps.apiKey ? 'Loaded' : 'Missing');

// Maps özelliği aktif mi?
console.log('Maps enabled:', window.KapTazeConfig.features.mapsEnabled);
```

### Network Tab'da Test:
- Google Maps API request'inin gönderildiğini kontrol et
- API key'in URL'de görünür olduğunu doğrula

## 🚨 Sorun Giderme

### Problem 1: API Key Görünmüyor
**Nedeni**: Environment variable ayarlanmamış
**Çözüm**: Netlify dashboard → Environment Variables → GOOGLE_MAPS_API_KEY ekle

### Problem 2: Build Hatası
**Nedeni**: `build-inject-env.js` çalışmıyor
**Çözüm**: 
```bash
# Local test
node build-inject-env.js

# Build command kontrol et
netlify.toml → command = "node build-inject-env.js"
```

### Problem 3: Placeholder Values
**Nedeni**: Build script çalışmadı
**Belirti**: Console'da `%%GOOGLE_MAPS_API_KEY%%` görünür
**Çözüm**: Netlify build'i yeniden tetikle

## 📊 Deploy Process

### 1️⃣ Environment Variables Ayarla
- Netlify dashboard'dan GOOGLE_MAPS_API_KEY ekle

### 2️⃣ Build Tetikle  
```bash
git push origin main
# veya
netlify deploy --prod
```

### 3️⃣ Verify
- https://kaptaze.netlify.app/customer-registration.html
- Browser Console → Config kontrol
- Harita yükleme test

## 🔐 Güvenlik Best Practices

### API Key Koruma:
1. ✅ **Netlify Environment Variables** kullan
2. ✅ **Google Cloud Console'da domain restrictions** ayarla  
3. ✅ **Debug mode'da API key masking**
4. ✅ **Regular rotation** (3-6 ayda bir)

### Domain Restrictions (Google Console):
```
kaptaze.netlify.app/*
*.netlify.app/*
localhost:*/*
127.0.0.1:*/*
```

## 📈 Monitoring

### Netlify Analytics:
- Build success/failure
- Environment variables status
- Deploy frequency

### Google Cloud Console:
- API usage monitoring  
- Cost tracking
- Quota limits

## 🆘 Emergency Response

### API Key Leak Durumunda:
1. **Immediately**: Google Cloud Console → API key'i disable et
2. **Generate new key**: Yeni API key oluştur
3. **Update Netlify**: Environment variable'ı güncelle  
4. **Redeploy**: Site'ı yeniden deploy et
5. **Monitor**: Unusual activity kontrol et

---

## 🎯 Özet Checklist

- [ ] Netlify environment variables ayarlandı
- [ ] Build command güncellendi  
- [ ] Google Cloud domain restrictions eklendi
- [ ] Production test edildi
- [ ] Debug console temiz
- [ ] API usage monitoring aktif

**Tahmini süre**: 15-30 dakika  
**Sonuç**: Güvenli, production-ready Google Maps entegrasyonu