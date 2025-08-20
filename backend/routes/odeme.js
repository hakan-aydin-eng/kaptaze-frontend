// KapTaze Ödeme Routes - Payment API Endpoints
const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Siparis = require('../models/Siparis');
const Odeme = require('../models/Odeme');
const iyzicoService = require('../services/odeme/iyzico');
const paytrService = require('../services/odeme/paytr');

const router = express.Router();

// Ödeme yöntemleri listesi
router.get('/yontemler', (req, res) => {
  try {
    const yontemler = [
      {
        id: 'iyzico',
        ad: 'Kredi/Banka Kartı',
        aciklama: 'Visa, Mastercard, American Express',
        logo: '/images/payment/cards.png',
        aktif: true,
        taksitVar: true,
        komisyon: 2.5
      },
      {
        id: 'paytr',
        ad: 'PayTR',
        aciklama: 'Tüm Türk bankaları',
        logo: '/images/payment/paytr.png',
        aktif: true,
        taksitVar: true,
        komisyon: 2.9
      },
      {
        id: 'havale',
        ad: 'Banka Havalesi',
        aciklama: 'EFT/Havale ile ödeme',
        logo: '/images/payment/bank.png',
        aktif: false,
        taksitVar: false,
        komisyon: 0
      },
      {
        id: 'kapida',
        ad: 'Kapıda Ödeme',
        aciklama: 'Teslim alırken nakit ödeme',
        logo: '/images/payment/cash.png',
        aktif: true,
        taksitVar: false,
        komisyon: 0
      }
    ];

    res.json({
      success: true,
      data: yontemler,
      message: 'Ödeme yöntemleri başarıyla listelendi'
    });
  } catch (error) {
    console.error('Ödeme yöntemleri listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ödeme yöntemleri listelenemedi',
      error: error.message
    });
  }
});

// Ödeme başlat
router.post('/basla', [
  auth,
  body('siparisId').notEmpty().withMessage('Sipariş ID gerekli'),
  body('odemeYontemi').notEmpty().withMessage('Ödeme yöntemi gerekli'),
  body('sepetItems').isArray().withMessage('Sepet ürünleri gerekli'),
  body('teslimatAdresi.adres').notEmpty().withMessage('Teslimat adresi gerekli'),
  body('teslimatAdresi.sehir').notEmpty().withMessage('Şehir bilgisi gerekli')
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

    const {
      siparisId,
      odemeYontemi,
      sepetItems,
      teslimatAdresi,
      taksitSayisi = 1
    } = req.body;

    // Siparişi kontrol et
    const siparis = await Siparis.findById(siparisId);
    if (!siparis) {
      return res.status(404).json({
        success: false,
        message: 'Sipariş bulunamadı'
      });
    }

    if (siparis.kullaniciId.toString() !== req.kullanici.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu siparişe erişim yetkiniz yok'
      });
    }

    if (siparis.durum !== 'beklemede') {
      return res.status(400).json({
        success: false,
        message: 'Sipariş durumu ödeme için uygun değil'
      });
    }

    // Ödeme kaydı oluştur
    const odeme = new Odeme({
      siparisId: siparis._id,
      kullaniciId: req.kullanici.id,
      tutar: siparis.toplam_tutar,
      odemeYontemi,
      taksitSayisi,
      durum: 'baslatildi',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await odeme.save();

    let paymentResult;

    // Ödeme yöntemine göre işlem yap
    switch (odemeYontemi) {
      case 'iyzico':
        paymentResult = await iyzicoService.createPayment({
          siporisToplami: siparis.toplam_tutar,
          siparisId: siparis._id,
          kullanici: req.kullanici,
          sepetItems,
          teslimatAdresi,
          ip: req.ip
        });
        break;

      case 'paytr':
        paymentResult = await paytrService.createPayment({
          siporisToplami: siparis.toplam_tutar,
          siparisId: siparis._id,
          kullanici: req.kullanici,
          sepetItems,
          teslimatAdresi,
          ip: req.ip
        });
        break;

      case 'kapida':
        // Kapıda ödeme için özel işlem
        paymentResult = {
          success: true,
          data: {
            paymentId: siparis._id,
            paymentType: 'cash_on_delivery'
          },
          message: 'Kapıda ödeme seçildi'
        };
        
        // Siparişi hazırlanıyor durumuna geçir
        siparis.durum = 'hazirlaniyor';
        siparis.odeme_durumu = 'kapida_odenecek';
        await siparis.save();
        
        odeme.durum = 'kapida_odenecek';
        await odeme.save();
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Geçersiz ödeme yöntemi'
        });
    }

    if (paymentResult.success) {
      // Ödeme başarıyla başlatıldı
      odeme.gateway_response = paymentResult.data;
      if (paymentResult.data.token) {
        odeme.gateway_token = paymentResult.data.token;
      }
      await odeme.save();

      res.json({
        success: true,
        data: {
          odemeId: odeme._id,
          ...paymentResult.data
        },
        message: paymentResult.message
      });
    } else {
      // Ödeme başlatılamadı
      odeme.durum = 'basarisiz';
      odeme.hata_mesaji = paymentResult.message;
      await odeme.save();

      res.status(400).json({
        success: false,
        message: paymentResult.message,
        error: paymentResult.error
      });
    }

  } catch (error) {
    console.error('Ödeme başlatma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ödeme başlatılamadı',
      error: error.message
    });
  }
});

