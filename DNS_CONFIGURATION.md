# KapTaze DNS Konfigürasyonu

## 🌐 DNS Kayıtları (kaptaze.com domain için)

### Backend API (Render.com)
```
Type: CNAME
Name: api
Value: kaptaze-backend-api.onrender.com
TTL: 3600 (1 saat)
```

### Frontend (Netlify)
```
Type: A
Name: @ (root domain)
Value: 75.2.60.5
TTL: 3600

Type: CNAME  
Name: www
Value: kaptaze.netlify.app
TTL: 3600
```

### E-posta (SendGrid için önerilir)
```
Type: TXT
Name: @ (root domain)
Value: "v=spf1 include:sendgrid.net ~all"
TTL: 3600

Type: CNAME
Name: email
Value: sendgrid.net
TTL: 3600
```

## 📋 Konfigürasyon Kontrol Listesi

### Render.com Tarafı
- [ ] Custom Domain ekle: `api.kaptaze.com`
- [ ] SSL Certificate otomatik oluşturulsun
- [ ] HTTPS redirect etkinleştirilsin

### Domain Provider Tarafı  
- [ ] CNAME kaydı: `api` → `kaptaze-backend-api.onrender.com`
- [ ] TTL ayarları yapılsın (3600 saniye önerilir)
- [ ] DNS propagation beklensin (24-48 saat)

### Test Edilecekler
- [ ] `https://api.kaptaze.com/health` endpoint'i çalışıyor mu?
- [ ] SSL certificate geçerli mi?
- [ ] API response'ları doğru mu?

## 🔧 Environment Variables Güncelleme

### Backend (.env.production)
```env
# API Base URL
API_BASE_URL=https://api.kaptaze.com

# CORS Configuration
FRONTEND_URLS=https://kaptaze.com,https://www.kaptaze.com,https://kaptaze.netlify.app
```

### Frontend (api-config.js)
```javascript
config: {
    baseUrl: window.location.hostname === 'localhost' 
        ? 'http://localhost:3002' 
        : 'https://api.kaptaze.com',
    timeout: 10000,
    version: 'v1'
}
```

## 🚀 Deployment Sırası

1. **Render.com'a Deploy**
   - GitHub repo push
   - Render auto-deploy
   - Custom domain konfigürasyon

2. **DNS Kayıtlarını Ekle**
   - Domain provider'da CNAME kayıtları
   - TTL ayarları

3. **SSL Certificate Bekle**
   - Render.com otomatik SSL
   - Let's Encrypt certificate

4. **Frontend'i Güncelle**
   - API URL'leri güncelle
   - Production build
   - Netlify deploy

5. **Test Et**
   - API endpoints test
   - Frontend-backend komunikasyon
   - HTTPS redirect kontrolü

## 🔍 Debug Komutları

### DNS Kontrol
```bash
# DNS kayıtlarını kontrol et
nslookup api.kaptaze.com

# DNS propagation kontrol
dig api.kaptaze.com

# SSL certificate kontrol  
openssl s_client -connect api.kaptaze.com:443
```

### API Test
```bash
# Health check
curl https://api.kaptaze.com/health

# CORS test
curl -H "Origin: https://kaptaze.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS https://api.kaptaze.com/auth/admin/login
```

## 📊 Monitoring

### Render.com Metrics
- Response times
- Error rates  
- Uptime monitoring
- Resource usage

### DNS Health
- DNS response times
- SSL certificate expiry
- Domain availability

## 🛠️ Troubleshooting

### Common Issues

1. **DNS Propagation Delay**
   - 24-48 saat bekle
   - Farklı DNS serverlardan test et
   - TTL ayarlarını kontrol et

2. **SSL Certificate Error**
   - Render.com domain verification
   - DNS kayıtları doğru mu kontrol et
   - Certificate renewal otomatik mi?

3. **CORS Errors**
   - FRONTEND_URLS environment variable
   - Domain spelling kontrolü
   - Protocol (HTTP vs HTTPS) uyumu

4. **API Response Errors**
   - Render.com logs kontrol
   - MongoDB Atlas bağlantısı
   - Environment variables eksik mi?