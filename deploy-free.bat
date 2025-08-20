@echo off
echo ========================================
echo 🚀 KapTaze Ücretsiz Deployment Başlatılıyor
echo ========================================
echo.

:: Vercel CLI kurulumu kontrolü
echo 📦 Vercel CLI kontrol ediliyor...
vercel --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Vercel CLI kurulu değil. Kuruluyor...
    npm install -g vercel
    if %ERRORLEVEL% neq 0 (
        echo ❌ Vercel CLI kurulumu başarısız!
        pause
        exit /b 1
    )
    echo ✅ Vercel CLI başarıyla kuruldu!
) else (
    echo ✅ Vercel CLI mevcut!
)
echo.

:: Ana Portal Deploy
echo 🏠 Ana Portal deploy ediliyor...
cd frontend\main-portal
echo   📁 Dizin: %cd%
echo   🌐 Target: kaptaze.vercel.app
vercel --yes --name kaptaze --prod
if %ERRORLEVEL% neq 0 (
    echo ❌ Ana portal deploy başarısız!
    pause
    exit /b 1
)
echo ✅ Ana portal başarıyla deploy edildi!
echo.

:: Backend için uyarı
echo 🚂 Backend Deployment Bilgisi
echo ========================================
echo Railway backend deployment için:
echo 1. https://railway.app → Login with GitHub
echo 2. New Project → Deploy from GitHub repo  
echo 3. Backend klasörünü seç
echo 4. Environment variables ekle:
echo    - NODE_ENV=production
echo    - MONGODB_URI=your_atlas_uri
echo    - JWT_SECRET=your_secret
echo    - PORT=$PORT
echo 5. Deploy!
echo.
echo 📋 Detaylı rehber: DEPLOY_FREE.md
echo.

:: Admin Panel Placeholder
echo ⚙️ Admin panel placeholder oluşturuluyor...
if not exist "frontend\admin-panel" mkdir frontend\admin-panel
cd ..\admin-panel
echo ^<!DOCTYPE html^>^<html^>^<head^>^<title^>KapTaze Admin^</title^>^</head^>^<body^>^<h1^>🔧 KapTaze Admin Panel^</h1^>^<p^>Admin panel geliştiriliyor...^</p^>^<a href="https://kaptaze.vercel.app"^>← Ana Portal^</a^>^</body^>^</html^> > index.html
echo {"name":"kaptaze-admin","version":"1.0.0"} > package.json
vercel --yes --name kaptaze-admin --prod
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Admin panel deploy edilemedi, manuel olarak deneyin
) else (
    echo ✅ Admin panel placeholder deploy edildi!
)
echo.

:: Restoran Panel Placeholder  
echo 🏪 Restoran panel placeholder oluşturuluyor...
if not exist "frontend\restaurant-panel" mkdir ..\restaurant-panel
cd ..\restaurant-panel
echo ^<!DOCTYPE html^>^<html^>^<head^>^<title^>KapTaze Restoran^</title^>^</head^>^<body^>^<h1^>🏪 KapTaze Restoran Paneli^</h1^>^<p^>Restoran paneli geliştiriliyor...^</p^>^<a href="https://kaptaze.vercel.app"^>← Ana Portal^</a^>^</body^>^</html^> > index.html
echo {"name":"kaptaze-restaurant","version":"1.0.0"} > package.json  
vercel --yes --name kaptaze-restaurant --prod
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Restoran panel deploy edilemedi, manuel olarak deneyin
) else (
    echo ✅ Restoran panel placeholder deploy edildi!
)
echo.

:: Sonuç
cd ..\..\
echo ========================================
echo 🎉 Deployment Tamamlandı!
echo ========================================
echo.
echo 📊 Sonuçlar:
echo ✅ Ana Portal: https://kaptaze.vercel.app
echo ⚠️ Backend API: Manuel Railway deployment gerekli
echo ✅ Admin Panel: https://kaptaze-admin.vercel.app  
echo ✅ Restoran Panel: https://kaptaze-restaurant.vercel.app
echo.
echo 📋 Sonraki Adımlar:
echo 1. Railway'de backend deploy et
echo 2. Environment variables ayarla
echo 3. URL'leri test et
echo 4. DEPLOY_FREE.md rehberini takip et
echo.
echo 🔗 Referanslar:
echo - Vercel: https://vercel.com/dashboard
echo - Railway: https://railway.app/dashboard  
echo - MongoDB: https://cloud.mongodb.com
echo.
pause