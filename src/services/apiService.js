// KapTaze API Service - Backend ile iletişim
// Profesyonel Türkçe API entegrasyonu

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://kaptaze.netlify.app/api'; // Production URL  
const FALLBACK_URL = 'https://kaptaze-backend.herokuapp.com/api'; // Fallback URL

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

  // MOBIL ENTEGRASYON API'leri
  async getMobileRestaurants() {
    try {
      console.log('📱 Mobil restoran verisi yükleniyor...');
      
      // 1. Önce web bridge üzerinden dene
      const bridgeData = await this.getWebBridgeData();
      if (bridgeData.success && bridgeData.data.restaurants.length > 0) {
        return bridgeData;
      }
      
      // 2. Direkt API dene
      const apiData = await this.get('/mobile/restaurants');
      if (apiData.success) {
        return apiData;
      }
      
      // 3. Fallback - JSON endpoint
      const jsonData = await this.getJSONEndpoint();
      if (jsonData.success) {
        return jsonData;
      }
      
      // 4. Son fallback - mock data
      return this.getMockRestaurants();
      
    } catch (error) {
      console.error('❌ Mobile restaurant data failed:', error);
      return this.getMockRestaurants();
    }
  }

  async getWebBridgeData() {
    try {
      // Web bridge sayfasına postMessage ile istek gönder
      if (typeof window !== 'undefined' && window.postMessage) {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Bridge timeout'));
          }, 5000);

          const messageHandler = (event) => {
            if (event.data.type === 'KAPTAZE_API_RESPONSE') {
              clearTimeout(timeout);
              window.removeEventListener('message', messageHandler);
              resolve(event.data.data);
            }
          };

          window.addEventListener('message', messageHandler);
          window.postMessage({
            type: 'KAPTAZE_API_REQUEST',
            method: 'GET',
            endpoint: '/restaurants/approved'
          }, '*');
        });
      }
      
      throw new Error('Bridge not available');
    } catch (error) {
      console.log('🌉 Web bridge failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getJSONEndpoint() {
    try {
      // GitHub Pages veya Netlify'da host edilen JSON dosyası
      const response = await fetch('/api/restaurants.json');
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error('JSON endpoint failed');
    } catch (error) {
      console.log('📄 JSON endpoint failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Web localStorage integration
  async getWebStorageData() {
    try {
      console.log('🌐 Web storage verisi yükleniyor...');
      console.log('🔍 Window check:', typeof window !== 'undefined');
      console.log('🔍 localStorage check:', typeof window !== 'undefined' ? !!window.localStorage : 'no window');
      
      // localStorage verilerine erişim yolu - browser ortamında çalışacak
      let registrations = [];
      let packages = [];
      
      // React Native Web ortamında window.localStorage kullan
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const regData = window.localStorage.getItem('registrations');
          const pkgData = window.localStorage.getItem('restaurantPackages');
          
          console.log('📦 Raw registration data:', regData);
          console.log('📦 Raw package data:', pkgData);
          
          registrations = regData ? JSON.parse(regData) : [];
          packages = pkgData ? JSON.parse(pkgData) : [];
          
          console.log('✅ Parsed registrations:', registrations.length);
          console.log('✅ Parsed packages:', packages.length);
        } catch (parseError) {
          console.error('❌ Parse error:', parseError);
          registrations = [];
          packages = [];
        }
      } else {
        console.log('⚠️ localStorage not available, trying fallback methods...');
        
        // Fallback: global storage varsa dene
        if (typeof global !== 'undefined' && global.localStorage) {
          registrations = JSON.parse(global.localStorage.getItem('registrations') || '[]');
          packages = JSON.parse(global.localStorage.getItem('restaurantPackages') || '[]');
        }
      }
      
      const approvedRestaurants = registrations.filter(reg => 
        reg.type === 'restaurant' && reg.status === 'approved'
      );
      
      console.log('📊 Storage data:', {
        totalRegistrations: registrations.length,
        approvedRestaurants: approvedRestaurants.length,
        packages: packages.length
      });
      
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

  // Mock data fallback (API çalışmazsa) + Web Test Data
  getMockRestaurants() {
    // Test için web onaylı restoran mock'u ekle
    const webMockRestaurants = [
      {
        _id: 'web_approved_1',
        name: 'Admin Onaylı Test Restaurant',
        category: 'Türk Mutfağı',
        rating: 4.8,
        distance: '0.5',
        image: '🍽️',
        imageUrl: null,
        location: {
          lat: 36.8969,
          lng: 30.7133,
          address: 'Web Test Mahallesi, Admin Sokak No:5, Antalya',
          city: 'Antalya',
          district: 'Muratpaşa'
        },
        phone: '+90 532 111 22 33',
        email: 'webtest@kaptaze.com',
        description: 'Web admin panelinden onaylanmış test restoranı',
        adminNote: 'Web to mobile test - Sistem çalışıyor!',
        owner: 'Web Test Sahibi',
        username: 'webtest',
        packages: [{
          _id: 'web_pkg_1',
          name: 'Web Test Paketi',
          description: 'Admin onaylı paket - Web to Mobile',
          quantity: 7,
          originalPrice: 95,
          salePrice: 60,
          discount: 37,
          status: 'available',
          category: 'Ana Yemek',
          expiryTime: '19:30'
        }]
      },
      {
        _id: 'web_approved_2', 
        name: 'Mobil Entegrasyon Cafe',
        category: 'Kahve & Atıştırmalık',
        rating: 4.6,
        distance: '1.1',
        image: '☕',
        imageUrl: null,
        location: {
          lat: 36.8945,
          lng: 30.7098,
          address: 'Entegrasyon Cad. No:42, Antalya',
          city: 'Antalya',
          district: 'Kepez'
        },
        phone: '+90 532 444 55 66',
        email: 'mobile@integration.com',
        description: 'Mobil entegrasyon test kafesi',
        adminNote: 'Cross-platform veri akış testi',
        owner: 'Mobile Test',
        username: 'mobiletest',
        packages: [{
          _id: 'mobile_pkg_1',
          name: 'Kahve + Kek Seti',
          description: 'Özel kahve + ev yapımı kek',
          quantity: 4,
          originalPrice: 65,
          salePrice: 40,
          discount: 38,
          status: 'available',
          category: 'Kahve',
          expiryTime: '17:00'
        }]
      }
    ];

    return {
      success: true,
      data: {
        restaurants: webMockRestaurants,
        meta: {
          source: 'mock_with_web_test',
          note: 'Mock data includes web-approved restaurant simulation',
          total: webMockRestaurants.length
        }
      }
    };
  }
}

const apiService = new ApiService();
export default apiService;