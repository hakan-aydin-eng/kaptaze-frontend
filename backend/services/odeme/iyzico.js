// KapTaze İyzico Ödeme Entegrasyonu - Türk Bankalar Ödeme Sistemi
const Iyzico = require('iyzipay');
const crypto = require('crypto');

class IyzicoService {
  constructor() {
    this.iyzico = new Iyzico({
      apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key',
      secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
      uri: process.env.NODE_ENV === 'production' 
        ? 'https://api.iyzipay.com' 
        : 'https://sandbox-api.iyzipay.com'
    });
  }

  // Ödeme başlat
  async createPayment(paymentData) {
    try {
      const {
        siparisToplami,
        siparisId,
        kullanici,
        sepetItems,
        teslimatAdresi
      } = paymentData;

      // Ödeme isteği verilerini hazırla
      const request = {
        locale: 'tr',
        conversationId: siparisId,
        price: siparisToplami.toString(),
        paidPrice: siparisToplami.toString(),
        currency: Iyzico.CURRENCY.TRY,
        installment: '1',
        basketId: siparisId,
        paymentChannel: Iyzico.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzico.PAYMENT_GROUP.PRODUCT,
        callbackUrl: `${process.env.FRONTEND_URL}/odeme/callback`,
        enabledInstallments: ['1', '2', '3', '6', '9', '12'],
        
        // Alıcı bilgileri
        buyer: {
          id: kullanici._id,
          name: kullanici.ad,
          surname: kullanici.soyad,
          gsmNumber: kullanici.telefon || '+905551234567',
          email: kullanici.eposta,
          identityNumber: this.generateIdentityNumber(),
          lastLoginDate: new Date().toISOString().split('T')[0] + ' 12:00:00',
          registrationDate: kullanici.kayitTarihi ? 
            new Date(kullanici.kayitTarihi).toISOString().split('T')[0] + ' 12:00:00' :
            '2024-01-01 12:00:00',
          registrationAddress: teslimatAdresi.adres,
          ip: paymentData.ip || '127.0.0.1',
          city: teslimatAdresi.sehir || 'Antalya',
          country: 'Turkey',
          zipCode: teslimatAdresi.postaKodu || '07000'
        },

        // Teslimat adresi
        shippingAddress: {
          contactName: `${kullanici.ad} ${kullanici.soyad}`,
          city: teslimatAdresi.sehir || 'Antalya',
          country: 'Turkey',
          address: teslimatAdresi.adres,
          zipCode: teslimatAdresi.postaKodu || '07000'
        },

        // Fatura adresi
        billingAddress: {
          contactName: `${kullanici.ad} ${kullanici.soyad}`,
          city: teslimatAdresi.sehir || 'Antalya',
          country: 'Turkey',
          address: teslimatAdresi.adres,
          zipCode: teslimatAdresi.postaKodu || '07000'
        },

        // Sepet ürünleri
        basketItems: this.prepareBasketItems(sepetItems, siporisToplami)
      };

      // İyzico checkout form oluştur
      return new Promise((resolve, reject) => {
        this.iyzico.checkoutFormInitialize.create(request, (err, result) => {
          if (err) {
            console.error('İyzico ödeme hatası:', err);
            reject({
              success: false,
              message: 'Ödeme başlatılamadı',
              error: err
            });
          } else if (result.status === 'success') {
            resolve({
              success: true,
              data: {
                checkoutFormContent: result.checkoutFormContent,
                token: result.token,
                paymentId: result.conversationId,
                paymentPageUrl: result.paymentPageUrl
              },
              message: 'Ödeme formu başarıyla oluşturuldu'
            });
          } else {
            reject({
              success: false,
              message: result.errorMessage || 'Ödeme başlatılamadı',
              error: result
            });
          }
        });
      });

    } catch (error) {
      console.error('İyzico servis hatası:', error);
      return {
        success: false,
        message: 'Ödeme servisi hatası',
        error: error.message
      };
    }
  }

  // Ödeme sonucunu kontrol et
  async verifyPayment(token) {
    try {
      const request = {
        locale: 'tr',
        token: token
      };

      return new Promise((resolve, reject) => {
        this.iyzico.checkoutForm.retrieve(request, (err, result) => {
          if (err) {
            console.error('İyzico doğrulama hatası:', err);
            reject({
              success: false,
              message: 'Ödeme doğrulanamadı',
              error: err
            });
          } else if (result.status === 'success') {
            const paymentStatus = result.paymentStatus;
            
            resolve({
              success: true,
              data: {
                paymentId: result.paymentId,
                conversationId: result.conversationId,
                paymentStatus: paymentStatus,
                paidPrice: result.paidPrice,
                currency: result.currency,
                installment: result.installment,
                paymentItems: result.paymentItems,
                fraudStatus: result.fraudStatus,
                merchantCommissionRate: result.merchantCommissionRate,
                merchantCommissionRateAmount: result.merchantCommissionRateAmount,
                iyziCommissionRateAmount: result.iyziCommissionRateAmount,
                cardType: result.cardType,
                cardAssociation: result.cardAssociation,
                cardFamily: result.cardFamily,
                binNumber: result.binNumber,
                lastFourDigits: result.lastFourDigits,
                basketId: result.basketId,
                isSuccess: paymentStatus === 'SUCCESS'
              },
              message: paymentStatus === 'SUCCESS' ? 
                'Ödeme başarıyla tamamlandı' : 
                'Ödeme tamamlanamadı'
            });
          } else {
            reject({
              success: false,
              message: result.errorMessage || 'Ödeme doğrulanamadı',
              error: result
            });
          }
        });
      });

    } catch (error) {
      console.error('İyzico doğrulama servis hatası:', error);
      return {
        success: false,
        message: 'Ödeme doğrulama servisi hatası',
        error: error.message
      };
    }
  }

