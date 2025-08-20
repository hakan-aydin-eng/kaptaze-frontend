// KAPTAZEAPPV5 - Bildirim Servisi
// Türkçe Push Notifications - Firebase FCM

const admin = require('firebase-admin');
const { Bildirim, Kullanici } = require('../models/veritabani-semasi');

// Firebase Admin SDK initialization
if (!admin.apps.length) {
    const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
}

class NotificationService {
    constructor() {
        this.messaging = admin.messaging();
        
        // Türkçe bildirim şablonları
        this.templates = {
            siparis: {
                yeni: {
                    title: '🎉 Yeni Siparişiniz Alındı!',
                    body: '{restoran} restoranından {paket} paketiniz hazırlanıyor.',
                    icon: 'order_new',
                    sound: 'default',
                    priority: 'high'
                },
                hazirlaniyor: {
                    title: '👨‍🍳 Siparişiniz Hazırlanıyor',
                    body: '{restoran} restoranında paketiniz hazırlanıyor. Yakında hazır olacak!',
                    icon: 'order_preparing',
                    sound: 'default',
                    priority: 'high'
                },
                hazir: {
                    title: '✅ Siparişiniz Hazır!',
                    body: '{restoran} restoranından paketiniz hazır. Teslim almayı unutmayın!',
                    icon: 'order_ready',
                    sound: 'success',
                    priority: 'high'
                },
                teslimAlindi: {
                    title: '🙏 Teşekkürler!',
                    body: 'Siparişinizi teslim aldınız. Çevreyi koruduğunuz için teşekkürler!',
                    icon: 'order_completed',
                    sound: 'success',
                    priority: 'normal'
                },
                iptal: {
                    title: '❌ Sipariş İptal Edildi',
                    body: '{restoran} restoranından siparişiniz iptal edildi. İade işlemi başlatıldı.',
                    icon: 'order_cancelled',
                    sound: 'default',
                    priority: 'high'
                }
            },
            promosyon: {
                yeni: {
                    title: '🔥 Yeni Fırsat!',
                    body: '{restoran} restoranında %{indirim} indirimli paketler var!',
                    icon: 'promotion',
                    sound: 'notification',
                    priority: 'normal'
                },
                sonDakika: {
                    title: '⏰ Son Dakika Fırsatı!',
                    body: '{restoran} restoranında sadece {adet} paket kaldı. Kaçırmayın!',
                    icon: 'urgent',
                    sound: 'urgent',
                    priority: 'high'
                },
                yeniRestoran: {
                    title: '🏪 Yeni Restoran!',
                    body: '{restoran} artık KAPTAZE\'de! İlk siparişinizde %20 indirim.',
                    icon: 'new_restaurant',
                    sound: 'notification',
                    priority: 'normal'
                }
            },
            sistem: {
                hosgeldin: {
                    title: '🎉 KAPTAZE\'ye Hoş Geldiniz!',
                    body: 'Gıda israfını önleme misyonumuza katıldığınız için teşekkürler!',
                    icon: 'welcome',
                    sound: 'welcome',
                    priority: 'normal'
                },
                hatirlatma: {
                    title: '🍽️ Yakındaki Lezzetler',
                    body: 'Yakınınızda {adet} restoranda indirimli paketler var!',
                    icon: 'reminder',
                    sound: 'notification',
                    priority: 'normal'
                },
                istatistik: {
                    title: '📊 Haftalık Özet',
                    body: 'Bu hafta {paket} paket kurtardınız ve {tasarruf}₺ tasarruf ettiniz!',
                    icon: 'stats',
                    sound: 'notification',
                    priority: 'normal'
                }
            },
            genel: {
                duyuru: {
                    title: '📢 Duyuru',
                    body: '{mesaj}',
                    icon: 'announcement',
                    sound: 'notification',
                    priority: 'normal'
                },
                guncelleme: {
                    title: '🔄 Uygulama Güncellendi',
                    body: 'Yeni özellikler ve iyileştirmeler mevcut. Uygulamayı güncelleyin!',
                    icon: 'update',
                    sound: 'notification',
                    priority: 'normal'
                }
            }
        };

        // Bildirim kategorileri
        this.categories = {
            SIPARIS: 'siparis',
            PROMOSYON: 'promosyon',
            SISTEM: 'sistem',
            GENEL: 'genel'
        };
    }

