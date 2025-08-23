/**
 * KapTaze API Service
 * Centralized API communication layer
 */

window.KapTazeAPIService = {
    
    // Generic API request method
    async request(endpoint, options = {}) {
        const url = window.KapTazeAPI.buildUrl(endpoint);
        const headers = window.KapTazeAPI.getAuthHeaders();
        
        const config = {
            method: options.method || 'GET',
            headers: { ...headers, ...options.headers },
            ...options
        };
        
        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }
        
        try {
            console.log(`📡 API Request: ${config.method} ${endpoint}`);
            
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            console.log(`✅ API Response: ${config.method} ${endpoint}`, data);
            return data;
            
        } catch (error) {
            console.error(`❌ API Error: ${config.method} ${endpoint}`, error);
            
            // Handle auth errors
            if (error.message.includes('token') || error.message.includes('Unauthorized')) {
                window.KapTazeAPI.clearAuth();
                if (window.location.pathname.includes('admin')) {
                    window.location.href = '/admin-login.html';
                } else if (window.location.pathname.includes('restaurant')) {
                    window.location.href = '/restaurant-login.html';
                }
            }
            
            throw error;
        }
    },
    
    // Authentication methods
    auth: {
        async adminLogin(username, password) {
            return await window.KapTazeAPIService.request(
                window.KapTazeAPI.endpoints.auth.adminLogin,
                {
                    method: 'POST',
                    body: { username, password }
                }
            );
        },
        
        async restaurantLogin(username, password) {
            return await window.KapTazeAPIService.request(
                window.KapTazeAPI.endpoints.auth.restaurantLogin,
                {
                    method: 'POST',
                    body: { username, password }
                }
            );
        },
        
        async logout() {
            try {
                await window.KapTazeAPIService.request(
                    window.KapTazeAPI.endpoints.auth.logout,
                    { method: 'POST' }
                );
            } finally {
                window.KapTazeAPI.clearAuth();
            }
        },
        
        async getMe() {
            return await window.KapTazeAPIService.request(
                window.KapTazeAPI.endpoints.auth.me
            );
        }
    },
    
    // Public methods
    public: {
        async submitApplication(applicationData) {
            return await window.KapTazeAPIService.request(
                window.KapTazeAPI.endpoints.public.applications,
                {
                    method: 'POST',
                    body: applicationData
                }
            );
        },
        
        async healthCheck() {
            return await window.KapTazeAPIService.request(
                window.KapTazeAPI.endpoints.public.health
            );
        }
    },
    
    // Admin methods
    admin: {
        async getApplications(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            const endpoint = params 
                ? `${window.KapTazeAPI.endpoints.admin.applications}?${params}`
                : window.KapTazeAPI.endpoints.admin.applications;
                
            return await window.KapTazeAPIService.request(endpoint);
        },
        
        async getApplication(applicationId) {
            return await window.KapTazeAPIService.request(
                `${window.KapTazeAPI.endpoints.admin.applications}/${applicationId}`
            );
        },
        
        async approveApplication(applicationId, data = {}) {
            return await window.KapTazeAPIService.request(
                `${window.KapTazeAPI.endpoints.admin.applications}/${applicationId}/approve`,
                {
                    method: 'POST',
                    body: data
                }
            );
        },
        
        async rejectApplication(applicationId, reason) {
            return await window.KapTazeAPIService.request(
                `${window.KapTazeAPI.endpoints.admin.applications}/${applicationId}/reject`,
                {
                    method: 'POST',
                    body: { reason }
                }
            );
        },
        
        async getRestaurants(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            const endpoint = params 
                ? `${window.KapTazeAPI.endpoints.admin.restaurants}?${params}`
                : window.KapTazeAPI.endpoints.admin.restaurants;
                
            return await window.KapTazeAPIService.request(endpoint);
        }
    },
    
    // Restaurant methods
    restaurant: {
        async getProfile() {
            return await window.KapTazeAPIService.request(
                window.KapTazeAPI.endpoints.restaurant.profile
            );
        },
        
        async updateProfile(profileData) {
            return await window.KapTazeAPIService.request(
                window.KapTazeAPI.endpoints.restaurant.profile,
                {
                    method: 'PATCH',
                    body: profileData
                }
            );
        },
        
        async getOrders(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            const endpoint = params 
                ? `${window.KapTazeAPI.endpoints.restaurant.orders}?${params}`
                : window.KapTazeAPI.endpoints.restaurant.orders;
                
            return await window.KapTazeAPIService.request(endpoint);
        }
    }
};

// Global error handler for API
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('API')) {
        console.error('🚨 Unhandled API Error:', event.reason);
    }
});