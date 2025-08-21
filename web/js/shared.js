/**
 * KapTaze Shared Data Management System
 * Bu dosya tüm sayfalar arası veri paylaşımını sağlar
 */

// Global KapTaze Data Object
window.KapTazeData = {
    // Storage Keys
    STORAGE_KEYS: {
        REGISTRATIONS: 'kaptaze_registrations',
        APPROVED_RESTAURANTS: 'kaptaze_approved_restaurants',
        ADMIN_TOKEN: 'kaptaze_admin_token',
        RESTAURANT_TOKEN: 'kaptaze_restaurant_token'
    },

    // Registration Management
    saveRegistration: function(data) {
        try {
            const existingRegistrations = this.getRegistrations();
            const registration = {
                id: Date.now().toString(),
                ...data,
                status: 'pending',
                createdAt: new Date().toISOString(),
                type: data.type || 'restaurant'
            };
            
            existingRegistrations.push(registration);
            localStorage.setItem(this.STORAGE_KEYS.REGISTRATIONS, JSON.stringify(existingRegistrations));
            
            console.log('✅ Registration saved:', registration.businessName);
            return registration;
        } catch (error) {
            console.error('❌ Registration save error:', error);
            return null;
        }
    },

    getRegistrations: function() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.REGISTRATIONS);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('❌ Registration load error:', error);
            return [];
        }
    },

    getRestaurantApplications: function() {
        return this.getRegistrations().filter(reg => reg.type === 'restaurant');
    },

    approveRegistration: function(registrationId) {
        try {
            const registrations = this.getRegistrations();
            const updated = registrations.map(reg => {
                if (reg.id === registrationId) {
                    reg.status = 'approved';
                    reg.approvedAt = new Date().toISOString();
                }
                return reg;
            });

            localStorage.setItem(this.STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
            
            // Also add to approved restaurants for mobile app
            const approvedReg = updated.find(r => r.id === registrationId);
            if (approvedReg) {
                this.addApprovedRestaurant(approvedReg);
            }

            console.log('✅ Registration approved:', registrationId);
            return true;
        } catch (error) {
            console.error('❌ Registration approval error:', error);
            return false;
        }
    },

    rejectRegistration: function(registrationId) {
        try {
            const registrations = this.getRegistrations();
            const updated = registrations.map(reg => {
                if (reg.id === registrationId) {
                    reg.status = 'rejected';
                    reg.rejectedAt = new Date().toISOString();
                }
                return reg;
            });

            localStorage.setItem(this.STORAGE_KEYS.REGISTRATIONS, JSON.stringify(updated));
            console.log('❌ Registration rejected:', registrationId);
            return true;
        } catch (error) {
            console.error('❌ Registration rejection error:', error);
            return false;
        }
    },

    // Approved Restaurants for Mobile App
    addApprovedRestaurant: function(registration) {
        try {
            const approved = this.getApprovedRestaurants();
            const restaurant = {
                id: registration.id,
                name: registration.businessName,
                category: registration.businessCategory || 'Genel',
                address: registration.businessAddress,
                email: registration.email,
                phone: registration.phone,
                username: registration.username,
                approvedAt: registration.approvedAt || new Date().toISOString()
            };

            approved.push(restaurant);
            localStorage.setItem(this.STORAGE_KEYS.APPROVED_RESTAURANTS, JSON.stringify(approved));
            
            console.log('✅ Restaurant added to approved list:', restaurant.name);
            return restaurant;
        } catch (error) {
            console.error('❌ Approved restaurant add error:', error);
            return null;
        }
    },

    getApprovedRestaurants: function() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEYS.APPROVED_RESTAURANTS);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('❌ Approved restaurants load error:', error);
            return [];
        }
    },

    // Authentication
    setAdminToken: function(token, userData) {
        localStorage.setItem(this.STORAGE_KEYS.ADMIN_TOKEN, token);
        localStorage.setItem('adminUser', JSON.stringify(userData));
    },

    getAdminToken: function() {
        return localStorage.getItem(this.STORAGE_KEYS.ADMIN_TOKEN);
    },

    clearAdminToken: function() {
        localStorage.removeItem(this.STORAGE_KEYS.ADMIN_TOKEN);
        localStorage.removeItem('adminUser');
    },

    setRestaurantToken: function(token, userData) {
        localStorage.setItem(this.STORAGE_KEYS.RESTAURANT_TOKEN, token);
        localStorage.setItem('restaurantUser', JSON.stringify(userData));
    },

    getRestaurantToken: function() {
        return localStorage.getItem(this.STORAGE_KEYS.RESTAURANT_TOKEN);
    },

    clearRestaurantToken: function() {
        localStorage.removeItem(this.STORAGE_KEYS.RESTAURANT_TOKEN);
        localStorage.removeItem('restaurantUser');
    },

    // Navigation Helpers
    navigateToPage: function(page) {
        const pages = {
            'home': 'index.html',
            'customer-registration': 'customer-registration.html',
            'admin-login': 'admin-login.html',
            'admin-panel': 'admin-panel.html',
            'restaurant-login': 'restaurant-login.html',
            'restaurant-panel': 'restaurant-panel.html'
        };

        if (pages[page]) {
            window.location.href = pages[page];
        } else {
            console.error('Unknown page:', page);
        }
    },

    // Debug Helpers
    clearAllData: function() {
        Object.values(this.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        localStorage.removeItem('adminUser');
        localStorage.removeItem('restaurantUser');
        console.log('🧹 All KapTaze data cleared');
    },

    showDataStats: function() {
        const registrations = this.getRegistrations();
        const approved = this.getApprovedRestaurants();
        console.log('📊 KapTaze Data Stats:');
        console.log('- Total registrations:', registrations.length);
        console.log('- Pending registrations:', registrations.filter(r => r.status === 'pending').length);
        console.log('- Approved restaurants:', approved.length);
        console.log('- Admin logged in:', !!this.getAdminToken());
        console.log('- Restaurant logged in:', !!this.getRestaurantToken());
    }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌱 KapTaze Shared Data System loaded');
    
    // Debug: Show data stats in console
    if (window.location.hostname === 'localhost') {
        window.KapTazeData.showDataStats();
    }
});

// Global helper functions for backward compatibility
window.showNotification = function(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add basic styles if not present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            .notification.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .notification.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .notification.info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
            .notification-content { display: flex; justify-content: space-between; align-items: center; }
            .notification button { background: none; border: none; font-size: 18px; cursor: pointer; }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
};