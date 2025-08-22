/**
 * KapTaze - Centralized Database System
 * Professional data management for Restaurant, Admin, and Customer panels
 */

class KapTazeDatabase {
    constructor() {
        this.storageKey = 'kaptaze_database';
        this.init();
    }

    // Initialize database structure
    init() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                // Restaurant Applications (from customer registration)
                applications: [],
                
                // Restaurant Users (approved applications with credentials)
                restaurantUsers: [],
                
                // Restaurant Profiles (detailed restaurant information)
                restaurantProfiles: [],
                
                // Customer Users
                customerUsers: [],
                
                // Restaurant Packages/Menu Items
                packages: [],
                
                // Orders and Transactions
                orders: [],
                
                // System metadata
                metadata: {
                    createdAt: new Date().toISOString(),
                    version: '1.0.0'
                }
            };
            
            this.saveData(initialData);
            console.log('📊 KapTaze Database initialized');
        } else {
            console.log('📊 KapTaze Database loaded');
        }
    }

    // Core data operations
    getData() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }

    saveData(data) {
        data.metadata.lastModified = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        this.notifyDataChange();
    }

    // Restaurant Application Management
    addApplication(applicationData) {
        const data = this.getData();
        
        const application = {
            id: this.generateId('APP'),
            ...applicationData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.applications.push(application);
        this.saveData(data);
        
        return application;
    }

    approveApplication(applicationId, credentials) {
        const data = this.getData();
        
        // Find and update application
        const appIndex = data.applications.findIndex(app => app.id === applicationId);
        if (appIndex === -1) return false;
        
        const application = data.applications[appIndex];
        application.status = 'approved';
        application.approvedAt = new Date().toISOString();
        
        // Create restaurant user account
        const restaurantUser = {
            id: this.generateId('RU'),
            applicationId: applicationId,
            username: credentials.username,
            password: credentials.password,
            email: application.email,
            phone: application.phone,
            role: 'restaurant',
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        data.restaurantUsers.push(restaurantUser);
        
        // Create basic restaurant profile
        const restaurantProfile = {
            id: this.generateId('RP'),
            userId: restaurantUser.id,
            applicationId: applicationId,
            
            // Basic info from application
            businessName: application.businessName,
            businessType: application.businessType,
            address: application.businessAddress,
            city: application.city,
            district: application.district,
            coordinates: {
                lat: application.businessLatitude,
                lng: application.businessLongitude
            },
            
            // Extended profile (to be filled by restaurant)
            description: '',
            website: '',
            mainImage: '',
            gallery: [],
            businessHours: {},
            specialties: [],
            
            // Status
            status: 'active',
            isVisible: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.restaurantProfiles.push(restaurantProfile);
        this.saveData(data);
        
        return {
            application,
            user: restaurantUser,
            profile: restaurantProfile
        };
    }

    // Restaurant Profile Management
    updateRestaurantProfile(profileId, updates) {
        const data = this.getData();
        
        const profileIndex = data.restaurantProfiles.findIndex(profile => profile.id === profileId);
        if (profileIndex === -1) return false;
        
        data.restaurantProfiles[profileIndex] = {
            ...data.restaurantProfiles[profileIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.saveData(data);
        return data.restaurantProfiles[profileIndex];
    }

    getRestaurantProfile(userId) {
        const data = this.getData();
        return data.restaurantProfiles.find(profile => profile.userId === userId);
    }

    // Package/Menu Management
    addPackage(restaurantId, packageData) {
        const data = this.getData();
        
        const packageObj = {
            id: this.generateId('PKG'),
            restaurantId: restaurantId,
            ...packageData,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.packages.push(packageObj);
        this.saveData(data);
        
        return packageObj;
    }

    updatePackage(packageId, updates) {
        const data = this.getData();
        
        const packageIndex = data.packages.findIndex(pkg => pkg.id === packageId);
        if (packageIndex === -1) return false;
        
        data.packages[packageIndex] = {
            ...data.packages[packageIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.saveData(data);
        return data.packages[packageIndex];
    }

    getRestaurantPackages(restaurantId) {
        const data = this.getData();
        return data.packages.filter(pkg => pkg.restaurantId === restaurantId && pkg.status === 'active');
    }

    // User Authentication
    authenticateUser(username, password, role = null) {
        const data = this.getData();
        
        let users = [];
        if (role === 'restaurant') {
            users = data.restaurantUsers;
        } else if (role === 'customer') {
            users = data.customerUsers;
        } else {
            users = [...data.restaurantUsers, ...data.customerUsers];
        }
        
        const user = users.find(u => 
            u.username === username && 
            u.password === password && 
            u.status === 'active'
        );
        
        if (user && user.role === 'restaurant') {
            // Get restaurant profile for restaurant users
            const profile = this.getRestaurantProfile(user.id);
            return { user, profile };
        }
        
        return user || null;
    }

    // Data retrieval methods
    getAllApplications() {
        return this.getData().applications;
    }

    getPendingApplications() {
        return this.getData().applications.filter(app => app.status === 'pending');
    }

    getAllRestaurants() {
        const data = this.getData();
        return data.restaurantProfiles.map(profile => {
            const user = data.restaurantUsers.find(u => u.id === profile.userId);
            const application = data.applications.find(app => app.id === profile.applicationId);
            
            return {
                ...profile,
                user: user,
                application: application
            };
        });
    }

    getActiveRestaurants() {
        return this.getAllRestaurants().filter(restaurant => 
            restaurant.status === 'active' && restaurant.isVisible
        );
    }

    // Utility methods
    generateId(prefix = 'ID') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}_${timestamp}_${random}`.toUpperCase();
    }

    // Event system for real-time updates
    notifyDataChange() {
        window.dispatchEvent(new CustomEvent('kaptaze_data_updated', {
            detail: { timestamp: new Date().toISOString() }
        }));
    }

    // Backup and restore
    exportData() {
        return JSON.stringify(this.getData(), null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            this.saveData(data);
            return true;
        } catch (error) {
            console.error('Database import failed:', error);
            return false;
        }
    }

    // Statistics
    getStatistics() {
        const data = this.getData();
        
        return {
            totalApplications: data.applications.length,
            pendingApplications: data.applications.filter(app => app.status === 'pending').length,
            activeRestaurants: data.restaurantProfiles.filter(r => r.status === 'active').length,
            totalPackages: data.packages.length,
            activePackages: data.packages.filter(pkg => pkg.status === 'active').length,
            totalOrders: data.orders.length
        };
    }
}

// Initialize global database instance
window.KapTazeDB = new KapTazeDatabase();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KapTazeDatabase;
}

console.log('🗄️ KapTaze Database System loaded');