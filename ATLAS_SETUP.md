# 🌟 KapTaze MongoDB Atlas Kurulum Rehberi

## 📋 Hızlı Kurulum Adımları

### 1. Atlas Hesabı ve Cluster
1. **Atlas Hesabı:** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. **Cluster:** M0 Sandbox (ÜCRETSİZ) - Frankfurt region
3. **Cluster Adı:** `kaptaze-cluster`

### 2. Database Kullanıcısı
- **Username:** `kaptaze-admin`
- **Password:** 21651121
- **Yetki:** Read and write to any database

### 3. Network Erişimi
- **IP Whitelist:** `0.0.0.0/0` (Anywhere - development için)

### 4. Connection String Alma
1. Database → Connect → Connect your application
2. Driver: Node.js
3. Connection string'i kopyalayın

**Örnek Connection String:**
```
mongodb+srv://<kaptaze-admin>:<21651121>@kaptaze-cluster.ra9padd.mongodb.net/?retryWrites=true&w=majority&appName=kaptaze-cluster
```

## 🔧 Projedeki Konfigürasyon

### .env Dosyası Oluşturma
```bash
# .env.example dosyasını .env olarak kopyalayın
cp .env.example .env
```

**`.env` dosyasında güncellenecek değişken:**
```env
MONGODB_URI=mongodb+srv://kaptaze-admin:21651121@kaptaze-cluster.xxxxx.mongodb.net/kaptazeappv5?retryWrites=true&w=majority
```

### Database Configuration
✅ `backend/config/database.js` - Atlas için optimize edildi
- Tüm environment'lar Atlas'a yönlendirildi
- Connection timeout değerleri artırıldı
- Retry logic eklenmiş

## 📊 Database Yapısı

Sistem şu database'leri kullanacak:
- **Production:** `kaptazeappv5`
- **Development:** `kaptaze_dev` 
- **Test:** `kaptaze_test`

## 🚀 Test Etme

### Backend Başlatma
```bash
cd backend
npm install
npm start
```

### Bağlantı Kontrol Mesajları
```
🔄 MongoDB bağlantısı kuruluyor... (development)
📡 URI: mongodb+srv://***:***@kaptaze-cluster.xxxxx.mongodb.net/kaptaze_dev
✅ MongoDB bağlantısı başarıyla kuruldu!
📊 Database: kaptaze_dev
🌐 Host: kaptaze-cluster-shard-00-00.xxxxx.mongodb.net:27017
```

## 🛡️ Güvenlik Notları

### Production için:
1. **IP Whitelist:** Sadece server IP'lerini ekleyin
2. **Strong Passwords:** Karmaşık şifreler kullanın
3. **Environment Variables:** Şifreleri kod içinde yazmayın
4. **Network Security:** VPC/Private endpoints kullanın

### Monitoring:
1. Atlas'ın built-in monitoring'ini kullanın
2. Performance Advisor önerilerini takip edin
3. Alerting kurun (disk usage, connections vb.)

## ⚡ Optimizasyon İpuçları

1. **Indexes:** Sistem otomatik index'ler oluşturacak
2. **Connection Pooling:** Maksimum pool size optimize edildi
3. **Read/Write Concerns:** Majority write concern aktif
4. **Retries:** Automatic retry logic mevcut

## 🆘 Sorun Giderme

### Bağlantı Hataları:
1. Connection string doğru mu?
2. Şifre ve kullanıcı adı doğru mu?
3. IP whitelist ayarlı mı?
4. Network bağlantınız stabil mi?

### Performance Sorunları:
1. Atlas Metrics'i kontrol edin
2. Index usage'ı analiz edin
3. Query performance'ını optimize edin

---

**🎯 Sonuç:** Atlas kurulumu tamamlandığında KapTaze sistemi cloud-native MongoDB ile çalışmaya hazır!