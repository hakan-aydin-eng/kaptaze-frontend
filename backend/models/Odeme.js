// KapTaze Ödeme Modeli - Payment Schema
const mongoose = require('mongoose');

const odemeSchema = new mongoose.Schema({
  // Temel bilgiler
  siparisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Siparis',
    required: [true, 'Sipariş ID gerekli'],
    index: true
  },
  
  kullaniciId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kullanici',
    required: [true, 'Kullanıcı ID gerekli'],
    index: true
  },

  // Ödeme detayları
  tutar: {
    type: Number,
    required: [true, 'Ödeme tutarı gerekli'],
    min: [0, 'Tutar negatif olamaz']
  },

  para_birimi: {
    type: String,
    default: 'TRY',
    enum: ['TRY', 'USD', 'EUR']
  },

  odemeYontemi: {
    type: String,
    required: [true, 'Ödeme yöntemi gerekli'],
    enum: {
      values: ['iyzico', 'paytr', 'havale', 'kapida', 'wallet'],
      message: 'Geçersiz ödeme yöntemi: {VALUE}'
    },
    index: true
  },

  taksitSayisi: {
    type: Number,
    default: 1,
    min: [1, 'Taksit sayısı en az 1 olmalı'],
    max: [12, 'Taksit sayısı en fazla 12 olmalı']
  },

  // Durum bilgileri
  durum: {
    type: String,
    required: true,
    enum: {
      values: [
        'baslatildi',      // Ödeme başlatıldı
        'beklemede',       // Kullanıcı girdilerini bekliyor
        'islem_alindi',    // 3D Secure işlemi alındı
        'basarili',        // Ödeme başarılı
        'basarisiz',       // Ödeme başarısız
        'iptal_edildi',    // Kullanıcı iptal etti
        'iade_edildi',     // Tam iade
        'kismi_iade',      // Kısmi iade
        'kapida_odenecek', // Kapıda ödenecek
        'zaman_asimi'      // Zaman aşımı
      ],
      message: 'Geçersiz ödeme durumu: {VALUE}'
    },
    default: 'baslatildi',
    index: true
  },

  odeme_durumu: {
    type: String,
    enum: ['odenmedi', 'odendi', 'iade_edildi', 'kismi_iade'],
    default: 'odenmedi'
  },

  // Gateway bilgileri
  gateway_token: {
    type: String,
    sparse: true,
    index: true
  },

  gateway_payment_id: {
    type: String,
    sparse: true
  },

  gateway_response: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // İade bilgileri
  iade_tutari: {
    type: Number,
    default: 0,
    min: [0, 'İade tutarı negatif olamaz']
  },

  iade_sebep: {
    type: String,
    trim: true
  },

  iade_tarihi: {
    type: Date
  },

  // Kart bilgileri (güvenli)
  kart_bilgileri: {
    bin_number: String,        // İlk 6 hanesi
    last_four_digits: String,  // Son 4 hanesi
    card_type: String,         // Visa, MasterCard, etc.
    card_association: String,  // VISA, MASTER_CARD, etc.
    card_family: String,       // Bonus, Axess, Maximum, etc.
    bank_name: String          // Banka adı
  },

  // Güvenlik bilgileri
  ip: {
    type: String,
    required: true
  },

  userAgent: {
    type: String
  },

  // Fraud kontrol
  fraud_status: {
    type: String,
    enum: ['accept', 'review', 'deny'],
    default: 'accept'
  },

  risk_skoru: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },

  // Komisyon bilgileri
  komisyon_orani: {
    type: Number,
    default: 0
  },

  komisyon_tutari: {
    type: Number,
    default: 0
  },

  merchant_komisyon: {
    type: Number,
    default: 0
  },

  // Bildirim bilgileri
  bildirim_url: String,
  
  callback_alindi: {
    type: Boolean,
    default: false
  },

  webhook_veri: {
    type: mongoose.Schema.Types.Mixed
  },

  // Hata bilgileri
  hata_kodu: String,
  
  hata_mesaji: String,

  gateway_hata_detay: {
    type: mongoose.Schema.Types.Mixed
  },

  // Zaman bilgileri
  baslatilma_tarihi: {
    type: Date,
    default: Date.now
  },

  tamamlanma_tarihi: {
    type: Date
  },

  timeout_tarihi: {
    type: Date
  },

  // Audit bilgileri
  olusturulma_tarihi: {
    type: Date,
    default: Date.now
  },

  guncellenme_tarihi: {
    type: Date,
    default: Date.now
  },

  guncellenen_kullanici: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Kullanici'
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
odemeSchema.index({ siparisId: 1, durum: 1 });
odemeSchema.index({ kullaniciId: 1, olusturulma_tarihi: -1 });
odemeSchema.index({ odemeYontemi: 1, durum: 1 });
odemeSchema.index({ gateway_token: 1 }, { sparse: true });
odemeSchema.index({ olusturulma_tarihi: -1 });

