// KAPTAZEAPPV5 - Ödeme Servisi
// İyzico ve PayTR entegrasyonu - Türk bankaları ile uyumlu

const Iyzipay = require('iyzipay');
const crypto = require('crypto');
const axios = require('axios');
const { Siparis, Kullanici } = require('../models/veritabani-semasi');

class PaymentService {
    constructor() {
        // İyzico konfigürasyonu
        this.iyzipay = new Iyzipay({
            apiKey: process.env.IYZICO_API_KEY,
            secretKey: process.env.IYZICO_SECRET_KEY,
            uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
        });

        // PayTR konfigürasyonu
        this.paytr = {
            merchantId: process.env.PAYTR_MERCHANT_ID,
            merchantKey: process.env.PAYTR_MERCHANT_KEY,
            merchantSalt: process.env.PAYTR_MERCHANT_SALT,
            baseUrl: 'https://www.paytr.com/odeme/api'
        };

        this.turkishBanks = [
            { code: 'akbank', name: 'Akbank', logo: '/images/banks/akbank.png' },
            { code: 'garanti', name: 'Garanti BBVA', logo: '/images/banks/garanti.png' },
            { code: 'isbank', name: 'Türkiye İş Bankası', logo: '/images/banks/isbank.png' },
            { code: 'yapikredi', name: 'Yapı Kredi', logo: '/images/banks/yapikredi.png' },
            { code: 'halkbank', name: 'Halkbank', logo: '/images/banks/halkbank.png' },
            { code: 'vakifbank', name: 'VakıfBank', logo: '/images/banks/vakifbank.png' },
            { code: 'ziraat', name: 'Ziraat Bankası', logo: '/images/banks/ziraat.png' },
            { code: 'denizbank', name: 'DenizBank', logo: '/images/banks/denizbank.png' }
        ];
    }

    // Desteklenen ödeme yöntemlerini getir
    getSupportedPaymentMethods() {
        return {
            basarili: true,
            odemeyontemleri: {
                kartlar: {
                    baslik: 'Kredi/Banka Kartı',
                    aciklama: 'Tüm Türk bankalarının kartları kabul edilir',
                    desteklenenKartlar: ['visa', 'mastercard', 'amex', 'troy'],
                    komisyon: 0,
                    anlikOdeme: true
                },
                bankalar: {
                    baslik: 'Türk Bankaları',
                    aciklama: 'Türkiye\'deki tüm bankalarla güvenli ödeme',
                    desteklenenBankalar: this.turkishBanks,
                    komisyon: 0,
                    anlikOdeme: true
                },
                dijitalCuzdanlar: {
                    baslik: 'Dijital Cüzdanlar',
                    aciklama: 'Hızlı ve güvenli dijital ödeme çözümleri',
                    desteklenenler: ['applepay', 'googlepay', 'samsungpay'],
                    komisyon: 0,
                    anlikOdeme: true
                },
                kapidaOdeme: {
                    baslik: 'Kapıda Ödeme',
                    aciklama: 'Paketi alırken nakit ödeme',
                    komisyon: 0,
                    anlikOdeme: false,
                    sadeceBelirliAlanlar: true
                }
            }
        };
    }

