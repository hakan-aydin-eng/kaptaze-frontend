// Paket Management Routes
const express = require('express');
const router = express.Router();
const { Paket } = require('../models/veritabani-semasi');
const { auth, restoranAuth } = require('../middleware/auth');

// Paket listeleme (müşteri için)
router.get('/', async (req, res) => {
    try {
        const { 
            kategori, 
            minFiyat, 
            maxFiyat, 
            restoranId, 
            konum, 
            mesafe = 5,
            sayfa = 1, 
            limit = 10 
        } = req.query;

        // Filtreleme objekti
        const filtreler = { 
            aktif: true,
            stok: { $gt: 0 },
            sonKullanmaTarihi: { $gte: new Date() }
        };

        if (kategori) filtreler.kategori = kategori;
        if (restoranId) filtreler.restoranId = restoranId;
        if (minFiyat || maxFiyat) {
            filtreler.fiyat = {};
            if (minFiyat) filtreler.fiyat.$gte = parseFloat(minFiyat);
            if (maxFiyat) filtreler.fiyat.$lte = parseFloat(maxFiyat);
        }

        // Sayfalama
        const skip = (parseInt(sayfa) - 1) * parseInt(limit);

        // Paketleri getir (populate ile restoran bilgileri)
        const paketler = await Paket.find(filtreler)
            .populate('restoranId', 'ad adres konum calismaSaatleri resimUrl puan')
            .sort({ olusturulmaTarihi: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Toplam sayı
        const toplam = await Paket.countDocuments(filtreler);

        // Sonuçları formatla
        const formatliPaketler = paketler.map(paket => ({
            id: paket._id,
            ad: paket.ad,
            aciklama: paket.aciklama,
            kategori: paket.kategori,
            originalFiyat: paket.originalFiyat,
            fiyat: paket.fiyat,
            stok: paket.stok,
            resimUrl: paket.resimUrl,
            sonKullanmaTarihi: paket.sonKullanmaTarihi,
            hazirlanmaSuresi: paket.hazirlanmaSuresi,
            restoran: paket.restoranId ? {
                id: paket.restoranId._id,
                ad: paket.restoranId.ad,
                adres: paket.restoranId.adres,
                konum: paket.restoranId.konum,
                calismaSaatleri: paket.restoranId.calismaSaatleri,
                resimUrl: paket.restoranId.resimUrl,
                puan: paket.restoranId.puan
            } : null
        }));

        res.json({
            success: true,
            message: 'Paketler başarıyla listelendi',
            data: {
                paketler: formatliPaketler,
                sayfalama: {
                    sayfaSayisi: Math.ceil(toplam / parseInt(limit)),
                    toplamKayit: toplam,
                    mevcutSayfa: parseInt(sayfa),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Paket listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Paketler listelenemedi',
            error: error.message
        });
    }
});

// Paket detayı
router.get('/:id', async (req, res) => {
    try {
        const paket = await Paket.findOne({ 
            _id: req.params.id, 
            aktif: true 
        }).populate('restoranId', 'ad adres konum calismaSaatleri iletisim resimUrl puan');

        if (!paket) {
            return res.status(404).json({
                success: false,
                message: 'Paket bulunamadı veya aktif değil'
            });
        }

        res.json({
            success: true,
            message: 'Paket detayı getirildi',
            data: {
                id: paket._id,
                ad: paket.ad,
                aciklama: paket.aciklama,
                kategori: paket.kategori,
                originalFiyat: paket.originalFiyat,
                fiyat: paket.fiyat,
                stok: paket.stok,
                resimUrl: paket.resimUrl,
                sonKullanmaTarihi: paket.sonKullanmaTarihi,
                hazirlanmaSuresi: paket.hazirlanmaSuresi,
                icerik: paket.icerik,
                restoran: paket.restoranId ? {
                    id: paket.restoranId._id,
                    ad: paket.restoranId.ad,
                    adres: paket.restoranId.adres,
                    konum: paket.restoranId.konum,
                    calismaSaatleri: paket.restoranId.calismaSaatleri,
                    iletisim: paket.restoranId.iletisim,
                    resimUrl: paket.restoranId.resimUrl,
                    puan: paket.restoranId.puan
                } : null
            }
        });

    } catch (error) {
        console.error('Paket detay hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Paket detayı getirilemedi',
            error: error.message
        });
    }
});

// Restoran paket listeleme
router.get('/restoran/:restoranId', restoranAuth, async (req, res) => {
    try {
        const { restoranId } = req.params;
        const { 
            aktif, 
            kategori, 
            sayfa = 1, 
            limit = 10 
        } = req.query;

        // Filtreleme
        const filtreler = { restoranId };
        if (aktif !== undefined) filtreler.aktif = aktif === 'true';
        if (kategori) filtreler.kategori = kategori;

        const skip = (parseInt(sayfa) - 1) * parseInt(limit);

        const paketler = await Paket.find(filtreler)
            .sort({ olusturulmaTarihi: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const toplam = await Paket.countDocuments(filtreler);

        res.json({
            success: true,
            message: 'Restoran paketleri listelendi',
            data: {
                paketler,
                sayfalama: {
                    sayfaSayisi: Math.ceil(toplam / parseInt(limit)),
                    toplamKayit: toplam,
                    mevcutSayfa: parseInt(sayfa),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Restoran paket listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Restoran paketleri listelenemedi',
            error: error.message
        });
    }
});

// Yeni paket oluşturma
router.post('/', restoranAuth, async (req, res) => {
    try {
        const {
            ad,
            aciklama,
            kategori,
            originalFiyat,
            fiyat,
            stok,
            sonKullanmaTarihi,
            hazirlanmaSuresi,
            icerik,
            resimUrl
        } = req.body;

        // Validasyon
        if (!ad || !kategori || !originalFiyat || !fiyat || !stok || !sonKullanmaTarihi) {
            return res.status(400).json({
                success: false,
                message: 'Gerekli alanları doldurun (ad, kategori, original fiyat, fiyat, stok, son kullanma tarihi)'
            });
        }

        // Yeni paket oluştur
        const yeniPaket = new Paket({
            ad,
            aciklama,
            kategori,
            originalFiyat: parseFloat(originalFiyat),
            fiyat: parseFloat(fiyat),
            stok: parseInt(stok),
            sonKullanmaTarihi: new Date(sonKullanmaTarihi),
            hazirlanmaSuresi: hazirlanmaSuresi || 15,
            icerik: icerik || [],
            resimUrl,
            restoranId: req.restoran.id,
            aktif: true
        });

        await yeniPaket.save();

        res.status(201).json({
            success: true,
            message: 'Paket başarıyla oluşturuldu',
            data: yeniPaket
        });

    } catch (error) {
        console.error('Paket oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Paket oluşturulamadı',
            error: error.message
        });
    }
});

// Paket güncelleme
router.put('/:id', restoranAuth, async (req, res) => {
    try {
        const paket = await Paket.findOne({ 
            _id: req.params.id, 
            restoranId: req.restoran.id 
        });

        if (!paket) {
            return res.status(404).json({
                success: false,
                message: 'Paket bulunamadı veya yetkiniz yok'
            });
        }

        // Güncellenebilir alanlar
        const guncellenebilirAlanlar = [
            'ad', 'aciklama', 'kategori', 'originalFiyat', 
            'fiyat', 'stok', 'sonKullanmaTarihi', 
            'hazirlanmaSuresi', 'icerik', 'resimUrl', 'aktif'
        ];

        guncellenebilirAlanlar.forEach(alan => {
            if (req.body[alan] !== undefined) {
                if (alan === 'originalFiyat' || alan === 'fiyat') {
                    paket[alan] = parseFloat(req.body[alan]);
                } else if (alan === 'stok' || alan === 'hazirlanmaSuresi') {
                    paket[alan] = parseInt(req.body[alan]);
                } else if (alan === 'sonKullanmaTarihi') {
                    paket[alan] = new Date(req.body[alan]);
                } else {
                    paket[alan] = req.body[alan];
                }
            }
        });

        paket.guncellenmeTarihi = new Date();
        await paket.save();

        res.json({
            success: true,
            message: 'Paket başarıyla güncellendi',
            data: paket
        });

    } catch (error) {
        console.error('Paket güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Paket güncellenemedi',
            error: error.message
        });
    }
});

// Paket silme (soft delete)
router.delete('/:id', restoranAuth, async (req, res) => {
    try {
        const paket = await Paket.findOne({ 
            _id: req.params.id, 
            restoranId: req.restoran.id 
        });

        if (!paket) {
            return res.status(404).json({
                success: false,
                message: 'Paket bulunamadı veya yetkiniz yok'
            });
        }

        // Soft delete
        paket.aktif = false;
        paket.guncellenmeTarihi = new Date();
        await paket.save();

        res.json({
            success: true,
            message: 'Paket başarıyla silindi'
        });

    } catch (error) {
        console.error('Paket silme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Paket silinemedi',
            error: error.message
        });
    }
});

// Paket kategorileri
router.get('/kategoriler/liste', async (req, res) => {
    try {
        const kategoriler = await Paket.distinct('kategori', { aktif: true });
        
        res.json({
            success: true,
            message: 'Kategoriler listelendi',
            data: kategoriler.sort()
        });

    } catch (error) {
        console.error('Kategori listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kategoriler listelenemedi',
            error: error.message
        });
    }
});

module.exports = router;