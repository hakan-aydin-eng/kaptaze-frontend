# 🌐 KapTaze Netlify + Render Deployment

## ⚡ Netlify Alternatifi - 10 Dakikada Canlı!

### 🎯 Hedef URLs:
- **Ana Portal:** https://https://kaptaze.com/
- **Backend API:** https://kaptaze-api.onrender.com  
- **Admin Panel:** https://kaptaze-admin.netlify.app
- **Restoran Panel:** https://kaptaze-restaurant.netlify.app

---

## 1. 🌐 Ana Portal - Netlify Deployment

### GitHub'a Push:
```bash
# Eğer henüz yapmadıysanız
git init
git add .
git commit -m "KapTaze initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Netlify Hesap:
1. [Netlify.com](https://netlify.com) → Sign up with GitHub
2. **New site from Git** → GitHub
3. Repository seç: **KapTazeApp**
4. **Build settings:**
   - Base directory: `frontend/main-portal`
   - Build command: `echo "Static site ready"`
   - Publish directory: `frontend/main-portal`
5. **Deploy site**

### Site Name Değiştir:
1. **Site settings** → **Change site name**
2. **Site name:** `kaptaze` 
3. **Save** → URL: `https://https://kaptaze.com/`

### Environment Variables:
**Site settings → Environment variables:**
```
KAPTAZE_DOMAIN = https://kaptaze.com/
KAPTAZE_ENVIRONMENT = production
NODE_ENV = production
```

---

## 2. 🎨 Backend API - Render Deployment  

