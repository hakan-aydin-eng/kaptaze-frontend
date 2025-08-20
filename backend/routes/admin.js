// Admin Management Routes
const express = require('express');
const router = express.Router();
const { Kullanici, Restoran, Siparis, Paket } = require('../models/veritabani-semasi');
const { adminAuth } = require('../middleware/auth');

// Dashboard istatistikleri
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const bugun = new Date();
        bugun.setHours(0, 0, 0, 0);
        const yarin = new Date(bugun);
        yarin.setDate(yarin.getDate() + 1);

        // Genel sayılar
        const [
            toplamKullanici,
            toplamRestoran,
            aktifRestoranlar,
            toplamSiparis,
            bugunSiparisler,
            toplamPaket,
            aktifPaketler
        ] = await Promise.all([
            Kullanici.countDocuments({ rol: 'kullanici' }),
            Restoran.countDocuments(),
            Restoran.countDocuments({ aktif: true, onaylanmis: true }),
            Siparis.countDocuments(),
            Siparis.countDocuments({ olusturulmaTarihi: { $gte: bugun, $lt: yarin } }),
            Paket.countDocuments(),
            Paket.countDocuments({ aktif: true, sonKullanmaTarihi: { $gte: new Date() } })
        ]);

        // Son 30 günlük sipariş trendi
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const siparissTrendi = await Siparis.aggregate([
            {
                $match: {
                    olusturulmaTarihi: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$olusturulmaTarihi" }
                    },
                    sayi: { $sum: 1 },
                    ciro: { $sum: "$toplamTutar" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Top restoranlar (sipariş sayısına göre)
        const topRestoranlar = await Siparis.aggregate([
            {
                $group: {
                    _id: "$restoranId",
                    siparisAdeti: { $sum: 1 },
                    toplamCiro: { $sum: "$toplamTutar" }
                }
            },
            {
                $lookup: {
                    from: "restoranlar",
                    localField: "_id",
                    foreignField: "_id",
                    as: "restoran"
                }
            },
            { $unwind: "$restoran" },
            {
                $project: {
                    ad: "$restoran.ad",
                    siparisAdeti: 1,
                    toplamCiro: 1
                }
            },
            { $sort: { siparisAdeti: -1 } },
            { $limit: 10 }
        ]);

        // Kategori dağılımı
        const kategoriDagilimi = await Paket.aggregate([
            { $match: { aktif: true } },
            {
                $group: {
                    _id: "$kategori",
                    sayi: { $sum: 1 }
                }
            },
            { $sort: { sayi: -1 } }
        ]);

        res.json({
            success: true,
            message: 'Dashboard verileri getirildi',
            data: {
                genel: {
                    toplamKullanici,
                    toplamRestoran,
                    aktifRestoranlar,
                    toplamSiparis,
                    bugunSiparisler,
                    toplamPaket,
                    aktifPaketler
                },
                siparissTrendi,
                topRestoranlar,
                kategoriDagilimi
            }
        });

    } catch (error) {
        console.error('Dashboard istatistik hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Dashboard verileri getirilemedi',
            error: error.message
        });
    }
});

