// KapTaze Bildirim Job - Scheduled Notification Tasks
const cron = require('node-cron');
const Bildirim = require('../models/Bildirim');
const Kullanici = require('../models/Kullanici');
const Siparis = require('../models/Siparis');
const firebaseService = require('../services/bildirim/firebaseService');

class BildirimJob {
  constructor() {
    this.isRunning = false;
    this.init();
  }

  init() {
    console.log('Bildirim job sistemi başlatılıyor...');
    
    // Her dakika çalış - bekleyen bildirimleri gönder
    cron.schedule('* * * * *', () => {
      this.processPendingNotifications();
    });

    // Her 5 dakikada bir - zamanlı bildirimleri kontrol et
    cron.schedule('*/5 * * * *', () => {
      this.processScheduledNotifications();
    });

    // Her 15 dakikada bir - başarısız bildirimleri yeniden dene
    cron.schedule('*/15 * * * *', () => {
      this.retryFailedNotifications();
    });

    // Her saat başı - sipariş hatırlatmaları
    cron.schedule('0 * * * *', () => {
      this.sendOrderReminders();
    });

    // Her gün gece yarısı - eski bildirimleri temizle
    cron.schedule('0 0 * * *', () => {
      this.cleanOldNotifications();
    });

    // Her gün sabah 9:00 - günlük özet bildirimi
    cron.schedule('0 9 * * *', () => {
      this.sendDailyDigest();
    });

    // Her cumartesi 10:00 - haftalık kampanya bildirimi
    cron.schedule('0 10 * * 6', () => {
      this.sendWeeklyPromotions();
    });

    console.log('Bildirim job sistemi başlatıldı');
  }

