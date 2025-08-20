// KapTaze Bildirim Routes - Notification API Endpoints
const express = require('express');
const { body, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Bildirim = require('../models/Bildirim');
const Kullanici = require('../models/Kullanici');
const firebaseService = require('../services/bildirim/firebaseService');

const router = express.Router();

// Kullanıcının bildirimlerini listele
router.get('/benimkiler', [
  auth,
  query('sayfa').optional().isInt({ min: 1 }).withMessage('Sayfa numarası geçersiz'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit geçersiz'),
  query('tip').optional().isIn(['genel', 'siparis', 'odeme', 'kampanya', 'restoran', 'sistem', 'degerlendirme', 'stok', 'destek', 'guvenlik', 'guncelleme']).withMessage('Geçersiz tip'),
  query('okundu').optional().isBoolean().withMessage('Okundu parametresi geçersiz')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz parametreler',
        errors: errors.array()
      });
    }

    const sayfa = parseInt(req.query.sayfa) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (sayfa - 1) * limit;
    const { tip, okundu } = req.query;

    // Filtre oluştur
    const filter = { kullaniciId: req.kullanici.id };
    
    if (tip) {
      filter.tip = tip;
    }
    
    if (okundu !== undefined) {
      filter.okundu = okundu === 'true';
    }

    // Bildirimleri getir
    const [bildirimler, toplam] = await Promise.all([
      Bildirim.find(filter)
        .sort({ olusturulma_tarihi: -1 })
        .limit(limit)
        .skip(offset)
        .populate('siparisId', 'siparis_no durum')
        .populate('restoranId', 'ad logo_url')
        .lean(),
      Bildirim.countDocuments(filter)
    ]);

    // Okunmamış bildirim sayısı
    const okunmamisSayisi = await Bildirim.countDocuments({
      kullaniciId: req.kullanici.id,
      okundu: false
    });

    res.json({
      success: true,
      data: {
        bildirimler: bildirimler.map(b => ({
          ...b,
          zamani_geldi_mi: !b.zamanlanmis_tarih || b.zamanlanmis_tarih <= new Date(),
          yas: Date.now() - b.olusturulma_tarihi.getTime()
        })),
        sayfalama: {
          sayfa,
          limit,
          toplam,
          toplamSayfa: Math.ceil(toplam / limit)
        },
        okunmamisSayisi
      },
      message: 'Bildirimler başarıyla listelendi'
    });

  } catch (error) {
    console.error('Bildirim listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler listelenemedi',
      error: error.message
    });
  }
});

// Bildirim detayı
router.get('/:bildirimId', auth, async (req, res) => {
  try {
    const { bildirimId } = req.params;

    const bildirim = await Bildirim.findById(bildirimId)
      .populate('siparisId')
      .populate('restoranId', 'ad logo_url konum')
      .populate('kampanyaId');

    if (!bildirim) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }

    if (bildirim.kullaniciId.toString() !== req.kullanici.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu bildirimi görme yetkiniz yok'
      });
    }

    res.json({
      success: true,
      data: bildirim.toSafeObject(),
      message: 'Bildirim detayı başarıyla alındı'
    });

  } catch (error) {
    console.error('Bildirim detay hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim detayı alınamadı',
      error: error.message
    });
  }
});

// Bildirimi okundu olarak işaretle
router.put('/:bildirimId/oku', auth, async (req, res) => {
  try {
    const { bildirimId } = req.params;

    const bildirim = await Bildirim.findById(bildirimId);

    if (!bildirim) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }

    if (bildirim.kullaniciId.toString() !== req.kullanici.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu bildirimi işaretleme yetkiniz yok'
      });
    }

    await bildirim.okunduOlarakIsaretle();

    res.json({
      success: true,
      data: {
        bildirimId: bildirim._id,
        okundu: bildirim.okundu,
        okunma_tarihi: bildirim.okunma_tarihi
      },
      message: 'Bildirim okundu olarak işaretlendi'
    });

  } catch (error) {
    console.error('Bildirim okundu işaretleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim okundu olarak işaretlenemedi',
      error: error.message
    });
  }
});

