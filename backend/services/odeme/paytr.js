// KapTaze PayTR Ödeme Entegrasyonu - Alternatif Türk Ödeme Sistemi
const crypto = require('crypto');
const axios = require('axios');

class PayTRService {
  constructor() {
    this.merchantId = process.env.PAYTR_MERCHANT_ID || 'test-merchant-id';
    this.merchantKey = process.env.PAYTR_MERCHANT_KEY || 'test-merchant-key';
    this.merchantSalt = process.env.PAYTR_MERCHANT_SALT || 'test-merchant-salt';
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://www.paytr.com/odeme/api'
      : 'https://www.paytr.com/odeme/api'; // PayTR test URL'i
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

      // Ödeme tutarını kuruş cinsine çevir
      const odemeTutariKurus = Math.round(siparisToplami * 100);

      // Sepet içeriğini hazırla
      const sepetDetayi = this.prepareSepetDetayi(sepetItems);

      // Hash hesaplama için gerekli veriler
      const hashVerileri = [
        this.merchantId,
        kullanici.eposta,
        siparisId,
        odemeTutariKurus,
        'TL',
        '0', // test_mode (0 = production, 1 = test)
        '0'  // non_3d (0 = 3D Secure aktif, 1 = pasif)
      ];

      const hashString = hashVerileri.join('') + this.merchantSalt;
      const paytrToken = this.createHash(hashString);

      // PayTR API isteği
      const requestData = {
        merchant_id: this.merchantId,
        user_ip: paymentData.ip || '127.0.0.1',
        merchant_oid: siparisId,
        email: kullanici.eposta,
        payment_amount: odemeTutariKurus,
        paytr_token: paytrToken,
        user_basket: sepetDetayi,
        debug_on: process.env.NODE_ENV !== 'production' ? 1 : 0,
        no_installment: 0, // Taksit seçenekleri aktif
        max_installment: 12,
        user_name: `${kullanici.ad} ${kullanici.soyad}`,
        user_address: teslimatAdresi.adres || 'Adres bilgisi yok',
        user_phone: kullanici.telefon || '5551234567',
        merchant_ok_url: `${process.env.FRONTEND_URL}/odeme/basarili`,
        merchant_fail_url: `${process.env.FRONTEND_URL}/odeme/basarisiz`,
        timeout_limit: 30,
        currency: 'TL',
        test_mode: process.env.NODE_ENV !== 'production' ? 1 : 0
      };

      // PayTR API'sine istek gönder
      const response = await axios.post(`${this.baseUrl}/odeme`, requestData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformRequest: [(data) => {
          return Object.keys(data)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
            .join('&');
        }]
      });

      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          data: {
            token: response.data.token,
            paymentUrl: `https://www.paytr.com/odeme/guvenli/${response.data.token}`,
            paymentId: siparisId
          },
          message: 'Ödeme formu başarıyla oluşturuldu'
        };
      } else {
        return {
          success: false,
          message: this.translateErrorMessage(response.data?.reason || 'Ödeme başlatılamadı'),
          error: response.data
        };
      }

    } catch (error) {
      console.error('PayTR ödeme hatası:', error);
      return {
        success: false,
        message: 'PayTR ödeme servisi hatası',
        error: error.message
      };
    }
  }

  // Ödeme sonucu callback doğrulaması
  async verifyCallback(callbackData) {
    try {
      const {
        merchant_oid,
        status,
        total_amount,
        hash
      } = callbackData;

      // Hash doğrulaması
      const expectedHash = this.createHash(
        merchant_oid + this.merchantSalt + status + total_amount
      );

      if (hash !== expectedHash) {
        return {
          success: false,
          message: 'Callback hash doğrulaması başarısız',
          isValid: false
        };
      }

      const isSuccess = status === 'success';
      
      return {
        success: true,
        data: {
          siparisId: merchant_oid,
          durum: status,
          tutar: total_amount / 100, // Kuruştan TL'ye çevir
          isSuccess: isSuccess,
          tamamlanmaTarihi: new Date().toISOString()
        },
        message: isSuccess ? 
          'Ödeme başarıyla tamamlandı' : 
          'Ödeme başarısız oldu',
        isValid: true
      };

    } catch (error) {
      console.error('PayTR callback doğrulama hatası:', error);
      return {
        success: false,
        message: 'Callback doğrulama servisi hatası',
        error: error.message,
        isValid: false
      };
    }
  }

  // İade işlemi
  async refundPayment(merchantOid, refundAmount) {
    try {
      const refundAmountKurus = Math.round(refundAmount * 100);
      
      const hashString = this.merchantId + merchantOid + refundAmountKurus + this.merchantSalt;
      const hash = this.createHash(hashString);

      const requestData = {
        merchant_id: this.merchantId,
        merchant_oid: merchantOid,
        return_amount: refundAmountKurus,
        hash: hash
      };

      const response = await axios.post(`${this.baseUrl}/iade`, requestData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformRequest: [(data) => {
          return Object.keys(data)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
            .join('&');
        }]
      });

      if (response.data && response.data.status === 'success') {
        return {
          success: true,
          data: {
            siparisId: merchantOid,
            iadeTutari: refundAmount,
            iadeTarihi: new Date().toISOString()
          },
          message: 'İade işlemi başarıyla tamamlandı'
        };
      } else {
        return {
          success: false,
          message: this.translateErrorMessage(response.data?.reason || 'İade işlemi başarısız'),
          error: response.data
        };
      }

    } catch (error) {
      console.error('PayTR iade hatası:', error);
      return {
        success: false,
        message: 'İade servisi hatası',
        error: error.message
      };
    }
  }

  // Ödeme durumu sorgulama
  async checkPaymentStatus(merchantOid) {
    try {
      const hashString = this.merchantId + merchantOid + this.merchantSalt;
      const hash = this.createHash(hashString);

      const requestData = {
        merchant_id: this.merchantId,
        merchant_oid: merchantOid,
        hash: hash
      };

      const response = await axios.post(`${this.baseUrl}/durum`, requestData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        transformRequest: [(data) => {
          return Object.keys(data)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
            .join('&');
        }]
      });

      if (response.data) {
        const status = response.data.status;
        const isSuccess = status === 'success';

        return {
          success: true,
          data: {
            siparisId: merchantOid,
            durum: status,
            isSuccess: isSuccess,
            detaylar: response.data
          },
          message: isSuccess ? 
            'Ödeme başarılı' : 
            'Ödeme başarısız veya beklemede'
        };
      } else {
        return {
          success: false,
          message: 'Ödeme durumu sorgulanamadı',
          error: response.data
        };
      }

    } catch (error) {
      console.error('PayTR durum sorgulama hatası:', error);
      return {
        success: false,
        message: 'Durum sorgulama servisi hatası',
        error: error.message
      };
    }
  }

  // Sepet detayını PayTR formatına çevir
  prepareSepetDetayi(sepetItems) {
    const sepetArray = [];

    sepetItems.forEach(item => {
      sepetArray.push([
        item.ad.substring(0, 50), // Ürün adı (max 50 karakter)
        (item.fiyat).toFixed(2), // Birim fiyat
        item.adet // Adet
      ]);
    });

    // Base64 encode et
    return Buffer.from(JSON.stringify(sepetArray)).toString('base64');
  }

  // MD5 hash oluştur
  createHash(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // Test kartları bilgileri
  getTestCards() {
    return {
      success: {
        cardNumber: '5406697543211173',
        expireMonth: '12',
        expireYear: '2030',
        cvc: '465',
        cardHolderName: 'Test User'
      },
      failure: {
        cardNumber: '4111111111111129',
        expireMonth: '12',
        expireYear: '2030', 
        cvc: '123',
        cardHolderName: 'Test User Fail'
      },
      threed: {
        cardNumber: '5406697543211181',
        expireMonth: '12',
        expireYear: '2030',
        cvc: '465',
        cardHolderName: 'Test User 3D'
      }
    };
  }

  // Desteklenen bankalar listesi
  getSupportedBanks() {
    return {
      'akbank': 'Akbank',
      'garanti': 'Garanti BBVA',
      'isbank': 'Türkiye İş Bankası',
      'yapikredi': 'Yapı Kredi',
      'ziraat': 'Ziraat Bankası',
      'halkbank': 'Halkbank',
      'vakifbank': 'VakıfBank',
      'finansbank': 'QNB Finansbank',
      'denizbank': 'DenizBank',
      'odeabank': 'ODEA Bank',
      'albaraka': 'Albaraka Türk',
      'anadolubank': 'Anadolubank',
      'alternatifbank': 'Alternatif Bank',
      'burgan': 'Burgan Bank',
      'fibabanka': 'Fibabanka',
      'icbc': 'ICBC Turkey',
      'ing': 'ING Bank',
      'kuveyttürk': 'Kuveyt Türk',
      'şekerbank': 'Şekerbank',
      'teb': 'TEB',
      'turkiyefinans': 'Türkiye Finans',
      'hsbc': 'HSBC'
    };
  }

  // Hata mesajlarını Türkçe çevir
  translateErrorMessage(errorMessage) {
    const translations = {
      'INVALID_HASH': 'Güvenlik doğrulaması başarısız',
      'INVALID_MERCHANT': 'Geçersiz üye işyeri',
      'INVALID_AMOUNT': 'Geçersiz tutar',
      'INVALID_EMAIL': 'Geçersiz e-posta adresi',
      'INVALID_USER_NAME': 'Geçersiz kullanıcı adı',
      'INVALID_USER_ADDRESS': 'Geçersiz adres',
      'INVALID_USER_PHONE': 'Geçersiz telefon numarası',
      'INVALID_CURRENCY': 'Geçersiz para birimi',
      'INVALID_BASKET': 'Geçersiz sepet içeriği',
      'MERCHANT_NOT_FOUND': 'Üye işyeri bulunamadı',
      'PAYMENT_NOT_FOUND': 'Ödeme bulunamadı',
      'PAYMENT_ALREADY_REFUNDED': 'Ödeme zaten iade edilmiş',
      'INSUFFICIENT_BALANCE': 'Yetersiz bakiye',
      'CARD_NOT_SUPPORTED': 'Kart desteklenmiyor',
      'TRANSACTION_FAILED': 'İşlem başarısız',
      'SYSTEM_ERROR': 'Sistem hatası'
    };

    return translations[errorMessage] || errorMessage || 'Bilinmeyen hata';
  }

  // Taksit seçeneklerini getir
  getInstallmentOptions(amount) {
    const installments = [];
    const baseAmount = parseFloat(amount);

    // Taksit oranları (örnek)
    const rates = {
      1: 0,      // Peşin
      2: 0.02,   // %2
      3: 0.03,   // %3
      6: 0.06,   // %6
      9: 0.09,   // %9
      12: 0.12   // %12
    };

    Object.keys(rates).forEach(installment => {
      const rate = rates[installment];
      const totalAmount = baseAmount * (1 + rate);
      const monthlyAmount = totalAmount / installment;

      installments.push({
        installment: parseInt(installment),
        rate: rate * 100,
        totalAmount: totalAmount.toFixed(2),
        monthlyAmount: monthlyAmount.toFixed(2)
      });
    });

    return installments;
  }

  // Webhook doğrulama
  validateWebhook(postData) {
    try {
      const {
        merchant_oid,
        status,
        total_amount,
        hash,
        failed_reason_code,
        failed_reason_msg,
        test_mode
      } = postData;

      // Hash kontrolü
      const expectedHash = this.createHash(
        merchant_oid + this.merchantSalt + status + total_amount
      );

      const isValid = hash === expectedHash;

      return {
        isValid,
        data: {
          siparisId: merchant_oid,
          durum: status,
          tutar: total_amount / 100,
          hatKodu: failed_reason_code,
          hataMesaji: failed_reason_msg,
          testModu: test_mode,
          isSuccess: status === 'success'
        }
      };

    } catch (error) {
      console.error('PayTR webhook doğrulama hatası:', error);
      return {
        isValid: false,
        error: error.message
      };
    }
  }
}

module.exports = new PayTRService();