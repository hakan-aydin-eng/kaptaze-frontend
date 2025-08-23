/**
 * KapTaze Unified Authentication System
 * NO localStorage, NO sessionStorage - Memory only
 * Global access from any device/browser via MongoDB Atlas
 * Version: 2025.08.23.01
 */

class KapTazeUnifiedAuth {
    constructor() {
        this.mongodb = null;
        this.currentRole = null;
        
        console.log('🔐 Unified Authentication System initialized');
    }
    
    // Initialize with MongoDB service
    initialize() {
        if (!window.KapTazeMongoDB) {
            console.error('❌ MongoDB service not available');
            return false;
        }
        
        this.mongodb = window.KapTazeMongoDB;
        console.log('✅ Authentication system connected to MongoDB');
        return true;
    }
    
    // Universal login function for all panels
    async login(username, password, role = null, redirectUrl = null) {
        try {
            if (!this.initialize()) {
                throw new Error('Authentication system not initialized');
            }
            
            console.log(`🔐 Attempting login for ${role || 'auto'} user:`, username);
            
            // Authenticate with MongoDB
            const result = await this.mongodb.authenticateUser(username, password, role);
            
            if (!result || !result.user) {
                throw new Error('Invalid credentials');
            }
            
            console.log('✅ Authentication successful:', result.user.username);
            
            // Redirect based on user role
            const user = result.user;
            const targetUrl = this.getRedirectUrl(user.role, redirectUrl);
            
            if (targetUrl) {
                console.log(`🔄 Redirecting to: ${targetUrl}`);
                window.location.href = targetUrl;
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Login failed:', error.message);
            throw error;
        }
    }
    
    // Get appropriate redirect URL based on role
    getRedirectUrl(role, customUrl = null) {
        if (customUrl) {
            return customUrl;
        }
        
        const redirectMap = {
            'admin': '/admin-panel.html',
            'restaurant': '/restaurant-panel.html',
            'customer': '/customer-panel.html'
        };
        
        return redirectMap[role] || '/';
    }
    
    // Check if user is authenticated for specific role
    checkAuth(requiredRole = null) {
        if (!this.initialize()) {
            return false;
        }
        
        const user = this.mongodb.getCurrentUser();
        if (!user) {
            console.log('❌ No user session found');
            return false;
        }
        
        if (requiredRole && user.role !== requiredRole) {
            console.log(`❌ Role mismatch: required ${requiredRole}, got ${user.role}`);
            return false;
        }
        
        console.log(`✅ User authenticated: ${user.username} (${user.role})`);
        return true;
    }
    
    // Logout and redirect
    logout(redirectUrl = null) {
        if (!this.initialize()) {
            return;
        }
        
        const user = this.mongodb.getCurrentUser();
        const role = user ? user.role : null;
        
        this.mongodb.clearSession();
        console.log('🚪 User logged out');
        
        // Redirect to appropriate login page
        const loginUrls = {
            'admin': '/admin-login.html',
            'restaurant': '/restaurant-login.html',
            'customer': '/customer-login.html'
        };
        
        const targetUrl = redirectUrl || loginUrls[role] || '/';
        window.location.href = targetUrl;
    }
    
    // Get current user info
    getCurrentUser() {
        if (!this.initialize()) {
            return null;
        }
        
        return this.mongodb.getCurrentUser();
    }
    
    // Setup form handlers for login pages
    setupLoginForm(formId, role) {
        const form = document.getElementById(formId);
        if (!form) {
            console.error(`❌ Login form ${formId} not found`);
            return;
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const username = formData.get('username');
            const password = formData.get('password');
            
            if (!username || !password) {
                this.showError('Kullanıcı adı ve şifre gerekli');
                return;
            }
            
            try {
                this.showLoading('Giriş yapılıyor...');
                
                await this.login(username, password, role);
                
            } catch (error) {
                this.showError(error.message);
            } finally {
                this.hideLoading();
            }
        });
        
        console.log(`✅ Login form setup for ${role}`);
    }
    
    // Setup authentication check for protected pages
    setupAuthCheck(requiredRole) {
        document.addEventListener('DOMContentLoaded', () => {
            if (!this.checkAuth(requiredRole)) {
                // Redirect to appropriate login page
                const loginUrls = {
                    'admin': '/admin-login.html',
                    'restaurant': '/restaurant-login.html',
                    'customer': '/customer-login.html'
                };
                
                const loginUrl = loginUrls[requiredRole] || '/';
                console.log(`❌ Authentication required, redirecting to: ${loginUrl}`);
                window.location.href = loginUrl;
            }
        });
        
        console.log(`✅ Auth check setup for ${requiredRole}`);
    }
    
    // UI Helper functions
    showLoading(message = 'Yükleniyor...') {
        const existing = document.getElementById('auth-loading');
        if (existing) {
            existing.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'auth-loading';
        overlay.innerHTML = `
            <div style="
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background: rgba(0,0,0,0.5); 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                z-index: 10000;
            ">
                <div style="
                    background: white; 
                    padding: 20px; 
                    border-radius: 8px; 
                    text-align: center;
                ">
                    <div class="spinner" style="
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3498db;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        animation: spin 2s linear infinite;
                        margin: 0 auto 10px;
                    "></div>
                    <p>${message}</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(overlay);
    }
    
    hideLoading() {
        const loading = document.getElementById('auth-loading');
        if (loading) {
            loading.remove();
        }
    }
    
    showError(message) {
        this.hideLoading();
        
        // Remove any existing error
        const existing = document.getElementById('auth-error');
        if (existing) {
            existing.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.id = 'auth-error';
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f44336;
                color: white;
                padding: 15px;
                border-radius: 5px;
                z-index: 10001;
                max-width: 300px;
            ">
                <strong>Hata:</strong> ${message}
                <button onclick="this.parentElement.parentElement.remove()" style="
                    float: right;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    margin-left: 10px;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
        
        console.error('❌ Auth Error:', message);
    }
}

// Create global instance
window.KapTazeAuth = new KapTazeUnifiedAuth();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KapTazeUnifiedAuth;
}

console.log('🔐 KapTaze Unified Authentication System loaded');