// Bildirimi tıklandı olarak işaretle
router.put('/:bildirimId/tikla', auth, async (req, res) => {
  try {
    const { bildirimId } = req.params;

    const bildirim = await Bildirim.findById(bildirimId);

    if (!bildirim) {
      return res.status(404).json({
        success: false,
        message: 'Bildirim bulunamadı'
      });
    }

    if (bildirim.kullaniciId.toString() !== req.kullanici.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu bildirimi işaretleme yetkiniz yok'
      });
    }

    await bildirim.tiklandiOlarakIsaretle();

    res.json({
      success: true,
      data: {
        bildirimId: bildirim._id,
        tiklandi: bildirim.tiklandi,
        tiklanma_tarihi: bildirim.tiklanma_tarihi,
        okundu: bildirim.okundu
      },
      message: 'Bildirim tıklandı olarak işaretlendi'
    });

  } catch (error) {
    console.error('Bildirim tıklama işaretleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim tıklandı olarak işaretlenemedi',
      error: error.message
    });
  }
});

// Tüm bildirimleri okundu olarak işaretle
router.put('/hepsini-oku', auth, async (req, res) => {
  try {
    const { bildirimIds } = req.body;

    const result = await Bildirim.topluOkunduIsaretle(req.kullanici.id, bildirimIds);

    res.json({
      success: true,
      data: {
        guncellenenSayisi: result.modifiedCount
      },
      message: 'Bildirimler okundu olarak işaretlendi'
    });

  } catch (error) {
    console.error('Toplu okundu işaretleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirimler okundu olarak işaretlenemedi',
      error: error.message
    });
  }
});

// Okunmamış bildirim sayısı
router.get('/okunmamis/sayisi', auth, async (req, res) => {
  try {
    const sayisi = await Bildirim.okunmamisSayisi(req.kullanici.id);

    res.json({
      success: true,
      data: {
        okunmamisSayisi: sayisi
      },
      message: 'Okunmamış bildirim sayısı alındı'
    });

  } catch (error) {
    console.error('Okunmamış bildirim sayısı hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Okunmamış bildirim sayısı alınamadı',
      error: error.message
    });
  }
});

// Push notification token güncelle
router.put('/token', [
  auth,
  body('token').notEmpty().withMessage('Push notification token gerekli'),
  body('platform').isIn(['ios', 'android', 'web']).withMessage('Geçersiz platform')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { token, platform } = req.body;

    // Kullanıcının token bilgisini güncelle
    const kullanici = await Kullanici.findById(req.kullanici.id);
    if (!kullanici) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    kullanici.push_token = token;
    kullanici.platform = platform;
    kullanici.token_guncelleme_tarihi = new Date();
    await kullanici.save();

    // Kullanıcıyı genel topic'e abone et
    try {
      await firebaseService.subscribeToTopic([token], 'genel_bildirimler');
      
      // Platform bazlı topic'e abone et
      await firebaseService.subscribeToTopic([token], `${platform}_kullanicilar`);
      
      // Kullanıcı konumuna göre topic (varsa)
      if (kullanici.sehir) {
        const sehirTopic = kullanici.sehir.toLowerCase().replace(/[^a-z0-9]/g, '_');
        await firebaseService.subscribeToTopic([token], sehirTopic);
      }
    } catch (topicError) {
      console.error('Topic abonelik hatası:', topicError);
    }

    res.json({
      success: true,
      data: {
        tokenGuncellendi: true,
        platform: platform
      },
      message: 'Push notification token güncellendi'
    });

  } catch (error) {
    console.error('Token güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Token güncellenemedi',
      error: error.message
    });
  }
});

