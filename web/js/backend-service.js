// Backend API Configuration for KapTaze
class BackendService {
    constructor() {
        this.baseURL = this.getBackendURL();
        
        // 🔴 API TEST MODE - localStorage fallback'leri devre dışı bırak
        this.API_TEST_MODE = window.location.search.includes('apitest=true');
        if (this.API_TEST_MODE) {
            console.log('🔴 API TEST MODE ACTIVE - No fallbacks, no demo data!');
        }
        
        this.endpoints = {
            auth: '/auth',
            restaurants: '/restaurant',
            customers: '/restaurant/customers',
            orders: '/orders',
            admin: '/admin',
            packages: '/restaurant/packages',
            // Public endpoints (no auth required)
            public: {
                restaurants: '/public/restaurants',
                packages: '/public/packages',
                stats: '/public/stats'
            }
        };
    }

    getBackendURL() {
        // Use unified API config if available
        if (window.KapTazeAPI && window.KapTazeAPI.config) {
            return window.KapTazeAPI.config.baseUrl;
        }
        
        // Fallback: Environment-based backend URL configuration
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001'; // Local development
        } else {
            return 'https://kaptaze-backend-api.onrender.com'; // Production
        }
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };

        const token = localStorage.getItem('kaptaze_token');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            console.log('🌐 Making API request to:', url);
            console.log('📋 Request config:', config);
            
            const response = await fetch(url, config);
            
            console.log('📨 Response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', errorText);
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ API Response data:', data);
            return data;
        } catch (error) {
            // Detailed error handling
            console.error('🚨 Backend Service Error:', {
                url: url,
                error: error.message,
                stack: error.stack
            });
            console.log('⚠️ Using demo data - Backend not available:', error.message);
            throw error;
        }
    }

    // Authentication Methods
    async login(email, password, userType) {
        return this.makeRequest(`${this.endpoints.auth}/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password, userType })
        });
    }

    async restaurantLogin(username, password) {
        return this.makeRequest(`${this.endpoints.auth}/restaurant/login`, {
            method: 'POST',  
            body: JSON.stringify({ username, password, userType: 'restaurant' })
        });
    }

    async register(userData) {
        return this.makeRequest(`${this.endpoints.auth}/register`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        // NO localStorage - API-only logout
        try {
            return await this.makeRequest(`${this.endpoints.auth}/logout`, {
                method: 'POST'
            });
        } catch (error) {
            console.log('Logout API call failed, but clearing session anyway');
            return Promise.resolve();
        }
    }

    async checkSession() {
        try {
            // Check if user has valid session via API
            return await this.makeRequest(`${this.endpoints.auth}/session`, {
                method: 'GET'
            });
        } catch (error) {
            console.log('Session check failed:', error);
            return null;
        }
    }

    // Restaurant Methods
    async getRestaurants() {
        return this.makeRequest(this.endpoints.restaurants);
    }

    // Public Methods (no authentication required)
    async getPublicRestaurants() {
        // NO FALLBACK - Direct API call only
        return await this.makeRequest(this.endpoints.public.restaurants);
    }

    async getRestaurantById(id) {
        return this.makeRequest(`${this.endpoints.restaurants}/${id}`);
    }

    async updateRestaurant(id, data) {
        return this.makeRequest(`${this.endpoints.restaurants}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // Package Methods
    async getPackages() {
        return this.makeRequest(this.endpoints.packages);
    }

    async createPackage(packageData) {
        return this.makeRequest(this.endpoints.packages, {
            method: 'POST',
            body: JSON.stringify(packageData)
        });
    }

    async updatePackage(id, data) {
        return this.makeRequest(`${this.endpoints.packages}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deletePackage(id) {
        return this.makeRequest(`${this.endpoints.packages}/${id}`, {
            method: 'DELETE'
        });
    }

    // Order Methods
    async createOrder(orderData) {
        return this.makeRequest(this.endpoints.orders, {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    async getOrders() {
        return this.makeRequest(this.endpoints.orders);
    }

    async updateOrderStatus(id, status) {
        return this.makeRequest(`${this.endpoints.orders}/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    // Public Methods (Ana sayfa için - token gerektirmeyen)
    async getPublicStats() {
        // NO FALLBACK - Direct API call only
        const response = await fetch(`${this.baseURL}/public/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('📊 Public stats loaded:', result);
            return result.data || result;
        } else {
            throw new Error(`Stats API failed: ${response.status}`);
        }
    }

    async getPublicPackages() {
        // NO FALLBACK - Direct API call only
        const response = await fetch(`${this.baseURL}/public/packages`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('📦 Public packages loaded');
            return result.data?.packages || result;
        } else {
            throw new Error(`Packages API failed: ${response.status}`);
        }
    }

    // Demo methods removed - NO FALLBACKS

    // Admin Methods
    async getAdminStats() {
        return this.makeRequest(`${this.endpoints.admin}/stats`);
    }

    async getAllUsers() {
        return this.makeRequest(`${this.endpoints.admin}/users`);
    }

    async updateUserStatus(userId, status) {
        return this.makeRequest(`${this.endpoints.admin}/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    }

    // Utility Methods
    isAuthenticated() {
        return !!localStorage.getItem('kaptaze_token');
    }

    getCurrentUser() {
        const user = localStorage.getItem('kaptaze_user');
        return user ? JSON.parse(user) : null;
    }

    saveUserData(user, token) {
        localStorage.setItem('kaptaze_user', JSON.stringify(user));
        localStorage.setItem('kaptaze_token', token);
    }
}

// Export for use in other files
window.BackendService = BackendService;
