// API Service for React Native App
const API_BASE_URL = 'https://kaptaze-backend.onrender.com/api'; // Render backend URL

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
}

export default new ApiService();
// Otomatik bağlantı testi
if (__DEV__) {
  (async () => {
    try {
      const result = await new ApiService().get('/');
      console.log('API bağlantı testi başarılı:', result);
    } catch (err) {
      console.error('API bağlantı testi hatası:', err);
    }
  })();
}
// Test için örnek GET isteği
// apiService.get('/test-endpoint')
//   .then(data => console.log(data))
//   .catch(err => console.error(err));