// Kullanıcı yönetimi - listeleme
router.get('/kullanicilar', adminAuth, async (req, res) => {
    try {
        const { 
            arama, 
            rol, 
            aktif, 
            sayfa = 1, 
            limit = 20 
        } = req.query;

        // Filtreleme
        const filtreler = {};
        if (arama) {
            filtreler.$or = [
                { ad: { $regex: arama, $options: 'i' } },
                { soyad: { $regex: arama, $options: 'i' } },
                { eposta: { $regex: arama, $options: 'i' } },
                { telefon: { $regex: arama, $options: 'i' } }
            ];
        }
        if (rol) filtreler.rol = rol;
        if (aktif !== undefined) filtreler.aktif = aktif === 'true';

        const skip = (parseInt(sayfa) - 1) * parseInt(limit);

        const kullanicilar = await Kullanici.find(filtreler)
            .select('-sifre') // Şifreyi gösterme
            .sort({ kayitTarihi: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const toplam = await Kullanici.countDocuments(filtreler);

        res.json({
            success: true,
            message: 'Kullanıcılar listelendi',
            data: {
                kullanicilar,
                sayfalama: {
                    sayfaSayisi: Math.ceil(toplam / parseInt(limit)),
                    toplamKayit: toplam,
                    mevcutSayfa: parseInt(sayfa),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Kullanıcı listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcılar listelenemedi',
            error: error.message
        });
    }
});

// Kullanıcı durumu güncelleme
router.put('/kullanicilar/:id/durum', adminAuth, async (req, res) => {
    try {
        const { aktif, sebep } = req.body;

        const kullanici = await Kullanici.findById(req.params.id);
        if (!kullanici) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        kullanici.aktif = aktif;
        if (sebep) {
            if (!kullanici.adminNotlari) kullanici.adminNotlari = [];
            kullanici.adminNotlari.push({
                tarih: new Date(),
                admin: req.user.id,
                not: `Durum değiştirme: ${aktif ? 'Aktif' : 'Pasif'} - ${sebep}`
            });
        }

        await kullanici.save();

        res.json({
            success: true,
            message: `Kullanıcı durumu ${aktif ? 'aktif' : 'pasif'} olarak güncellendi`,
            data: {
                kullaniciId: kullanici._id,
                yeniDurum: kullanici.aktif
            }
        });

    } catch (error) {
        console.error('Kullanıcı durum güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Kullanıcı durumu güncellenemedi',
            error: error.message
        });
    }
});

// Restoran yönetimi - listeleme
router.get('/restoranlar', adminAuth, async (req, res) => {
    try {
        const { 
            arama, 
            onaylanmis, 
            aktif, 
            sayfa = 1, 
            limit = 20 
        } = req.query;

        // Filtreleme
        const filtreler = {};
        if (arama) {
            filtreler.$or = [
                { ad: { $regex: arama, $options: 'i' } },
                { eposta: { $regex: arama, $options: 'i' } },
                { 'adres.sehir': { $regex: arama, $options: 'i' } }
            ];
        }
        if (onaylanmis !== undefined) filtreler.onaylanmis = onaylanmis === 'true';
        if (aktif !== undefined) filtreler.aktif = aktif === 'true';

        const skip = (parseInt(sayfa) - 1) * parseInt(limit);

        const restoranlar = await Restoran.find(filtreler)
            .sort({ basvuruTarihi: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const toplam = await Restoran.countDocuments(filtreler);

        // Her restoran için sipariş sayısı
        const restoranlarWithStats = await Promise.all(
            restoranlar.map(async (restoran) => {
                const siparisAdeti = await Siparis.countDocuments({ restoranId: restoran._id });
                const aktifPaketSayisi = await Paket.countDocuments({ 
                    restoranId: restoran._id, 
                    aktif: true,
                    sonKullanmaTarihi: { $gte: new Date() }
                });
                
                return {
                    ...restoran.toObject(),
                    istatistikler: {
                        siparisAdeti,
                        aktifPaketSayisi
                    }
                };
            })
        );

        res.json({
            success: true,
            message: 'Restoranlar listelendi',
            data: {
                restoranlar: restoranlarWithStats,
                sayfalama: {
                    sayfaSayisi: Math.ceil(toplam / parseInt(limit)),
                    toplamKayit: toplam,
                    mevcutSayfa: parseInt(sayfa),
                    limit: parseInt(limit)
                }
            }
        });

    } catch (error) {
        console.error('Restoran listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Restoranlar listelenemedi',
            error: error.message
        });
    }
});

// Restoran onaylama/reddetme
router.put('/restoranlar/:id/onayla', adminAuth, async (req, res) => {
    try {
        const { onaylanmis, sebep } = req.body;

        const restoran = await Restoran.findById(req.params.id);
        if (!restoran) {
            return res.status(404).json({
                success: false,
                message: 'Restoran bulunamadı'
            });
        }

        restoran.onaylanmis = onaylanmis;
        restoran.onayTarihi = onaylanmis ? new Date() : null;
        restoran.onayAdmin = req.user.id;

        if (sebep) {
            if (!restoran.adminNotlari) restoran.adminNotlari = [];
            restoran.adminNotlari.push({
                tarih: new Date(),
                admin: req.user.id,
                not: `${onaylanmis ? 'Onaylandı' : 'Reddedildi'}: ${sebep}`
            });
        }

        await restoran.save();

        res.json({
            success: true,
            message: `Restoran ${onaylanmis ? 'onaylandı' : 'reddedildi'}`,
            data: {
                restoranId: restoran._id,
                durum: onaylanmis,
                onayTarihi: restoran.onayTarihi
            }
        });

    } catch (error) {
        console.error('Restoran onaylama hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Restoran durumu güncellenemedi',
            error: error.message
        });
    }
});

// Sipariş yönetimi - genel listeleme
router.get('/siparisler', adminAuth, async (req, res) => {
    try {
        const { 
            durum, 
            tarih, 
            restoranId, 
            kullaniciId,
            sayfa = 1, 
            limit = 50 
        } = req.query;

        // Filtreleme
        const filtreler = {};
        if (durum) filtreler.durum = durum;
        if (restoranId) filtreler.restoranId = restoranId;
        if (kullaniciId) filtreler.kullaniciId = kullaniciId;
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
            .populate('kullaniciId', 'ad soyad eposta telefon')
            .populate('restoranId', 'ad eposta adres')
            .sort({ olusturulmaTarihi: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const toplam = await Siparis.countDocuments(filtreler);

        // Durum istatistikleri
        const durumIstatistikleri = await Siparis.aggregate([
            { $group: { _id: '$durum', sayi: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            message: 'Siparişler listelendi',
            data: {
                siparisler,
                durumIstatistikleri,
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

// Paket yönetimi - genel listeleme
router.get('/paketler', adminAuth, async (req, res) => {
    try {
        const { 
            kategori, 
            aktif, 
            restoranId,
            arama,
            sayfa = 1, 
            limit = 50 
        } = req.query;

        // Filtreleme
        const filtreler = {};
        if (kategori) filtreler.kategori = kategori;
        if (aktif !== undefined) filtreler.aktif = aktif === 'true';
        if (restoranId) filtreler.restoranId = restoranId;
        if (arama) {
            filtreler.$or = [
                { ad: { $regex: arama, $options: 'i' } },
                { aciklama: { $regex: arama, $options: 'i' } }
            ];
        }

        const skip = (parseInt(sayfa) - 1) * parseInt(limit);

        const paketler = await Paket.find(filtreler)
            .populate('restoranId', 'ad eposta')
            .sort({ olusturulmaTarihi: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const toplam = await Paket.countDocuments(filtreler);

        res.json({
            success: true,
            message: 'Paketler listelendi',
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
        console.error('Paket listeleme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Paketler listelenemedi',
            error: error.message
        });
    }
});

// Sistem ayarları
router.get('/ayarlar', adminAuth, (req, res) => {
    res.json({
        success: true,
        message: 'Sistem ayarları getirildi',
        data: {
            sistem: {
                versiyon: process.env.APP_VERSION || '1.0.0',
                node_versiyon: process.version,
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            veritabani: {
                durum: 'bağlı', // Bu dinamik olarak kontrol edilebilir
                connections: 'aktif'
            }
        }
    });
});

// Raporlar
router.get('/raporlar/genel', adminAuth, async (req, res) => {
    try {
        const { baslangic, bitis } = req.query;
        
        let tarihFiltresi = {};
        if (baslangic && bitis) {
            tarihFiltresi = {
                olusturulmaTarihi: {
                    $gte: new Date(baslangic),
                    $lte: new Date(bitis)
                }
            };
        }

        // Genel özet
        const [
            toplamCiro,
            siparisAdeti,
            ortalamaSiparis,
            katilimciRestoranSayisi
        ] = await Promise.all([
            Siparis.aggregate([
                { $match: { durum: 'teslim_edildi', ...tarihFiltresi } },
                { $group: { _id: null, toplam: { $sum: '$toplamTutar' } } }
            ]),
            Siparis.countDocuments({ ...tarihFiltresi }),
            Siparis.aggregate([
                { $match: { durum: 'teslim_edildi', ...tarihFiltresi } },
                { $group: { _id: null, ortalama: { $avg: '$toplamTutar' } } }
            ]),
            Siparis.distinct('restoranId', tarihFiltresi).then(arr => arr.length)
        ]);

        // Günlük sipariş dağılımı
        const gunlukDagilim = await Siparis.aggregate([
            { $match: tarihFiltresi },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$olusturulmaTarihi" }
                    },
                    siparisAdeti: { $sum: 1 },
                    ciro: { 
                        $sum: {
                            $cond: [
                                { $eq: ['$durum', 'teslim_edildi'] },
                                '$toplamTutar',
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            success: true,
            message: 'Genel rapor oluşturuldu',
            data: {
                ozet: {
                    toplamCiro: toplamCiro[0]?.toplam || 0,
                    siparisAdeti,
                    ortalamaSiparis: ortalamaSiparis[0]?.ortalama || 0,
                    katilimciRestoranSayisi
                },
                gunlukDagilim
            }
        });

    } catch (error) {
        console.error('Rapor oluşturma hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Rapor oluşturulamadı',
            error: error.message
        });
    }
});

module.exports = router;