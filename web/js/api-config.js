/**
 * KapTaze API Configuration
 * Centralized API configuration for backend communication
 */

window.KapTazeAPI = {
    // API Base Configuration
    config: {
        baseUrl: window.location.hostname === 'localhost' 
            ? 'http://localhost:3002' 
            : 'https://kaptaze-backend-api.onrender.com',
        timeout: 15000, // Increased timeout for production
        version: 'v1'
    },
    
    // API Endpoints
    endpoints: {
        // Authentication endpoints
        auth: {
            adminLogin: '/auth/admin/login',
            restaurantLogin: '/auth/restaurant/login',
            logout: '/auth/logout',
            me: '/auth/me',
            refresh: '/auth/refresh'
        },
        
        // Public endpoints
        public: {
            applications: '/public/applications',
            health: '/health'
        },
        
        // Admin endpoints
        admin: {
            applications: '/admin/applications',
            restaurants: '/admin/restaurants',
            users: '/admin/users'
        },
        
        // Restaurant endpoints
        restaurant: {
            profile: '/restaurant/profile',
            orders: '/restaurant/orders',
            dashboard: '/restaurant/dashboard'
        }
    },
    
    // Storage keys
    storage: {
        authToken: 'kaptaze_auth_token',
        userData: 'kaptaze_user_data',
        userRole: 'kaptaze_user_role'
    },
    
    // Helper methods
    getAuthToken() {
        return localStorage.getItem(this.storage.authToken);
    },
    
    setAuthToken(token) {
        localStorage.setItem(this.storage.authToken, token);
    },
    
    clearAuth() {
        localStorage.removeItem(this.storage.authToken);
        localStorage.removeItem(this.storage.userData);
        localStorage.removeItem(this.storage.userRole);
    },
    
    getAuthHeaders() {
        const token = this.getAuthToken();
        return token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        } : {
            'Content-Type': 'application/json'
        };
    },
    
    // Build full URL
    buildUrl(endpoint) {
        return `${this.config.baseUrl}${endpoint}`;
    }
};

// Environment detection and debug info
if (window.location.hostname === 'localhost') {
    console.log('🔧 KapTaze API Config loaded:', window.KapTazeAPI.config);
}