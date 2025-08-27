// Backend API Configuration for KapTaze
class BackendService {
    constructor() {
        this.baseURL = this.getBackendURL();
        this.endpoints = {
            auth: '/auth',
            restaurants: '/restaurant',
            customers: '/restaurant/customers',
            orders: '/orders',
            admin: '/admin',
            packages: '/restaurant/packages'
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

    async register(userData) {
        return this.makeRequest(`${this.endpoints.auth}/register`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        localStorage.removeItem('kaptaze_token');
        localStorage.removeItem('kaptaze_user');
        return Promise.resolve();
    }

    // Restaurant Methods
    async getRestaurants() {
        return this.makeRequest(this.endpoints.restaurants);
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
