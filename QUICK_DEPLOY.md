# ⚡ KapTaze Hızlı Canlıya Alma Rehberi

## 🚀 1-Click Deployment Hazır!

### 1. Domain Satın Al
- **Önerilen:** `kaptazeapp.com.tr` 
- **Registrar:** NIC.TR, Turhost, veya Hosting.com.tr
- **Maliyet:** ₺50-100/yıl

### 2. Sunucu Kirala
- **DigitalOcean Droplet:** Ubuntu 22.04, 2CPU/4GB RAM (~$24/ay)
- **Alternative:** AWS EC2 t3.medium (~$35/ay)

### 3. DNS Ayarları
```
A Records:
kaptazeapp.com.tr      → SUNUCU_IP
www.kaptazeapp.com.tr  → SUNUCU_IP  
api.kaptazeapp.com.tr  → SUNUCU_IP
admin.kaptazeapp.com.tr → SUNUCU_IP
restoran.kaptazeapp.com.tr → SUNUCU_IP
```

## 🛠️ Sunucu Kurulum (5 Dakika)

### 1. Temel Kurulumlar:
```bash
# Sistem güncelleme
sudo apt update && sudo apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo apt install docker-compose -y

# Git clone
git clone YOUR_REPO_URL kaptaze
cd kaptaze
```

### 2. Environment Ayarları:
```bash
# .env dosyasını oluştur
cp deployment/.env.example deployment/.env

# Değişkenleri düzenle
nano deployment/.env
```

**Gerekli değişkenler:**
```env
DOMAIN=kaptazeapp.com.tr
MONGODB_URI=your_atlas_connection_string
JWT_SECRET=your_secret_key
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=strong_password
```

### 3. SSL Sertifikası:
```bash
# Certbot kurulumu
sudo apt install certbot -y

# SSL sertifikası alma
sudo certbot certonly --standalone \
  -d kaptazeapp.com.tr \
  -d www.kaptazeapp.com.tr \
  -d api.kaptazeapp.com.tr \
  -d admin.kaptazeapp.com.tr \
  -d restoran.kaptazeapp.com.tr \
  --email info@kaptazeapp.com.tr \
  --agree-tos
```

### 4. Deploy:
```bash
# Production ortamında çalıştır
cd deployment
docker-compose up -d

# Logları kontrol et
docker-compose logs -f
```

## ✅ Test Etme

### 1. Health Check:
```bash
curl -X GET https://api.kaptazeapp.com.tr/health
```

### 2. Ana Portal Test:
```bash
curl -I https://kaptazeapp.com.tr
```

### 3. Browser Test:
- 🏠 Ana Portal: https://kaptazeapp.com.tr
- 👤 Müşteri: https://app.kaptazeapp.com.tr  
- ⚙️ Admin: https://admin.kaptazeapp.com.tr
- 🏪 Restoran: https://restoran.kaptazeapp.com.tr
- 🔗 API: https://api.kaptazeapp.com.tr

## 📊 Monitoring

### Grafana Dashboard:
https://monitor.kaptazeapp.com.tr

### Docker Status:
```bash
docker-compose ps
docker-compose logs backend
```

## 🔧 Troubleshooting

### SSL Sorunları:
```bash
# Sertifikayı yenile
sudo certbot renew

# Nginx restart
docker-compose restart nginx
```

### MongoDB Bağlantısı:
```bash
# Backend logs
docker-compose logs backend | grep MongoDB

# Bağlantı test
docker-compose exec backend npm run test-db
```

## 🎯 Toplam Süre: ~30 Dakika

1. **Domain satın alma:** 10 dakika
2. **Sunucu kiralama:** 5 dakika  
3. **DNS ayarları:** 5 dakika
4. **Kurulum + Deploy:** 10 dakika

---

**🌍 KapTaze artık dünya çapında erişilebilir!**

## 📞 Destek

Sorun yaşıyorsanız:
1. Logs'ları kontrol edin: `docker-compose logs`
2. Health check yapın: `/health` endpoint'leri
3. DNS propagation kontrol: https://dnschecker.org

**🎉 Tebrikler! KapTaze canlıda!**