// Ödeme durumu sorgula
router.get('/:odemeId/durum', auth, async (req, res) => {
  try {
    const { odemeId } = req.params;

    const odeme = await Odeme.findById(odemeId);
    if (!odeme) {
      return res.status(404).json({
        success: false,
        message: 'Ödeme bulunamadı'
      });
    }

    if (odeme.kullaniciId.toString() !== req.kullanici.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu ödemeye erişim yetkiniz yok'
      });
    }

    // Gateway'den durum sorgula
    let statusResult;
    
    if (odeme.odemeYontemi === 'iyzico' && odeme.gateway_token) {
      statusResult = await iyzicoService.verifyPayment(odeme.gateway_token);
    } else if (odeme.odemeYontemi === 'paytr') {
      statusResult = await paytrService.checkPaymentStatus(odeme.siparisId);
    }

    // Durum güncelle
    if (statusResult && statusResult.success) {
      const isSuccess = statusResult.data.isSuccess;
      
      if (isSuccess && odeme.durum !== 'basarili') {
        odeme.durum = 'basarili';
        odeme.gateway_response = statusResult.data;
        await odeme.save();

        // Siparişi güncelle
        const siparis = await Siparis.findById(odeme.siparisId);
        if (siparis) {
          siparis.durum = 'hazirlaniyor';
          siparis.odeme_durumu = 'odendi';
          await siparis.save();
        }
      } else if (!isSuccess && odeme.durum === 'baslatildi') {
        odeme.durum = 'basarisiz';
        await odeme.save();
      }
    }

    res.json({
      success: true,
      data: {
        odemeId: odeme._id,
        durum: odeme.durum,
        tutar: odeme.tutar,
        odemeYontemi: odeme.odemeYontemi,
        taksitSayisi: odeme.taksitSayisi,
        olusturulmaTarihi: odeme.olusturulma_tarihi,
        guncellemeTarihi: odeme.guncellenme_tarihi,
        isSuccess: odeme.durum === 'basarili',
        gatewayResponse: statusResult?.data || {}
      },
      message: 'Ödeme durumu başarıyla alındı'
    });

  } catch (error) {
    console.error('Ödeme durumu sorgulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ödeme durumu sorgulanamadı',
      error: error.message
    });
  }
});

// İyzico callback
router.post('/callback/iyzico', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token bulunamadı'
      });
    }

    // Ödemeyi doğrula
    const verificationResult = await iyzicoService.verifyPayment(token);

    if (verificationResult.success) {
      const paymentData = verificationResult.data;
      const siparisId = paymentData.conversationId;

      // Ödeme kaydını bul ve güncelle
      const odeme = await Odeme.findOne({ 
        gateway_token: token,
        siparisId: siparisId 
      });

      if (odeme) {
        const isSuccess = paymentData.isSuccess;
        
        odeme.durum = isSuccess ? 'basarili' : 'basarisiz';
        odeme.gateway_response = paymentData;
        await odeme.save();

        // Sipariş durumunu güncelle
        const siparis = await Siparis.findById(siparisId);
        if (siparis) {
          if (isSuccess) {
            siparis.durum = 'hazirlaniyor';
            siparis.odeme_durumu = 'odendi';
          } else {
            siparis.durum = 'iptal_edildi';
            siparis.odeme_durumu = 'odenmedi';
          }
          await siparis.save();
        }

        res.json({
          success: true,
          data: {
            isSuccess: isSuccess,
            siparisId: siparisId,
            tutar: paymentData.paidPrice
          },
          message: isSuccess ? 'Ödeme başarılı' : 'Ödeme başarısız'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Ödeme kaydı bulunamadı'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: verificationResult.message,
        error: verificationResult.error
      });
    }

  } catch (error) {
    console.error('İyzico callback hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Callback işlemi başarısız',
      error: error.message
    });
  }
});

