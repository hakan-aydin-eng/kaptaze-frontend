// KAPTAZEAPPV5 - Ödeme API Rotaları
// İyzico ve PayTR entegrasyonu ile

const express = require('express');
const { body, validationResult } = require('express-validator');
const PaymentService = require('../services/PaymentService');
const { Siparis, Kullanici } = require('../models/veritabani-semasi');
const auth = require('../middleware/auth');

const router = express.Router();

// Türkçe Hata Mesajları
const hataMesajlari = {
    siparisYok: 'Sipariş bulunamadı',
    kullaniciYok: 'Kullanıcı bulunamadı',
    kartBilgileriGecersiz: 'Kart bilgileri geçersiz',
    tutarGecersiz: 'Ödeme tutarı geçersiz',
    odemeBasarisiz: 'Ödeme işlemi başarısız',
    yetkisizErisim: 'Bu işlem için yetkiniz yok'
};

// Validasyon kuralları
const odemeValidasyon = [
    body('siparisId')
        .notEmpty()
        .withMessage('Sipariş ID zorunludur')
        .isMongoId()
        .withMessage('Geçerli bir sipariş ID girin'),
    body('tutar')
        .isFloat({ min: 1 })
        .withMessage('Ödeme tutarı en az 1 TL olmalıdır'),
    body('odemeYontemi')
        .isIn(['iyzico', 'paytr', 'kapida_odeme'])
        .withMessage('Geçerli bir ödeme yöntemi seçin')
];

