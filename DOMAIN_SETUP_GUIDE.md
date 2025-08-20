# 🌐 KapTaze Domain Kurulum Rehberi

## 1. Domain Satın Alma (.com.tr)

### Önerilen Registrar'lar:
- **NIC.TR (Doğrudan):** https://www.nic.tr
- **Turhost:** https://turhost.com
- **Turkticaret.net:** https://turkticaret.net
- **Hosting.com.tr:** https://hosting.com.tr

### Domain Alternatifleri:
1. **Ana Seçenek:** `kaptazeapp.com.tr`
2. **Alternatif:** `kaptaze.com.tr`
3. **Rezerv:** `kaptazeplatform.com.tr`

## 2. DNS Kayıtları Yapılandırması

### Gerekli A Records:
```
kaptazeapp.com.tr           → SERVER_IP
www.kaptazeapp.com.tr      → SERVER_IP
app.kaptazeapp.com.tr      → SERVER_IP
admin.kaptazeapp.com.tr    → SERVER_IP
restoran.kaptazeapp.com.tr → SERVER_IP
api.kaptazeapp.com.tr      → SERVER_IP
cdn.kaptazeapp.com.tr      → SERVER_IP
```

### CNAME Records:
```
www → kaptazeapp.com.tr
```

## 3. Hosting Seçenekleri

### Cloud Hosting (Önerilen):
1. **DigitalOcean Droplet**
   - Ubuntu 22.04 LTS
   - 2 CPU, 4GB RAM, 80GB SSD
   - Aylık ~$24

2. **AWS EC2**
   - t3.medium instance
   - Ubuntu Server
   - Aylık ~$35

3. **Google Cloud Compute Engine**
   - e2-medium
   - Ubuntu 22.04
   - Aylık ~$25

### Türkiye Hosting:
1. **Turhost VDS**
   - 2 CPU, 4GB RAM
   - Ubuntu 22.04
   - Aylık ~₺200

2. **Hosting.com.tr VDS**
   - 2 CPU, 4GB RAM
   - CentOS/Ubuntu
   - Aylık ~₺180

## 4. Sunucu Hazırlama

### 4.1 Temel Kurulumlar:
```bash
# Sistem güncellemesi
sudo apt update && sudo apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose kurulumu
sudo apt install docker-compose -y

# Nginx kurulumu
sudo apt install nginx -y

# Certbot (SSL) kurulumu
sudo apt install certbot python3-certbot-nginx -y

# Node.js kurulumu (alternatif deployment için)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 kurulumu (process management)
sudo npm install -g pm2
```

### 4.2 Firewall Yapılandırması:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 5. Domain Doğrulama

### DNS Propagation Test:
```bash
# Domain'in çözümlenip çözümlenmediğini test et
nslookup kaptazeapp.com.tr
dig kaptazeapp.com.tr

# Subdomain testleri
nslookup app.kaptazeapp.com.tr
nslookup api.kaptazeapp.com.tr
```

### Online Test Araçları:
- https://dnschecker.org
- https://www.whatsmydns.net
- https://mxtoolbox.com/SuperTool.aspx

## 6. SSL Sertifikası (Let's Encrypt)

```bash
# Tüm subdomain'ler için SSL
sudo certbot --nginx -d kaptazeapp.com.tr -d www.kaptazeapp.com.tr -d app.kaptazeapp.com.tr -d admin.kaptazeapp.com.tr -d restoran.kaptazeapp.com.tr -d api.kaptazeapp.com.tr

# Otomatik yenileme testi
sudo certbot renew --dry-run
```

## 7. Domain Maliyetleri (Tahmini)

### Yıllık Maliyetler:
- **.com.tr domain:** ₺50-100/yıl
- **Hosting (VDS):** ₺1.800-3.000/yıl
- **SSL Sertifikası:** ₺0 (Let's Encrypt)
- **CDN (CloudFlare):** ₺0-300/yıl

### Toplam Tahmini: ₺1.850-3.400/yıl

## 8. Domain Satın Alma Adımları

### NIC.TR Üzerinden:
1. https://www.nic.tr adresine git
2. Domain sorgula: `kaptazeapp.com.tr`
3. Müsaitse sepete ekle
4. Kayıt bilgilerini doldur
5. Ödeme yap (Kredi kartı/Havale)
6. DNS ayarlarını yapılandır

### Registrar Üzerinden:
1. Seçtiğin registrar'a git
2. Domain ara ve satın al
3. Nameserver'ları güncelle
4. DNS zone ayarlarını yap

## 9. Production Deployment Checklist

- [ ] Domain satın alındı
- [ ] DNS kayıtları oluşturuldu
- [ ] Sunucu kiralandı
- [ ] Docker kurulumu tamamlandı
- [ ] SSL sertifikası alındı
- [ ] Nginx yapılandırıldı
- [ ] Environment variables ayarlandı
- [ ] Database bağlantısı test edildi
- [ ] Tüm subdomain'ler çalışıyor

---

**🎯 Sonuç:** Domain kurulumu tamamlandığında KapTaze sistemi dünya çapında erişilebilir olacak!