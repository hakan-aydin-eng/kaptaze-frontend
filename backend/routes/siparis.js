// Sipariş Management Routes
const express = require('express');
const router = express.Router();
const { Siparis, Paket } = require('../models/veritabani-semasi');
const { auth, restoranAuth } = require('../middleware/auth');

// Sipariş oluşturma
router.post('/', auth, async (req, res) => {
    try {
        const { paketId, miktar = 1, notlar } = req.body;

        if (!paketId) {
            return res.status(400).json({
                success: false,
                message: 'Paket ID gerekli'
            });
        }

        // Paket kontrolü
        const paket = await Paket.findOne({ 
            _id: paketId, 
            aktif: true,
            sonKullanmaTarihi: { $gte: new Date() }
        });

        if (!paket) {
            return res.status(404).json({
                success: false,
                message: 'Paket bulunamadı veya süresi dolmuş'
            });
        }

        // Stok kontrolü
        if (paket.stok < miktar) {
            return res.status(400).json({
                success: false,
                message: 'Yeterli stok yok',
                data: { mevcutStok: paket.stok }
            });
        }

        // Toplam tutar hesaplama
        const toplamTutar = paket.fiyat * miktar;

        // Sipariş oluştur
        const yeniSiparis = new Siparis({
            kullaniciId: req.user.id,
            restoranId: paket.restoranId,
            paketler: [{
                paketId: paketId,
                ad: paket.ad,
                fiyat: paket.fiyat,
                miktar: miktar
            }],
            toplamTutar,
            durum: 'beklemede',
            notlar,
            olusturulmaTarihi: new Date()
        });

        await yeniSiparis.save();

        // Paket stokunu azalt
        paket.stok -= miktar;
        await paket.save();

        res.status(201).json({
            success: true,
            message: 'Sipariş başarıyla oluşturuldu',
            data: {
                siparisId: yeniSiparis._id,
                toplamTutar: yeniSiparis.toplamTutar,
                durum: yeniSiparis.durum,
                tahminiHazirlamaSuresi: paket.hazirlanmaSuresi
            }
        });

    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sipariş oluşturulamadı',
            error: error.message
        });
    }
});

