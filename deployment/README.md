# KapTaze Production Deployment Guide
## .com.tr Domain ile Production Deployment

Bu rehber, KapTaze uygulamasının production ortamında nasıl deploy edileceğini açıklar.

## 📋 Ön Gereksinimler

### Sistem Gereksinimleri
- **İşletim Sistemi**: Ubuntu 20.04 LTS veya daha yeni
- **RAM**: Minimum 4GB (8GB önerilen)
- **Disk**: Minimum 50GB SSD
- **CPU**: 2 core (4 core önerilen)
- **Network**: 100 Mbps internet bağlantısı

### Yazılım Gereksinimleri
```bash
# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git kurulumu
sudo apt update
sudo apt install git -y
```

## 🚀 Deployment Adımları

### 1. Repository'yi Klonlayın
```bash
git clone https://github.com/your-username/KapTazeApp.git
cd KapTazeApp/deployment
```

### 2. Environment Dosyasını Hazırlayın
```bash
# .env dosyasını oluşturun
cp .env.example .env

# .env dosyasını editörde açın
nano .env
```

### 3. Gerekli Ayarları Yapılandırın

#### Domain Ayarları
```env
DOMAIN=kaptazeapp.com.tr
FRONTEND_URL=https://kaptazeapp.com.tr
API_BASE_URL=https://api.kaptazeapp.com.tr
```

#### Veritabanı Ayarları
```env
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=güçlü_şifre_buraya
REDIS_PASSWORD=redis_şifre_buraya
```

#### Güvenlik Ayarları
```env
JWT_SECRET=çok_güçlü_jwt_secret_key_buraya
JWT_REFRESH_SECRET=çok_güçlü_refresh_secret_key_buraya
```

#### Ödeme Entegrasyonu
```env
# İyzico Production Ayarları
IYZICO_API_KEY=production_api_key
IYZICO_SECRET_KEY=production_secret_key

# PayTR Production Ayarları
PAYTR_MERCHANT_ID=merchant_id
PAYTR_MERCHANT_KEY=merchant_key
PAYTR_MERCHANT_SALT=merchant_salt
```

### 4. DNS Ayarlarını Yapılandırın

Domain sağlayıcınızdan aşağıdaki A kayıtlarını ekleyin:

```
kaptazeapp.com.tr        A    YOUR_SERVER_IP
www.kaptazeapp.com.tr    A    YOUR_SERVER_IP
api.kaptazeapp.com.tr    A    YOUR_SERVER_IP
admin.kaptazeapp.com.tr  A    YOUR_SERVER_IP
```

### 5. Deployment'ı Başlatın
```bash
# Deployment script'ini çalıştırılabilir yapın
chmod +x deploy.sh

# Deployment'ı başlatın
./deploy.sh
```

## 🔧 Yapılandırma Detayları

### Nginx Konfigürasyonu
- SSL/TLS terminasyonu
- Rate limiting
- CORS ayarları
- Static file caching
- Security headers

### Veritabanı Konfigürasyonu
- MongoDB with authentication
- Redis caching
- Automatic indexing
- Backup configuration

### SSL Sertifikaları
- Let's Encrypt otomatik sertifika
- Otomatik yenileme
- HSTS headers
- Perfect Forward Secrecy

### Monitoring
- Prometheus metrics
- Grafana dashboards
- Elasticsearch logging
- Health checks

## 📊 Monitoring ve Yönetim

### Servis Durumunu Kontrol Etme
```bash
# Tüm servislerin durumu
docker-compose ps

# Servis loglarını görüntüleme
docker-compose logs -f [service_name]

# Kaynak kullanımını görüntüleme
docker stats
```

### Monitoring URL'leri
- **Grafana**: https://monitor.kaptazeapp.com.tr
- **Prometheus**: http://localhost:9090
- **Elasticsearch**: http://localhost:9200

### Backup İşlemleri
```bash
# Manuel backup oluşturma
docker-compose exec mongodb mongodump --out /backup/manual_backup_$(date +%Y%m%d)

# Backup'ları listeleme
ls -la backup/

# Backup'tan restore etme
docker-compose exec mongodb mongorestore /backup/backup_directory
```

## 🔒 Güvenlik Önlemleri

### 1. Firewall Ayarları
```bash
# UFW aktif et
sudo ufw enable

# Gerekli portları aç
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Gereksiz portları kapat
sudo ufw deny 27017/tcp  # MongoDB
sudo ufw deny 6379/tcp   # Redis
```

### 2. SSH Güvenliği
```bash
# SSH key-based authentication kullanın
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Root login'i devre dışı bırakın
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
```

### 3. Regular Updates
```bash
# Sistem güncellemeleri
sudo apt update && sudo apt upgrade -y

# Docker güncellemeleri
docker-compose pull
docker-compose up -d
```

## 🚨 Troubleshooting

### Yaygın Problemler ve Çözümleri

#### 1. SSL Sertifikası Alınamıyor
```bash
# Certbot loglarını kontrol edin
docker-compose logs certbot

# DNS ayarlarını kontrol edin
nslookup kaptazeapp.com.tr

# Port 80'in açık olduğunu kontrol edin
sudo netstat -tlnp | grep :80
```

#### 2. Veritabanı Bağlantısı Kurulamıyor
```bash
# MongoDB loglarını kontrol edin
docker-compose logs mongodb

# Network bağlantısını test edin
docker-compose exec backend ping mongodb
```

#### 3. Yüksek Bellek Kullanımı
```bash
# Container'ları yeniden başlatın
docker-compose restart

# Unused image'ları temizleyin
docker image prune -f

# System resource'ları temizleyin
docker system prune -f
```

## 📈 Performance Optimizasyonu

### 1. Database Optimizasyonu
```javascript
// MongoDB indexleri oluşturun
db.kullanicilar.createIndex({ "eposta": 1 }, { unique: true })
db.siparisler.createIndex({ "kullaniciId": 1, "olusturulma_tarihi": -1 })
db.restoranlar.createIndex({ "konum": "2dsphere" })
```

### 2. Caching Stratejisi
- Redis ile API response caching
- Nginx ile static file caching
- CDN entegrasyonu (CloudFlare önerilen)

### 3. Resource Limits
```yaml
# docker-compose.yml'de resource limitleri
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 🔄 Güncellemeler

### Kod Güncellemeleri
```bash
# Git'ten son değişiklikleri çekin
git pull origin main

# Servisleri yeniden build edin
docker-compose build --no-cache

# Servisleri yeniden başlatın
docker-compose up -d
```

### SSL Sertifikası Yenileme
```bash
# Manuel yenileme
docker-compose run --rm certbot renew

# Otomatik yenileme için crontab
0 12 * * * cd /path/to/deployment && docker-compose run --rm certbot renew && docker-compose restart nginx
```

## 📞 Destek

Deployment sırasında sorun yaşarsanız:

1. **Logları kontrol edin**: `docker-compose logs -f`
2. **Sistem kaynaklarını kontrol edin**: `htop` veya `docker stats`
3. **Network bağlantısını test edin**: `ping`, `curl`, `nslookup`
4. **Issue oluşturun**: GitHub repository'sinde issue açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🌟 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

---

**KapTaze Team** - Gıda israfını önleme misyonumuzda bize katıldığınız için teşekkürler! 🌱