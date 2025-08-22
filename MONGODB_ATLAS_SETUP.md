# 🗄️ MongoDB Atlas Kurulum Rehberi

## 🚀 HEMEN BAŞLA

### 1. MongoDB Atlas Hesabı Oluştur
1. **https://www.mongodb.com/cloud/atlas/register** adresine git
2. **Email** ile kayıt ol
3. **Free Tier** seç (M0 - 512MB ücretsiz)

### 2. Cluster Oluştur
1. **"Build a Database"** tıkla
2. **Free** seçeneğini seç
3. **Provider:** AWS
4. **Region:** Europe (Frankfurt) seç
5. **Cluster Name:** `kaptaze-cluster`
6. **Create Cluster** tıkla (2-3 dakika sürer)

### 3. Database User Oluştur
1. **Database Access** sekmesine git
2. **Add New Database User** tıkla
3. **Username:** `kaptaze`
4. **Password:** `KapTaze2025`
5. **Database User Privileges:** Read and write to any database
6. **Add User** tıkla

### 4. Network Access Ayarla
1. **Network Access** sekmesine git
2. **Add IP Address** tıkla
3. **Allow Access From Anywhere** seç (Netlify için gerekli)
4. **Confirm** tıkla

### 5. Connection String Al
1. **Database** sekmesine git
2. **Connect** butonuna tıkla
3. **Connect your application** seç
4. **Node.js** driver seç
5. Connection string'i kopyala:
```
mongodb+srv://kaptaze:KapTaze2025@kaptaze-cluster.xxxxx.mongodb.net/kaptaze?retryWrites=true&w=majority
```

### 6. Netlify Environment Variables
1. **Netlify Dashboard**'a git
2. **Site Settings → Environment Variables**
3. **Add Variable:**
   - **Key:** `MONGODB_URI`
   - **Value:** `[yukarıdaki connection string]`

## 🔧 HAZIR DOSYALAR

✅ **mongodb-service.js** - MongoDB operations
✅ **mongodb-storage.js** - Netlify function
✅ **.env** - Environment variables
✅ **package.json** - MongoDB driver installed

## 🚀 DEPLOYMENT

```bash
# Environment variable ekle
netlify env:set MONGODB_URI "mongodb+srv://kaptaze:KapTaze2025@kaptaze-cluster.xxxxx.mongodb.net/kaptaze"

# Deploy et
git add .
git commit -m "🗄️ MongoDB Atlas integration - Persistent data storage"
git push
```

## 🎯 VERİ MİGRASYONU

Eski veriler MongoDB'ye otomatik taşınacak:
- ✅ Applications
- ✅ Restaurant Users
- ✅ Restaurant Profiles
- ✅ Packages
- ✅ Orders

## ⚡ AVANTAJLAR

- 🔒 **Kalıcı Veri:** Asla silinmez
- 🌍 **Global Access:** Her yerden erişim
- 📊 **Scalable:** Milyonlarca kayıt
- 🛡️ **Professional:** Enterprise-grade security
- 💰 **Free:** 512MB ücretsiz

## 🔥 HEMEN BAŞLAYALIM!

Sadece **5 dakika** sürecek ve artık hiçbir veri kaybetmeyeceğiz!