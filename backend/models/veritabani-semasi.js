// KAPTAZEAPPV5 - MongoDB Veritabanı Şeması
// TSX dosyasından çıkarılan veriler temel alınarak oluşturuldu

const mongoose = require('mongoose');

// Kullanıcı Şeması
const kullaniciSemasi = new mongoose.Schema({
  ad: { 
    type: String, 
    required: [true, 'Ad zorunludur'], 
    trim: true 
  },
  soyad: { 
    type: String, 
    required: [true, 'Soyad zorunludur'], 
    trim: true 
  },
  eposta: { 
    type: String, 
    required: [true, 'E-posta zorunludur'], 
    unique: true, 
    lowercase: true 
  },
  telefon: { 
    type: String, 
    trim: true 
  },
  sifre: { 
    type: String, 
    required: [true, 'Şifre zorunludur'], 
    minlength: [6, 'Şifre en az 6 karakter olmalıdır'] 
  },
  misafirMi: { 
    type: Boolean, 
    default: false 
  },
  sosyalMedyaSaglayici: { 
    type: String, 
    enum: ['google', 'facebook', 'apple', null],
    default: null
  },
  konum: {
    sehir: { type: String, default: 'Antalya' },
    ilce: { type: String, default: 'Merkez' },
    adres: String,
    enlem: Number,
    boylam: Number
  },
  istatistikler: {
    kurtarilanPaket: { type: Number, default: 0 },
    tasarruf: { type: Number, default: 0 },
    co2Tasarrufu: { type: Number, default: 0 }
  },
  olusturmaTarihi: { 
    type: Date, 
    default: Date.now 
  },
  aktifMi: { 
    type: Boolean, 
    default: true 
  }
});

// Restoran Şeması
const restoranSemasi = new mongoose.Schema({
  ad: { 
    type: String, 
    required: [true, 'Restoran adı zorunludur'], 
    trim: true 
  },
  kategori: { 
    type: String, 
    required: [true, 'Kategori zorunludur'],
    enum: [
      'Geleneksel Türk', 'Et & Kebap', 'Deniz Ürünleri', 
      'Börek & Kahvaltı', 'Pide & Lahmacun', 'Kahve & Pasta',
      'Fırın & Ekmek', 'Vegan Yemekler', 'Japon Mutfağı',
      'İtalyan Mutfağı', 'Fast Food', 'Tatlı & Dondurma'
    ]
  },
  aciklama: { 
    type: String, 
    required: [true, 'Açıklama zorunludur'] 
  },
  adres: { 
    type: String, 
    required: [true, 'Adres zorunludur'] 
  },
  konum: {
    enlem: { type: Number, required: true },
    boylam: { type: Number, required: true },
    mesafe: String // "0.5km" formatında
  },
  iletisim: {
    telefon: String,
    eposta: String,
    website: String
  },
  calismaSaatleri: {
    baslangic: { type: String, required: true }, // "18:00"
    bitis: { type: String, required: true }, // "22:00"
    hergün: { type: Boolean, default: true }
  },
  puan: { 
    type: Number, 
    min: 1, 
    max: 5, 
    default: 4.0 
  },
  onerilenMi: { 
    type: Boolean, 
    default: false 
  },
  aktifMi: { 
    type: Boolean, 
    default: true 
  },
  resimUrl: String,
  olusturmaTarihi: { 
    type: Date, 
    default: Date.now 
  }
});

// Paket Şeması
const paketSemasi = new mongoose.Schema({
  restoranId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restoran', 
    required: true 
  },
  ad: { 
    type: String, 
    default: 'Sürpriz Paketi' 
  },
  aciklama: { 
    type: String, 
    required: [true, 'Paket açıklaması zorunludur'] 
  },
  orijinalFiyat: { 
    type: Number, 
    required: [true, 'Orijinal fiyat zorunludur'] 
  },
  satisFiyati: { 
    type: Number, 
    required: [true, 'Satış fiyatı zorunludur'] 
  },
  stokAdedi: { 
    type: Number, 
    required: [true, 'Stok adedi zorunludur'],
    min: 0
  },
  durum: { 
    type: String, 
    enum: ['pickup_now', 'last_package', 'sold_out'], 
    default: 'pickup_now' 
  },
  hazirlanmaTarihi: { 
    type: Date, 
    required: true 
  },
  sonKullanmaTarihi: { 
    type: Date, 
    required: true 
  },
  aktifMi: { 
    type: Boolean, 
    default: true 
  },
  olusturmaTarihi: { 
    type: Date, 
    default: Date.now 
  }
});

