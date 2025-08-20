// KapTaze Bildirim Modeli - Notification Schema
const mongoose = require('mongoose');

const bildirimSchema = new mongoose.Schema({
  // Kullanıcı bilgisi
  kullaniciId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kullanici',
    required: [true, 'Kullanıcı ID gerekli'],
    index: true
  },

  // Bildirim içeriği
  baslik: {
    type: String,
    required: [true, 'Bildirim başlığı gerekli'],
    maxlength: [100, 'Başlık maksimum 100 karakter olabilir'],
    trim: true
  },

  mesaj: {
    type: String,
    required: [true, 'Bildirim mesajı gerekli'],
    maxlength: [500, 'Mesaj maksimum 500 karakter olabilir'],
    trim: true
  },

  // Bildirim türü
  tip: {
    type: String,
    required: true,
    enum: {
      values: [
        'genel',           // Genel bildirimler
        'siparis',         // Sipariş ile ilgili
        'odeme',           // Ödeme ile ilgili
        'kampanya',        // Kampanya/promosyon
        'restoran',        // Restoran bildirimleri
        'sistem',          // Sistem bildirimleri
        'degerlendirme',   // Değerlendirme hatırlatması
        'stok',            // Stok bildirimleri
        'destek',          // Müşteri desteği
        'guvenlik',        // Güvenlik bildirimleri
        'guncelleme'       // Uygulama güncellemeleri
      ],
      message: 'Geçersiz bildirim tipi: {VALUE}'
    },
    index: true
  },

  // İlgili kayıt ID'leri
  siparisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Siparis',
    sparse: true
  },

  restoranId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restoran',
    sparse: true
  },

  kampanyaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kampanya',
    sparse: true
  },

  // Bildirim durumu
  durum: {
    type: String,
    required: true,
    enum: {
      values: [
        'gonderilecek',   // Henüz gönderilmedi
        'gonderiliyor',   // Gönderiliyor
        'gonderildi',     // Başarıyla gönderildi
        'basarisiz',      // Gönderilemedi
        'zamanli',        // Zamanlanmış
        'iptal_edildi'    // İptal edildi
      ],
      message: 'Geçersiz bildirim durumu: {VALUE}'
    },
    default: 'gonderilecek',
    index: true
  },

  // Okunma durumu
  okundu: {
    type: Boolean,
    default: false,
    index: true
  },

  okunma_tarihi: {
    type: Date
  },

  // Tıklanma durumu
  tiklandi: {
    type: Boolean,
    default: false
  },

  tiklanma_tarihi: {
    type: Date
  },

  // Gönderim bilgileri
  gonderilme_tarihi: {
    type: Date
  },

  zamanlanmis_tarih: {
    type: Date,
    index: true
  },

  // Toplu bildirim mi?
  toplu_bildirim: {
    type: Boolean,
    default: false
  },

  // Öncelik
  oncelik: {
    type: String,
    enum: ['dusuk', 'normal', 'yuksek', 'acil'],
    default: 'normal'
  },

  // Ses ve titreşim ayarları
  sesli: {
    type: Boolean,
    default: true
  },

  titresimli: {
    type: Boolean,
    default: true
  },

  // Bildirim verileri (JSON)
  veri: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Aksiyon butonları
  aksiyonlar: [{
    tip: {
      type: String,
      enum: ['git', 'onayla', 'reddet', 'goster', 'paylas'],
      required: true
    },
    baslik: {
      type: String,
      required: true,
      maxlength: 20
    },
    url: String,
    renk: {
      type: String,
      default: '#16a34a'
    }
  }],

  // Push notification bilgileri
  push_notification_id: String,

  // Hata bilgileri
  hata_mesaji: String,
  
  hata_kodu: String,

  deneme_sayisi: {
    type: Number,
    default: 0,
    max: 5
  },

  // Kategori (Android için)
  kategori: {
    type: String,
    default: 'genel'
  },

  // Büyük resim URL'i
  buyuk_resim_url: String,

  // Grup ID (benzer bildirimleri gruplamak için)
  grup_id: String,

  // Bildirim kanalı (Android için)
  kanal: {
    type: String,
    default: 'varsayilan'
  },

  // Otomatik silme süresi (gün)
  otomatik_silme_gun: {
    type: Number,
    default: 30,
    min: 1,
    max: 365
  },

  // Zaman bilgileri
  olusturulma_tarihi: {
    type: Date,
    default: Date.now,
    index: true
  },

  guncellenme_tarihi: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: {
    createdAt: 'olusturulma_tarihi',
    updatedAt: 'guncellenme_tarihi'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// İndeksler
bildirimSchema.index({ kullaniciId: 1, olusturulma_tarihi: -1 });
bildirimSchema.index({ kullaniciId: 1, okundu: 1 });
bildirimSchema.index({ kullaniciId: 1, tip: 1 });
bildirimSchema.index({ durum: 1, zamanlanmis_tarih: 1 });
bildirimSchema.index({ olusturulma_tarihi: 1 }, { expireAfterSeconds: 2592000 }); // 30 gün sonra otomatik sil

// Virtual fields
bildirimSchema.virtual('zamani_geldi_mi').get(function() {
  if (!this.zamanlanmis_tarih) return false;
  return this.zamanlanmis_tarih <= new Date();
});

bildirimSchema.virtual('okunmamis_mi').get(function() {
  return !this.okundu;
});

bildirimSchema.virtual('gecikme_suresi').get(function() {
  if (!this.gonderilme_tarihi) return null;
  return this.gonderilme_tarihi.getTime() - this.olusturulma_tarihi.getTime();
});

bildirimSchema.virtual('yas').get(function() {
  return Date.now() - this.olusturulma_tarihi.getTime();
});

// Metodlar
bildirimSchema.methods.okunduOlarakIsaretle = function() {
  if (!this.okundu) {
    this.okundu = true;
    this.okunma_tarihi = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

bildirimSchema.methods.tiklandiOlarakIsaretle = function() {
  if (!this.tiklandi) {
    this.tiklandi = true;
    this.tiklanma_tarihi = new Date();
    
    // Tıklandığında otomatik olarak okundu olarak işaretle
    if (!this.okundu) {
      this.okundu = true;
      this.okunma_tarihi = new Date();
    }
    
    return this.save();
  }
  return Promise.resolve(this);
};

bildirimSchema.methods.basariliOlarakIsaretle = function(pushNotificationId = null) {
  this.durum = 'gonderildi';
  this.gonderilme_tarihi = new Date();
  if (pushNotificationId) {
    this.push_notification_id = pushNotificationId;
  }
  return this.save();
};

bildirimSchema.methods.basarisizOlarakIsaretle = function(hataMessaji, hataKodu = null) {
  this.durum = 'basarisiz';
  this.hata_mesaji = hataMessaji;
  this.hata_kodu = hataKodu;
  this.deneme_sayisi += 1;
  return this.save();
};

bildirimSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Hassas bilgileri kaldır
  delete obj.push_notification_id;
  delete obj.hata_mesaji;
  delete obj.hata_kodu;
  delete obj.deneme_sayisi;
  
  return obj;
};

// Static metodlar
bildirimSchema.statics.kullanicininBildirimleri = function(kullaniciId, limit = 50, offset = 0) {
  return this.find({ kullaniciId })
    .sort({ olusturulma_tarihi: -1 })
    .limit(limit)
    .skip(offset)
    .lean();
};

bildirimSchema.statics.okunmamisBildirimler = function(kullaniciId) {
  return this.find({ 
    kullaniciId, 
    okundu: false 
  }).sort({ olusturulma_tarihi: -1 });
};

bildirimSchema.statics.okunmamisSayisi = function(kullaniciId) {
  return this.countDocuments({ 
    kullaniciId, 
    okundu: false 
  });
};

bildirimSchema.statics.gonderilecekBildirimler = function() {
  return this.find({
    durum: { $in: ['gonderilecek', 'basarisiz'] },
    deneme_sayisi: { $lt: 5 },
    $or: [
      { zamanlanmis_tarih: { $exists: false } },
      { zamanlanmis_tarih: { $lte: new Date() } }
    ]
  }).populate('kullaniciId', 'push_token aktif');
};

bildirimSchema.statics.zamanliBildirimler = function() {
  return this.find({
    durum: 'zamanli',
    zamanlanmis_tarih: { $lte: new Date() }
  }).populate('kullaniciId', 'push_token aktif');
};

bildirimSchema.statics.tipineGoreBildirimler = function(kullaniciId, tip, limit = 20) {
  return this.find({ 
    kullaniciId, 
    tip 
  })
    .sort({ olusturulma_tarihi: -1 })
    .limit(limit)
    .lean();
};

bildirimSchema.statics.istatistikler = function(startDate, endDate) {
  const matchStage = {};
  
  if (startDate && endDate) {
    matchStage.olusturulma_tarihi = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          durum: '$durum',
          tip: '$tip'
        },
        count: { $sum: 1 },
        okunma_orani: {
          $avg: {
            $cond: [{ $eq: ['$okundu', true] }, 1, 0]
          }
        },
        tiklanma_orani: {
          $avg: {
            $cond: [{ $eq: ['$tiklandi', true] }, 1, 0]
          }
        }
      }
    },
    {
      $group: {
        _id: '$_id.durum',
        tips: {
          $push: {
            tip: '$_id.tip',
            count: '$count',
            okunma_orani: '$okunma_orani',
            tiklanma_orani: '$tiklanma_orani'
          }
        },
        toplam: { $sum: '$count' }
      }
    }
  ]);
};

bildirimSchema.statics.topluOkunduIsaretle = function(kullaniciId, bildirimIds = []) {
  const query = { kullaniciId, okundu: false };
  
  if (bildirimIds.length > 0) {
    query._id = { $in: bildirimIds };
  }
  
  return this.updateMany(query, {
    $set: {
      okundu: true,
      okunma_tarihi: new Date()
    }
  });
};

bildirimSchema.statics.eskiBildirimleriSil = function(gun = 30) {
  const cutoffDate = new Date(Date.now() - (gun * 24 * 60 * 60 * 1000));
  
  return this.deleteMany({
    olusturulma_tarihi: { $lt: cutoffDate },
    okundu: true
  });
};

// Middleware
bildirimSchema.pre('save', function(next) {
  this.guncellenme_tarihi = new Date();
  next();
});

// Bildirim oluşturulduğunda log
bildirimSchema.post('save', function(doc) {
  if (doc.isNew) {
    console.log(`Yeni bildirim oluşturuldu: ${doc._id} - ${doc.baslik}`);
  }
});

const Bildirim = mongoose.model('Bildirim', bildirimSchema);

module.exports = Bildirim;