  // Bekleyen bildirimleri gönder
  async processPendingNotifications() {
    if (this.isRunning) return;
    
    try {
      this.isRunning = true;

      const bekleyenBildirimler = await Bildirim.gonderilecekBildirimler();
      
      if (bekleyenBildirimler.length === 0) {
        return;
      }

      console.log(`${bekleyenBildirimler.length} bekleyen bildirim işleniyor...`);

      for (const bildirim of bekleyenBildirimler) {
        if (!bildirim.kullaniciId || !bildirim.kullaniciId.push_token || !bildirim.kullaniciId.aktif) {
          // Kullanıcı bulunamadı veya token yok
          await bildirim.basarisizOlarakIsaretle('Kullanıcı token\'ı bulunamadı');
          continue;
        }

        const kullanici = bildirim.kullaniciId;
        
        // Gece modu kontrolü
        if (this.isNightMode(kullanici)) {
          // Acil olmayan bildirimleri sabaha ertele
          if (bildirim.oncelik !== 'acil') {
            const sabah8 = new Date();
            sabah8.setHours(8, 0, 0, 0);
            if (sabah8.getTime() < Date.now()) {
              sabah8.setDate(sabah8.getDate() + 1);
            }
            
            bildirim.zamanlanmis_tarih = sabah8;
            bildirim.durum = 'zamanli';
            await bildirim.save();
            continue;
          }
        }

        // Kullanıcının bildirim ayarlarını kontrol et
        if (!this.shouldSendNotification(kullanici, bildirim)) {
          await bildirim.basarisizOlarakIsaretle('Kullanıcı ayarları bildirimi engelliyor');
          continue;
        }

        // Bildirimi gönder
        const notification = {
          baslik: bildirim.baslik,
          mesaj: bildirim.mesaj,
          tip: bildirim.tip
        };

        const sendResult = await firebaseService.sendToDevice(
          kullanici.push_token,
          notification,
          {
            bildirimId: bildirim._id.toString(),
            tip: bildirim.tip,
            ...bildirim.veri
          }
        );

        // Sonucu kaydet
        if (sendResult.success) {
          await bildirim.basariliOlarakIsaretle(sendResult.messageId);
          console.log(`Bildirim gönderildi: ${bildirim._id} - ${kullanici.push_token.substring(0, 20)}...`);
        } else {
          await bildirim.basarisizOlarakIsaretle(sendResult.error);
          console.error(`Bildirim gönderilemedi: ${bildirim._id} - ${sendResult.error}`);
        }

        // Rate limiting için kısa bekleme
        await this.sleep(100);
      }

    } catch (error) {
      console.error('Bekleyen bildirimler işleme hatası:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Zamanlı bildirimleri işle
  async processScheduledNotifications() {
    try {
      const zamaniBeliriler = await Bildirim.zamanliBildirimler();

      for (const bildirim of zamaniBeliriler) {
        bildirim.durum = 'gonderilecek';
        await bildirim.save();
      }

      if (zamaniBeliriler.length > 0) {
        console.log(`${zamaniBeliriler.length} zamanlı bildirim aktif hale getirildi`);
      }

    } catch (error) {
      console.error('Zamanlı bildirimler işleme hatası:', error);
    }
  }

  // Başarısız bildirimleri yeniden dene
  async retryFailedNotifications() {
    try {
      const basarisizBildirimler = await Bildirim.find({
        durum: 'basarisiz',
        deneme_sayisi: { $lt: 3 },
        olusturulma_tarihi: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Son 24 saat
      });

      for (const bildirim of basarisizBildirimler) {
        bildirim.durum = 'gonderilecek';
        await bildirim.save();
      }

      if (basarisizBildirimler.length > 0) {
        console.log(`${basarisizBildirimler.length} başarısız bildirim yeniden deneme için hazırlandı`);
      }

    } catch (error) {
      console.error('Başarısız bildirimler yeniden deneme hatası:', error);
    }
  }

  // Sipariş hatırlatmaları
  async sendOrderReminders() {
    try {
      const now = new Date();
      const bir_saat_once = new Date(now.getTime() - 60 * 60 * 1000);

      // Teslim saati yaklaşan siparişler
      const yaklaşanSiparisler = await Siparis.find({
        durum: 'hazir',
        teslim_saati: {
          $gte: now,
          $lte: new Date(now.getTime() + 30 * 60 * 1000) // 30 dakika içinde
        }
      }).populate('kullaniciId', 'push_token');

      for (const siparis of yaklaşanSiparisler) {
        if (siparis.kullaniciId && siparis.kullaniciId.push_token) {
          const kalan_dakika = Math.round((siparis.teslim_saati - now) / (1000 * 60));
          
          await firebaseService.sendAndSaveNotification(
            siparis.kullaniciId._id,
            'siparis_hatirlatma',
            {
              baslik: '⏰ Teslim Saati Yaklaşıyor',
              mesaj: `Siparişiniz ${kalan_dakika} dakika içinde teslim alınmalı!`,
              siparisId: siparis._id,
              kalanDakika: kalan_dakika
            },
            [siparis.kullaniciId.push_token]
          );
        }
      }

      // Uzun süre bekleyen siparişler
      const bekleyenSiparisler = await Siparis.find({
        durum: { $in: ['onaylandi', 'hazirlaniyor'] },
        olusturulma_tarihi: { $lte: bir_saat_once }
      }).populate('kullaniciId', 'push_token').populate('restoranId', 'ad');

      for (const siparis of bekleyenSiparisler) {
        if (siparis.kullaniciId && siparis.kullaniciId.push_token) {
          const bekleme_suresi = Math.round((now - siparis.olusturulma_tarihi) / (1000 * 60));
          
          await firebaseService.sendAndSaveNotification(
            siparis.kullaniciId._id,
            'siparis_gec',
            {
              baslik: '🕒 Sipariş Durumu',
              mesaj: `${siparis.restoranId.ad} restoranından siparişiniz ${bekleme_suresi} dakikadır hazırlanıyor.`,
              siparisId: siparis._id,
              bekleme_suresi
            },
            [siparis.kullaniciId.push_token]
          );
        }
      }

    } catch (error) {
      console.error('Sipariş hatırlatmaları gönderme hatası:', error);
    }
  }

  // Eski bildirimleri temizle
  async cleanOldNotifications() {
    try {
      const result = await Bildirim.eskiBildirimleriSil(30); // 30 günden eski
      console.log(`${result.deletedCount} eski bildirim temizlendi`);

      // Başarısız ve eski bildirimleri de temizle
      const failedResult = await Bildirim.deleteMany({
        durum: 'basarisiz',
        olusturulma_tarihi: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 günden eski
      });
      
      console.log(`${failedResult.deletedCount} başarısız eski bildirim temizlendi`);

    } catch (error) {
      console.error('Eski bildirimler temizleme hatası:', error);
    }
  }

  // Günlük özet bildirimi
  async sendDailyDigest() {
    try {
      // Sadece pazartesi, çarşamba, cuma günleri gönder
      const today = new Date().getDay();
      if (![1, 3, 5].includes(today)) return;

      const aktifKullanicilar = await Kullanici.find({
        aktif: true,
        push_token: { $exists: true, $ne: null },
        'bildirim_ayarlari.gunluk_ozet': { $ne: false }
      }).select('_id push_token ad');

      if (aktifKullanicilar.length === 0) return;

      // Her kullanıcı için kişiselleştirilmiş özet
      for (const kullanici of aktifKullanicilar) {
        const okunmamisSayisi = await Bildirim.countDocuments({
          kullaniciId: kullanici._id,
          okundu: false
        });

        if (okunmamisSayisi > 5) {
          await firebaseService.sendAndSaveNotification(
            kullanici._id,
            'gunluk_ozet',
            {
              baslik: '📊 Günlük Özet',
              mesaj: `${okunmamisSayisi} okunmamış bildiriminiz var. Ayrıca size özel fırsatlar sizi bekliyor!`,
              okunmamisSayisi
            },
            [kullanici.push_token]
          );
        }
      }

    } catch (error) {
      console.error('Günlük özet bildirimi hatası:', error);
    }
  }

  // Haftalık kampanya bildirimi
  async sendWeeklyPromotions() {
    try {
      await firebaseService.sendBroadcastNotification(
        'haftalik_kampanya',
        {
          baslik: '🎉 Haftalık Kampanyalar',
          mesaj: 'Bu hafta size özel indirimler! Favori restoranlarınızda %70\'e varan fırsatlar!'
        }
      );

      console.log('Haftalık kampanya bildirimi gönderildi');

    } catch (error) {
      console.error('Haftalık kampanya bildirimi hatası:', error);
    }
  }

  // Yardımcı metodlar

  // Gece modu kontrolü
  isNightMode(kullanici) {
    const geceModu = kullanici.bildirim_ayarlari?.gece_modu;
    if (!geceModu || !geceModu.aktif) return false;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = geceModu.baslangic.split(':').map(Number);
    const [endHour, endMinute] = geceModu.bitis.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Gece yarısını geçen durumlar (ör: 22:00 - 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Bildirimin gönderilip gönderilmeyeceğini kontrol et
  shouldSendNotification(kullanici, bildirim) {
    const ayarlar = kullanici.bildirim_ayarlari || {};
    
    // Temel tip kontrolü
    if (ayarlar[bildirim.tip] === false) {
      return false;
    }

    // Acil bildirimler her zaman gönderilir
    if (bildirim.oncelik === 'acil') {
      return true;
    }

    // Kullanıcının genel bildirim ayarı kapalıysa
    if (ayarlar.genel === false) {
      return false;
    }

    return true;
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // İstatistik raporu oluştur
  async generateStatsReport() {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const stats = await Bildirim.aggregate([
        {
          $match: {
            olusturulma_tarihi: { $gte: yesterday, $lt: today }
          }
        },
        {
          $group: {
            _id: '$durum',
            count: { $sum: 1 }
          }
        }
      ]);

      console.log('Son 24 saat bildirim istatistikleri:', stats);
      return stats;

    } catch (error) {
      console.error('İstatistik raporu oluşturma hatası:', error);
      return [];
    }
  }
}

// Singleton instance oluştur
const bildirimJob = new BildirimJob();

module.exports = bildirimJob;