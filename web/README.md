# 🌐 KapTaze Frontend

Modern restaurant management system frontend with professional API integration.

## 🚀 Production Pages

### Customer Registration
- **URL**: `/customer-registration-v2.html`
- **Features**: API-powered form, real-time validation, location integration
- **Backend**: `POST /public/applications`

### Admin Panel
- **Login**: `/admin-login-v2.html` 
- **Dashboard**: `/admin-dashboard-professional.html` (with API integration)
- **Features**: JWT authentication, real-time data, professional UI

### Restaurant Panel  
- **Login**: `/restaurant-login.html`
- **Dashboard**: `/restaurant-panel.html`
- **Features**: Business management, order tracking

## 🔧 API Integration

### Configuration (`js/api-config.js`)
```javascript
baseUrl: window.location.hostname === 'localhost' 
    ? 'http://localhost:3002' 
    : 'https://api.kaptaze.com'
```

### Service Layer (`js/api-service.js`)
- Centralized API communication
- Automatic token management  
- Error handling with fallbacks
- Real-time status monitoring

## 🎨 Features

- **Responsive Design**: Mobile-first approach
- **Real-time API Status**: Connection monitoring
- **Professional UI**: Modern design with animations
- **Error Handling**: User-friendly error messages
- **Token Management**: Automatic JWT handling
- **Form Validation**: Client-side + server-side validation

## 🛠️ Tech Stack

- **Vanilla JavaScript** (no frameworks for performance)
- **Modern CSS** with Flexbox/Grid
- **Font Awesome** icons
- **Google Fonts** (Inter)
- **API Integration** with fetch()

## 📱 Responsive Design

- Mobile-first design approach
- Tablet and desktop optimizations
- Touch-friendly interface
- Fast loading with minimal dependencies

## 🚀 Deployment (Netlify)

### Build Settings
- **Build Command**: (none needed)
- **Publish Directory**: `.` (root)
- **Custom Domain**: `kaptaze.com`

### Environment Detection
Automatically detects environment:
- **Local**: Uses `localhost:3002` API
- **Production**: Uses `https://api.kaptaze.com` API

## 🧪 Testing

### Local Development
1. Start backend: `cd ../kaptaze-backend-api && npm run dev`
2. Start frontend: `python -m http.server 8080`
3. Open: `http://localhost:8080`

### Production URLs
- **Customer Registration**: https://kaptaze.com/customer-registration-v2.html
- **Admin Login**: https://kaptaze.com/admin-login-v2.html
- **Admin Dashboard**: https://kaptaze.com/admin-dashboard-professional.html

## 🔐 Admin Demo Credentials

```
Username: admin
Password: admin123
```

## 🎯 User Flow

1. **Customer** submits restaurant application
2. **Admin** reviews and approves/rejects applications  
3. **Restaurant** receives credentials via email
4. **Restaurant** logs in to manage business

## 📊 API Status Monitoring

All pages include real-time API connectivity monitoring:
- **Green**: API connected and ready
- **Yellow**: Connecting to API
- **Red**: API connection failed

## 🤖 Generated with Claude Code

Professional frontend developed with modern best practices and seamless API integration.

---

**🌟 Production URL**: https://kaptaze.com  
**🔗 Backend API**: https://api.kaptaze.com  
**📊 Status**: Production Ready