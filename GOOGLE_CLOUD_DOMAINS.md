# 🔒 Google Cloud Console - Domain Restrictions Setup

**CRITICAL SECURITY STEP**: API key'in güvenliği için domain restrictions ayarlanmalı!

## 🎯 Google Cloud Console Setup

### 1️⃣ Console'a Git
https://console.cloud.google.com/

### 2️⃣ API Credentials
**Navigation:** APIs & Services → Credentials

### 3️⃣ API Key'i Seç
**Key:** `AIzaSyBTPj8fON_ie4OjJUFi1FCDCRD6V6d4xWk`

### 4️⃣ Application Restrictions
**Type:** HTTP referrers (web sites)

**Allowed referrers:**
```
https://kaptaze.com//*
*.netlify.app/*
localhost:*/*
127.0.0.1:*/*
*.localhost:*/*
```

### 5️⃣ API Restrictions
**Restrict key to specific APIs:**
- ✅ Maps JavaScript API
- ✅ Places API  
- ✅ Geocoding API

## 🧪 Test After Setup

### Production Test:
https://https://kaptaze.com//customer-registration.html

**Expected Console Output:**
```javascript
🌍 Environment variables loaded: {
  hasGoogleMapsKey: true,
  keyPreview: "AIzaSyBT...xWk", 
  environment: "production"
}

🗺️ Loading Google Maps API...
🗺️ Maps API: Ready to load
```

### Domain Test:
- ✅ https://kaptaze.com/ → ✅ Works
- ❌ other-site.com → ❌ Blocked (expected)

## 🚨 Security Benefits

- **Prevents API key theft**: Only allowed domains can use
- **Cost protection**: Unauthorized usage blocked
- **Usage monitoring**: Clear visibility on legitimate usage

## ⚡ Quick Checklist

- [ ] Google Cloud Console opened
- [ ] Credentials → API Key selected  
- [ ] HTTP referrers restrictions added
- [ ] API restrictions enabled
- [ ] Production site tested
- [ ] Console output verified

**Estimated time:** 5 minutes  
**Result:** Secure, production-ready API key