// PayTR callback
router.post('/callback/paytr', async (req, res) => {
  try {
    const callbackResult = await paytrService.verifyCallback(req.body);

    if (callbackResult.success && callbackResult.isValid) {
      const paymentData = callbackResult.data;

      // Ödeme kaydını bul ve güncelle
      const odeme = await Odeme.findOne({ 
        siparisId: paymentData.siparisId 
      });

      if (odeme) {
        const isSuccess = paymentData.isSuccess;
        
        odeme.durum = isSuccess ? 'basarili' : 'basarisiz';
        odeme.gateway_response = paymentData;
        await odeme.save();

        // Sipariş durumunu güncelle
        const siparis = await Siparis.findById(paymentData.siparisId);
        if (siparis) {
          if (isSuccess) {
            siparis.durum = 'hazirlaniyor';
            siparis.odeme_durumu = 'odendi';
          } else {
            siparis.durum = 'iptal_edildi';
            siparis.odeme_durumu = 'odenmedi';
          }
          await siparis.save();
        }

        // PayTR'ye OK yanıtı gönder
        res.send('OK');
      } else {
        res.status(404).send('Payment not found');
      }
    } else {
      res.status(400).send('Invalid callback');
    }

  } catch (error) {
    console.error('PayTR callback hatası:', error);
    res.status(500).send('Callback failed');
  }
});

// Taksit seçeneklerini getir
router.get('/taksitler/:tutar', (req, res) => {
  try {
    const { tutar } = req.params;
    const amount = parseFloat(tutar);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz tutar'
      });
    }

    const taksitler = paytrService.getInstallmentOptions(amount);

    res.json({
      success: true,
      data: taksitler,
      message: 'Taksit seçenekleri başarıyla listelendi'
    });

  } catch (error) {
    console.error('Taksit seçenekleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Taksit seçenekleri alınamadı',
      error: error.message
    });
  }
});

// İade işlemi
router.post('/iade', [
  auth,
  body('odemeId').notEmpty().withMessage('Ödeme ID gerekli'),
  body('iadeTutari').isNumeric().withMessage('İade tutarı gerekli'),
  body('sebep').notEmpty().withMessage('İade sebebi gerekli')
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

    const { odemeId, iadeTutari, sebep } = req.body;

    const odeme = await Odeme.findById(odemeId);
    if (!odeme) {
      return res.status(404).json({
        success: false,
        message: 'Ödeme bulunamadı'
      });
    }

    if (odeme.durum !== 'basarili') {
      return res.status(400).json({
        success: false,
        message: 'Sadece başarılı ödemeler iade edilebilir'
      });
    }

    if (iadeTutari > odeme.tutar) {
      return res.status(400).json({
        success: false,
        message: 'İade tutarı ödeme tutarından fazla olamaz'
      });
    }

    let refundResult;

    // Ödeme yöntemine göre iade işlemi
    if (odeme.odemeYontemi === 'iyzico') {
      const paymentTransactionId = odeme.gateway_response?.paymentItems?.[0]?.paymentTransactionId;
      if (paymentTransactionId) {
        refundResult = await iyzicoService.refundPayment(paymentTransactionId, iadeTutari, sebep);
      }
    } else if (odeme.odemeYontemi === 'paytr') {
      refundResult = await paytrService.refundPayment(odeme.siparisId, iadeTutari);
    }

    if (refundResult && refundResult.success) {
      // İade kaydını güncelle
      odeme.iade_tutari = (odeme.iade_tutari || 0) + iadeTutari;
      odeme.iade_sebep = sebep;
      if (odeme.iade_tutari >= odeme.tutar) {
        odeme.durum = 'iade_edildi';
      } else {
        odeme.durum = 'kismi_iade';
      }
      odeme.iade_tarihi = new Date();
      await odeme.save();

      res.json({
        success: true,
        data: {
          odemeId: odeme._id,
          iadeTutari,
          toplamIade: odeme.iade_tutari,
          yeniDurum: odeme.durum
        },
        message: 'İade işlemi başarıyla tamamlandı'
      });
    } else {
      res.status(400).json({
        success: false,
        message: refundResult?.message || 'İade işlemi başarısız',
        error: refundResult?.error
      });
    }

  } catch (error) {
    console.error('İade işlemi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İade işlemi başarısız',
      error: error.message
    });
  }
});

// Test kartları bilgileri
router.get('/test-kartlari', (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test kartları sadece geliştirme ortamında kullanılabilir'
      });
    }

    const testKartlari = {
      iyzico: iyzicoService.getTestCards(),
      paytr: paytrService.getTestCards()
    };

    res.json({
      success: true,
      data: testKartlari,
      message: 'Test kartları başarıyla listelendi'
    });

  } catch (error) {
    console.error('Test kartları hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Test kartları alınamadı',
      error: error.message
    });
  }
});

module.exports = router;