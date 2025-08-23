/**
 * KapTaze Unified MongoDB Service
 * SINGLE SOURCE OF TRUTH - MongoDB Atlas Only
 * NO localStorage, NO sessionStorage, NO client-side storage
 * Version: 2025.08.23.01
 */

class KapTazeUnifiedMongoDB {
    constructor() {
        this.apiUrl = '/.netlify/functions/unified-mongodb';
        this.cache = {
            data: null,
            timestamp: null,
            ttl: 30000 // 30 seconds only
        };
        
        // Session state in memory only - never persisted
        this.sessionState = {
            currentUser: null,
            authToken: null,
            sessionId: null,
            expires: null
        };
        
        console.log('🌐 KapTaze Unified MongoDB Service initialized - Atlas only');
    }
    
    // CORE API - Direct MongoDB operations only
    async makeRequest(action, data = null) {
        try {
            console.log(`📡 MongoDB Request: ${action}`, data ? 'with data' : 'no data');
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.sessionState.authToken ? `Bearer ${this.sessionState.authToken}` : ''
                },
                body: JSON.stringify({
                    action: action,
                    data: data,
                    sessionId: this.sessionState.sessionId
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ MongoDB HTTP Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                console.error(`❌ MongoDB API Error for ${action}:`, result.error);
                throw new Error(result.error || 'MongoDB request failed');
            }
            
            console.log(`✅ MongoDB success for ${action}`);
            return result;
            
        } catch (error) {
            console.error(`❌ MongoDB Error (${action}):`, error.message);
            throw error;
        }
    }
    
    // USER AUTHENTICATION - Memory session only
    async authenticateUser(username, password, role = null) {
        try {
            const result = await this.makeRequest('authenticate', {
                username,
                password,
                role
            });
            
            if (result.success && result.data.user) {
                // Store session in memory only - NO localStorage
                this.sessionState = {
                    currentUser: result.data.user,
                    authToken: result.data.token,
                    sessionId: result.data.sessionId,
                    expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                };
                
                console.log('✅ User authenticated - session stored in memory only');
                return result.data;
            }
            
            return null;
        } catch (error) {
            console.error('❌ Authentication failed:', error.message);
            throw error;
        }
    }
    
    // SESSION MANAGEMENT - Memory only
    getCurrentUser() {
        if (!this.sessionState.currentUser || !this.sessionState.expires) {
            return null;
        }
        
        // Check if session expired
        if (new Date() > this.sessionState.expires) {
            this.clearSession();
            return null;
        }
        
        return this.sessionState.currentUser;
    }
    
    isAuthenticated() {
        return !!this.getCurrentUser();
    }
    
    clearSession() {
        this.sessionState = {
            currentUser: null,
            authToken: null,
            sessionId: null,
            expires: null
        };
        console.log('🧹 Session cleared from memory');
    }
    
    // CUSTOMER APPLICATIONS
    async addApplication(applicationData) {
        const result = await this.makeRequest('addApplication', applicationData);
        this.invalidateCache();
        return result.data;
    }
    
    async getApplications() {
        const result = await this.makeRequest('getApplications');
        return result.data || [];
    }
    
    async approveApplication(applicationId, credentials) {
        const result = await this.makeRequest('approveApplication', {
            applicationId,
            credentials
        });
        this.invalidateCache();
        return result.data;
    }
    
    // RESTAURANT MANAGEMENT
    async getRestaurants() {
        const result = await this.makeRequest('getRestaurants');
        return result.data || [];
    }
    
    async getRestaurantByUserId(userId) {
        const result = await this.makeRequest('getRestaurantByUserId', { userId });
        return result.data;
    }
    
    // PACKAGE MANAGEMENT
    async getPackages(restaurantId = null) {
        const result = await this.makeRequest('getPackages', { restaurantId });
        return result.data || [];
    }
    
    async addPackage(restaurantId, packageData) {
        console.log('💾 Adding package to MongoDB only:', restaurantId);
        
        const packageWithId = {
            id: `PKG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            restaurantId: restaurantId,
            ...packageData,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const result = await this.makeRequest('addPackage', packageWithId);
        this.invalidateCache();
        return result.data;
    }
    
    async updatePackage(packageId, packageData) {
        const result = await this.makeRequest('updatePackage', {
            packageId,
            ...packageData,
            updatedAt: new Date().toISOString()
        });
        this.invalidateCache();
        return result.data;
    }
    
    async deletePackage(packageId) {
        const result = await this.makeRequest('deletePackage', { packageId });
        this.invalidateCache();
        return result.data;
    }
    
    // ORDERS
    async getOrders(restaurantId = null) {
        const result = await this.makeRequest('getOrders', { restaurantId });
        return result.data || [];
    }
    
    // STATISTICS
    async getStatistics() {
        const result = await this.makeRequest('getStatistics');
        return result.data || {
            totalApplications: 0,
            pendingApplications: 0,
            approvedApplications: 0,
            activeRestaurants: 0,
            totalUsers: 0,
            totalPackages: 0,
            activePackages: 0,
            totalOrders: 0
        };
    }
    
    // CACHE MANAGEMENT - Memory only, no persistence
    invalidateCache() {
        this.cache = {
            data: null,
            timestamp: null,
            ttl: 30000
        };
        console.log('🗑️ Memory cache invalidated');
    }
    
    // REAL-TIME UPDATES
    notifyDataChange(action, data = null) {
        window.dispatchEvent(new CustomEvent('kaptaze_data_updated', {
            detail: { 
                action,
                data,
                timestamp: new Date().toISOString() 
            }
        }));
        
        console.log(`📢 Data change notification: ${action}`);
    }
    
    onDataChange(callback) {
        window.addEventListener('kaptaze_data_updated', callback);
        return () => window.removeEventListener('kaptaze_data_updated', callback);
    }
    
    // DEVICE/BROWSER DETECTION
    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: {
                width: screen.width,
                height: screen.height
            },
            timestamp: new Date().toISOString()
        };
    }
}

// Global instance - single source of truth
window.KapTazeMongoDB = new KapTazeUnifiedMongoDB();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KapTazeUnifiedMongoDB;
}

console.log('🌐 KapTaze Unified MongoDB Service loaded - NO LOCAL STORAGE');