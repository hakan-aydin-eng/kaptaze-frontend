// KAPTAZEAPPV5 - Restoran API Rotaları
// Türkçe Validasyon Mesajları ile

const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Restoran, Paket } = require('../models/veritabani-semasi');
const auth = require('../middleware/auth');

const router = express.Router();

// Türkçe Hata Mesajları
const hataMesajlari = {
  adZorunlu: 'Restoran adı zorunludur',
  kategoriZorunlu: 'Kategori seçimi zorunludur',
  aciklamaZorunlu: 'Açıklama zorunludur',
  adresZorunlu: 'Adres bilgisi zorunludur',
  restoranYok: 'Restoran bulunamadı',
  koordinatGecersiz: 'Geçerli koordinat bilgisi girin'
};

// Validasyon kuralları
const restoranValidasyon = [
  body('ad')
    .notEmpty()
    .withMessage(hataMesajlari.adZorunlu)
    .isLength({ min: 2, max: 100 })
    .withMessage('Restoran adı 2-100 karakter arasında olmalıdır'),
  body('kategori')
    .notEmpty()
    .withMessage(hataMesajlari.kategoriZorunlu)
    .isIn([
      'Geleneksel Türk', 'Et & Kebap', 'Deniz Ürünleri', 
      'Börek & Kahvaltı', 'Pide & Lahmacun', 'Kahve & Pasta',
      'Fırın & Ekmek', 'Vegan Yemekler', 'Japon Mutfağı',
      'İtalyan Mutfağı', 'Fast Food', 'Tatlı & Dondurma'
    ])
    .withMessage('Geçerli bir kategori seçin'),
  body('aciklama')
    .notEmpty()
    .withMessage(hataMesajlari.aciklamaZorunlu)
    .isLength({ max: 500 })
    .withMessage('Açıklama en fazla 500 karakter olabilir'),
  body('adres')
    .notEmpty()
    .withMessage(hataMesajlari.adresZorunlu),
  body('konum.enlem')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Enlem -90 ile 90 arasında olmalıdır'),
  body('konum.boylam')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Boylam -180 ile 180 arasında olmalıdır')
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

// @route   GET /api/restoran/liste
// @desc    Tüm restoranları listele (filtreleme ve arama ile)
// @access  Public
router.get('/liste', [
  query('kategori').optional().isString(),
  query('arama').optional().isString(),
  query('sayfa').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('enlem').optional().isFloat(),
  query('boylam').optional().isFloat(),
  query('mesafe').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { 
      kategori, 
      arama, 
      sayfa = 1, 
      limit = 10,
      enlem,
      boylam,
      mesafe = 10
    } = req.query;

    // Filtreleme objesi
    let filtre = { aktifMi: true };

    // Kategori filtresi
    if (kategori && kategori !== 'all') {
      filtre.kategori = kategori;
    }

    // Arama filtresi
    if (arama) {
      filtre.$or = [
        { ad: { $regex: arama, $options: 'i' } },
        { aciklama: { $regex: arama, $options: 'i' } },
        { kategori: { $regex: arama, $options: 'i' } }
      ];
    }

    // Sayfalama
    const skip = (parseInt(sayfa) - 1) * parseInt(limit);

    // Restoranları getir
    let restoranlar = await Restoran.find(filtre)
      .sort({ onerilenMi: -1, puan: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Her restoran için aktif paket sayısını hesapla
    const restoranlarVeriyle = await Promise.all(
      restoranlar.map(async (restoran) => {
        const aktifPaketSayisi = await Paket.countDocuments({
          restoranId: restoran._id,
          aktifMi: true,
          stokAdedi: { $gt: 0 }
        });

        // Mesafe hesaplama (kullanıcı konumu varsa)
        let hesaplananMesafe = null;
        if (enlem && boylam) {
          const restoranEnlem = restoran.konum.enlem;
          const restoranBoylam = restoran.konum.boylam;
          
          // Haversine formülü ile mesafe hesaplama
          const R = 6371; // Dünya yarıçapı (km)
          const dLat = (restoranEnlem - enlem) * Math.PI / 180;
          const dLon = (restoranBoylam - boylam) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(enlem * Math.PI / 180) * Math.cos(restoranEnlem * Math.PI / 180) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          hesaplananMesafe = (R * c).toFixed(1) + 'km';
        }

        return {
          id: restoran._id,
          ad: restoran.ad,
          kategori: restoran.kategori,
          aciklama: restoran.aciklama,
          adres: restoran.adres,
          konum: restoran.konum,
          mesafe: hesaplananMesafe || restoran.konum.mesafe,
          calismaSaatleri: restoran.calismaSaatleri,
          puan: restoran.puan,
          onerilenMi: restoran.onerilenMi,
          resimUrl: restoran.resimUrl,
          aktifPaketSayisi,
          iletisim: restoran.iletisim
        };
      })
    );

    // Mesafe filtresi (kullanıcı konumu varsa)
    if (enlem && boylam) {
      restoranlarVeriyle = restoranlarVeriyle.filter(restoran => {
        if (restoran.mesafe) {
          const restoranMesafe = parseFloat(restoran.mesafe.replace('km', ''));
          return restoranMesafe <= mesafe;
        }
        return true;
      });
    }

    // Toplam sayı
    const toplam = await Restoran.countDocuments(filtre);

    res.json({
      basarili: true,
      restoranlar: restoranlarVeriyle,
      sayfalama: {
        mevcut: parseInt(sayfa),
        toplam: Math.ceil(toplam / parseInt(limit)),
        kayitSayisi: restoranlarVeriyle.length,
        toplamKayit: toplam
      },
      filtreler: {
        kategori: kategori || 'tümü',
        arama: arama || '',
        mesafe: mesafe + 'km'
      }
    });

  } catch (error) {
    console.error('Restoran listesi hatası:', error);
    res.status(500).json({
      hata: true,
      mesaj: 'Restoranlar yüklenirken hata oluştu'
    });
  }
});

// @route   GET /api/restoran/onerilen
// @desc    Önerilen restoranları getir
// @access  Public
router.get('/onerilen', async (req, res) => {
  try {
    const onerilenRestoranlar = await Restoran.find({ 
      onerilenMi: true, 
      aktifMi: true 
    })
    .sort({ puan: -1 })
    .limit(5);

    // Her restoran için aktif paket bilgilerini getir
    const restoranlarVeriyle = await Promise.all(
      onerilenRestoranlar.map(async (restoran) => {
        const paketler = await Paket.find({
          restoranId: restoran._id,
          aktifMi: true,
          stokAdedi: { $gt: 0 }
        }).limit(3);

        return {
          id: restoran._id,
          ad: restoran.ad,
          kategori: restoran.kategori,
          aciklama: restoran.aciklama,
          adres: restoran.adres,
          konum: restoran.konum,
          calismaSaatleri: restoran.calismaSaatleri,
          puan: restoran.puan,
          resimUrl: restoran.resimUrl,
          paketSayisi: paketler.length,
          paketler: paketler.map(paket => ({
            id: paket._id,
            ad: paket.ad,
            orijinalFiyat: paket.orijinalFiyat,
            satisFiyati: paket.satisFiyati,
            stokAdedi: paket.stokAdedi,
            durum: paket.durum
          }))
        };
      })
    );

    res.json({
      basarili: true,
      mesaj: 'Önerilen restoranlar başarıyla getirildi',
      restoranlar: restoranlarVeriyle
    });

  } catch (error) {
    console.error('Önerilen restoranlar hatası:', error);
    res.status(500).json({
      hata: true,
      mesaj: 'Önerilen restoranlar yüklenirken hata oluştu'
    });
  }
});

// @route   GET /api/restoran/:id
// @desc    Belirli bir restoranın detaylarını getir
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const restoran = await Restoran.findOne({ 
      _id: req.params.id, 
      aktifMi: true 
    });

    if (!restoran) {
      return res.status(404).json({
        hata: true,
        mesaj: hataMesajlari.restoranYok
      });
    }

    // Restoranın aktif paketlerini getir
    const paketler = await Paket.find({
      restoranId: restoran._id,
      aktifMi: true,
      stokAdedi: { $gt: 0 }
    }).sort({ olusturmaTarihi: -1 });

    res.json({
      basarili: true,
      restoran: {
        id: restoran._id,
        ad: restoran.ad,
        kategori: restoran.kategori,
        aciklama: restoran.aciklama,
        adres: restoran.adres,
        konum: restoran.konum,
        iletisim: restoran.iletisim,
        calismaSaatleri: restoran.calismaSaatleri,
        puan: restoran.puan,
        onerilenMi: restoran.onerilenMi,
        resimUrl: restoran.resimUrl,
        paketler: paketler.map(paket => ({
          id: paket._id,
          ad: paket.ad,
          aciklama: paket.aciklama,
          orijinalFiyat: paket.orijinalFiyat,
          satisFiyati: paket.satisFiyati,
          stokAdedi: paket.stokAdedi,
          durum: paket.durum,
          hazirlanmaTarihi: paket.hazirlanmaTarihi,
          sonKullanmaTarihi: paket.sonKullanmaTarihi
        }))
      }
    });

  } catch (error) {
    console.error('Restoran detay hatası:', error);
    res.status(500).json({
      hata: true,
      mesaj: 'Restoran bilgileri yüklenirken hata oluştu'
    });
  }
});

