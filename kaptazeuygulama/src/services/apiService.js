// API Service for React Native App - Updated for KapTaze Backend API
const API_BASE_URL = 'https://kaptaze-backend-api.onrender.com'; // Updated backend URL

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Fix Turkish character encoding issues from backend
  fixTurkishChars(text) {
    if (typeof text !== 'string') return text;
    
    const charMap = {
      'Ã¼': 'ü', 'Ã': 'ü',
      'Ã§': 'ç', 'Â§': 'ç',
      'Ä±': 'ı', 'Â±': 'ı', 
      'Ä°': 'İ', 'Â°': 'İ',
      'Ã¶': 'ö', 'Ã¶': 'ö',
      'ÅŸ': 'ş', 'Å': 'ş',
      'Äž': 'ğ', 'Â®': 'ğ',
      'Ã¢': 'â', 'Ã¢': 'â',
      'Ã‡': 'Ç', 'Ã‡': 'Ç',
      'Ãœ': 'Ü', 'Ãœ': 'Ü',
      'Ã–': 'Ö', 'Ã–': 'Ö',
      'ÅŽ': 'Ş', 'ÅŽ': 'Ş',
      'Äž': 'Ğ', 'Äž': 'Ğ',
      'T�rk': 'Türk',
      'Mutfa��': 'Mutfağı',
      'Mutfa�': 'Mutfağı',
      '�': 'ü'
    };

    let fixed = text;
    Object.keys(charMap).forEach(key => {
      fixed = fixed.replace(new RegExp(key, 'g'), charMap[key]);
    });

    return fixed;
  }

  // Fix Turkish characters in object recursively
  fixTurkishInObject(obj) {
    if (typeof obj === 'string') {
      return this.fixTurkishChars(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.fixTurkishInObject(item));
    } else if (obj && typeof obj === 'object') {
      const fixed = {};
      Object.keys(obj).forEach(key => {
        fixed[key] = this.fixTurkishInObject(obj[key]);
      });
      return fixed;
    }
    return obj;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`📡 API Request: ${config.method} ${url}`);
      console.log('📦 Request body:', config.body);
      
      const response = await fetch(url, config);
      const data = await response.json();
      
      // Fix Turkish character encoding in response data
      const fixedData = this.fixTurkishInObject(data);
      
      console.log(`📨 Response status: ${response.status}`);
      console.log('📥 Response data (fixed):', fixedData);
      
      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, fixedData);
        throw new Error(fixedData.message || fixedData.error || `HTTP error! status: ${response.status}`);
      }

      return fixedData;
    } catch (error) {
      console.error('🚨 API Request Error:', error);
      console.error('🔍 Error details:', {
        url,
        method: config.method,
        body: config.body,
        status: error.status || 'unknown'
      });
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Mobile App Specific Methods
  async getRestaurants(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/public/restaurants?${queryParams}` : '/public/restaurants';
    return this.get(endpoint);
  }

  async getRestaurantById(id) {
    return this.get(`/public/restaurants/${id}`);
  }

  async getPackages(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/public/packages?${queryParams}` : '/public/packages';
    return this.get(endpoint);
  }

  async getCategories() {
    return this.get('/public/categories');
  }

  async getCities() {
    return this.get('/public/cities');
  }

  // Order Management
  async createOrder(orderData) {
    return this.post('/orders', orderData);
  }

  async getOrder(orderId) {
    return this.get(`/orders/${orderId}`);
  }

  async getCustomerOrders(customerId, filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/orders/customer/${customerId}?${queryParams}` : `/orders/customer/${customerId}`;
    return this.get(endpoint);
  }

  async updateOrderStatus(orderId, status, note = '') {
    return this.patch(`/orders/${orderId}/status`, { status, note });
  }

  async addReview(orderId, rating, comment = '') {
    return this.post(`/orders/${orderId}/review`, { rating, comment });
  }

  // Authentication (if needed)
  async login(credentials) {
    return this.post('/auth/login', credentials);
  }

  // Profile Management
  async updateProfile(profileData, token) {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Save push notification token
  async savePushToken(tokenData) {
    console.log('📤 ApiService: Saving push token to backend');

    // Get auth token from AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    if (!authToken) {
      throw new Error('No authentication token found');
    }

    return this.request('/auth/push-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(tokenData)
    });
  }
}

const apiService = new ApiService();
export default apiService;

// Connection test for development
if (__DEV__) {
  (async () => {
    try {
      const result = await apiService.get('/health');
      console.log('✅ KapTaze API connection successful:', result);
    } catch (err) {
      console.error('❌ KapTaze API connection failed:', err.message);
    }
  })();
}