// KAPTAZEAPPV5 - Ana Backend Server
// Türkçe API Responses ile Node.js/Express

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Middleware'ler
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://kaptaze.netlify.app',
    'https://kaptaze.render.com',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ],
  credentials: true
}));

// Rate limiting - DDoS koruması
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // her IP için maksimum 100 istek
  message: {
    hata: true,
    mesaj: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.',
    kod: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Bağlantısı (Database Manager ile)
const { databaseManager } = require('./config/database');

// Try to connect to MongoDB, but don't exit if it fails (for demo purposes)
databaseManager.connect(process.env.NODE_ENV || 'development')
  .catch(err => {
    console.error('❌ MongoDB bağlantı hatası:', err.message);
    console.log('⚠️ MongoDB olmadan devam ediliyor (demo mode)...');
    // Don't exit, continue without database for demo
  });

// API Rotaları
const kullaniciRotalari = require('./routes/kullanici');
const restoranRotalari = require('./routes/restoran');
const paketRotalari = require('./routes/paket');
const siparisRotalari = require('./routes/siparis');
const adminRotalari = require('./routes/admin');

// API Base Path
app.use('/api/kullanici', kullaniciRotalari);
app.use('/api/restoran', restoranRotalari);
app.use('/api/paket', paketRotalari);
app.use('/api/siparis', siparisRotalari);
app.use('/api/admin', adminRotalari);

// Ana sayfa endpoint'i
app.get('/', (req, res) => {
  res.json({
    mesaj: 'KAPTAZEAPPV5 Backend API Çalışıyor! 🚀',
    versiyon: '1.0.0',
    durum: 'aktif',
    zaman: new Date().toLocaleString('tr-TR')
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    durum: 'sağlıklı',
    veritabani: mongoose.connection.readyState === 1 ? 'bağlı' : 'bağlı değil',
    zaman: new Date().toLocaleString('tr-TR'),
    bellek: process.memoryUsage()
  });
});

// 404 Hata Yakalayıcı
app.use('*', (req, res) => {
  res.status(404).json({
    hata: true,
    mesaj: 'İstediğiniz sayfa bulunamadı.',
    yol: req.originalUrl,
    zaman: new Date().toLocaleString('tr-TR')
  });
});

// Global Hata Yakalayıcı
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  
  res.status(err.status || 500).json({
    hata: true,
    mesaj: process.env.NODE_ENV === 'production' 
      ? 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.' 
      : err.message,
    kod: err.code || 'INTERNAL_SERVER_ERROR',
    zaman: new Date().toLocaleString('tr-TR')
  });
});

// Server başlatma
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 KAPTAZEAPPV5 Backend ${PORT} portunda çalışıyor`);
  console.log(`📅 Başlatma zamanı: ${new Date().toLocaleString('tr-TR')}`);
  console.log(`🌍 Ortam: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;