// Virtual fields
odemeSchema.virtual('kalan_tutar').get(function() {
  return this.tutar - (this.iade_tutari || 0);
});

odemeSchema.virtual('iade_edilebilir_mi').get(function() {
  return this.durum === 'basarili' && this.kalan_tutar > 0;
});

odemeSchema.virtual('basarili_mi').get(function() {
  return this.durum === 'basarili';
});

odemeSchema.virtual('beklemede_mi').get(function() {
  return ['baslatildi', 'beklemede', 'islem_alindi'].includes(this.durum);
});

// Metodlar
odemeSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  
  // Hassas bilgileri kaldır
  delete obj.gateway_response;
  delete obj.webhook_veri;
  delete obj.gateway_hata_detay;
  
  return obj;
};

odemeSchema.methods.markAsSuccessful = function(gatewayResponse = {}) {
  this.durum = 'basarili';
  this.odeme_durumu = 'odendi';
  this.tamamlanma_tarihi = new Date();
  this.gateway_response = gatewayResponse;
  
  // Kart bilgilerini güvenli şekilde sakla
  if (gatewayResponse.binNumber) {
    this.kart_bilgileri = {
      bin_number: gatewayResponse.binNumber,
      last_four_digits: gatewayResponse.lastFourDigits,
      card_type: gatewayResponse.cardType,
      card_association: gatewayResponse.cardAssociation,
      card_family: gatewayResponse.cardFamily,
      bank_name: gatewayResponse.bankName
    };
  }
  
  return this.save();
};

odemeSchema.methods.markAsFailed = function(errorMessage = '', gatewayResponse = {}) {
  this.durum = 'basarisiz';
  this.odeme_durumu = 'odenmedi';
  this.hata_mesaji = errorMessage;
  this.gateway_response = gatewayResponse;
  
  return this.save();
};

odemeSchema.methods.processRefund = function(refundAmount, reason = '') {
  this.iade_tutari = (this.iade_tutari || 0) + refundAmount;
  this.iade_sebep = reason;
  this.iade_tarihi = new Date();
  
  if (this.iade_tutari >= this.tutar) {
    this.durum = 'iade_edildi';
    this.odeme_durumu = 'iade_edildi';
  } else {
    this.durum = 'kismi_iade';
    this.odeme_durumu = 'kismi_iade';
  }
  
  return this.save();
};

// Static metodlar
odemeSchema.statics.findByOrderId = function(orderId) {
  return this.find({ siparisId: orderId }).sort({ olusturulma_tarihi: -1 });
};

odemeSchema.statics.findPendingPayments = function() {
  return this.find({
    durum: { $in: ['baslatildi', 'beklemede', 'islem_alindi'] },
    olusturulma_tarihi: { $gte: new Date(Date.now() - 30 * 60 * 1000) } // Son 30 dakika
  });
};

odemeSchema.statics.findSuccessfulPayments = function(startDate, endDate) {
  const query = { durum: 'basarili' };
  
  if (startDate && endDate) {
    query.tamamlanma_tarihi = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return this.find(query).sort({ tamamlanma_tarihi: -1 });
};

odemeSchema.statics.getPaymentStats = function(startDate, endDate) {
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
        _id: '$durum',
        count: { $sum: 1 },
        totalAmount: { $sum: '$tutar' },
        avgAmount: { $avg: '$tutar' }
      }
    }
  ]);
};

// Middleware
odemeSchema.pre('save', function(next) {
  this.guncellenme_tarihi = new Date();
  
  // Timeout tarihi hesapla (30 dakika)
  if (this.isNew && !this.timeout_tarihi) {
    this.timeout_tarihi = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  next();
});

// Ödeme durumu değiştiğinde log
odemeSchema.pre('save', function(next) {
  if (this.isModified('durum')) {
    console.log(`Ödeme durumu değişti: ${this._id} - ${this.durum}`);
  }
  next();
});

const Odeme = mongoose.model('Odeme', odemeSchema);

module.exports = Odeme;