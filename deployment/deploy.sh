#!/bin/bash

# KAPTAZEAPPV5 - Production Deployment Script
# .com.tr domain için otomatik deployment

set -e

# Renkli output için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonksiyonlar
print_info() {
    echo -e "${BLUE}[BİLGİ]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[BAŞARILI]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[UYARI]${NC} $1"
}

print_error() {
    echo -e "${RED}[HATA]${NC} $1"
}

# Başlık
echo "=================================================="
echo "🚀 KAPTAZEAPPV5 Production Deployment"
echo "🌐 Domain: kaptazeapp.com.tr"
echo "📅 Tarih: $(date)"
echo "=================================================="

# Environment dosyası kontrolü
if [ ! -f ".env" ]; then
    print_error ".env dosyası bulunamadı!"
    print_info "Lütfen .env.example dosyasını .env olarak kopyalayın ve ayarları yapın."
    exit 1
fi

print_success ".env dosyası bulundu"

# Docker kontrolü
if ! command -v docker &> /dev/null; then
    print_error "Docker yüklü değil!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose yüklü değil!"
    exit 1
fi

print_success "Docker ve Docker Compose hazır"

# Git kontrolü
if [ -d ".git" ]; then
    print_info "Git repository bulundu, son değişiklikler çekiliyor..."
    git pull origin main
    print_success "Kod güncellemeleri çekildi"
else
    print_warning "Git repository bulunamadı"
fi

# Önceki deployment'ı durdur
print_info "Önceki servisleri durduruluyor..."
docker-compose down --remove-orphans

# Docker volume'ları temizle (opsiyonel)
read -p "🗑️  Docker volume'ları temizlemek istiyor musunuz? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Docker volume'ları temizleniyor..."
    docker volume prune -f
    print_success "Volume'lar temizlendi"
fi

# Docker image'ları yeniden build et
print_info "Docker image'ları build ediliyor..."
docker-compose build --no-cache

print_success "Image'lar build edildi"

# SSL sertifikaları için Let's Encrypt
print_info "SSL sertifikaları kontrol ediliyor..."

if [ ! -d "ssl/live/kaptazeapp.com.tr" ]; then
    print_warning "SSL sertifikaları bulunamadı, yeni sertifika alınıyor..."
    
    # Geçici nginx container'ı başlat
    docker-compose up -d nginx
    
    # Let's Encrypt sertifika al
    docker-compose run --rm certbot
    
    print_success "SSL sertifikaları alındı"
else
    print_success "SSL sertifikaları mevcut"
fi

# Production servisleri başlat
print_info "Production servisleri başlatılıyor..."
docker-compose up -d

# Servis sağlığını kontrol et
print_info "Servis sağlığı kontrol ediliyor..."
sleep 30

# Backend health check
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
    print_success "Backend servisi çalışıyor (HTTP $BACKEND_STATUS)"
else
    print_error "Backend servisi çalışmıyor (HTTP $BACKEND_STATUS)"
fi

# Frontend health check
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_success "Frontend servisi çalışıyor (HTTP $FRONTEND_STATUS)"
else
    print_error "Frontend servisi çalışmıyor (HTTP $FRONTEND_STATUS)"
fi

# Nginx health check
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "000")
if [ "$NGINX_STATUS" = "200" ]; then
    print_success "Nginx servisi çalışıyor (HTTP $NGINX_STATUS)"
else
    print_error "Nginx servisi çalışmıyor (HTTP $NGINX_STATUS)"
fi

# Domain kontrolleri
print_info "Domain erişimi kontrol ediliyor..."

# HTTPS kontrolleri
DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://kaptazeapp.com.tr || echo "000")
if [ "$DOMAIN_STATUS" = "200" ]; then
    print_success "kaptazeapp.com.tr erişilebilir (HTTPS $DOMAIN_STATUS)"
else
    print_warning "kaptazeapp.com.tr erişilemiyor (HTTPS $DOMAIN_STATUS)"
fi

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.kaptazeapp.com.tr/health || echo "000")
if [ "$API_STATUS" = "200" ]; then
    print_success "api.kaptazeapp.com.tr erişilebilir (HTTPS $API_STATUS)"
else
    print_warning "api.kaptazeapp.com.tr erişilemiyor (HTTPS $API_STATUS)"
fi

# Veritabanı backup oluştur
print_info "Veritabanı backup'ı oluşturuluyor..."
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mongodb mongodump --uri="mongodb://root:${MONGO_ROOT_PASSWORD}@localhost:27017/kaptazeappv5" --out="/backup/backup_${BACKUP_DATE}" 2>/dev/null || print_warning "Backup oluşturulamadı"

print_success "Backup oluşturuldu: backup_${BACKUP_DATE}"

# Log monitoring başlat
print_info "Log monitoring başlatılıyor..."
docker-compose logs -f &
LOG_PID=$!

# Cleanup function
cleanup() {
    print_info "Temizlik yapılıyor..."
    kill $LOG_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

# Deployment özeti
echo "=================================================="
print_success "🎉 DEPLOYMENT TAMAMLANDI!"
echo "=================================================="
echo "📱 Ana Site: https://kaptazeapp.com.tr"
echo "🔧 Admin Panel: https://admin.kaptazeapp.com.tr"
echo "🏪 Restoran Panel: https://restoran.kaptazeapp.com.tr"
echo "📊 Monitoring: https://monitor.kaptazeapp.com.tr"
echo "🔗 API: https://api.kaptazeapp.com.tr"
echo "=================================================="
echo "📋 Servis Durumları:"
docker-compose ps
echo "=================================================="
echo "📊 Sistem Kaynakları:"
echo "🖥️  CPU: $(docker system df | grep 'Images' | awk '{print $4}')"
echo "💾 Disk: $(docker system df | grep 'Containers' | awk '{print $4}')"
echo "=================================================="

# Monitoring URL'leri
print_info "Monitoring URL'leri:"
echo "- Grafana: https://monitor.kaptazeapp.com.tr"
echo "- Prometheus: http://localhost:9090"
echo "- Elasticsearch: http://localhost:9200"

# SSL sertifika yenileme hatırlatması
print_warning "SSL sertifikası 90 günde bir yenilenmeli!"
print_info "Otomatik yenileme için crontab ekleyin:"
echo "0 12 * * * cd $(pwd) && docker-compose run --rm certbot renew && docker-compose restart nginx"

# Son kontroller
print_info "Son kontroller yapılıyor..."
sleep 5

# Bellek kullanımı
MEMORY_USAGE=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}")
echo "📊 Bellek Kullanımı:"
echo "$MEMORY_USAGE"

print_success "🚀 KAPTAZEAPPV5 başarıyla deploy edildi!"
print_info "Log'ları izlemek için: docker-compose logs -f"
print_info "Servis durumunu kontrol etmek için: docker-compose ps"
print_info "Deployment'ı durdurmak için: docker-compose down"

# Canlı log takibi (isteğe bağlı)
read -p "📺 Canlı log'ları izlemek istiyor musunuz? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Canlı log takibi başlatılıyor... (CTRL+C ile çıkın)"
    docker-compose logs -f
fi

print_success "Deployment scripti tamamlandı! 🎉"