# 🆓 KapTaze Ücretsiz Deployment Rehberi

## ⚡ 15 Dakikada Ücretsiz Canlı!

### 🎯 Hedef URLs:
- **Ana Portal:** https://kaptaze.vercel.app
- **Backend API:** https://kaptaze-api.railway.app  
- **Admin Panel:** https://kaptaze-admin.vercel.app
- **Restoran Panel:** https://kaptaze-restaurant.vercel.app

---

## 1. 🚀 Ana Portal - Vercel Deployment

### Hesap Oluştur:
1. [Vercel.com](https://vercel.com) → Sign up with GitHub
2. GitHub'a repo push et (gerekirse)

### Deploy Et:
```bash
# Vercel CLI kur
npm i -g vercel

# Portal dizinine git
cd frontend/main-portal

# Deploy et
vercel

# Sorulara cevap:
# Set up and deploy? Y
# Which scope? [Your account]
# Link to existing project? N  
# What's your project's name? kaptaze
# In which directory is your code located? ./
# Want to override settings? N
```

### Custom Domain (İsteğe Bağlı):
```bash
# Vercel dashboard → Project Settings → Domains
# Add: kaptaze.vercel.app (otomatik)
# Add: kaptaze.com (kendi domain'iniz varsa)
```

---

## 2. 🚂 Backend API - Railway Deployment  

### Hesap Oluştur:
1. [Railway.app](https://railway.app) → Login with GitHub
2. New Project → Deploy from GitHub repo

### Konfigürasyon:
1. **Repo seç:** KapTazeApp
2. **Root Directory:** `/backend`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`

### Environment Variables:
Railway dashboard → Variables sekmesi:
```env
NODE_ENV=production
MONGODB_URI=your_atlas_connection_string
JWT_SECRET=your_secret_key
PORT=$PORT
CORS_ORIGIN=https://kaptaze.vercel.app,https://kaptaze-admin.vercel.app,https://kaptaze-restaurant.vercel.app
```

### Domain:
- Railway otomatik domain verir: `kaptaze-api.railway.app`
- Custom domain: Settings → Domains

---

## 3. ⚙️ Admin Panel - Vercel Deployment

### Admin Panel Hazırlığı:
```bash
# Admin panel dizini oluştur (henüz yoksa)
mkdir -p frontend/admin-panel
cd frontend/admin-panel

# Basit admin panel (placeholder)
echo '<!DOCTYPE html>
<html>
<head><title>KapTaze Admin</title></head>
<body>
    <h1>🔧 KapTaze Admin Panel</h1>
    <p>Admin panel geliştiriliyor...</p>
    <a href="https://kaptaze.vercel.app">← Ana Portal</a>
</body>
</html>' > index.html

# Package.json
echo '{
  "name": "kaptaze-admin",
  "version": "1.0.0",
  "scripts": {
    "build": "echo Building admin panel",
    "start": "echo Admin panel ready"
  }
}' > package.json
```

### Admin Deploy:
```bash
cd frontend/admin-panel
vercel --name kaptaze-admin
```

---

## 4. 🏪 Restoran Panel - Vercel Deployment

### Restoran Panel Hazırlığı:
```bash
mkdir -p frontend/restaurant-panel  
cd frontend/restaurant-panel

# Placeholder restoran paneli
echo '<!DOCTYPE html>
<html>
<head><title>KapTaze Restoran</title></head>
<body>
    <h1>🏪 KapTaze Restoran Paneli</h1>
    <p>Restoran paneli geliştiriliyor...</p>
    <a href="https://kaptaze.vercel.app">← Ana Portal</a>
</body>
</html>' > index.html

echo '{
  "name": "kaptaze-restaurant", 
  "version": "1.0.0"
}' > package.json
```

### Restoran Deploy:
```bash
vercel --name kaptaze-restaurant
```

---

## 5. 🔗 Domain Bağlantısı Test

### API Test:
```bash
curl https://kaptaze-api.railway.app/health
```

### Portal Test:
Browser'da aç: https://kaptaze.vercel.app

### Cross-Origin Test:
Portal'dan API'ye istek atabilme testi

---

## 6. 📊 Monitoring & Analytics

### Vercel Analytics (Ücretsiz):
```bash
# Vercel dashboard → Analytics
# Usage, Performance, Audience verileri
```

### Railway Metrics:
```bash  
# Railway dashboard → Metrics
# CPU, Memory, Network usage
```

---

## 🚨 Sorun Giderme

### Vercel Build Hatası:
```bash
# Logs kontrol
vercel logs

# Local test
vercel dev
```

### Railway Crash:
```bash
# Logs kontrol  
railway logs
```

### CORS Hatası:
```bash
# Backend .env'de CORS_ORIGIN güncelle
CORS_ORIGIN=https://kaptaze.vercel.app
```

---

## 💰 Maliyet Takibi

### Ücretsiz Limitler:
- **Vercel:** Sınırsız deployment, 100GB bandwidth
- **Railway:** $5 kredi/ay (500 saat)
- **Atlas:** 512MB database

### Uyarılar:
- Railway kredisi bitmesin
- Vercel bandwidth limite yaklaşma
- Atlas connection limiti

---

## 🚀 Upgrade Path

### Vercel Pro ($20/ay):
- Custom domains sınırsız
- Advanced analytics
- Team collaboration

### Railway Developer ($5/ay):  
- Unlimited credit
- Custom domains
- Priority support

### MongoDB Shared ($9/ay):
- 2GB storage
- Backup & restore

---

## ✅ Deployment Checklist

- [ ] Vercel hesabı oluşturuldu
- [ ] Railway hesabı oluşturuldu  
- [ ] Ana portal deploy edildi
- [ ] Backend API deploy edildi
- [ ] Environment variables ayarlandı
- [ ] CORS konfigürasyonu yapıldı
- [ ] Health check çalışıyor
- [ ] Domain'ler test edildi
- [ ] Analytics kuruldu

---

**🎉 Tebrikler! KapTaze artık ücretsiz olarak canlıda!**

**URLs:**
- 🏠 Ana Portal: https://kaptaze.vercel.app
- 🔗 API: https://kaptaze-api.railway.app
- ⚙️ Admin: https://kaptaze-admin.vercel.app
- 🏪 Restoran: https://kaptaze-restaurant.vercel.app