### Render Hesap:
1. [Render.com](https://render.com) → Sign up with GitHub
2. **New** → **Web Service**
3. **Connect repository:** KapTazeApp
4. **Konfigürasyon:**
   - Name: `kaptaze-api`
   - Environment: `Node`
   - Region: `Frankfurt` (Avrupa)
   - Branch: `main`
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`

### Environment Variables:
Render Dashboard → Environment sekmesi:
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=your_atlas_connection_string
JWT_SECRET=kaptaze_jwt_secret_key_super_secure_2024
JWT_REFRESH_SECRET=kaptaze_refresh_secret_key_super_secure_2024
SESSION_SECRET=kaptaze_session_secret_key_super_secure_2024

# CORS - Netlify domain'leri
CORS_ORIGIN=https://https://kaptaze.com/,https://kaptaze-admin.netlify.app,https://kaptaze-restaurant.netlify.app

# Database
MONGODB_URI=mongodb+srv://kaptaze-admin:21651121@kaptaze-cluster.ra9padd.mongodb.net/kaptazeappv5?retryWrites=true&w=majority
```

### Deploy:
**Create Web Service** → Otomatik deploy başlar

---

## 3. ⚙️ Admin Panel - Netlify

### Admin Panel Oluştur:
```bash
mkdir -p frontend/admin-panel
cd frontend/admin-panel

# Admin panel HTML
echo '<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KapTaze Admin Panel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #16a34a; text-align: center; }
        .btn { background: #16a34a; color: white; padding: 15px 30px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
        .btn:hover { background: #15803d; }
        .status { background: #f0fdf4; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 KapTaze Admin Panel</h1>
        <div class="status">
            <h3>📊 Sistem Durumu</h3>
            <p>✅ Admin panel aktif</p>
            <p>🔗 API Bağlantısı: <span id="api-status">Test ediliyor...</span></p>
        </div>
        
        <h3>🚀 Hızlı Erişim</h3>
        <a href="https://https://kaptaze.com/" class="btn">🏠 Ana Portal</a>
        <a href="https://kaptaze-restaurant.netlify.app" class="btn">🏪 Restoran Panel</a>
        <a href="https://cloud.mongodb.com" class="btn">💾 MongoDB Atlas</a>
        <a href="https://render.com/dashboard" class="btn">🖥️ Render Dashboard</a>
        
        <h3>📋 Yönetim Araçları</h3>
        <p>🔧 Admin araçları geliştiriliyor...</p>
        <p>📞 Destek: info@kaptazeapp.com.tr</p>
    </div>

    <script>
        // API status check
        fetch("https://kaptaze-api.onrender.com/health")
            .then(response => response.json())
            .then(data => {
                document.getElementById("api-status").innerHTML = "✅ Aktif";
            })
            .catch(() => {
                document.getElementById("api-status").innerHTML = "❌ Bağlantı sorunu";
            });
    </script>
</body>
</html>' > index.html

# Netlify config
echo '[build]
  publish = "."
  command = "echo Admin panel ready"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200' > netlify.toml
```

### Netlify'de Deploy:
1. **New site from Git** → Same repo
2. **Build settings:**
   - Base directory: `frontend/admin-panel`  
   - Build command: `echo "Admin ready"`
   - Publish directory: `frontend/admin-panel`
3. **Site name:** `kaptaze-admin`

---

## 4. 🏪 Restoran Panel - Netlify

### Restoran Panel:
```bash
mkdir -p frontend/restaurant-panel
cd frontend/restaurant-panel

echo '<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KapTaze Restoran Panel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        h1 { color: #667eea; text-align: center; margin-bottom: 30px; }
        .feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .feature-card { background: #f8fafc; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea; }
        .btn { background: #667eea; color: white; padding: 15px 25px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px 5px; transition: all 0.3s; }
        .btn:hover { background: #5a6fd8; transform: translateY(-2px); }
        .stats { background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏪 KapTaze Restoran Paneli</h1>
        
        <div class="stats">
            <h3>📊 Restoran İstatistikleri</h3>
            <p>🎯 Aktif Paket Sayısı: <strong>12</strong></p>
            <p>📦 Toplam Satış: <strong>247</strong></p>
            <p>💰 Bu Ay Kazanç: <strong>₺3.450</strong></p>
        </div>

        <div class="feature-grid">
            <div class="feature-card">
                <h4>📦 Paket Yönetimi</h4>
                <p>Yemek paketlerinizi oluşturun ve yönetin</p>
            </div>
            <div class="feature-card">
                <h4>📋 Sipariş Takibi</h4>
                <p>Gelen siparişleri takip edin ve yönetin</p>
            </div>
            <div class="feature-card">
                <h4>💳 Ödeme Yönetimi</h4>
                <p>Gelir ve ödeme bilgilerinizi görüntüleyin</p>
            </div>
            <div class="feature-card">
                <h4>📊 Analiz Raporları</h4>
                <p>Satış performansınızı analiz edin</p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://https://kaptaze.com/" class="btn">🏠 Ana Portal</a>
            <a href="https://kaptaze-admin.netlify.app" class="btn">⚙️ Admin Panel</a>
            <a href="mailto:restoran@kaptazeapp.com.tr" class="btn">📞 Destek</a>
        </div>

        <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <h4 style="color: #92400e;">🚧 Geliştirme Aşamasında</h4>
            <p style="color: #92400e; margin: 0;">Restoran paneli aktif olarak geliştirilmektedir. Yakında tüm özellikler eklenecek!</p>
        </div>
    </div>
</body>
</html>' > index.html

echo '[build]
  publish = "."
  command = "echo Restaurant panel ready"

[[redirects]]
  from = "/*"  
  to = "/index.html"
  status = 200' > netlify.toml
```

### Deploy:
1. **New site from Git** → Same repo  
2. Base directory: `frontend/restaurant-panel`
3. **Site name:** `kaptaze-restaurant`

---

## 5. 🔧 CORS ve Environment Setup

### Backend CORS Güncellemesi:
Render'da environment variables'a ekle:
```env
CORS_ORIGIN=https://https://kaptaze.com/,https://kaptaze-admin.netlify.app,https://kaptaze-restaurant.netlify.app,http://localhost:8080
```

### SSL Sertifikaları:
- **Netlify:** Otomatik Let's Encrypt SSL ✅
- **Render:** Otomatik SSL ✅

---

## 6. 🧪 Test ve Doğrulama

### API Test:
```bash
curl https://kaptaze-api.onrender.com/health
```

### Frontend Test:
```bash
# Browser'da aç:
https://https://kaptaze.com/
https://kaptaze-admin.netlify.app  
https://kaptaze-restaurant.netlify.app
```

### Cross-Domain Test:
Ana portal'dan API'ye erişim testi

---

## 📊 Deployment Özeti

| Servis | Platform | URL | Status |
|--------|----------|-----|--------|
| Ana Portal | Netlify | https://kaptaze.com/ | ✅ |
| Backend API | Render | kaptaze-api.onrender.com | ✅ |
| Admin Panel | Netlify | kaptaze-admin.netlify.app | ✅ |
| Restoran Panel | Netlify | kaptaze-restaurant.netlify.app | ✅ |
| Database | MongoDB Atlas | cloud.mongodb.com | ✅ |

---

## 💰 Ücretsiz Limitler

- **Netlify:** 100GB bandwidth, sınırsız site
- **Render:** 750 saat/ay free tier
- **MongoDB Atlas:** 512MB storage

---

## 🚀 Sonraki Adımlar

1. ✅ Tüm URL'leri test edin
2. 📧 Custom email setup (ileride)
3. 📊 Analytics ekleme
4. 🔍 SEO optimizasyonu
5. 📱 PWA özellikleri

---

**🎉 KapTaze artık Netlify + Render ile canlıda!**