  // İade işlemi
  async refundPayment(paymentTransactionId, refundAmount, reason) {
    try {
      const request = {
        locale: 'tr',
        conversationId: `refund-${Date.now()}`,
        paymentTransactionId: paymentTransactionId,
        price: refundAmount.toString(),
        currency: Iyzico.CURRENCY.TRY,
        ip: '127.0.0.1'
      };

      return new Promise((resolve, reject) => {
        this.iyzico.refund.create(request, (err, result) => {
          if (err) {
            console.error('İyzico iade hatası:', err);
            reject({
              success: false,
              message: 'İade işlemi başarısız',
              error: err
            });
          } else if (result.status === 'success') {
            resolve({
              success: true,
              data: {
                paymentId: result.paymentId,
                paymentTransactionId: result.paymentTransactionId,
                price: result.price,
                currency: result.currency
              },
              message: 'İade işlemi başarıyla tamamlandı'
            });
          } else {
            reject({
              success: false,
              message: result.errorMessage || 'İade işlemi başarısız',
              error: result
            });
          }
        });
      });

    } catch (error) {
      console.error('İyzico iade servis hatası:', error);
      return {
        success: false,
        message: 'İade servisi hatası',
        error: error.message
      };
    }
  }

  // Ödeme geçmişi sorgula
  async getPaymentHistory(conversationId) {
    try {
      const request = {
        locale: 'tr',
        conversationId: conversationId
      };

      return new Promise((resolve, reject) => {
        this.iyzico.payment.retrieve(request, (err, result) => {
          if (err) {
            console.error('İyzico geçmiş sorgulama hatası:', err);
            reject({
              success: false,
              message: 'Ödeme geçmişi alınamadı',
              error: err
            });
          } else {
            resolve({
              success: true,
              data: result,
              message: 'Ödeme geçmişi başarıyla alındı'
            });
          }
        });
      });

    } catch (error) {
      console.error('İyzico geçmiş servis hatası:', error);
      return {
        success: false,
        message: 'Ödeme geçmişi servisi hatası',
        error: error.message
      };
    }
  }

  // Sepet ürünlerini İyzico formatına çevir
  prepareBasketItems(sepetItems, toplamTutar) {
    const basketItems = [];
    let processedAmount = 0;

    sepetItems.forEach((item, index) => {
      const itemPrice = item.fiyat * item.adet;
      const itemPriceFormatted = itemPrice.toFixed(2);
      
      basketItems.push({
        id: item.packageId || `item-${index}`,
        name: item.ad.substring(0, 50), // İyzico max 50 karakter
        category1: item.kategori || 'Yemek',
        category2: 'Paket Yemek',
        itemType: Iyzico.BASKET_ITEM_TYPE.PHYSICAL,
        price: itemPriceFormatted
      });

      processedAmount += itemPrice;
    });

    // Kargo/hizmet bedeli varsa ekle
    if (processedAmount < toplamTutar) {
      const serviceCharge = (toplamTutar - processedAmount).toFixed(2);
      basketItems.push({
        id: 'service-charge',
        name: 'Hizmet Bedeli',
        category1: 'Hizmet',
        category2: 'Hizmet Bedeli',
        itemType: Iyzico.BASKET_ITEM_TYPE.VIRTUAL,
        price: serviceCharge
      });
    }

    return basketItems;
  }

  // Kimlik numarası oluştur (test için)
  generateIdentityNumber() {
    // Test ortamı için sabit kimlik numarası
    if (process.env.NODE_ENV !== 'production') {
      return '11111111111';
    }
    
    // Prodüksiyon için gerçek kimlik numarası kullanılmalı
    return '11111111111';
  }

  // Test kartları
  getTestCards() {
    return {
      success: {
        cardHolderName: 'John Doe',
        cardNumber: '5528790000000008',
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123'
      },
      failure: {
        cardHolderName: 'John Doe',
        cardNumber: '4111111111111129',
        expireMonth: '12',
        expireYear: '2030',
        cvc: '123'
      }
    };
  }

  // Webhook doğrulama
  validateWebhook(payload, signature) {
    try {
      const secretKey = process.env.IYZICO_SECRET_KEY;
      const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(payload)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Webhook doğrulama hatası:', error);
      return false;
    }
  }

  // Hata mesajlarını Türkçeye çevir
  translateErrorMessage(errorMessage) {
    const translations = {
      'Card number is invalid': 'Kart numarası geçersiz',
      'Expiry date is invalid': 'Son kullanma tarihi geçersiz',
      'CVC is invalid': 'CVC kodu geçersiz',
      'Insufficient funds': 'Yetersiz bakiye',
      'Card is blocked': 'Kart bloke',
      'Transaction not permitted': 'İşlem izin verilmedi',
      'Invalid merchant': 'Geçersiz üye işyeri',
      'General error': 'Genel hata',
      'Invalid request': 'Geçersiz istek',
      'Transaction declined': 'İşlem reddedildi',
      'Expired card': 'Kartın süresi dolmuş',
      'Restricted card': 'Kısıtlı kart',
      'Invalid amount': 'Geçersiz tutar'
    };

    return translations[errorMessage] || errorMessage;
  }
}

module.exports = new IyzicoService();