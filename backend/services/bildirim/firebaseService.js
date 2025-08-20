// KapTaze Firebase Push Notification Service - Türkçe Bildirim Sistemi
const admin = require('firebase-admin');
const Bildirim = require('../../models/Bildirim');

class FirebaseService {
  constructor() {
    this.initialized = false;
    this.init();
  }

  // Firebase Admin SDK'yı başlat
  init() {
    try {
      if (!this.initialized) {
        const serviceAccount = {
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID || "kaptaze-app",
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
        };

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
        });

        this.initialized = true;
        console.log('Firebase Admin SDK başlatıldı');
      }
    } catch (error) {
      console.error('Firebase Admin SDK başlatma hatası:', error);
    }
  }

  // Tek cihaza bildirim gönder
  async sendToDevice(token, notification, data = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK başlatılmamış');
      }

      const message = {
        token: token,
        notification: {
          title: notification.baslik,
          body: notification.mesaj,
          sound: 'default'
        },
        data: {
          ...data,
          type: notification.tip || 'genel',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#16a34a',
            sound: 'default',
            channelId: 'kaptaze_channel',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          },
          data: {
            ...data,
            title: notification.baslik,
            body: notification.mesaj
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.baslik,
                body: notification.mesaj
              },
              sound: 'default',
              badge: 1,
              'content-available': 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      
      console.log('Bildirim başarıyla gönderildi:', response);
      return {
        success: true,
        messageId: response,
        data: response
      };

    } catch (error) {
      console.error('Bildirim gönderme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Birden fazla cihaza bildirim gönder
  async sendToMultipleDevices(tokens, notification, data = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK başlatılmamış');
      }

      if (!tokens || tokens.length === 0) {
        return {
          success: false,
          error: 'Token listesi boş'
        };
      }

      // Token'ları 500'lü gruplara ayır (Firebase limiti)
      const tokenChunks = this.chunkArray(tokens, 500);
      const results = [];

      for (const tokenChunk of tokenChunks) {
        const message = {
          tokens: tokenChunk,
          notification: {
            title: notification.baslik,
            body: notification.mesaj,
            sound: 'default'
          },
          data: {
            ...data,
            type: notification.tip || 'genel',
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          android: {
            notification: {
              icon: 'ic_notification',
              color: '#16a34a',
              sound: 'default',
              channelId: 'kaptaze_channel',
              priority: 'high'
            }
          },
          apns: {
            payload: {
              aps: {
                alert: {
                  title: notification.baslik,
                  body: notification.mesaj
                },
                sound: 'default',
                badge: 1
              }
            }
          }
        };

        const response = await admin.messaging().sendMulticast(message);
        results.push(response);
      }

      // Sonuçları birleştir
      const totalSuccess = results.reduce((sum, result) => sum + result.successCount, 0);
      const totalFailure = results.reduce((sum, result) => sum + result.failureCount, 0);

      return {
        success: true,
        successCount: totalSuccess,
        failureCount: totalFailure,
        results: results
      };

    } catch (error) {
      console.error('Toplu bildirim gönderme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Topic'e bildirim gönder
  async sendToTopic(topic, notification, data = {}) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK başlatılmamış');
      }

      const message = {
        topic: topic,
        notification: {
          title: notification.baslik,
          body: notification.mesaj,
          sound: 'default'
        },
        data: {
          ...data,
          type: notification.tip || 'genel'
        },
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#16a34a',
            sound: 'default',
            channelId: 'kaptaze_channel'
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.baslik,
                body: notification.mesaj
              },
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      
      return {
        success: true,
        messageId: response
      };

    } catch (error) {
      console.error('Topic bildirim gönderme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Kullanıcıyı topic'e abone et
  async subscribeToTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK başlatılmamış');
      }

      const response = await admin.messaging().subscribeToTopic(tokens, topic);
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors
      };

    } catch (error) {
      console.error('Topic abonelik hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Kullanıcının topic aboneliğini iptal et
  async unsubscribeFromTopic(tokens, topic) {
    try {
      if (!this.initialized) {
        throw new Error('Firebase Admin SDK başlatılmamış');
      }

      const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors
      };

    } catch (error) {
      console.error('Topic abonelik iptal hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Array'ı parçalara ayır
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Bildirim şablonları - Türkçe
  getNotificationTemplates() {
    return {
      // Sipariş bildirimleri
      siparis_onaylandi: {
        baslik: '✅ Sipariş Onaylandı',
        mesaj: 'Siparişiniz onaylandı ve hazırlanıyor. Yakında hazır olacak!',
        tip: 'siparis'
      },
      
      siparis_hazirlaniyor: {
        baslik: '👨‍🍳 Siparişiniz Hazırlanıyor',
        mesaj: 'Siparişiniz restoran tarafından hazırlanıyor.',
        tip: 'siparis'
      },

      siparis_hazir: {
        baslik: '🎉 Siparişiniz Hazır!',
        mesaj: 'Siparişiniz hazır! Restorandan teslim alabilirsiniz.',
        tip: 'siparis'
      },

      siparis_teslim_edildi: {
        baslik: '📦 Sipariş Teslim Edildi',
        mesaj: 'Siparişiniz başarıyla teslim edildi. Afiyet olsun!',
        tip: 'siparis'
      },

      siparis_iptal: {
        baslik: '❌ Sipariş İptal Edildi',
        mesaj: 'Siparişiniz iptal edildi. Ödemeniz iade edilecek.',
        tip: 'siparis'
      },

      // Ödeme bildirimleri
      odeme_basarili: {
        baslik: '💳 Ödeme Başarılı',
        mesaj: 'Ödemeniz başarıyla alındı. Siparişiniz hazırlanacak.',
        tip: 'odeme'
      },

      odeme_basarisiz: {
        baslik: '❌ Ödeme Başarısız',
        mesaj: 'Ödemeniz alınamadı. Lütfen tekrar deneyin.',
        tip: 'odeme'
      },

      iade_basarili: {
        baslik: '💰 İade İşlemi Tamamlandı',
        mesaj: 'İade işleminiz tamamlandı. Tutar hesabınıza yansıyacak.',
        tip: 'odeme'
      },

      // Kampanya bildirimleri
      yeni_kampanya: {
        baslik: '🎁 Yeni Kampanya!',
        mesaj: 'Size özel kampanyalar var! Hemen inceleyin.',
        tip: 'kampanya'
      },

      indirim_firsati: {
        baslik: '🔥 Büyük İndirim Fırsatı!',
        mesaj: 'Sevdiğiniz restoranda %50 indirim! Kaçırmayın!',
        tip: 'kampanya'
      },

      // Restoran bildirimleri
      yeni_paket: {
        baslik: '🍽️ Yeni Paket Eklendi!',
        mesaj: 'Favori restoranınızda yeni paketler var!',
        tip: 'restoran'
      },

      stok_azaldi: {
        baslik: '⏰ Son Dakika!',
        mesaj: 'Sepetinizdeki ürün az kaldı! Hemen sipariş ver!',
        tip: 'stok'
      },

      // Sistem bildirimleri
      hosgeldiniz: {
        baslik: '🌱 KapTaze\'ye Hoş Geldiniz!',
        mesaj: 'Gıda israfına karşı mücadelede bize katıldığınız için teşekkürler!',
        tip: 'sistem'
      },

      profil_tamamla: {
        baslik: '👤 Profil Bilgilerinizi Tamamlayın',
        mesaj: 'Daha iyi hizmet için profil bilgilerinizi güncelleyin.',
        tip: 'sistem'
      },

      // Değerlendirme bildirimleri
      degerlendirme_hatirlatma: {
        baslik: '⭐ Deneyiminizi Paylaşın',
        mesaj: 'Son siparişinizi değerlendirmeyi unutmayın!',
        tip: 'degerlendirme'
      }
    };
  }

  // Bildirim gönder ve veritabanına kaydet
  async sendAndSaveNotification(kullaniciId, templateKey, customData = {}, tokens = []) {
    try {
      const templates = this.getNotificationTemplates();
      const template = templates[templateKey];

      if (!template) {
        throw new Error(`Geçersiz bildirim şablonu: ${templateKey}`);
      }

      // Özel verilerle şablonu güncelle
      const notification = {
        baslik: customData.baslik || template.baslik,
        mesaj: customData.mesaj || template.mesaj,
        tip: customData.tip || template.tip
      };

      // Veritabanına kaydet
      const bildirimKaydi = new Bildirim({
        kullaniciId,
        baslik: notification.baslik,
        mesaj: notification.mesaj,
        tip: notification.tip,
        veri: customData,
        durum: 'gonderilecek'
      });

      await bildirimKaydi.save();

      // Push notification gönder
      let sendResult = { success: true };
      
      if (tokens && tokens.length > 0) {
        if (tokens.length === 1) {
          sendResult = await this.sendToDevice(tokens[0], notification, customData);
        } else {
          sendResult = await this.sendToMultipleDevices(tokens, notification, customData);
        }
      }

      // Durum güncelle
      bildirimKaydi.durum = sendResult.success ? 'gonderildi' : 'basarisiz';
      bildirimKaydi.gonderilme_tarihi = new Date();
      bildirimKaydi.hata_mesaji = sendResult.success ? null : sendResult.error;
      await bildirimKaydi.save();

      return {
        success: true,
        bildirimId: bildirimKaydi._id,
        pushResult: sendResult
      };

    } catch (error) {
      console.error('Bildirim gönderme ve kaydetme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Toplu bildirim gönder (tüm kullanıcılara)
  async sendBroadcastNotification(templateKey, customData = {}) {
    try {
      const Kullanici = require('../../models/Kullanici');
      
      // Aktif kullanıcıları al
      const kullanicilar = await Kullanici.find({
        aktif: true,
        push_token: { $exists: true, $ne: null }
      }).select('_id push_token');

      if (kullanicilar.length === 0) {
        return {
          success: false,
          message: 'Bildirim gönderilecek kullanıcı bulunamadı'
        };
      }

      const tokens = kullanicilar.map(k => k.push_token).filter(t => t);
      const kullaniciIds = kullanicilar.map(k => k._id);

      const templates = this.getNotificationTemplates();
      const template = templates[templateKey];

      if (!template) {
        throw new Error(`Geçersiz bildirim şablonu: ${templateKey}`);
      }

      const notification = {
        baslik: customData.baslik || template.baslik,
        mesaj: customData.mesaj || template.mesaj,
        tip: customData.tip || template.tip
      };

      // Toplu push notification gönder
      const sendResult = await this.sendToMultipleDevices(tokens, notification, customData);

      // Veritabanına kaydetmek için toplu insert
      const bildirimKayitlari = kullaniciIds.map(kullaniciId => ({
        kullaniciId,
        baslik: notification.baslik,
        mesaj: notification.mesaj,
        tip: notification.tip,
        veri: customData,
        durum: 'gonderildi',
        gonderilme_tarihi: new Date(),
        toplu_bildirim: true
      }));

      await Bildirim.insertMany(bildirimKayitlari);

      return {
        success: true,
        totalUsers: kullanicilar.length,
        successCount: sendResult.successCount,
        failureCount: sendResult.failureCount
      };

    } catch (error) {
      console.error('Toplu bildirim gönderme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Zamanlı bildirim gönder
  async scheduleNotification(kullaniciId, templateKey, scheduledTime, customData = {}) {
    try {
      const templates = this.getNotificationTemplates();
      const template = templates[templateKey];

      if (!template) {
        throw new Error(`Geçersiz bildirim şablonu: ${templateKey}`);
      }

      const notification = {
        baslik: customData.baslik || template.baslik,
        mesaj: customData.mesaj || template.mesaj,
        tip: customData.tip || template.tip
      };

      // Veritabanına zamanlı bildirim kaydı
      const bildirimKaydi = new Bildirim({
        kullaniciId,
        baslik: notification.baslik,
        mesaj: notification.mesaj,
        tip: notification.tip,
        veri: customData,
        durum: 'zamanli',
        zamanlanmis_tarih: scheduledTime
      });

      await bildirimKaydi.save();

      return {
        success: true,
        bildirimId: bildirimKaydi._id,
        scheduledTime: scheduledTime
      };

    } catch (error) {
      console.error('Zamanlı bildirim kaydetme hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new FirebaseService();