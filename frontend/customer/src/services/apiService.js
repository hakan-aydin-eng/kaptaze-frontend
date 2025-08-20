// KapTaze Customer API Service - Müşteri API Hizmetleri
import axios from 'axios';

// Base configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
    
    // Axios instance oluştur
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Request interceptor - Token ekle
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Hata yönetimi
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token süresi dolmuş
          this.token = null;
          localStorage.removeItem('kaptaze_token');
          window.location.href = '/giris';
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Token ayarla
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('kaptaze_token', token);
    } else {
      localStorage.removeItem('kaptaze_token');
    }
  }

  // Token al
  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('kaptaze_token');
    }
    return this.token;
  }

  // === AUTH ENDPOINTS ===

  // Giriş yap
  async login(credentials) {
    try {
      const response = await this.client.post('/auth/giris', credentials);
      if (response.success && response.data.token) {
        this.setToken(response.data.token);
      }
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Giriş başarısız'
      };
    }
  }

  // Kayıt ol
  async register(userData) {
    try {
      const response = await this.client.post('/auth/kayit', userData);
      if (response.success && response.data.token) {
        this.setToken(response.data.token);
      }
      return response;
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Kayıt başarısız'
      };
    }
  }

  // Çıkış yap
  async logout() {
    try {
      await this.client.post('/auth/cikis');
      this.setToken(null);
      return { success: true };
    } catch (error) {
      this.setToken(null);
      return { success: true }; // Çıkış her zaman başarılı sayılır
    }
  }

  // Mevcut kullanıcı bilgisi
  async getCurrentUser() {
    try {
      return await this.client.get('/auth/me');
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Kullanıcı bilgisi alınamadı'
      };
    }
  }

  // Şifre değiştir
  async changePassword(passwords) {
    try {
      return await this.client.post('/auth/sifre-degistir', passwords);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Şifre değiştirilemedi'
      };
    }
  }

  // Şifre sıfırlama isteği
  async forgotPassword(email) {
    try {
      return await this.client.post('/auth/sifremi-unuttum', email);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Şifre sıfırlama isteği gönderilemedi'
      };
    }
  }

  // === USER ENDPOINTS ===

  // Profil güncelle
  async updateProfile(userData) {
    try {
      return await this.client.put('/kullanici/profil', userData);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profil güncellenemedi'
      };
    }
  }

  // Profil fotoğrafı yükle
  async uploadProfilePhoto(formData) {
    try {
      return await this.client.post('/kullanici/profil-foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Fotoğraf yüklenemedi'
      };
    }
  }

  // === RESTAURANT ENDPOINTS ===

  // Restoranları listele
  async getRestaurants(params = {}) {
    try {
      return await this.client.get('/restoranlar', { params });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Restoranlar yüklenemedi'
      };
    }
  }

  // Restoran detayı
  async getRestaurant(id) {
    try {
      return await this.client.get(`/restoranlar/${id}`);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Restoran detayı yüklenemedi'
      };
    }
  }

  // Restoran paketleri
  async getRestaurantPackages(restaurantId, params = {}) {
    try {
      return await this.client.get(`/restoranlar/${restaurantId}/paketler`, { params });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Paketler yüklenemedi'
      };
    }
  }

  // === PACKAGE ENDPOINTS ===

  // Paket detayı
  async getPackage(id) {
    try {
      return await this.client.get(`/paketler/${id}`);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Paket detayı yüklenemedi'
      };
    }
  }

  // Paket arama
  async searchPackages(query, filters = {}) {
    try {
      const params = { q: query, ...filters };
      return await this.client.get('/paketler/ara', { params });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Arama yapılamadı'
      };
    }
  }

  // Yakındaki paketler
  async getNearbyPackages(coordinates, radius = 5) {
    try {
      const params = {
        lat: coordinates.lat,
        lng: coordinates.lng,
        radius: radius
      };
      return await this.client.get('/paketler/yakin', { params });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Yakındaki paketler bulunamadı'
      };
    }
  }

  // === ORDER ENDPOINTS ===

  // Sipariş ver
  async createOrder(orderData) {
    try {
      return await this.client.post('/siparisler', orderData);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Sipariş verilemedi'
      };
    }
  }

  // Siparişlerimi listele
  async getMyOrders(params = {}) {
    try {
      return await this.client.get('/siparisler/benimkiler', { params });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Siparişler yüklenemedi'
      };
    }
  }

  // Sipariş detayı
  async getOrder(id) {
    try {
      return await this.client.get(`/siparisler/${id}`);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Sipariş detayı yüklenemedi'
      };
    }
  }

  // Sipariş iptal et
  async cancelOrder(id, reason) {
    try {
      return await this.client.post(`/siparisler/${id}/iptal`, { sebep: reason });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Sipariş iptal edilemedi'
      };
    }
  }

  // Sipariş onayla/teslim al
  async confirmOrder(id) {
    try {
      return await this.client.post(`/siparisler/${id}/onayla`);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Sipariş onaylanamadı'
      };
    }
  }

  // === PAYMENT ENDPOINTS ===

  // Ödeme başlat
  async initiatePayment(paymentData) {
    try {
      return await this.client.post('/odeme/basla', paymentData);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Ödeme başlatılamadı'
      };
    }
  }

  // Ödeme durumu sorgula
  async checkPaymentStatus(paymentId) {
    try {
      return await this.client.get(`/odeme/${paymentId}/durum`);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Ödeme durumu sorgulanamadı'
      };
    }
  }

  // === FAVORITES ENDPOINTS ===

  // Favorileri listele
  async getFavorites() {
    try {
      return await this.client.get('/favoriler');
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Favoriler yüklenemedi'
      };
    }
  }

  // Favorilere ekle
  async addToFavorites(restaurantId) {
    try {
      return await this.client.post('/favoriler', { restoranId: restaurantId });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Favorilere eklenemedi'
      };
    }
  }

  // Favorilerden çıkar
  async removeFromFavorites(restaurantId) {
    try {
      return await this.client.delete(`/favoriler/${restaurantId}`);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Favorilerden çıkarılamadı'
      };
    }
  }

  // === REVIEW ENDPOINTS ===

  // Değerlendirme yap
  async submitReview(orderOrRestaurantId, reviewData, type = 'order') {
    try {
      const endpoint = type === 'order' 
        ? `/siparisler/${orderOrRestaurantId}/degerlendirme`
        : `/restoranlar/${orderOrRestaurantId}/degerlendirme`;
      
      return await this.client.post(endpoint, reviewData);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Değerlendirme gönderilemedi'
      };
    }
  }

  // === NOTIFICATION ENDPOINTS ===

  // Bildirimleri listele
  async getNotifications(params = {}) {
    try {
      return await this.client.get('/bildirimler', { params });
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Bildirimler yüklenemedi'
      };
    }
  }

  // Bildirimi okundu olarak işaretle
  async markNotificationAsRead(id) {
    try {
      return await this.client.put(`/bildirimler/${id}/oku`);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Bildirim işaretlenemedi'
      };
    }
  }

  // === SUPPORT ENDPOINTS ===

  // Destek talebi oluştur
  async createSupportRequest(requestData) {
    try {
      return await this.client.post('/destek', requestData);
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Destek talebi gönderilemedi'
      };
    }
  }

  // === UTILITY METHODS ===

  // Konum servisleri
  async getLocationSuggestions(query) {
    try {
      return await this.client.get(`/konum/ara?q=${encodeURIComponent(query)}`);
    } catch (error) {
      return {
        success: false,
        message: 'Konum arama yapılamadı'
      };
    }
  }

  // Uygulama ayarları
  async getAppSettings() {
    try {
      return await this.client.get('/ayarlar/genel');
    } catch (error) {
      return {
        success: false,
        message: 'Ayarlar yüklenemedi'
      };
    }
  }
}

// Singleton instance
const apiService = new ApiService();

export default apiService;