    // Tek kullanıcıya bildirim gönder
    async sendToUser(userId, templateType, templateName, data = {}, customOptions = {}) {
        try {
            // Kullanıcının FCM token'ını al
            const kullanici = await Kullanici.findById(userId);
            if (!kullanici || !kullanici.fcmToken) {
                console.warn(`Kullanıcı bulunamadı veya FCM token yok: ${userId}`);
                return {
                    basarili: false,
                    mesaj: 'Kullanıcı FCM token\'ı bulunamadı'
                };
            }

            // Şablonu al
            const template = this.getTemplate(templateType, templateName);
            if (!template) {
                return {
                    basarili: false,
                    mesaj: 'Bildirim şablonu bulunamadı'
                };
            }

            // Mesaj içeriğini hazırla
            const message = this.prepareMessage(kullanici.fcmToken, template, data, customOptions);

            // FCM'e gönder
            const response = await this.messaging.send(message);

            // Bildirimi veritabanına kaydet
            await this.saveNotificationToDatabase(userId, templateType, template, data);

            console.log('Bildirim başarıyla gönderildi:', response);

            return {
                basarili: true,
                mesaj: 'Bildirim gönderildi',
                messageId: response
            };

        } catch (error) {
            console.error('Bildirim gönderme hatası:', error);
            return {
                basarili: false,
                mesaj: 'Bildirim gönderilemedi',
                hata: error.message
            };
        }
    }