// Sipariş Şeması
const siparisSemasi = new mongoose.Schema({
  kullaniciId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Kullanici', 
    required: true 
  },
  restoranId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restoran', 
    required: true 
  },
  paketId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Paket', 
    required: true 
  },
  adet: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  toplamFiyat: { 
    type: Number, 
    required: true 
  },
  durum: { 
    type: String, 
    enum: ['preparing', 'ready', 'completed', 'cancelled'], 
    default: 'preparing' 
  },
  teslimSaati: { 
    type: String, 
    required: true 
  },
  teslimAdresi: { 
    type: String, 
    required: true 
  },
  odemeDurumu: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  odemeYontemi: { 
    type: String, 
    enum: ['kredi_karti', 'nakit', 'havale'], 
    default: 'kredi_karti' 
  },
  notlar: String,
  iptalNedeni: String,
  olusturmaTarihi: { 
    type: Date, 
    default: Date.now 
  },
  guncellenmeTarihi: { 
    type: Date, 
    default: Date.now 
  }
});

// Admin Şeması
const adminSemasi = new mongoose.Schema({
  kullaniciAdi: { 
    type: String, 
    required: true, 
    unique: true 
  },
  eposta: { 
    type: String, 
    required: true, 
    unique: true 
  },
  sifre: { 
    type: String, 
    required: true 
  },
  rol: { 
    type: String, 
    enum: ['super_admin', 'admin', 'moderator'], 
    default: 'admin' 
  },
  yetkiler: [{
    type: String,
    enum: [
      'kullanici_yonetimi', 'restoran_yonetimi', 'siparis_yonetimi',
      'paket_yonetimi', 'raporlar', 'sistem_ayarlari'
    ]
  }],
  aktifMi: { 
    type: Boolean, 
    default: true 
  },
  sonGirisTarihi: Date,
  olusturmaTarihi: { 
    type: Date, 
    default: Date.now 
  }
});

// Favoriler Şeması
const favoriSemasi = new mongoose.Schema({
  kullaniciId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Kullanici', 
    required: true 
  },
  restoranId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restoran', 
    required: true 
  },
  olusturmaTarihi: { 
    type: Date, 
    default: Date.now 
  }
});

// Bildirim Şeması
const bildirimSemasi = new mongoose.Schema({
  kullaniciId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Kullanici', 
    required: true 
  },
  baslik: { 
    type: String, 
    required: true 
  },
  mesaj: { 
    type: String, 
    required: true 
  },
  tip: { 
    type: String, 
    enum: ['siparis', 'promosyon', 'sistem', 'genel'], 
    default: 'genel' 
  },
  okunduMu: { 
    type: Boolean, 
    default: false 
  },
  gonderimTarihi: { 
    type: Date, 
    default: Date.now 
  }
});

// Model'leri dışa aktarma
const Kullanici = mongoose.model('Kullanici', kullaniciSemasi);
const Restoran = mongoose.model('Restoran', restoranSemasi);
const Paket = mongoose.model('Paket', paketSemasi);
const Siparis = mongoose.model('Siparis', siparisSemasi);
const Admin = mongoose.model('Admin', adminSemasi);
const Favori = mongoose.model('Favori', favoriSemasi);
const Bildirim = mongoose.model('Bildirim', bildirimSemasi);

module.exports = {
  Kullanici,
  Restoran,
  Paket,
  Siparis,
  Admin,
  Favori,
  Bildirim
};