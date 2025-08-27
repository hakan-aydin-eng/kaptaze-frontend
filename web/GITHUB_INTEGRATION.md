# KapTaze GitHub Integration Setup

## GitHub Repository Erişimi

Bu dosya KapTaze projesi için GitHub entegrasyonu ve otomatik deployment kurulumu rehberini içermektedir.

### 1. Repository Durumu
- **Frontend Repository**: https://github.com/hakan-aydin-eng/kaptaze-frontend.git
- **Backend**: kaptaze-backend-api klasöründe yerel
- **Status**: GitHub'a bağlı ✅

### 2. GitHub Actions Workflow
GitHub Actions workflow'u otomatik olarak oluşturuldu:
- **Dosya**: `.github/workflows/deploy.yml`
- **Tetikleyici**: main/master branch'e push
- **İşlemler**: 
  - Frontend build ve Netlify deployment
  - Backend Render deployment
  - Test çalıştırma

### 3. Gerekli GitHub Secrets
Repository Settings > Secrets and variables > Actions bölümüne aşağıdaki secret'ları ekleyin:

```
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
NETLIFY_SITE_ID=your_netlify_site_id
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID=your_render_service_id
MONGODB_URI=your_mongodb_connection_string
```

### 4. Backend Repository Kurulumu
Backend için ayrı bir repository oluşturmanız önerilir:

```bash
cd ../kaptaze-backend-api
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/hakan-aydin-eng/kaptaze-backend.git
git push -u origin main
```

### 5. Deployment Konfigürasyonu

#### Frontend (Netlify)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist/`
- **Environment Variables**: `.env` dosyasındaki değişkenler

#### Backend (Render)
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**: `.env.production` dosyasındaki değişkenler

### 6. API Endpoint Konfigürasyonu
Frontend'de backend URL'lerini dinamik olarak ayarlamak için:

```javascript
// js/api-config.js
const API_CONFIG = {
  development: 'http://localhost:3000',
  production: 'https://your-backend-url.render.com'
};
```

### 7. GitHub Actions Status
Workflow durumunu kontrol etmek için:
- Repository ana sayfasında "Actions" sekmesi
- Her commit sonrası otomatik deployment
- Hata durumunda email bildirimleri

### 8. Monitoring ve Logging
- **Frontend**: Netlify Dashboard
- **Backend**: Render Dashboard
- **Database**: MongoDB Atlas Monitoring

### 9. Güvenlik
- Tüm sensitive bilgiler GitHub Secrets'da
- API keys ve database bağlantı stringleri şifrelendi
- HTTPS zorunlu tüm endpoint'lerde

### 10. Gelecek Güncellemeler
- [ ] Mobile app deployment pipeline
- [ ] Staging environment setup
- [ ] Automated testing pipeline
- [ ] Performance monitoring integration
