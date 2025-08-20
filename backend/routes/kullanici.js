// KAPTAZEAPPV5 - Kullanıcı API Rotaları
// Türkçe Validasyon Mesajları ile

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Kullanici } = require('../models/veritabani-semasi');
const auth = require('../middleware/auth');

const router = express.Router();

// Türkçe Hata Mesajları
const hataMesajlari = {
  emailGecersiz: 'Geçerli bir e-posta adresi girin',
  emailZorunlu: 'E-posta adresi zorunludur',
  sifreZorunlu: 'Şifre zorunludur',
  sifreKisa: 'Şifre en az 6 karakter olmalıdır',
  adZorunlu: 'Ad zorunludur',
  soyadZorunlu: 'Soyad zorunludur',
  emailMevcut: 'Bu e-posta adresi zaten kullanılıyor',
  kullaniciYok: 'Kullanıcı bulunamadı',
  sifreYanlis: 'E-posta veya şifre hatalı',
  yetkisizErisim: 'Bu işlem için yetkiniz yok'
};

// Validasyon kuralları
const kayitValidasyon = [
  body('ad')
    .notEmpty()
    .withMessage(hataMesajlari.adZorunlu)
    .isLength({ min: 2 })
    .withMessage('Ad en az 2 karakter olmalıdır'),
  body('soyad')
    .notEmpty()
    .withMessage(hataMesajlari.soyadZorunlu)
    .isLength({ min: 2 })
    .withMessage('Soyad en az 2 karakter olmalıdır'),
  body('eposta')
    .isEmail()
    .withMessage(hataMesajlari.emailGecersiz)
    .normalizeEmail(),
  body('sifre')
    .isLength({ min: 6 })
    .withMessage(hataMesajlari.sifreKisa)
];

const girisValidasyon = [
  body('eposta')
    .isEmail()
    .withMessage(hataMesajlari.emailGecersiz)
    .normalizeEmail(),
  body('sifre')
    .notEmpty()
    .withMessage(hataMesajlari.sifreZorunlu)
];

// Hata kontrolü middleware
const validasyonKontrol = (req, res, next) => {
  const hatalar = validationResult(req);
  if (!hatalar.isEmpty()) {
    return res.status(400).json({
      hata: true,
      mesaj: 'Girdiğiniz bilgilerde hatalar var',
      detaylar: hatalar.array().map(h => ({
        alan: h.param,
        mesaj: h.msg
      }))
    });
  }
  next();
};

