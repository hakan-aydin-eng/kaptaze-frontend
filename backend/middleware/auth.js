// Authentication & Authorization Middleware
const jwt = require('jsonwebtoken');
const { Kullanici, Restoran } = require('../models/veritabani-semasi');

// JWT Token doğrulama middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Erişim token bulunamadı. Giriş yapmanız gerekiyor.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kaptaze_jwt_secret_key_super_secure_2024');
        
        // Kullanıcı bilgilerini getir
        const kullanici = await Kullanici.findById(decoded.id || decoded.kullanici?.id).select('-sifre');
        
        if (!kullanici) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token. Kullanıcı bulunamadı.'
            });
        }

        if (!kullanici.aktif) {
            return res.status(403).json({
                success: false,
                message: 'Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.'
            });
        }

        req.user = kullanici;
        req.kullanici = kullanici; // Backward compatibility
        next();

    } catch (error) {
        console.error('Auth middleware hatası:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token formatı.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Token doğrulama hatası.',
            error: error.message
        });
    }
};

// Restoran yetkilendirme middleware
const restoranAuth = async (req, res, next) => {
    try {
        // Önce genel auth kontrolü
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Erişim token bulunamadı. Giriş yapmanız gerekiyor.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kaptaze_jwt_secret_key_super_secure_2024');
        
        // Restoran bilgilerini getir
        const restoran = await Restoran.findById(decoded.restoranId || decoded.id);
        
        if (!restoran) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token. Restoran bulunamadı.'
            });
        }

        if (!restoran.aktif) {
            return res.status(403).json({
                success: false,
                message: 'Restoran hesabı pasif durumda.'
            });
        }

        if (!restoran.onaylanmis) {
            return res.status(403).json({
                success: false,
                message: 'Restoran hesabı henüz onaylanmamış. Lütfen onay sürecinin tamamlanmasını bekleyin.'
            });
        }

        req.restoran = restoran;
        req.user = { id: decoded.id, rol: 'restoran', restoranId: restoran._id };
        next();

    } catch (error) {
        console.error('Restoran auth middleware hatası:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token formatı.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Restoran yetkilendirme hatası.',
            error: error.message
        });
    }
};

// Admin yetkilendirme middleware
const adminAuth = async (req, res, next) => {
    try {
        // Önce genel auth kontrolü
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Erişim token bulunamadı. Giriş yapmanız gerekiyor.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kaptaze_jwt_secret_key_super_secure_2024');
        
        // Kullanıcı bilgilerini getir ve admin kontrolü yap
        const kullanici = await Kullanici.findById(decoded.id || decoded.kullanici?.id).select('-sifre');
        
        if (!kullanici) {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token. Kullanıcı bulunamadı.'
            });
        }

        if (!kullanici.aktif) {
            return res.status(403).json({
                success: false,
                message: 'Hesabınız pasif durumda.'
            });
        }

        if (kullanici.rol !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için admin yetkisi gereklidir.'
            });
        }

        req.user = kullanici;
        next();

    } catch (error) {
        console.error('Admin auth middleware hatası:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Geçersiz token formatı.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Admin yetkilendirme hatası.',
            error: error.message
        });
    }
};

// Optional auth (token varsa doğrula, yoksa devam et)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token');
        
        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kaptaze_jwt_secret_key_super_secure_2024');
        const kullanici = await Kullanici.findById(decoded.id || decoded.kullanici?.id).select('-sifre');
        
        if (kullanici && kullanici.aktif) {
            req.user = kullanici;
        } else {
            req.user = null;
        }

        next();

    } catch (error) {
        // Hatalı token durumunda da devam et
        req.user = null;
        next();
    }
};

// Backward compatibility - export default function
module.exports = auth;

// Named exports
module.exports.auth = auth;
module.exports.restoranAuth = restoranAuth;
module.exports.adminAuth = adminAuth;
module.exports.optionalAuth = optionalAuth;