// @route   GET /api/restoran/kategoriler/liste
// @desc    Mevcut kategorileri listele
// @access  Public
router.get('/kategoriler/liste', async (req, res) => {
  try {
    const kategoriler = [
      { id: 'all', ad: 'Tümü', emoji: '🍽️' },
      { id: 'local', ad: 'Yerel', emoji: '🏠' },
      { id: 'sweet', ad: 'Tatlı', emoji: '🧁' },
      { id: 'vegan', ad: 'Vegan', emoji: '🥗' },
      { id: 'Geleneksel Türk', ad: 'Geleneksel Türk', emoji: '🇹🇷' },
      { id: 'Et & Kebap', ad: 'Et & Kebap', emoji: '🥙' },
      { id: 'Deniz Ürünleri', ad: 'Deniz Ürünleri', emoji: '🐟' },
      { id: 'Börek & Kahvaltı', ad: 'Börek & Kahvaltı', emoji: '🥧' },
      { id: 'Pide & Lahmacun', ad: 'Pide & Lahmacun', emoji: '🍕' },
      { id: 'Kahve & Pasta', ad: 'Kahve & Pasta', emoji: '☕' },
      { id: 'Fırın & Ekmek', ad: 'Fırın & Ekmek', emoji: '🍞' },
      { id: 'Vegan Yemekler', ad: 'Vegan Yemekler', emoji: '🌱' },
      { id: 'Fast Food', ad: 'Fast Food', emoji: '🍔' },
      { id: 'Tatlı & Dondurma', ad: 'Tatlı & Dondurma', emoji: '🍨' }
    ];

    res.json({
      basarili: true,
      kategoriler
    });

  } catch (error) {
    console.error('Kategori listesi hatası:', error);
    res.status(500).json({
      hata: true,
      mesaj: 'Kategoriler yüklenirken hata oluştu'
    });
  }
});

module.exports = router;