// @route   POST /api/kullanici/kayit
// @desc    Yeni kullanıcı kaydı
// @access  Public
router.post('/kayit', kayitValidasyon, validasyonKontrol, async (req, res) => {
  try {
    const { ad, soyad, eposta, telefon, sifre } = req.body;

    // E-posta kontrolü
    const mevcutKullanici = await Kullanici.findOne({ eposta });
    if (mevcutKullanici) {
      return res.status(400).json({
        hata: true,
        mesaj: hataMesajlari.emailMevcut
      });
    }

    // Şifre hashleme
    const salt = await bcrypt.genSalt(10);
    const hashliSifre = await bcrypt.hash(sifre, salt);

    // Yeni kullanıcı oluşturma
    const yeniKullanici = new Kullanici({
      ad,
      soyad,
      eposta,
      telefon,
      sifre: hashliSifre
    });

    await yeniKullanici.save();

    // JWT token oluşturma
    const payload = {
      kullanici: {
        id: yeniKullanici.id,
        eposta: yeniKullanici.eposta
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          basarili: true,
          mesaj: 'Hesabınız başarıyla oluşturuldu!',
          token,
          kullanici: {
            id: yeniKullanici.id,
            ad: yeniKullanici.ad,
            soyad: yeniKullanici.soyad,
            eposta: yeniKullanici.eposta,
            telefon: yeniKullanici.telefon
          }
        });
      }
    );

  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({
      hata: true,
      mesaj: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

// @route   POST /api/kullanici/giris
// @desc    Kullanıcı girişi
// @access  Public
router.post('/giris', girisValidasyon, validasyonKontrol, async (req, res) => {
  try {
    const { eposta, sifre } = req.body;

    // Kullanıcı kontrolü
    const kullanici = await Kullanici.findOne({ eposta });
    if (!kullanici) {
      return res.status(400).json({
        hata: true,
        mesaj: hataMesajlari.sifreYanlis
      });
    }

    // Şifre kontrolü
    const sifreEslesmesi = await bcrypt.compare(sifre, kullanici.sifre);
    if (!sifreEslesmesi) {
      return res.status(400).json({
        hata: true,
        mesaj: hataMesajlari.sifreYanlis
      });
    }

    // JWT token oluşturma
    const payload = {
      kullanici: {
        id: kullanici.id,
        eposta: kullanici.eposta
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          basarili: true,
          mesaj: 'Giriş başarılı! Hoş geldiniz.',
          token,
          kullanici: {
            id: kullanici.id,
            ad: kullanici.ad,
            soyad: kullanici.soyad,
            eposta: kullanici.eposta,
            telefon: kullanici.telefon,
            istatistikler: kullanici.istatistikler
          }
        });
      }
    );

  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({
      hata: true,
      mesaj: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

// @route   GET /api/kullanici/profil
// @desc    Kullanıcı profil bilgileri
// @access  Private
router.get('/profil', auth, async (req, res) => {
  try {
    const kullanici = await Kullanici.findById(req.kullanici.id).select('-sifre');
    
    if (!kullanici) {
      return res.status(404).json({
        hata: true,
        mesaj: hataMesajlari.kullaniciYok
      });
    }

    res.json({
      basarili: true,
      kullanici: {
        id: kullanici.id,
        ad: kullanici.ad,
        soyad: kullanici.soyad,
        eposta: kullanici.eposta,
        telefon: kullanici.telefon,
        konum: kullanici.konum,
        istatistikler: kullanici.istatistikler,
        olusturmaTarihi: kullanici.olusturmaTarihi
      }
    });

  } catch (error) {
    console.error('Profil getirme hatası:', error);
    res.status(500).json({
      hata: true,
      mesaj: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

// @route   PUT /api/kullanici/profil
// @desc    Kullanıcı profil güncelleme
// @access  Private
router.put('/profil', auth, [
  body('ad').optional().isLength({ min: 2 }).withMessage('Ad en az 2 karakter olmalıdır'),
  body('soyad').optional().isLength({ min: 2 }).withMessage('Soyad en az 2 karakter olmalıdır'),
  body('telefon').optional().isMobilePhone('tr-TR').withMessage('Geçerli bir telefon numarası girin')
], validasyonKontrol, async (req, res) => {
  try {
    const { ad, soyad, telefon } = req.body;
    
    const guncellenenKullanici = await Kullanici.findByIdAndUpdate(
      req.kullanici.id,
      { ad, soyad, telefon },
      { new: true, runValidators: true }
    ).select('-sifre');

    if (!guncellenenKullanici) {
      return res.status(404).json({
        hata: true,
        mesaj: hataMesajlari.kullaniciYok
      });
    }

    res.json({
      basarili: true,
      mesaj: 'Profiliniz başarıyla güncellendi',
      kullanici: guncellenenKullanici
    });

  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    res.status(500).json({
      hata: true,
      mesaj: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

// @route   POST /api/kullanici/misafir-giris
// @desc    Misafir kullanıcı girişi
// @access  Public
router.post('/misafir-giris', async (req, res) => {
  try {
    // Geçici misafir kullanıcı oluşturma
    const misafirKullanici = new Kullanici({
      ad: 'Misafir',
      soyad: 'Kullanıcı',
      eposta: `misafir_${Date.now()}@kaptazeapp.com`,
      sifre: await bcrypt.hash('misafir123', 10),
      misafirMi: true
    });

    await misafirKullanici.save();

    // JWT token oluşturma
    const payload = {
      kullanici: {
        id: misafirKullanici.id,
        eposta: misafirKullanici.eposta,
        misafir: true
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }, // Misafir için 1 gün
      (err, token) => {
        if (err) throw err;
        res.json({
          basarili: true,
          mesaj: 'Misafir olarak giriş yaptınız. Sipariş vermek için kayıt olmanız gerekebilir.',
          token,
          kullanici: {
            id: misafirKullanici.id,
            ad: misafirKullanici.ad,
            soyad: misafirKullanici.soyad,
            misafirMi: true
          }
        });
      }
    );

  } catch (error) {
    console.error('Misafir giriş hatası:', error);
    res.status(500).json({
      hata: true,
      mesaj: 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
});

module.exports = router;