    // Çoklu kullanıcıya bildirim gönder
    async sendToMultipleUsers(userIds, templateType, templateName, data = {}, customOptions = {}) {
        try {
            const results = [];
            const batchSize = 500; // FCM batch limit

            for (let i = 0; i < userIds.length; i += batchSize) {
                const batch = userIds.slice(i, i + batchSize);
                const batchResults = await Promise.allSettled(
                    batch.map(userId => this.sendToUser(userId, templateType, templateName, data, customOptions))
                );
                
                results.push(...batchResults);
            }

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.basarili).length;
            const failed = results.length - successful;

            return {
                basarili: true,
                mesaj: `${successful} bildirim gönderildi, ${failed} başarısız`,
                basarili: successful,
                basarisiz: failed
            };

        } catch (error) {
            console.error('Çoklu bildirim gönderme hatası:', error);
            return {
                basarili: false,
                mesaj: 'Çoklu bildirim gönderilemedi',
                hata: error.message
            };
        }
    }

    // Konuma göre bildirim gönder
    async sendByLocation(location, radius, templateType, templateName, data = {}, customOptions = {}) {
        try {
            // Belirtilen konum ve yarıçaptaki kullanıcıları bul
            const kullanicilar = await Kullanici.find({
                'konum.enlem': {
                    $gte: location.latitude - radius,
                    $lte: location.latitude + radius
                },
                'konum.boylam': {
                    $gte: location.longitude - radius,
                    $lte: location.longitude + radius
                },
                fcmToken: { $exists: true, $ne: null }
            });

            const userIds = kullanicilar.map(k => k._id);
            
            return await this.sendToMultipleUsers(userIds, templateType, templateName, data, customOptions);

        } catch (error) {
            console.error('Konuma göre bildirim gönderme hatası:', error);
            return {
                basarili: false,
                mesaj: 'Konuma göre bildirim gönderilemedi'
            };
        }
    }

    // Tüm kullanıcılara bildirim gönder (dikkatli kullanın!)
    async sendToAllUsers(templateType, templateName, data = {}, customOptions = {}) {
        try {
            const kullanicilar = await Kullanici.find({
                fcmToken: { $exists: true, $ne: null },
                aktifMi: true
            }).select('_id');

            const userIds = kullanicilar.map(k => k._id);
            
            return await this.sendToMultipleUsers(userIds, templateType, templateName, data, customOptions);

        } catch (error) {
            console.error('Tüm kullanıcılara bildirim gönderme hatası:', error);
            return {
                basarili: false,
                mesaj: 'Tüm kullanıcılara bildirim gönderilemedi'
            };
        }
    }

    // Sipariş durumu bildirimleri
    async sendOrderNotification(orderId, status, userId) {
        try {
            const Siparis = require('../models/veritabani-semasi').Siparis;
            const siparis = await Siparis.findById(orderId).populate('restoranId paketId');
            
            if (!siparis) {
                return { basarili: false, mesaj: 'Sipariş bulunamadı' };
            }

            const data = {
                restoran: siparis.restoranId.ad,
                paket: siparis.paketId.ad,
                siparisId: orderId.toString()
            };

            let templateName;
            switch (status) {
                case 'preparing':
                    templateName = 'hazirlaniyor';
                    break;
                case 'ready':
                    templateName = 'hazir';
                    break;
                case 'completed':
                    templateName = 'teslimAlindi';
                    break;
                case 'cancelled':
                    templateName = 'iptal';
                    break;
                default:
                    templateName = 'yeni';
            }

            return await this.sendToUser(userId, 'siparis', templateName, data);

        } catch (error) {
            console.error('Sipariş bildirimi hatası:', error);
            return {
                basarili: false,
                mesaj: 'Sipariş bildirimi gönderilemedi'
            };
        }
    }

    // Promosyon bildirimleri
    async sendPromotionNotification(restaurantId, discountPercent, availablePackages, location, radius = 10) {
        try {
            const Restoran = require('../models/veritabani-semasi').Restoran;
            const restoran = await Restoran.findById(restaurantId);
            
            if (!restoran) {
                return { basarili: false, mesaj: 'Restoran bulunamadı' };
            }

            const data = {
                restoran: restoran.ad,
                indirim: discountPercent.toString(),
                adet: availablePackages.toString()
            };

            const templateName = availablePackages <= 3 ? 'sonDakika' : 'yeni';

            return await this.sendByLocation(location, radius, 'promosyon', templateName, data);

        } catch (error) {
            console.error('Promosyon bildirimi hatası:', error);
            return {
                basarili: false,
                mesaj: 'Promosyon bildirimi gönderilemedi'
            };
        }
    }

    // Haftalık istatistik bildirimi
    async sendWeeklyStats(userId) {
        try {
            const kullanici = await Kullanici.findById(userId);
            if (!kullanici) {
                return { basarili: false, mesaj: 'Kullanıcı bulunamadı' };
            }

            const data = {
                paket: kullanici.istatistikler.kurtarilanPaket.toString(),
                tasarruf: kullanici.istatistikler.tasarruf.toFixed(0)
            };

            return await this.sendToUser(userId, 'sistem', 'istatistik', data);

        } catch (error) {
            console.error('İstatistik bildirimi hatası:', error);
            return {
                basarili: false,
                mesaj: 'İstatistik bildirimi gönderilemedi'
            };
        }
    }

    // Şablon alma
    getTemplate(templateType, templateName) {
        return this.templates[templateType]?.[templateName] || null;
    }

    // Mesaj hazırlama
    prepareMessage(token, template, data, customOptions) {
        let title = template.title;
        let body = template.body;

        // Template değişkenlerini değiştir
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'g');
            title = title.replace(regex, data[key]);
            body = body.replace(regex, data[key]);
        });

        const message = {
            token: token,
            notification: {
                title: title,
                body: body
            },
            data: {
                type: template.icon,
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                ...data
            },
            android: {
                notification: {
                    icon: template.icon,
                    sound: template.sound,
                    priority: template.priority,
                    channelId: 'kaptaze-' + (template.icon.includes('order') ? 'orders' : 'promotions'),
                    color: '#10b981'
                },
                priority: template.priority === 'high' ? 'high' : 'normal'
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: title,
                            body: body
                        },
                        sound: template.sound + '.wav',
                        badge: 1
                    }
                }
            },
            ...customOptions
        };

        return message;
    }

    // Bildirimi veritabanına kaydet
    async saveNotificationToDatabase(userId, type, template, data) {
        try {
            let title = template.title;
            let body = template.body;

            // Template değişkenlerini değiştir
            Object.keys(data).forEach(key => {
                const regex = new RegExp(`{${key}}`, 'g');
                title = title.replace(regex, data[key]);
                body = body.replace(regex, data[key]);
            });

            const bildirim = new Bildirim({
                kullaniciId: userId,
                baslik: title,
                mesaj: body,
                tip: type,
                okunduMu: false,
                gonderimTarihi: new Date()
            });

            await bildirim.save();
            return bildirim;

        } catch (error) {
            console.error('Bildirim veritabanına kaydetme hatası:', error);
            return null;
        }
    }

    // Kullanıcının bildirimlerini getir
    async getUserNotifications(userId, limit = 50, page = 1) {
        try {
            const skip = (page - 1) * limit;
            
            const bildirimler = await Bildirim.find({ kullaniciId: userId })
                .sort({ gonderimTarihi: -1 })
                .limit(limit)
                .skip(skip);

            const toplam = await Bildirim.countDocuments({ kullaniciId: userId });
            const okunmayan = await Bildirim.countDocuments({ 
                kullaniciId: userId, 
                okunduMu: false 
            });

            return {
                basarili: true,
                bildirimler,
                sayfalama: {
                    mevcut: page,
                    toplam: Math.ceil(toplam / limit),
                    kayitSayisi: bildirimler.length,
                    toplamKayit: toplam
                },
                okunmayanSayisi: okunmayan
            };

        } catch (error) {
            console.error('Kullanıcı bildirimleri getirme hatası:', error);
            return {
                basarili: false,
                mesaj: 'Bildirimler getirilemedi'
            };
        }
    }

    // Bildirimi okundu olarak işaretle
    async markAsRead(notificationIds, userId) {
        try {
            await Bildirim.updateMany(
                { 
                    _id: { $in: notificationIds },
                    kullaniciId: userId
                },
                { 
                    okunduMu: true 
                }
            );

            return {
                basarili: true,
                mesaj: 'Bildirimler okundu olarak işaretlendi'
            };

        } catch (error) {
            console.error('Bildirim okundu işaretleme hatası:', error);
            return {
                basarili: false,
                mesaj: 'Bildirimler işaretlenemedi'
            };
        }
    }

    // FCM token güncelle
    async updateFCMToken(userId, fcmToken) {
        try {
            await Kullanici.findByIdAndUpdate(userId, { fcmToken });
            
            return {
                basarili: true,
                mesaj: 'FCM token güncellendi'
            };

        } catch (error) {
            console.error('FCM token güncelleme hatası:', error);
            return {
                basarili: false,
                mesaj: 'FCM token güncellenemedi'
            };
        }
    }
}

module.exports = new NotificationService();