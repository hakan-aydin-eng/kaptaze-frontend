// KapTaze API Service - Backend ile iletişim
// Profesyonel Türkçe API entegrasyonu

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://kaptaze-backend.herokuapp.com/api'; // Production URL
const FALLBACK_URL = 'http://localhost:5000/api'; // Development URL

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Token yönetimi
  async setToken(token) {
    this.token = token;
    await AsyncStorage.setItem('@kaptaze_token', token);
  }

  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('@kaptaze_token');
    }
    return this.token;
  }

  async removeToken() {
    this.token = null;
    await AsyncStorage.removeItem('@kaptaze_token');
  }

  // HTTP istekleri için ortak method
  async request(endpoint, options = {}) {
    try {
      const token = await this.getToken();
      const url = `${this.baseURL}${endpoint}`;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      };

      console.log('📡 API İsteği:', url, config.method || 'GET');
      
      const response = await fetch(url, config);
      const data = await response.json();
      
      console.log('📥 API Yanıt:', {
        url,
        status: response.status,
        success: response.ok,
        data
      });

      if (!response.ok) {
        throw new Error(data.mesaj || data.message || 'API isteği başarısız');
      }

      return {
        success: true,
        data: data.data || data,
        message: data.mesaj || data.message,
        status: response.status
      };

    } catch (error) {
      console.error('❌ API Hatası:', error);
      
      // Network hatası durumunda fallback dene
      if (error.message.includes('Network') && this.baseURL !== FALLBACK_URL) {
        console.log('🔄 Fallback URL deneniyor...');
        this.baseURL = FALLBACK_URL;
        return this.request(endpoint, options);
      }

      return {
        success: false,
        error: error.message,
        message: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.',
        data: null
      };
    }
  }

  // GET isteği
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST isteği
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT isteği
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE isteği
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // KULLANICI API'leri
  async registerUser(userData) {
    const response = await this.post('/kullanici/kayit', userData);
    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }
    return response;
  }

  async loginUser(credentials) {
    const response = await this.post('/kullanici/giris', credentials);
    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }
    return response;
  }

  async guestLogin() {
    const response = await this.post('/kullanici/misafir-giris', {});
    if (response.success && response.data.token) {
      await this.setToken(response.data.token);
    }
    return response;
  }

  async getUserProfile() {
    return this.get('/kullanici/profil');
  }

  async updateUserProfile(profileData) {
    return this.put('/kullanici/profil', profileData);
  }

  async logout() {
    await this.removeToken();
    return { success: true, message: 'Çıkış başarılı' };
  }

  // RESTORAN API'leri
  async getRestaurants(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const endpoint = queryString ? `/restoran?${queryString}` : '/restoran';
    return this.get(endpoint);
  }

  async getRestaurantById(id) {
    return this.get(`/restoran/${id}`);
  }

  async getFeaturedRestaurants() {
    return this.get('/restoran?onerilen=true&limit=10');
  }

  async getNearbyRestaurants(lat, lng, radius = 5) {
    return this.get(`/restoran/yakin?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // PAKET API'leri
  async getPackages(restoranId) {
    return this.get(`/paket?restoranId=${restoranId}`);
  }

  async getPackageById(id) {
    return this.get(`/paket/${id}`);
  }

  // SİPARİŞ API'leri
  async createOrder(orderData) {
    return this.post('/siparis', orderData);
  }

  async getUserOrders() {
    return this.get('/siparis/kullanici');
  }

  async getOrderById(id) {
    return this.get(`/siparis/${id}`);
  }

  async updateOrderStatus(id, status) {
    return this.put(`/siparis/${id}/durum`, { durum: status });
  }

  // FAVORİ API'leri
  async addToFavorites(restoranId) {
    return this.post('/favori', { restoranId });
  }

  async removeFromFavorites(restoranId) {
    return this.delete(`/favori/${restoranId}`);
  }

  async getUserFavorites() {
    return this.get('/favori');
  }

  // BİLDİRİM API'leri
  async getNotifications() {
    return this.get('/bildirim');
  }

  async markNotificationAsRead(id) {
    return this.put(`/bildirim/${id}/okudum`, {});
  }

  // ARAMA API'leri
  async searchRestaurants(query, filters = {}) {
    const searchParams = { ...filters, q: query };
    const queryString = new URLSearchParams(searchParams).toString();
    return this.get(`/restoran/ara?${queryString}`);
  }

  // İSTATİSTİK API'leri
  async getUserStats() {
    return this.get('/kullanici/istatistikler');
  }

  // Web localStorage integration
  async getWebStorageData() {
    try {
      // Bu production'da gerçek API'den gelecek
      // Şimdilik localStorage simülasyonu
      const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
      const approvedRestaurants = registrations.filter(reg => 
        reg.type === 'restaurant' && reg.status === 'approved'
      );
      
      // Paketleri yükle
      const packages = JSON.parse(localStorage.getItem('restaurantPackages') || '[]');
      
      return {
        success: true,
        data: {
          restaurants: approvedRestaurants.map(reg => {
            // Bu restorana ait paketleri bul
            const restaurantPackages = packages.filter(pkg => pkg.restaurantId === reg.id);
            
            return {
              _id: reg.id,
              ad: reg.businessName,
              kategori: reg.businessCategory,
              puan: 4.0 + Math.random(),
              konum: { 
                mesafe: (Math.random() * 5).toFixed(1) + 'km',
                adres: reg.businessAddress,
                sehir: reg.city,
                ilce: reg.district
              },
              resimUrl: null,
              sahibi: `${reg.firstName} ${reg.lastName}`,
              telefon: reg.phone,
              eposta: reg.email,
              onerilenMi: true, // Yeni onaylanan restoranlar öne çıkarılsın
              packages: restaurantPackages.length > 0 ? restaurantPackages.map(pkg => ({
                _id: pkg.id,
                ad: pkg.name,
                aciklama: pkg.description,
                orijinalFiyat: pkg.originalPrice,
                satisFiyati: pkg.discountPrice,
                stokAdedi: pkg.quantity,
                durum: 'pickup_now',
                kategori: pkg.category,
                sonTeslim: pkg.expiryTime,
                resimUrl: pkg.image
              })) : [{
                _id: `p_${reg.id}`,
                ad: 'Sürpriz Paketi',
                aciklama: 'Günün özel menüsü',
                orijinalFiyat: 80 + Math.floor(Math.random() * 40),
                satisFiyati: 30 + Math.floor(Math.random() * 30),
                stokAdedi: Math.floor(Math.random() * 10) + 1,
                durum: 'pickup_now'
              }]
            };
          })
        }
      };
    } catch (error) {
      return this.getMockRestaurants();
    }
  }

  // Mock data fallback (API çalışmazsa)
  getMockRestaurants() {
    return {
      success: true,
      data: {
        restaurants: [
          {
            _id: 'mock1',
            ad: 'Demo Restoran',
            kategori: 'Türk Mutfağı',
            puan: 4.5,
            konum: { mesafe: '1.2km' },
            resimUrl: null,
            packages: [{
              _id: 'p1',
              ad: 'Sürpriz Paketi',
              aciklama: 'Demo paket',
              orijinalFiyat: 100,
              satisFiyati: 60,
              stokAdedi: 3,
              durum: 'pickup_now'
            }]
          }
        ]
      }
    };
  }
}

const apiService = new ApiService();
export default apiService;