// Kullanıcı siparişleri
router.get('/kullanici', auth, async (req, res) => {
    try {
        const { durum, sayfa = 1, limit = 10 } = req.query;
        
        // Filtreleme
        const filtreler = { kullaniciId: req.user.id };
        if (durum) filtreler.durum = durum;

        const skip = (parseInt(sayfa) - 1) * parseInt(limit);

        const siparisler = await Siparis.find(filtreler)
            .populate('restoranId', 'ad adres konum iletisim resimUrl')
            .sort({ olusturulmaTarihi: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const toplam = await Siparis.countDocuments(filtreler);

        res.json({
            success: true,
            message: 'Siparişler listelendi',
            data: {
                siparisler,
                sayfalama: {
                    sayfaSayisi: Math.ceil(toplam / parseInt(limit)),
                    toplamKayit: toplam,
                    mevcutSayfa: parseInt(sayfa),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Sipariş listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Siparişler listelenemedi',
            error: error.message
        });
    }
});

// Restoran siparişleri
router.get('/restoran', restoranAuth, async (req, res) => {
    try {
        const { durum, tarih, sayfa = 1, limit = 20 } = req.query;
        
        // Filtreleme
        const filtreler = { restoranId: req.restoran.id };
        if (durum) filtreler.durum = durum;
        if (tarih) {
            const baslangicTarihi = new Date(tarih);
            const bitisTarihi = new Date(baslangicTarihi);
            bitisTarihi.setDate(bitisTarihi.getDate() + 1);
            
            filtreler.olusturulmaTarihi = {
                $gte: baslangicTarihi,
                $lt: bitisTarihi
            };
        }

        const skip = (parseInt(sayfa) - 1) * parseInt(limit);

        const siparisler = await Siparis.find(filtreler)
            .populate('kullaniciId', 'ad soyad telefon')
            .sort({ olusturulmaTarihi: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const toplam = await Siparis.countDocuments(filtreler);

        // Durum istatistikleri
        const durumIstatistikleri = await Siparis.aggregate([
            { $match: { restoranId: req.restoran.id } },
            { $group: { _id: '$durum', sayi: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            message: 'Restoran siparişleri listelendi',
            data: {
                siparisler,
                istatistikler: durumIstatistikleri,
                sayfalama: {
                    sayfaSayisi: Math.ceil(toplam / parseInt(limit)),
                    toplamKayit: toplam,
                    mevcutSayfa: parseInt(sayfa),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Restoran sipariş listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Restoran siparişleri listelenemedi',
            error: error.message
        });
    }
});

// Sipariş detayı
router.get('/:id', auth, async (req, res) => {
    try {
        const siparis = await Siparis.findById(req.params.id)
            .populate('kullaniciId', 'ad soyad telefon')
            .populate('restoranId', 'ad adres konum iletisim calismaSaatleri resimUrl');

        if (!siparis) {
            return res.status(404).json({
                success: false,
                message: 'Sipariş bulunamadı'
            });
        }

        // Yetki kontrolü
        if (siparis.kullaniciId._id.toString() !== req.user.id && 
            siparis.restoranId._id.toString() !== req.user.restoranId) {
            return res.status(403).json({
                success: false,
                message: 'Bu siparişi görme yetkiniz yok'
            });
        }

        res.json({
            success: true,
            message: 'Sipariş detayı getirildi',
            data: siparis
        });

    } catch (error) {
        console.error('Sipariş detay hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sipariş detayı getirilemedi',
            error: error.message
        });
    }
});

// Sipariş durumu güncelleme (restoran)
router.put('/:id/durum', restoranAuth, async (req, res) => {
    try {
        const { durum, notlar } = req.body;
        
        const gecerliDurumlar = ['beklemede', 'onaylandi', 'hazirlaniyor', 'hazir', 'teslim_edildi', 'iptal_edildi'];
        
        if (!durum || !gecerliDurumlar.includes(durum)) {
            return res.status(400).json({
                success: false,
                message: 'Geçerli bir durum seçin',
                data: { gecerliDurumlar }
            });
        }

        const siparis = await Siparis.findOne({
            _id: req.params.id,
            restoranId: req.restoran.id
        });

        if (!siparis) {
            return res.status(404).json({
                success: false,
                message: 'Sipariş bulunamadı veya yetkiniz yok'
            });
        }

        // Durum geçişi kontrolü
        const durumGecisleri = {
            'beklemede': ['onaylandi', 'iptal_edildi'],
            'onaylandi': ['hazirlaniyor', 'iptal_edildi'],
            'hazirlaniyor': ['hazir'],
            'hazir': ['teslim_edildi'],
            'teslim_edildi': [],
            'iptal_edildi': []
        };

        if (!durumGecisleri[siparis.durum].includes(durum)) {
            return res.status(400).json({
                success: false,
                message: `${siparis.durum} durumundan ${durum} durumuna geçiş yapılamaz`,
                data: { izinVerilenDurumlar: durumGecisleri[siparis.durum] }
            });
        }

        // Durumu güncelle
        const eskiDurum = siparis.durum;
        siparis.durum = durum;
        if (notlar) siparis.notlar = notlar;
        
        // Durum geçmişi
        if (!siparis.durumGecmisi) siparis.durumGecmisi = [];
        siparis.durumGecmisi.push({
            durum: durum,
            tarih: new Date(),
            notlar: notlar
        });

        // Hazır olma saati
        if (durum === 'hazir') {
            siparis.hazirOlmaTarihi = new Date();
        }

        // Teslim saati
        if (durum === 'teslim_edildi') {
            siparis.teslimTarihi = new Date();
        }

        await siparis.save();

        res.json({
            success: true,
            message: `Sipariş durumu ${eskiDurum} -> ${durum} olarak güncellendi`,
            data: {
                siparisId: siparis._id,
                yeniDurum: siparis.durum,
                durumGecmisi: siparis.durumGecmisi
            }
        });

    } catch (error) {
        console.error('Sipariş durum güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sipariş durumu güncellenemedi',
            error: error.message
        });
    }
});

// Sipariş iptal etme (kullanıcı)
router.put('/:id/iptal', auth, async (req, res) => {
    try {
        const { iptalSebebi } = req.body;

        const siparis = await Siparis.findOne({
            _id: req.params.id,
            kullaniciId: req.user.id
        });

        if (!siparis) {
            return res.status(404).json({
                success: false,
                message: 'Sipariş bulunamadı'
            });
        }

        // İptal edilebilir durumlar
        if (!['beklemede', 'onaylandi'].includes(siparis.durum)) {
            return res.status(400).json({
                success: false,
                message: 'Bu aşamada sipariş iptal edilemez',
                data: { mevcutDurum: siparis.durum }
            });
        }

        // Siparişi iptal et
        siparis.durum = 'iptal_edildi';
        siparis.iptalSebebi = iptalSebebi;
        siparis.iptalTarihi = new Date();

        // Durum geçmişi
        if (!siparis.durumGecmisi) siparis.durumGecmisi = [];
        siparis.durumGecmisi.push({
            durum: 'iptal_edildi',
            tarih: new Date(),
            notlar: `Kullanıcı tarafından iptal edildi: ${iptalSebebi}`
        });

        await siparis.save();

        // Paket stoğunu geri ekle
        for (const paketBilgisi of siparis.paketler) {
            await Paket.findByIdAndUpdate(
                paketBilgisi.paketId,
                { $inc: { stok: paketBilgisi.miktar } }
            );
        }

        res.json({
            success: true,
            message: 'Sipariş başarıyla iptal edildi',
            data: {
                siparisId: siparis._id,
                iptalTarihi: siparis.iptalTarihi,
                iptalSebebi: siparis.iptalSebebi
            }
        });

    } catch (error) {
        console.error('Sipariş iptal hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sipariş iptal edilemedi',
            error: error.message
        });
    }
});

// Sipariş istatistikleri (restoran)
router.get('/istatistikler/ozet', restoranAuth, async (req, res) => {
    try {
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const yarin = new Date(bugun);
        yarin.setDate(yarin.getDate() + 1);

        // Bugünkü siparişler
        const bugunSiparisler = await Siparis.find({
            restoranId: req.restoran.id,
            olusturulmaTarihi: { $gte: bugun, $lt: yarin }
        });

        // Genel istatistikler
        const [
            toplamSiparis,
            aktifSiparisler,
            tamamlananSiparisler,
            gunlukCiro
        ] = await Promise.all([
            Siparis.countDocuments({ restoranId: req.restoran.id }),
            Siparis.countDocuments({ 
                restoranId: req.restoran.id, 
                durum: { $in: ['beklemede', 'onaylandi', 'hazirlaniyor', 'hazir'] } 
            }),
            Siparis.countDocuments({ 
                restoranId: req.restoran.id, 
                durum: 'teslim_edildi' 
            }),
            Siparis.aggregate([
                { 
                    $match: { 
                        restoranId: req.restoran.id,
                        durum: 'teslim_edildi',
                        teslimTarihi: { $gte: bugun, $lt: yarin }
                    } 
                },
                { $group: { _id: null, toplam: { $sum: '$toplamTutar' } } }
            ])
        ]);

        res.json({
            success: true,
            message: 'İstatistikler getirildi',
            data: {
                bugun: {
                    siparisAdeti: bugunSiparisler.length,
                    ciro: gunlukCiro[0]?.toplam || 0,
                    durumDagilimi: bugunSiparisler.reduce((acc, siparis) => {
                        acc[siparis.durum] = (acc[siparis.durum] || 0) + 1;
                        return acc;
                    }, {})
                },
                genel: {
                    toplamSiparis,
                    aktifSiparisler,
                    tamamlananSiparisler,
                    basariOrani: toplamSiparis > 0 ? Math.round((tamamlananSiparisler / toplamSiparis) * 100) : 0
                }
            }
        });

    } catch (error) {
        console.error('İstatistik hatası:', error);
        res.status(500).json({
            success: false,
            message: 'İstatistikler getirilemedi',
            error: error.message
        });
    }
});

module.exports = router;