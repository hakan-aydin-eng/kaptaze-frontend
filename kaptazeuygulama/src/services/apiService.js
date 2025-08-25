// API Service for React Native App - Updated for KapTaze Backend API
const API_BASE_URL = 'https://kaptaze-backend-api.onrender.com'; // Updated backend URL

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
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