/**
 * KapTaze Shared Storage Service
 * Centralized data management across all panels (Admin, Restaurant, Customer)
 */

class KapTazeSharedStorage {
    constructor() {
        // Try MongoDB first, fallback to shared-storage
        this.mongoUrl = '/.netlify/functions/mongodb-storage';
        this.baseUrl = '/.netlify/functions/shared-storage';
        this.cache = {
            data: null,
            timestamp: null,
            ttl: 30000 // 30 seconds cache
        };
        
        console.log('🌐 KapTaze Shared Storage Service initialized');
    }
    
    // Core API Methods - Try MongoDB first, fallback to shared-storage
    async makeRequest(action, data = null) {
        try {
            console.log(`📡 Storage Request: ${action}`, data ? 'with data' : 'no data');
            
            // Try MongoDB first
            try {
                console.log(`🗄️ Trying MongoDB:`, this.mongoUrl);
                
                const mongoResponse = await fetch(this.mongoUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: action,
                        data: data
                    })
                });
                
                if (mongoResponse.ok) {
                    const result = await mongoResponse.json();
                    console.log(`✅ MongoDB success for ${action}:`, result);
                    return result;
                }
                
                console.log(`⚠️ MongoDB failed, trying fallback...`);
            } catch (mongoError) {
                console.log(`⚠️ MongoDB error, using fallback:`, mongoError.message);
            }
            
            // Fallback to shared-storage
            console.log(`🔗 Fallback URL:`, this.baseUrl);
            console.log(`📤 Request data:`, { action, data });
            
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: action,
                    data: data
                })
            });
            
            console.log(`📡 Response status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ HTTP Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log(`📥 Full response for ${action}:`, result);
            
            if (!result.success) {
                console.error(`❌ API Error for ${action}:`, result.error);
                throw new Error(result.error || 'Request failed');
            }
            
            console.log(`✅ Success for ${action}, returning:`, result.data);
            return result;
            
        } catch (error) {
            console.error(`❌ Shared Storage Error (${action}):`, {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    // Data Retrieval
    async getAllData(useCache = true) {
        // Check cache first
        if (useCache && this.cache.data && this.cache.timestamp) {
            const now = Date.now();
            if (now - this.cache.timestamp < this.cache.ttl) {
                console.log('📋 Using cached data');
                return this.cache.data;
            }
        }
        
        const result = await this.makeRequest('get');
        
        // Update cache
        this.cache.data = result.data;
        this.cache.timestamp = Date.now();
        
        return result.data;
    }
    
    // Application Management
    async addApplication(applicationData) {
        const result = await this.makeRequest('addApplication', applicationData);
        this.invalidateCache();
        return result.data;
    }
    
    async approveApplication(applicationId, credentials) {
        const result = await this.makeRequest('approveApplication', {
            applicationId,
            credentials
        });
        this.invalidateCache();
        return result.data;
    }
    
    async getApplications() {
        const data = await this.getAllData();
        return data.applications || [];
    }
    
    async getPendingApplications() {
        const applications = await this.getApplications();
        return applications.filter(app => app.status === 'pending');
    }
    
    async getApprovedApplications() {
        const applications = await this.getApplications();
        return applications.filter(app => app.status === 'approved');
    }
    
    // Restaurant Management
    async getRestaurants() {
        const data = await this.getAllData();
        const applications = data.applications || [];
        const restaurantUsers = data.restaurantUsers || [];
        const restaurantProfiles = data.restaurantProfiles || [];
        
        // Combine data into full restaurant objects
        return restaurantProfiles.map(profile => {
            const user = restaurantUsers.find(u => u.id === profile.userId);
            const application = applications.find(app => app.id === profile.applicationId);
            
            return {
                ...profile,
                user: user,
                application: application
            };
        });
    }
    
    async getRestaurantByUserId(userId) {
        const restaurants = await this.getRestaurants();
        return restaurants.find(restaurant => restaurant.user && restaurant.user.id === userId);
    }
    
    async getRestaurantByUsername(username) {
        const data = await this.getAllData();
        const user = data.restaurantUsers.find(u => u.username === username);
        if (!user) return null;
        
        return await this.getRestaurantByUserId(user.id);
    }
    
    // User Authentication
    async authenticateUser(username, password, role = null) {
        const data = await this.getAllData();
        
        let users = [];
        if (role === 'restaurant') {
            users = data.restaurantUsers || [];
        } else if (role === 'customer') {
            users = data.customerUsers || [];
        } else {
            users = [...(data.restaurantUsers || []), ...(data.customerUsers || [])];
        }
        
        const user = users.find(u => 
            u.username === username && 
            u.password === password && 
            u.status === 'active'
        );
        
        if (user && user.role === 'restaurant') {
            // Get restaurant profile for restaurant users
            const restaurant = await this.getRestaurantByUserId(user.id);
            return { user, restaurant };
        }
        
        return user ? { user } : null;
    }
    
    // Package Management
    async getPackages(restaurantId = null) {
        const data = await this.getAllData();
        const packages = data.packages || [];
        
        if (restaurantId) {
            return packages.filter(pkg => pkg.restaurantId === restaurantId && pkg.status === 'active');
        }
        
        return packages.filter(pkg => pkg.status === 'active');
    }
    
    async addPackage(restaurantId, packageData) {
        console.log('💾 Adding package for restaurant:', restaurantId);
        
        const packageWithId = {
            id: `PKG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            restaurantId: restaurantId,
            ...packageData,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        return this.makeRequest('addPackage', packageWithId);
    }
    
    // Statistics
    async getStatistics() {
        const data = await this.getAllData();
        
        return {
            totalApplications: (data.applications || []).length,
            pendingApplications: (data.applications || []).filter(app => app.status === 'pending').length,
            approvedApplications: (data.applications || []).filter(app => app.status === 'approved').length,
            activeRestaurants: (data.restaurantProfiles || []).filter(r => r.status === 'active').length,
            totalUsers: (data.restaurantUsers || []).length + (data.customerUsers || []).length,
            totalPackages: (data.packages || []).length,
            activePackages: (data.packages || []).filter(pkg => pkg.status === 'active').length,
            totalOrders: (data.orders || []).length
        };
    }
    
    // Utility Methods
    invalidateCache() {
        this.cache.data = null;
        this.cache.timestamp = null;
        console.log('🗑️ Cache invalidated');
    }
    
    // Fallback to local database
    async withFallback(sharedStorageOperation, localDatabaseOperation) {
        try {
            return await sharedStorageOperation();
        } catch (error) {
            console.log('⚠️ Shared storage failed, using local database fallback:', error.message);
            if (localDatabaseOperation && typeof localDatabaseOperation === 'function') {
                return localDatabaseOperation();
            }
            throw error;
        }
    }
    
    // Event system for real-time updates across panels
    notifyDataChange(action, data = null) {
        window.dispatchEvent(new CustomEvent('kaptaze_shared_data_updated', {
            detail: { 
                action,
                data,
                timestamp: new Date().toISOString() 
            }
        }));
        
        console.log(`📢 Data change notification: ${action}`);
    }
    
    // Subscribe to data changes
    onDataChange(callback) {
        window.addEventListener('kaptaze_shared_data_updated', callback);
        return () => window.removeEventListener('kaptaze_shared_data_updated', callback);
    }
}

// Initialize global shared storage service
window.KapTazeShared = new KapTazeSharedStorage();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KapTazeSharedStorage;
}

console.log('🌐 KapTaze Shared Storage Service loaded globally');