// API Service for React Native App - Updated for KapTaze Backend API
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://kaptaze-backend-api.onrender.com'; // Updated backend URL

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.isRefreshing = false;
    this.failedQueue = [];
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

  // Token refresh mechanism
  async refreshToken() {
    if (this.isRefreshing) {
      // If already refreshing, wait for it to complete
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const currentToken = await AsyncStorage.getItem('@kaptaze_user_token');
      const userData = await AsyncStorage.getItem('@kaptaze_user_data');

      if (!currentToken || !userData) {
        throw new Error('No token found');
      }

      const user = JSON.parse(userData);
      console.log('🔄 Attempting to refresh token...');

      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id || user._id,
          oldToken: currentToken
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      const newToken = data.data.token;

      // Update stored token
      await AsyncStorage.setItem('@kaptaze_user_token', newToken);
      await AsyncStorage.setItem('@kaptaze_user_data', JSON.stringify(data.data.user));

      console.log('✅ Token refreshed successfully');

      // Process queued requests
      this.failedQueue.forEach(({ resolve }) => resolve(newToken));
      this.failedQueue = [];

      return newToken;

    } catch (error) {
      console.error('❌ Token refresh failed:', error);

      // Process queued requests with error
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];

      // Clear stored data on refresh failure
      await AsyncStorage.multiRemove(['@kaptaze_user_token', '@kaptaze_user_data']);

      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Add auth token if available
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`📡 API Request: ${config.method} ${url}`);
      console.log('📦 Request body:', config.body);

      const response = await fetch(url, config);
      const data = await response.json();

      // Check for 401 error and attempt token refresh
      if (response.status === 401 && endpoint !== '/auth/refresh-token') {
        console.log('🔄 401 detected, attempting token refresh...');

        try {
          const newToken = await this.refreshToken();

          // Retry the original request with new token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              Authorization: `Bearer ${newToken}`,
            },
          };

          console.log(`🔁 Retrying request with fresh token: ${config.method} ${url}`);
          const retryResponse = await fetch(url, retryConfig);
          const retryData = await retryResponse.json();

          if (!retryResponse.ok) {
            throw new Error(retryData.message || retryData.error || `HTTP error! status: ${retryResponse.status}`);
          }

          return this.fixTurkishInObject(retryData);

        } catch (refreshError) {
          console.error('❌ Token refresh failed, user needs to login again');
          throw new Error('Session expired. Please login again.');
        }
      }

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

  // Fetch user orders from backend (new Order schema)
  async fetchUserOrders(userId) {
    console.log("📱 Fetching orders for user:", userId);
    return this.get(`/orders/user/${userId}`);
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

    // Push token endpoint is now public - no auth required
    // This allows receiving notifications without login

    try {
      return await this.request('/auth/push-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tokenData)
      });
    } catch (error) {
      console.log('⚠️ Push token save failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  // Favorites Management
  async getFavorites() {
    console.log('📤 ApiService: Getting favorites from backend');

    // Get auth token from AsyncStorage
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    if (!authToken) {
      throw new Error('No authentication token found');
    }

    return this.request('/auth/favorites', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  async addToFavorites(restaurantId) {
    console.log('❤️ ApiService: Adding restaurant to favorites:', restaurantId);

    // Get auth token from AsyncStorage
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    if (!authToken) {
      throw new Error('No authentication token found');
    }

    return this.request(`/auth/favorites/${restaurantId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  async removeFromFavorites(restaurantId) {
    console.log('💔 ApiService: Removing restaurant from favorites:', restaurantId);

    // Get auth token from AsyncStorage
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    if (!authToken) {
      throw new Error('No authentication token found');
    }

    return this.request(`/auth/favorites/${restaurantId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  // Notification Management
  async getNotifications() {
    console.log('🔔 ApiService: Getting notifications from backend');

    // Get auth token from AsyncStorage
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    if (!authToken) {
      throw new Error('No authentication token found');
    }

    return this.request('/auth/notifications', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  async markNotificationRead(notificationId) {
    console.log('📖 ApiService: Marking notification as read:', notificationId);

    // Get auth token from AsyncStorage
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    if (!authToken) {
      throw new Error('No authentication token found');
    }

    return this.request(`/auth/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  async markAllNotificationsRead() {
    console.log('📖 ApiService: Marking all notifications as read');

    // Get auth token from AsyncStorage
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    if (!authToken) {
      throw new Error('No authentication token found');
    }

    return this.request('/auth/notifications/mark-all-read', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  async markNotificationUnread(notificationId) {
    console.log('📫 ApiService: Marking notification as unread:', notificationId);
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');
    if (!authToken) {
      throw new Error('No authentication token found');
    }
    return this.request(`/auth/notifications/${notificationId}/unread`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  async deleteNotification(notificationId) {
    console.log('🗑️ ApiService: Deleting notification:', notificationId);
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');
    if (!authToken) {
      throw new Error('No authentication token found');
    }
    return this.request(`/auth/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  async clearAllNotifications() {
    console.log('🗑️ ApiService: Clearing all notifications');

    // Get auth token from AsyncStorage
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    if (!authToken) {
      throw new Error('No authentication token found');
    }

    return this.request('/auth/notifications/clear-all', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }

  // Submit order rating
  async submitOrderRating(ratingData) {
    console.log('📊 Submitting order rating:', ratingData);

    try {
      // Get auth token from AsyncStorage
      const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

      console.log('🔐 Debug token info:');
      console.log('🔐 Token exists:', !!authToken);
      console.log('🔐 Token length:', authToken ? authToken.length : 0);
      console.log('🔐 Token preview:', authToken ? authToken.substring(0, 50) + '...' : 'N/A');

      if (!authToken) {
        throw new Error('No authentication token found - User needs to login');
      }

      // Create FormData for multipart upload if photos exist
      let requestBody;
      let headers = {
        'Authorization': `Bearer ${authToken}`
      };

      if (ratingData.photos && ratingData.photos.length > 0) {
        // Use FormData for photo uploads
        const formData = new FormData();
        formData.append('orderId', ratingData.orderId);
        formData.append('rating', ratingData.rating.toString());
        if (ratingData.comment) {
          formData.append('comment', ratingData.comment);
        }

        // Add photos
        ratingData.photos.forEach((photo, index) => {
          formData.append('photos', {
            uri: photo.uri,
            type: photo.type || 'image/jpeg',
            name: photo.name || `rating_photo_${index}.jpg`,
          });
        });

        requestBody = formData;
        // Don't set Content-Type header, let fetch handle it for FormData
      } else {
        // JSON request for text-only ratings
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify({
          orderId: ratingData.orderId,
          rating: ratingData.rating,
          comment: ratingData.comment || '',
        });
      }

      const response = await this.request('/auth/orders/rating', {
        method: 'POST',
        headers,
        body: requestBody,
      });

      console.log('✅ Rating submitted successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Rating submission failed:', error);
      throw error;
    }
  }

  // Get surprise stories for main page
  async getSurpriseStories(limit = 10, city = null) {
    try {
      let url = `/auth/surprise-stories?limit=${limit}`;
      if (city) {
        url += `&city=${encodeURIComponent(city)}`;
      }

      console.log('🌍 Fetching stories for:', { limit, city, url });
      const response = await this.get(url);

      if (response.success && response.stories) {
        // Fix Turkish characters in story data
        response.stories = response.stories.map(story => ({
          ...story,
          restaurant: story.restaurant ? {
            ...story.restaurant,
            name: this.fixTurkishChars(story.restaurant.name)
          } : null,
          consumer: story.consumer ? {
            ...story.consumer,
            name: this.fixTurkishChars(story.consumer.name)
          } : null,
          packageInfo: story.packageInfo ? {
            ...story.packageInfo,
            packageName: this.fixTurkishChars(story.packageInfo.packageName)
          } : null
        }));
      }

      return response;
    } catch (error) {
      console.error('❌ Failed to load surprise stories:', error);
      throw error;
    }
  }

  // Payment processing with Iyzico
  async createPayment(paymentData) {
    console.log('💳 ApiService: Creating payment request');

    // Get auth token from AsyncStorage
    const authToken = await AsyncStorage.getItem('@kaptaze_user_token');

    if (!authToken) {
      throw new Error('No authentication token found');
    }

    return this.request('/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(paymentData)
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