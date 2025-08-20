# 🆓 KapTaze Ücretsiz Hosting Rehberi

## 🎯 Ücretsiz Seçenekler (0₺ Başlangıç)

### 1. 🚀 **Vercel** (En İyi Seçenek)
- **Ücretsiz:** Sınırsız deployment
- **Domain:** `kaptaze.vercel.app` + kendi domain bağlama
- **SSL:** Otomatik ücretsiz
- **Upgrade:** Pro ($20/ay), Team ($100/ay)
- **Avantaj:** Next.js optimizasyonu, CDN, otomatik scaling

**Kurulum:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

### 2. ☁️ **Netlify**
- **Ücretsiz:** 100GB bandwidth, 300 build minute
- **Domain:** `kaptaze.netlify.app` + custom domain
- **SSL:** Otomatik Let's Encrypt
- **Upgrade:** Pro ($19/ay), Business ($99/ay)

**Kurulum:**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

### 3. 🐙 **GitHub Pages**
- **Ücretsiz:** Sınırsız static hosting
- **Domain:** `username.github.io/kaptaze`
- **SSL:** Otomatik HTTPS
- **Sınır:** Sadece static site

### 4. 🔥 **Firebase Hosting**
- **Ücretsiz:** 10GB hosting, 125K reads/ay
- **Domain:** `kaptaze.web.app` + custom domain
- **SSL:** Otomatik
- **Upgrade:** Blaze Plan (pay-as-you-go)

## 🖥️ Backend Ücretsiz Seçenekler

### 1. 🦎 **Heroku** (Sınırlı)
- **Ücretsiz:** Kapatıldı (2022)
- **Alternatif:** Railway, Render

### 2. 🚂 **Railway**
- **Ücretsiz:** $5 credit/ay, 500 saat
- **Database:** PostgreSQL/MongoDB dahil
- **Domain:** `*.railway.app`
- **Upgrade:** Developer ($5/ay), Team ($20/ay)

### 3. 🎨 **Render**
- **Ücretsiz:** 750 saat/ay static + web service
- **Database:** PostgreSQL ücretsiz
- **SSL:** Otomatik
- **Upgrade:** Starter ($7/ay)

### 4. 🔺 **Vercel Functions**
- **Ücretsiz:** 100GB bandwidth, 12 saniye timeout
- **Database:** PlanetScale/Supabase entegrasyonu
- **API Routes:** Serverless functions

## 💾 Ücretsiz Database Seçenekler

### 1. 🍃 **MongoDB Atlas** (Mevcut)
- **Ücretsiz:** 512MB, 3 cluster
- **Upgrade:** Shared ($9/ay), Dedicated ($57/ay)

### 2. 🐘 **Supabase**
- **Ücretsiz:** 500MB database, 2GB bandwidth
- **Features:** PostgreSQL + Auth + Storage
- **Upgrade:** Pro ($25/ay)

### 3. 🌍 **PlanetScale**
- **Ücretsiz:** 1 database, 10GB storage
- **MySQL uyumlu**
- **Upgrade:** Scaler ($29/ay)

## 🎯 KapTaze İçin Önerilen Kombinasyon

### 💚 **Starter Setup (0₺)**
```
Ana Portal: Vercel/Netlify (kaptaze.vercel.app)
Backend API: Railway (kaptaze-api.railway.app)  
Database: MongoDB Atlas (mevcut)
Admin Panel: Vercel (kaptaze-admin.vercel.app)
Restoran Panel: Vercel (kaptaze-restoran.vercel.app)
```

### 🚀 **Growth Setup ($5-10/ay)**
```
Ana Portal: Vercel Pro
Backend: Railway Developer
Database: MongoDB Atlas Shared
CDN: Cloudflare (ücretsiz)
Monitoring: Vercel Analytics
```

## 📋 Subdomain Organizasyonu

### Vercel Approach:
```
Ana Portal: kaptaze.vercel.app
API: kaptaze-api.railway.app  
Admin: kaptaze-admin.vercel.app
Restoran: kaptaze-restoran.vercel.app
```

### Custom Domain (İleride):
```
Ana Portal: kaptaze.com (Vercel)
API: api.kaptaze.com (Railway)
Admin: admin.kaptaze.com (Vercel)
Restoran: restoran.kaptaze.com (Vercel)
```

## 🛠️ Migration Path

### Phase 1: Free (0₺)
- Vercel/Netlify static hosting
- Railway backend
- Atlas database
- *.vercel.app domains

### Phase 2: Custom Domain (₺100/yıl)
- Domain satın al
- DNS ayarları
- SSL otomatik

### Phase 3: Scale Up ($50-100/ay)  
- Pro plans
- CDN
- Advanced monitoring
- Professional email

## ⚡ Hızlı Başlangıç

### 1. Ana Portal (Vercel):
```bash
cd frontend/main-portal
npx vercel
# Follow prompts
```

### 2. Backend (Railway):
```bash
# railway.app'e git
# GitHub repo connect
# Auto-deploy setup
```

### 3. Environment Variables:
- Railway dashboard'dan env vars ekle
- Vercel dashboard'dan domains ayarla

## 📊 Karşılaştırma

| Servis | Ücretsiz Limit | Custom Domain | Upgrade |
|--------|----------------|---------------|---------|
| Vercel | Sınırsız | ✅ Ücretsiz | $20/ay |
| Netlify | 100GB/ay | ✅ Ücretsiz | $19/ay |
| Railway | $5 credit/ay | ✅ Ücretsiz | $5/ay |
| Render | 750 saat/ay | ✅ Ücretsiz | $7/ay |

## 🎯 Sonuç

**En İyi Seçim:** Vercel (Frontend) + Railway (Backend) + Atlas (DB)
- **Başlangıç:** 0₺
- **Ölçeklenme:** Kolay ve ucuz
- **Performance:** Yüksek
- **Developer Experience:** Mükemmel

---

**🚀 15 dakikada ücretsiz deploy!**