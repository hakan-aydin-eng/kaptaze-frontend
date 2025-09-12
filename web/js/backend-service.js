// Backend API Configuration for KapTaze
class BackendService {
    constructor() {
        this.baseURL = this.getBackendURL();
        this.authToken = sessionStorage.getItem('kaptaze_session_token'); // Load existing token
        
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

        // Use instance token, sessionStorage, or localStorage fallback
        const token = this.authToken || 
                     sessionStorage.getItem('kaptaze_session_token') || 
                     localStorage.getItem('kaptaze_auth_token') ||  // Restaurant panel uses this
                     localStorage.getItem('kaptaze_token');
        console.log('🔑 TOKEN DEBUG:', {
            instanceToken: !!this.authToken,
            sessionToken: !!sessionStorage.getItem('kaptaze_session_token'), 
            authToken: !!localStorage.getItem('kaptaze_auth_token'),
            localToken: !!localStorage.getItem('kaptaze_token'),
            finalToken: !!token,
            tokenPreview: token?.substring(0, 20) + '...'
        });
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            credentials: 'include', // Include cookies for authentication
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        // Auto-stringify body if it's an object (but not FormData or string)
        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        // Remove Content-Type for FormData (let browser set it with boundary)
        if (config.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            console.log('🌐 Making API request to:', url);
            console.log('📋 Request config:', config);
            
            const response = await fetch(url, config);
            
            // Debug response headers for CORS and authentication
            console.log('📨 Response status:', response.status, response.statusText);
            console.log('📨 Response headers:', {
                'set-cookie': response.headers.get('set-cookie'),
                'access-control-allow-credentials': response.headers.get('access-control-allow-credentials'),
                'access-control-allow-origin': response.headers.get('access-control-allow-origin')
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API Error Response:', errorText);
                throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('✅ API Response data:', data);
            
            // Special logging for login responses
            if (url.includes('/login')) {
                console.log('🔐 LOGIN RESPONSE ANALYSIS:', {
                    success: data.success,
                    hasToken: !!(data.token || data.data?.token),
                    hasUser: !!(data.user || data.data?.user),
                    errorMessage: data.error || data.message,
                    responseStructure: Object.keys(data)
                });
            }
            
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
        // Try restaurant-specific login endpoint first
        console.log('🍴 Trying restaurant login endpoint...');
        
        try {
            const response = await this.makeRequest(`/restaurant/login`, {
                method: 'POST',  
                body: JSON.stringify({ username, password })
            });
            
            console.log('🔍 LOGIN RESPONSE DEBUG:', {
                response: response,
                hasToken: !!response?.token,
                hasAccessToken: !!response?.accessToken, 
                hasData: !!response?.data,
                dataHasToken: !!response?.data?.token,
                dataHasAccessToken: !!response?.data?.accessToken,
                responseKeys: response ? Object.keys(response) : null,
                dataKeys: response?.data ? Object.keys(response.data) : null
            });
            
            // Store token from login response - try different token field names
            // Priority: data.token first (most common in our API), then top-level token
            const token = response?.data?.token || response?.data?.accessToken || response?.token || response?.accessToken;
            if (token) {
                this.authToken = token;
                sessionStorage.setItem('kaptaze_session_token', token);
                console.log('✅ Auth token stored for session:', token.substring(0, 20) + '...');
            } else {
                console.log('❌ NO TOKEN FOUND in login response!');
            }
            
            return response;
            
        } catch (error) {
            console.log('❌ /restaurant/login failed, trying fallback /auth/restaurant/login');
            
            // Fallback to auth endpoint
            const response = await this.makeRequest(`${this.endpoints.auth}/restaurant/login`, {
                method: 'POST',  
                body: JSON.stringify({ username, password, userType: 'restaurant' })
            });
            
            console.log('🔍 FALLBACK LOGIN RESPONSE DEBUG:', response);
            
            // Store token from fallback response - try different token field names
            // Priority: data.token first (most common in our API), then top-level token
            const token = response?.data?.token || response?.data?.accessToken || response?.token || response?.accessToken;
            if (token) {
                this.authToken = token;
                sessionStorage.setItem('kaptaze_session_token', token);
                console.log('✅ Auth token stored for session (fallback):', token.substring(0, 20) + '...');
            } else {
                console.log('❌ NO TOKEN FOUND in fallback response!');
            }
            
            return response;
        }
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
        } finally {
            // Clear session token
            this.authToken = null;
            sessionStorage.removeItem('kaptaze_session_token');
        }
    }

    async checkSession() {
        try {
            // Check if user has valid session via API using /restaurant/me
            const response = await this.makeRequest(`${this.endpoints.restaurants}/me`, {
                method: 'GET'
            });
            
            // If successful, create user object format expected by restaurant panel
            if (response && response.data && response.data.user) {
                return {
                    user: {
                        username: response.data.user.username,
                        firstName: response.data.user.firstName,
                        lastName: response.data.user.lastName,
                        email: response.data.user.email,
                        role: response.data.user.role,
                        restaurantId: response.data.user.restaurantId
                    }
                };
            }
            
            return null;
        } catch (error) {
            console.log('Session check failed:', error);
            return null;
        }
    }

    // Restaurant Methods
    async getRestaurants() {
        return this.makeRequest(this.endpoints.restaurants);
    }

    async createRestaurantProfile(profileData) {
        // Create restaurant profile using /restaurant/me endpoint
        return this.makeRequest(`${this.endpoints.restaurants}/me`, {
            method: 'POST',
            body: profileData
        });
    }

    async updateRestaurantProfile(profileData) {
        // Update restaurant profile using /restaurant/me endpoint
        return this.makeRequest(`${this.endpoints.restaurants}/me`, {
            method: 'PUT', 
            body: profileData
        });
    }

    async getRestaurantProfile() {
        // Get restaurant profile using /restaurant/me endpoint
        return this.makeRequest(`${this.endpoints.restaurants}/me`, {
            method: 'GET'
        });
    }

    async uploadRestaurantImage(formData) {
        // Upload restaurant image to Cloudinary via /restaurant/profile/image endpoint
        return this.makeRequest(`${this.endpoints.restaurants}/profile/image`, {
            method: 'POST',
            body: formData
        });
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