const kartValidasyon = [
    body('kartBilgileri.kartSahibi')
        .notEmpty()
        .withMessage('Kart sahibi adı zorunludur')
        .isLength({ min: 2, max: 50 })
        .withMessage('Kart sahibi adı 2-50 karakter arasında olmalıdır'),
    body('kartBilgileri.kartNumarasi')
        .isCreditCard()
        .withMessage('Geçerli bir kart numarası girin'),
    body('kartBilgileri.sonKullanmaAy')
        .isInt({ min: 1, max: 12 })
        .withMessage('Geçerli bir ay girin (1-12)'),
    body('kartBilgileri.sonKullanmaYil')
        .isInt({ min: new Date().getFullYear(), max: new Date().getFullYear() + 20 })
        .withMessage('Geçerli bir yıl girin'),
    body('kartBilgileri.guvenlikKodu')
        .isLength({ min: 3, max: 4 })
        .withMessage('Güvenlik kodu 3-4 haneli olmalıdır')
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

// @route   GET /api/payment/methods
// @desc    Desteklenen ödeme yöntemlerini getir
// @access  Public
router.get('/methods', (req, res) => {
    try {
        const methods = PaymentService.getSupportedPaymentMethods();
        res.json(methods);
    } catch (error) {
        console.error('Ödeme yöntemleri getirme hatası:', error);
        res.status(500).json({
            hata: true,
            mesaj: 'Ödeme yöntemleri yüklenirken hata oluştu'
        });
    }
});

// @route   POST /api/payment/create
// @desc    Yeni ödeme işlemi başlat
// @access  Private
router.post('/create', auth, odemeValidasyon, validasyonKontrol, async (req, res) => {
    try {
        const { siparisId, tutar, odemeYontemi, kartBilgileri } = req.body;
        const kullaniciId = req.kullanici.id;

        // Sipariş kontrolü
        const siparis = await Siparis.findById(siparisId);
        if (!siparis) {
            return res.status(404).json({
                hata: true,
                mesaj: hataMesajlari.siparisYok
            });
        }

        // Kullanıcı yetki kontrolü
        if (siparis.kullaniciId.toString() !== kullaniciId) {
            return res.status(403).json({
                hata: true,
                mesaj: hataMesajlari.yetkisizErisim
            });
        }

        // Sipariş durumu kontrolü
        if (siparis.odemeDurumu === 'completed') {
            return res.status(400).json({
                hata: true,
                mesaj: 'Bu sipariş zaten ödenmiş'
            });
        }

        // Tutar kontrolü
        if (Math.abs(tutar - siparis.toplamFiyat) > 0.01) {
            return res.status(400).json({
                hata: true,
                mesaj: 'Ödeme tutarı sipariş tutarı ile eşleşmiyor'
            });
        }

        const orderData = {
            siparisId,
            kullaniciId,
            tutar,
            kartBilgileri,
            ip: req.ip || req.connection.remoteAddress
        };

        let result;

        // Ödeme yöntemine göre işlem
        switch (odemeYontemi) {
            case 'iyzico':
                if (!kartBilgileri) {
                    return res.status(400).json({
                        hata: true,
                        mesaj: 'İyzico ödemesi için kart bilgileri gerekli'
                    });
                }
                result = await PaymentService.createIyzicoPayment(orderData);
                break;

            case 'paytr':
                result = await PaymentService.createPayTRPayment(orderData);
                break;

            case 'kapida_odeme':
                result = await handleCashOnDelivery(siparisId);
                break;

            default:
                return res.status(400).json({
                    hata: true,
                    mesaj: 'Desteklenmeyen ödeme yöntemi'
                });
        }

        // Ödeme sonucunu işle
        if (result.basarili) {
            // Sipariş durumunu güncelle
            await Siparis.findByIdAndUpdate(siparisId, {
                odemeDurumu: result.provider === 'cash' ? 'pending' : 'pending',
                odemeYontemi: odemeYontemi,
                odemeId: result.odemeId,
                guncellenmeTarihi: new Date()
            });

            res.json({
                basarili: true,
                mesaj: 'Ödeme işlemi başlatıldı',
                odemeId: result.odemeId,
                odemeUrl: result.odemeUrl || null,
                provider: result.provider,
                durum: 'pending'
            });
        } else {
            res.status(400).json({
                hata: true,
                mesaj: result.mesaj || hataMesajlari.odemeBasarisiz,
                detay: result.detay || null
            });
        }

    } catch (error) {
        console.error('Ödeme oluşturma hatası:', error);
        res.status(500).json({
            hata: true,
            mesaj: 'Ödeme işlemi sırasında bir hata oluştu'
        });
    }
});

// @route   POST /api/payment/verify
// @desc    Ödeme doğrulama (callback)
// @access  Public
router.post('/verify', async (req, res) => {
    try {
        const { paymentId, provider, status } = req.body;

        if (!paymentId || !provider) {
            return res.status(400).json({
                hata: true,
                mesaj: 'Eksik ödeme bilgileri'
            });
        }

        // Ödeme durumunu kontrol et
        const result = await PaymentService.checkPaymentStatus(paymentId, provider);

        if (result.basarili) {
            // Sipariş durumunu güncelle
            const siparis = await Siparis.findOne({ odemeId: paymentId });
            
            if (siparis) {
                const yeniDurum = result.durum === 'success' ? 'completed' : 'failed';
                
                await Siparis.findByIdAndUpdate(siparis._id, {
                    odemeDurumu: yeniDurum,
                    guncellenmeTarihi: new Date()
                });

                // Başarılı ödeme için kullanıcı istatistiklerini güncelle
                if (yeniDurum === 'completed') {
                    await Kullanici.findByIdAndUpdate(siparis.kullaniciId, {
                        $inc: {
                            'istatistikler.kurtarilanPaket': 1,
                            'istatistikler.tasarruf': siparis.toplamFiyat * 0.5 // Ortalama %50 tasarruf
                        }
                    });
                }

                res.json({
                    basarili: true,
                    mesaj: yeniDurum === 'completed' ? 'Ödeme başarılı' : 'Ödeme başarısız',
                    durum: yeniDurum,
                    siparisId: siparis._id
                });
            } else {
                res.status(404).json({
                    hata: true,
                    mesaj: 'Sipariş bulunamadı'
                });
            }
        } else {
            res.status(400).json({
                hata: true,
                mesaj: 'Ödeme doğrulaması başarısız'
            });
        }

    } catch (error) {
        console.error('Ödeme doğrulama hatası:', error);
        res.status(500).json({
            hata: true,
            mesaj: 'Ödeme doğrulama sırasında hata oluştu'
        });
    }
});

// @route   POST /api/payment/refund
// @desc    Ödeme iadesi
// @access  Private
router.post('/refund', auth, [
    body('siparisId').isMongoId().withMessage('Geçerli sipariş ID girin'),
    body('tutar').optional().isFloat({ min: 0.01 }).withMessage('İade tutarı pozitif olmalıdır'),
    body('sebep').optional().isLength({ max: 500 }).withMessage('İade sebebi en fazla 500 karakter olabilir')
], validasyonKontrol, async (req, res) => {
    try {
        const { siparisId, tutar, sebep } = req.body;
        const kullaniciId = req.kullanici.id;

        // Sipariş kontrolü
        const siparis = await Siparis.findById(siparisId);
        if (!siparis) {
            return res.status(404).json({
                hata: true,
                mesaj: hataMesajlari.siparisYok
            });
        }

        // Kullanıcı yetki kontrolü
        if (siparis.kullaniciId.toString() !== kullaniciId) {
            return res.status(403).json({
                hata: true,
                mesaj: hataMesajlari.yetkisizErisim
            });
        }

        // Ödeme durumu kontrolü
        if (siparis.odemeDurumu !== 'completed') {
            return res.status(400).json({
                hata: true,
                mesaj: 'Sadece tamamlanmış ödemeler iade edilebilir'
            });
        }

        const iadeTutari = tutar || siparis.toplamFiyat;

        // İade işlemi
        const result = await PaymentService.refundPayment(
            siparis.odemeId,
            iadeTutari,
            siparis.odemeYontemi,
            sebep || 'Kullanıcı talebi'
        );

        if (result.basarili) {
            // Sipariş durumunu güncelle
            await Siparis.findByIdAndUpdate(siparisId, {
                odemeDurumu: 'refunded',
                durum: 'cancelled',
                iptalNedeni: sebep || 'Kullanıcı talebi',
                guncellenmeTarihi: new Date()
            });

            res.json({
                basarili: true,
                mesaj: 'İade işlemi başlatıldı',
                iadeId: result.iadeId,
                iadeTutari: iadeTutari
            });
        } else {
            res.status(400).json({
                hata: true,
                mesaj: result.mesaj || 'İade işlemi başarısız'
            });
        }

    } catch (error) {
        console.error('İade işlemi hatası:', error);
        res.status(500).json({
            hata: true,
            mesaj: 'İade işlemi sırasında hata oluştu'
        });
    }
});

// @route   GET /api/payment/commission/:amount/:method
// @desc    Komisyon hesaplama
// @access  Private
router.get('/commission/:amount/:method', auth, (req, res) => {
    try {
        const { amount, method } = req.params;
        const tutar = parseFloat(amount);

        if (isNaN(tutar) || tutar <= 0) {
            return res.status(400).json({
                hata: true,
                mesaj: hataMesajlari.tutarGecersiz
            });
        }

        const commission = PaymentService.calculateCommission(tutar, method);

        res.json({
            basarili: true,
            komisyon: commission
        });

    } catch (error) {
        console.error('Komisyon hesaplama hatası:', error);
        res.status(500).json({
            hata: true,
            mesaj: 'Komisyon hesaplanamadı'
        });
    }
});

// Kapıda ödeme işlemi
const handleCashOnDelivery = async (siparisId) => {
    try {
        return {
            basarili: true,
            mesaj: 'Kapıda ödeme seçildi',
            odemeId: `cash_${siparisId}_${Date.now()}`,
            provider: 'cash'
        };
    } catch (error) {
        return {
            hata: true,
            mesaj: 'Kapıda ödeme işlemi başarısız'
        };
    }
};

module.exports = router;