// Bildirim ayarları
router.get('/ayarlar', auth, async (req, res) => {
  try {
    const kullanici = await Kullanici.findById(req.kullanici.id)
      .select('bildirim_ayarlari');

    const varsayilanAyarlar = {
      genel: true,
      siparis: true,
      odeme: true,
      kampanya: true,
      restoran: true,
      sistem: false,
      degerlendirme: true,
      stok: true,
      destek: true,
      guvenlik: true,
      guncelleme: false,
      sesli: true,
      titresimli: true,
      gece_modu: {
        aktif: true,
        baslangic: '22:00',
        bitis: '08:00'
      }
    };

    const ayarlar = { 
      ...varsayilanAyarlar, 
      ...(kullanici.bildirim_ayarlari || {}) 
    };

    res.json({
      success: true,
      data: ayarlar,
      message: 'Bildirim ayarları alındı'
    });

  } catch (error) {
    console.error('Bildirim ayarları alma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim ayarları alınamadı',
      error: error.message
    });
  }
});

// Bildirim ayarlarını güncelle
router.put('/ayarlar', [
  auth,
  body('ayarlar').isObject().withMessage('Ayarlar objesi gerekli')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { ayarlar } = req.body;

    const kullanici = await Kullanici.findById(req.kullanici.id);
    if (!kullanici) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    kullanici.bildirim_ayarlari = {
      ...kullanici.bildirim_ayarlari,
      ...ayarlar
    };

    await kullanici.save();

    res.json({
      success: true,
      data: kullanici.bildirim_ayarlari,
      message: 'Bildirim ayarları güncellendi'
    });

  } catch (error) {
    console.error('Bildirim ayarları güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Bildirim ayarları güncellenemedi',
      error: error.message
    });
  }
});

// Test bildirimi gönder (sadece development)
router.post('/test', auth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test bildirimi sadece geliştirme ortamında kullanılabilir'
      });
    }

    const kullanici = await Kullanici.findById(req.kullanici.id);
    if (!kullanici || !kullanici.push_token) {
      return res.status(400).json({
        success: false,
        message: 'Push token bulunamadı'
      });
    }

    const result = await firebaseService.sendAndSaveNotification(
      req.kullanici.id,
      'hosgeldiniz',
      {
        baslik: '🧪 Test Bildirimi',
        mesaj: 'Bu bir test bildirimidir. Bildirim sistemi çalışıyor!',
        test: true
      },
      [kullanici.push_token]
    );

    res.json({
      success: true,
      data: result,
      message: 'Test bildirimi gönderildi'
    });

  } catch (error) {
    console.error('Test bildirimi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Test bildirimi gönderilemedi',
      error: error.message
    });
  }
});

// Bildirim istatistikleri
router.get('/istatistik/ozet', auth, async (req, res) => {
  try {
    const kullaniciId = req.kullanici.id;
    const son7Gun = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const son30Gun = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      toplamBildirim,
      okunmamisBildirim,
      son7GunBildirim,
      son30GunBildirim,
      tiplereBolunmus
    ] = await Promise.all([
      Bildirim.countDocuments({ kullaniciId }),
      Bildirim.countDocuments({ kullaniciId, okundu: false }),
      Bildirim.countDocuments({ 
        kullaniciId, 
        olusturulma_tarihi: { $gte: son7Gun } 
      }),
      Bildirim.countDocuments({ 
        kullaniciId, 
        olusturulma_tarihi: { $gte: son30Gun } 
      }),
      Bildirim.aggregate([
        { $match: { kullaniciId: req.kullanici.id } },
        {
          $group: {
            _id: '$tip',
            count: { $sum: 1 },
            okunma_orani: {
              $avg: { $cond: [{ $eq: ['$okundu', true] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        toplam: {
          bildirim_sayisi: toplamBildirim,
          okunmamis_sayisi: okunmamisBildirim,
          okunma_orani: toplamBildirim > 0 ? 
            ((toplamBildirim - okunmamisBildirim) / toplamBildirim * 100).toFixed(1) : 0
        },
        zaman_bazli: {
          son_7_gun: son7GunBildirim,
          son_30_gun: son30GunBildirim
        },
        tip_bazli: tiplereBolunmus.map(tip => ({
          tip: tip._id,
          sayisi: tip.count,
          okunma_orani: (tip.okunma_orani * 100).toFixed(1)
        }))
      },
      message: 'Bildirim istatistikleri alındı'
    });

  } catch (error) {
    console.error('Bildirim istatistik hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınamadı',
      error: error.message
    });
  }
});

module.exports = router;