    // İyzico ile ödeme başlat
    async createIyzicoPayment(orderData) {
        try {
            const { siparisId, kullaniciId, tutar, kartBilgileri } = orderData;

            // Sipariş ve kullanıcı bilgilerini al
            const [siparis, kullanici] = await Promise.all([
                Siparis.findById(siparisId).populate('restoranId paketId'),
                Kullanici.findById(kullaniciId)
            ]);

            if (!siparis || !kullanici) {
                return {
                    hata: true,
                    mesaj: 'Sipariş veya kullanıcı bulunamadı'
                };
            }

            // İyzico ödeme request'i hazırla
            const request = {
                locale: Iyzipay.LOCALE.TR,
                conversationId: `kaptaze_${siparisId}`,
                price: tutar.toString(),
                paidPrice: tutar.toString(),
                currency: Iyzipay.CURRENCY.TRY,
                installment: '1',
                basketId: `basket_${siparisId}`,
                paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
                paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
                callbackUrl: `${process.env.FRONTEND_URL}/payment/callback`,
                
                // Kart bilgileri
                paymentCard: {
                    cardHolderName: kartBilgileri.kartSahibi,
                    cardNumber: kartBilgileri.kartNumarasi,
                    expireMonth: kartBilgileri.sonKullanmaAy,
                    expireYear: kartBilgileri.sonKullanmaYil,
                    cvc: kartBilgileri.guvenlikKodu,
                    registerCard: '0'
                },

                // Alıcı bilgileri
                buyer: {
                    id: kullanici._id.toString(),
                    name: kullanici.ad,
                    surname: kullanici.soyad,
                    gsmNumber: kullanici.telefon || '+905555555555',
                    email: kullanici.eposta,
                    identityNumber: '11111111111', // Test için
                    lastLoginDate: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0],
                    registrationDate: kullanici.olusturmaTarihi.toISOString().split('T')[0] + ' ' + kullanici.olusturmaTarihi.toTimeString().split(' ')[0],
                    registrationAddress: siparis.teslimAdresi,
                    ip: orderData.ip || '127.0.0.1',
                    city: kullanici.konum?.sehir || 'Antalya',
                    country: 'Turkey',
                    zipCode: '07000'
                },

                // Teslimat adresi
                shippingAddress: {
                    contactName: `${kullanici.ad} ${kullanici.soyad}`,
                    city: kullanici.konum?.sehir || 'Antalya',
                    country: 'Turkey',
                    address: siparis.teslimAdresi,
                    zipCode: '07000'
                },

                // Fatura adresi
                billingAddress: {
                    contactName: `${kullanici.ad} ${kullanici.soyad}`,
                    city: kullanici.konum?.sehir || 'Antalya',
                    country: 'Turkey',
                    address: siparis.teslimAdresi,
                    zipCode: '07000'
                },

                // Sepet ürünleri
                basketItems: [{
                    id: siparis.paketId._id.toString(),
                    name: siparis.paketId.ad,
                    category1: siparis.restoranId.kategori,
                    category2: 'Gıda',
                    itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                    price: tutar.toString()
                }]
            };

            // İyzico'ya ödeme isteği gönder
            return new Promise((resolve) => {
                this.iyzipay.payment.create(request, (err, result) => {
                    if (err) {
                        console.error('İyzico ödeme hatası:', err);
                        resolve({
                            hata: true,
                            mesaj: 'Ödeme işlemi başlatılamadı',
                            detay: err.message
                        });
                    } else {
                        if (result.status === 'success') {
                            resolve({
                                basarili: true,
                                mesaj: 'Ödeme başarılı',
                                odemeId: result.paymentId,
                                sonuc: result,
                                provider: 'iyzico'
                            });
                        } else {
                            resolve({
                                hata: true,
                                mesaj: result.errorMessage || 'Ödeme başarısız',
                                kod: result.errorCode
                            });
                        }
                    }
                });
            });

        } catch (error) {
            console.error('İyzico ödeme servisi hatası:', error);
            return {
                hata: true,
                mesaj: 'Ödeme servisi hatası',
                detay: error.message
            };
        }
    }

    // PayTR ile ödeme başlat
    async createPayTRPayment(orderData) {
        try {
            const { siparisId, kullaniciId, tutar } = orderData;

            // Sipariş ve kullanıcı bilgilerini al
            const [siparis, kullanici] = await Promise.all([
                Siparis.findById(siparisId).populate('restoranId paketId'),
                Kullanici.findById(kullaniciId)
            ]);

            if (!siparis || !kullanici) {
                return {
                    hata: true,
                    mesaj: 'Sipariş veya kullanıcı bulunamadı'
                };
            }

            // PayTR için gerekli parametreler
            const merchantOid = `kaptaze_${siparisId}_${Date.now()}`;
            const userBasket = JSON.stringify([
                [siparis.paketId.ad, (tutar * 100).toString(), '1'] // PayTR kuruş cinsinden çalışır
            ]);

            // Hash oluştur
            const hashStr = [
                this.paytr.merchantId,
                orderData.ip || '127.0.0.1',
                merchantOid,
                kullanici.eposta,
                (tutar * 100).toString(), // PayTR kuruş cinsinden
                userBasket,
                '1', // no_installment
                '0', // max_installment
                'TL',
                '1', // test_mode (production'da 0)
                this.paytr.merchantSalt
            ].join('|');

            const token = crypto.createHmac('sha256', this.paytr.merchantKey)
                .update(hashStr)
                .digest('base64');

            // PayTR API'sine gönderilecek data
            const postData = {
                merchant_id: this.paytr.merchantId,
                user_ip: orderData.ip || '127.0.0.1',
                merchant_oid: merchantOid,
                email: kullanici.eposta,
                payment_amount: (tutar * 100).toString(),
                paytr_token: token,
                user_basket: userBasket,
                debug_on: '1', // Test için
                no_installment: '1',
                max_installment: '0',
                user_name: `${kullanici.ad} ${kullanici.soyad}`,
                user_address: siparis.teslimAdresi,
                user_phone: kullanici.telefon || '05555555555',
                merchant_ok_url: `${process.env.FRONTEND_URL}/payment/success`,
                merchant_fail_url: `${process.env.FRONTEND_URL}/payment/failed`,
                timeout_limit: '30',
                currency: 'TL',
                test_mode: '1' // Production'da 0
            };

            // PayTR API'sine istek gönder
            const response = await axios.post(this.paytr.baseUrl + '/odeme', postData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data.status === 'success') {
                return {
                    basarili: true,
                    mesaj: 'PayTR ödeme sayfası oluşturuldu',
                    odemeUrl: response.data.payment_url,
                    odemeId: merchantOid,
                    token: response.data.token,
                    provider: 'paytr'
                };
            } else {
                return {
                    hata: true,
                    mesaj: response.data.reason || 'PayTR ödeme oluşturulamadı'
                };
            }

        } catch (error) {
            console.error('PayTR ödeme servisi hatası:', error);
            return {
                hata: true,
                mesaj: 'PayTR ödeme servisi hatası',
                detay: error.message
            };
        }
    }

    // Ödeme durumunu kontrol et
    async checkPaymentStatus(paymentId, provider) {
        try {
            if (provider === 'iyzico') {
                return await this.checkIyzicoPaymentStatus(paymentId);
            } else if (provider === 'paytr') {
                return await this.checkPayTRPaymentStatus(paymentId);
            }

            return {
                hata: true,
                mesaj: 'Desteklenmeyen ödeme sağlayıcısı'
            };

        } catch (error) {
            console.error('Ödeme durumu kontrol hatası:', error);
            return {
                hata: true,
                mesaj: 'Ödeme durumu kontrol edilemedi'
            };
        }
    }

    // İyzico ödeme durumu kontrol
    async checkIyzicoPaymentStatus(paymentId) {
        return new Promise((resolve) => {
            this.iyzipay.payment.retrieve({
                paymentId: paymentId,
                locale: Iyzipay.LOCALE.TR
            }, (err, result) => {
                if (err) {
                    resolve({
                        hata: true,
                        mesaj: 'İyzico ödeme durumu kontrol edilemedi'
                    });
                } else {
                    resolve({
                        basarili: true,
                        durum: result.status,
                        detay: result
                    });
                }
            });
        });
    }

    // PayTR ödeme durumu kontrol
    async checkPayTRPaymentStatus(merchantOid) {
        try {
            // PayTR için ödeme sorgusu hash'i
            const hashStr = [
                this.paytr.merchantId,
                merchantOid,
                this.paytr.merchantSalt
            ].join('|');

            const token = crypto.createHmac('sha256', this.paytr.merchantKey)
                .update(hashStr)
                .digest('base64');

            const postData = {
                merchant_id: this.paytr.merchantId,
                merchant_oid: merchantOid,
                paytr_token: token
            };

            const response = await axios.post(this.paytr.baseUrl + '/odeme/durum', postData);

            return {
                basarili: true,
                durum: response.data.status,
                detay: response.data
            };

        } catch (error) {
            return {
                hata: true,
                mesaj: 'PayTR ödeme durumu kontrol edilemedi'
            };
        }
    }

    // Ödeme iade işlemi
    async refundPayment(paymentId, amount, provider, reason = 'Kullanıcı talebi') {
        try {
            if (provider === 'iyzico') {
                return await this.refundIyzicoPayment(paymentId, amount, reason);
            } else if (provider === 'paytr') {
                return await this.refundPayTRPayment(paymentId, amount, reason);
            }

            return {
                hata: true,
                mesaj: 'Desteklenmeyen ödeme sağlayıcısı'
            };

        } catch (error) {
            console.error('Ödeme iade hatası:', error);
            return {
                hata: true,
                mesaj: 'Ödeme iadesi yapılamadı'
            };
        }
    }

    // İyzico iade işlemi
    async refundIyzicoPayment(paymentId, amount, reason) {
        return new Promise((resolve) => {
            this.iyzipay.refund.create({
                locale: Iyzipay.LOCALE.TR,
                conversationId: `refund_${Date.now()}`,
                paymentTransactionId: paymentId,
                price: amount.toString(),
                currency: Iyzipay.CURRENCY.TRY,
                reason: reason
            }, (err, result) => {
                if (err) {
                    resolve({
                        hata: true,
                        mesaj: 'İyzico iade işlemi başarısız'
                    });
                } else {
                    resolve({
                        basarili: result.status === 'success',
                        mesaj: result.status === 'success' ? 'İade işlemi başarılı' : result.errorMessage,
                        iadeId: result.refundId
                    });
                }
            });
        });
    }

    // Ödeme komisyonu hesapla
    calculateCommission(amount, paymentMethod) {
        // KAPTAZE için komisyon hesaplama
        const commissionRates = {
            'credit_card': 0.025, // %2.5
            'debit_card': 0.015,  // %1.5
            'bank_transfer': 0.01, // %1.0
            'digital_wallet': 0.02, // %2.0
            'cash_on_delivery': 0.0 // %0.0
        };

        const rate = commissionRates[paymentMethod] || 0.025;
        const commission = amount * rate;
        
        return {
            tutar: amount,
            komisyonOrani: rate,
            komisyonTutari: commission,
            netTutar: amount - commission
        };
    }

    // Ödeme raporları
    async getPaymentReports(startDate, endDate) {
        try {
            const siparisler = await Siparis.find({
                olusturmaTarihi: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                },
                odemeDurumu: 'completed'
            }).populate('kullaniciId restoranId');

            const toplamGelir = siparisler.reduce((total, siparis) => total + siparis.toplamFiyat, 0);
            const toplamKomisyon = siparisler.reduce((total, siparis) => {
                const commission = this.calculateCommission(siparis.toplamFiyat, siparis.odemeYontemi);
                return total + commission.komisyonTutari;
            }, 0);

            return {
                basarili: true,
                rapor: {
                    baslangicTarihi: startDate,
                    bitisTarihi: endDate,
                    toplamSiparis: siparisler.length,
                    toplamGelir: toplamGelir,
                    toplamKomisyon: toplamKomisyon,
                    netGelir: toplamGelir - toplamKomisyon,
                    gunlukOrtalama: toplamGelir / Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
                    odemeYontemleri: this.groupByPaymentMethod(siparisler)
                }
            };

        } catch (error) {
            console.error('Ödeme raporu hatası:', error);
            return {
                hata: true,
                mesaj: 'Ödeme raporu oluşturulamadı'
            };
        }
    }

    // Ödeme yöntemine göre gruplama
    groupByPaymentMethod(orders) {
        const grouped = {};
        orders.forEach(order => {
            const method = order.odemeYontemi || 'unknown';
            if (!grouped[method]) {
                grouped[method] = {
                    adet: 0,
                    tutar: 0
                };
            }
            grouped[method].adet++;
            grouped[method].tutar += order.toplamFiyat;
        });
        return grouped;
    }
}

module.exports = new PaymentService();