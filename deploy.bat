@echo off
echo ========================================
echo 🌐 KapTaze Netlify + Render Deployment
echo ========================================
echo.

:: Netlify CLI kurulumu kontrolü
echo 📦 Netlify CLI kontrol ediliyor...
netlify --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Netlify CLI kurulu değil. Kuruluyor...
    npm install -g netlify-cli
    if %ERRORLEVEL% neq 0 (
        echo ❌ Netlify CLI kurulumu başarısız!
        pause
        exit /b 1
    )
    echo ✅ Netlify CLI başarıyla kuruldu!
) else (
    echo ✅ Netlify CLI mevcut!
)
echo.

:: Git kontrolü
echo 📋 Git repository kontrol ediliyor...
if not exist ".git" (
    echo ❌ Git repository bulunamadı!
    echo 🔧 Git init yapılıyor...
    git init
    git add .
    git commit -m "KapTaze initial commit for Netlify"
    echo ✅ Git repository oluşturuldu!
    echo.
    echo ⚠️  GitHub'a push etmeyi unutmayın:
    echo    git remote add origin YOUR_GITHUB_REPO_URL
    echo    git push -u origin main
    echo.
)

:: Admin Panel Oluştur
echo ⚙️ Admin panel oluşturuluyor...
if not exist "frontend\admin-panel" mkdir frontend\admin-panel
cd frontend\admin-panel

echo ^<!DOCTYPE html^>^<html lang="tr"^>^<head^>^<meta charset="UTF-8"^>^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>^<title^>KapTaze Admin Panel^</title^>^<style^>body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }.container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }h1 { color: #16a34a; text-align: center; }.btn { background: #16a34a; color: white; padding: 15px 30px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }.btn:hover { background: #15803d; }.status { background: #f0fdf4; border: 1px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0; }^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>🔧 KapTaze Admin Panel^</h1^>^<div class="status"^>^<h3^>📊 Sistem Durumu^</h3^>^<p^>✅ Admin panel aktif^</p^>^<p^>🔗 API Bağlantısı: ^<span id="api-status"^>Test ediliyor...^</span^>^</p^>^</div^>^<h3^>🚀 Hızlı Erişim^</h3^>^<a href="https://kaptaze.netlify.app" class="btn"^>🏠 Ana Portal^</a^>^<a href="https://kaptaze-restaurant.netlify.app" class="btn"^>🏪 Restoran Panel^</a^>^<a href="https://cloud.mongodb.com" class="btn"^>💾 MongoDB Atlas^</a^>^<a href="https://render.com/dashboard" class="btn"^>🖥️ Render Dashboard^</a^>^<h3^>📋 Yönetim Araçları^</h3^>^<p^>🔧 Admin araçları geliştiriliyor...^</p^>^<p^>📞 Destek: info@kaptazeapp.com.tr^</p^>^</div^>^<script^>fetch("https://kaptaze-api.onrender.com/health").then(response =^> response.json()).then(data =^> {document.getElementById("api-status").innerHTML = "✅ Aktif";}).catch(() =^> {document.getElementById("api-status").innerHTML = "❌ Bağlantı sorunu";});^</script^>^</body^>^</html^> > index.html

echo [build]
  publish = "."
  command = "echo Admin panel ready"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200 > netlify.toml

echo ✅ Admin panel oluşturuldu!
cd ..\..

:: Restoran Panel Oluştur
echo 🏪 Restoran panel oluşturuluyor...
if not exist "frontend\restaurant-panel" mkdir frontend\restaurant-panel
cd frontend\restaurant-panel

echo ^<!DOCTYPE html^>^<html lang="tr"^>^<head^>^<meta charset="UTF-8"^>^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>^<title^>KapTaze Restoran Panel^</title^>^<style^>body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); min-height: 100vh; }.container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }h1 { color: #667eea; text-align: center; margin-bottom: 30px; }.btn { background: #667eea; color: white; padding: 15px 25px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px 5px; }.btn:hover { background: #5a6fd8; }.stats { background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }^</style^>^</head^>^<body^>^<div class="container"^>^<h1^>🏪 KapTaze Restoran Paneli^</h1^>^<div class="stats"^>^<h3^>📊 Restoran İstatistikleri^</h3^>^<p^>🎯 Aktif Paket Sayısı: ^<strong^>12^</strong^>^</p^>^<p^>📦 Toplam Satış: ^<strong^>247^</strong^>^</p^>^<p^>💰 Bu Ay Kazanç: ^<strong^>₺3.450^</strong^>^</p^>^</div^>^<div style="text-align: center; margin-top: 30px;"^>^<a href="https://kaptaze.netlify.app" class="btn"^>🏠 Ana Portal^</a^>^<a href="https://kaptaze-admin.netlify.app" class="btn"^>⚙️ Admin Panel^</a^>^</div^>^</div^>^</body^>^</html^> > index.html

echo [build]
  publish = "."
  command = "echo Restaurant panel ready"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200 > netlify.toml

echo ✅ Restoran panel oluşturuldu!
cd ..\..

:: Netlify Login
echo 🔐 Netlify login...
netlify status >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Netlify'e login olmanız gerekiyor
    netlify login
    if %ERRORLEVEL% neq 0 (
        echo ❌ Netlify login başarısız!
        pause
        exit /b 1
    )
)
echo ✅ Netlify login başarılı!
echo.

:: Ana Portal Deploy
echo 🏠 Ana portal deploy ediliyor...
cd frontend\main-portal
echo   📁 Dizin: %cd%
echo   🌐 Target: kaptaze.netlify.app

:: Site oluştur ve deploy et
netlify sites:create --name kaptaze >nul 2>&1
netlify deploy --prod --dir .
if %ERRORLEVEL% neq 0 (
    echo ❌ Ana portal deploy başarısız!
    echo 💡 Manuel deployment gerekebilir: https://app.netlify.com
    pause
) else (
    echo ✅ Ana portal başarıyla deploy edildi!
    echo 🌐 URL: https://kaptaze.netlify.app
)
cd ..\..
echo.

:: Sonuç
echo ========================================
echo 🎉 Netlify Deployment Tamamlandı!
echo ========================================
echo.
echo 📊 Sonuçlar:
echo ✅ Ana Portal: https://kaptaze.netlify.app
echo 📋 Admin/Restoran panelleri oluşturuldu
echo ⚠️  Backend için Render.com'da manuel deployment gerekli
echo.
echo 📋 Sonraki Adımlar:
echo.
echo 🚂 BACKEND (Render.com):
echo 1. https://render.com → Sign up with GitHub
echo 2. New ^> Web Service ^> Connect KapTazeApp repo
echo 3. Name: kaptaze-api
echo 4. Root Directory: backend
echo 5. Build Command: npm install  
echo 6. Start Command: npm start
echo 7. Environment variables ekle:
echo    NODE_ENV=production
echo    MONGODB_URI=your_atlas_connection
echo    CORS_ORIGIN=https://kaptaze.netlify.app
echo.
echo 📱 ADMIN ^& RESTORAN PANELLERİ:
echo 1. https://app.netlify.com → New site from Git
echo 2. KapTazeApp repo seç
echo 3. Base directory: frontend/admin-panel
echo 4. Site name: kaptaze-admin
echo 5. Deploy!
echo 6. Restoran panel için tekrarla (restaurant-panel)
echo.
echo 🔗 Detaylı Rehber: DEPLOY_NETLIFY.md
echo.
echo 📞 Destek Links:
echo - Netlify: https://app.netlify.com
echo - Render: https://render.com/dashboard
echo - MongoDB: https://cloud.mongodb.com
echo.
pause