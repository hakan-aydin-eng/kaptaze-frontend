/**
 * KapTaze Admin Dashboard - Backend API Integration
 * Version: 2025.08.24
 */

class KapTazeAdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentUser = null;
        this.data = {
            applications: [],
            restaurants: [],
            packages: [],
            orders: [],
            users: []
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Admin Dashboard (Backend API) initializing...');
        
        // Check authentication
        if (!this.checkAuthentication()) {
            return;
        }

        // Setup navigation
        this.setupNavigation();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Setup auto-refresh
        this.setupAutoRefresh();
        
        console.log('✅ Admin Dashboard ready');
    }

    checkAuthentication() {
        const token = window.KapTazeAPI.getAuthToken();
        const userRole = localStorage.getItem(window.KapTazeAPI.storage.userRole);
        
        if (!token || userRole !== 'admin') {
            console.log('❌ No admin authentication found');
            window.location.href = '/admin-login-v2.html';
            return false;
        }

        // Get user data
        const userData = localStorage.getItem(window.KapTazeAPI.storage.userData);
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUserInfo();
        }

        return true;
    }

    updateUserInfo() {
        if (this.currentUser) {
            // Update user avatar and name in top bar
            const userAvatar = document.querySelector('.user-avatar');
            const userName = document.querySelector('.user-menu span');
            
            if (userAvatar) {
                userAvatar.textContent = this.currentUser.firstName?.charAt(0) || 'A';
            }
            if (userName) {
                userName.textContent = this.currentUser.firstName || 'Admin';
            }
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-section]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
            });
        });

        // Setup filters
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.refreshApplications());
        }
    }

    showSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`)?.classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            applications: 'Başvuru Yönetimi',
            restaurants: 'Restoran Yönetimi', 
            packages: 'Paket Yönetimi',
            orders: 'Sipariş Yönetimi',
            users: 'Kullanıcı Yönetimi',
            analytics: 'Sistem Analizleri',
            settings: 'Ayarlar'
        };
        document.getElementById('page-title').textContent = titles[section] || section;

        this.currentSection = section;

        // Load section specific data
        this.loadSectionData(section);
    }

    async loadSectionData(section) {
        switch(section) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'applications':
                await this.loadApplicationsData();
                break;
            case 'restaurants':
                await this.loadRestaurantsData();
                break;
            case 'packages':
                await this.loadPackagesData();
                break;
            case 'orders':
                await this.loadOrdersData();
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
        }
    }

    async loadDashboardData() {
        try {
            console.log('📊 Loading dashboard data...');
            
            // Load applications and restaurants for dashboard stats
            await Promise.all([
                this.loadApplicationsData(),
                this.loadRestaurantsData()
            ]);
            
            // Update stats
            this.updateDashboardStats();
            
        } catch (error) {
            console.error('❌ Dashboard data load failed:', error);
        }
    }

    async loadApplicationsData() {
        try {
            console.log('📋 Loading applications data...');
            
            const response = await window.KapTazeAPIService.admin.getApplications();
            this.data.applications = response.data.applications || [];
            
            console.log(`✅ Loaded ${this.data.applications.length} applications`);
            
            // Update applications table
            this.updateApplicationsTable();
            
            // Update pending count badge
            const pendingCount = this.data.applications.filter(app => app.status === 'pending').length;
            document.getElementById('pending-count').textContent = pendingCount;
            
        } catch (error) {
            console.error('❌ Applications load failed:', error);
            this.showError('Başvurular yüklenirken hata oluştu: ' + error.message);
        }
    }

    updateDashboardStats() {
        const apps = this.data.applications;
        
        // Total applications
        document.getElementById('total-applications').textContent = apps.length;
        
        // Pending applications
        const pending = apps.filter(app => app.status === 'pending').length;
        document.getElementById('pending-applications').textContent = pending;
        
        // Active restaurants (from restaurants data)
        const activeRestaurants = this.data.restaurants.filter(r => r.status === 'active').length;
        document.getElementById('active-restaurants').textContent = activeRestaurants;
        
        // Today's applications
        const todayApps = apps.filter(app => {
            const today = new Date().toDateString();
            return new Date(app.submittedAt).toDateString() === today;
        }).length;
        document.getElementById('today-applications').textContent = todayApps;
        
        // Week approvals 
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekApprovals = apps.filter(app => 
            app.status === 'approved' && 
            new Date(app.reviewedAt) >= weekAgo
        ).length;
        document.getElementById('week-approvals').textContent = weekApprovals;
        
        // Mock data for other stats (coming soon)
        document.getElementById('total-packages').textContent = '0';
        document.getElementById('active-packages').textContent = '0';
        document.getElementById('total-orders').textContent = '0';
        
        // Update recent applications table
        this.updateRecentApplicationsTable();
    }

    updateApplicationsTable() {
        const tbody = document.getElementById('applications-table');
        if (!tbody) return;

        const filterValue = document.getElementById('status-filter')?.value || '';
        let filteredApps = this.data.applications;

        if (filterValue) {
            filteredApps = this.data.applications.filter(app => app.status === filterValue);
        }

        if (filteredApps.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        ${filterValue ? 'Bu durumda başvuru bulunamadı' : 'Henüz başvuru bulunmuyor'}
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredApps.map(app => `
            <tr>
                <td>
                    <div>
                        <strong>${app.businessName}</strong><br>
                        <small style="color: #6b7280;">${app.firstName} ${app.lastName}</small>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.875rem;">
                        <div>${app.email}</div>
                        <div style="color: #6b7280;">${app.phone}</div>
                    </div>
                </td>
                <td>
                    <span class="status-badge">${app.businessCategory}</span>
                </td>
                <td style="font-size: 0.875rem; color: #6b7280;">
                    ${new Date(app.submittedAt).toLocaleDateString('tr-TR')}
                </td>
                <td>
                    <div>
                        <span class="status-badge ${app.status}">
                            ${this.getStatusText(app.status)}
                        </span>
                        ${app.status === 'approved' && app.emailSent !== undefined ? `
                            <br><small style="color: ${app.emailSent ? '#059669' : '#dc2626'}; font-size: 0.75rem; margin-top: 4px; display: block;">
                                ${app.emailSent ? '📧 Email gönderildi' : '⚠️ Email gönderilemedi'}
                            </small>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        ${app.status === 'pending' ? `
                            <button class="btn btn-success btn-sm" onclick="dashboard.approveApplication('${app.applicationId}', '${app.businessName}')">
                                <i class="fas fa-check"></i> Onayla
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="dashboard.rejectApplication('${app.applicationId}')">
                                <i class="fas fa-times"></i> Reddet
                            </button>
                        ` : `
                            <button class="btn btn-info btn-sm" onclick="dashboard.viewApplication('${app.applicationId}')">
                                <i class="fas fa-eye"></i> Detay
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateRecentApplicationsTable() {
        const tbody = document.getElementById('recent-applications');
        if (!tbody) return;

        const recentApps = this.data.applications.slice(0, 5);

        if (recentApps.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 1rem; color: #6b7280;">
                        Henüz başvuru bulunmuyor
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recentApps.map(app => `
            <tr>
                <td>
                    <strong>${app.businessName}</strong><br>
                    <small style="color: #6b7280;">${app.firstName} ${app.lastName}</small>
                </td>
                <td>
                    <span class="status-badge">${app.businessCategory}</span>
                </td>
                <td style="font-size: 0.875rem; color: #6b7280;">
                    ${new Date(app.submittedAt).toLocaleDateString('tr-TR')}
                </td>
                <td>
                    <span class="status-badge ${app.status}">
                        ${this.getStatusText(app.status)}
                    </span>
                </td>
                <td>
                    ${app.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="dashboard.approveApplication('${app.applicationId}', '${app.businessName}')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : `
                        <button class="btn btn-info btn-sm" onclick="dashboard.viewApplication('${app.applicationId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    `}
                </td>
            </tr>
        `).join('');
    }

    getStatusText(status) {
        const statusMap = {
            pending: 'Beklemede',
            approved: 'Onaylandı',
            rejected: 'Reddedildi'
        };
        return statusMap[status] || status;
    }

    async approveApplication(applicationId, businessName) {
        try {
            console.log(`✅ Approving application: ${applicationId}`);
            
            const response = await window.KapTazeAPIService.admin.approveApplication(applicationId);
            
            console.log('✅ Application approved:', response);
            
            // Show success message with email status
            const emailStatus = response.data.emailStatus;
            let message = `${businessName} başvurusu onaylandı!`;
            
            if (emailStatus.sent) {
                message += ' 📧 Giriş bilgileri email ile gönderildi.';
            } else if (emailStatus.error) {
                message += ` ⚠️ Email gönderilemedi: ${emailStatus.error}`;
            }
            
            this.showSuccess(message);
            
            // Refresh applications
            await this.loadApplicationsData();
            
        } catch (error) {
            console.error('❌ Approve failed:', error);
            this.showError('Onaylama işlemi başarısız: ' + error.message);
        }
    }

    async rejectApplication(applicationId) {
        const reason = prompt('Reddetme sebebini girin:');
        if (!reason || reason.trim() === '') {
            return;
        }

        if (!confirm('Bu başvuruyu reddetmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            console.log(`❌ Rejecting application: ${applicationId}`);
            
            const response = await window.KapTazeAPIService.admin.rejectApplication(applicationId, reason.trim());
            
            console.log('✅ Application rejected:', response);
            
            this.showSuccess('Başvuru reddedildi.');
            
            // Refresh applications
            await this.loadApplicationsData();
            
        } catch (error) {
            console.error('❌ Reject failed:', error);
            this.showError('Reddetme işlemi başarısız: ' + error.message);
        }
    }

    async refreshApplications() {
        await this.loadApplicationsData();
    }

    // Restaurant management
    async loadRestaurantsData() {
        try {
            console.log('🏪 Loading restaurants data...');
            
            const response = await window.KapTazeAPIService.admin.getRestaurants();
            this.data.restaurants = response.data.restaurants || [];
            
            console.log(`✅ Loaded ${this.data.restaurants.length} restaurants`);
            
            // Update restaurants table
            this.updateRestaurantsTable();
            
        } catch (error) {
            console.error('❌ Restaurants load failed:', error);
            this.showError('Restoranlar yüklenirken hata oluştu: ' + error.message);
        }
    }

    updateRestaurantsTable() {
        const tbody = document.getElementById('restaurants-table');
        if (!tbody) return;

        if (this.data.restaurants.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-store" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        Henüz onaylanan restoran bulunmuyor
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.restaurants.map(restaurant => `
            <tr>
                <td>
                    <div>
                        <strong>${restaurant.name}</strong><br>
                        <small style="color: #6b7280;">${restaurant.category}</small>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.875rem;">
                        <div>${restaurant.email}</div>
                        <div style="color: #6b7280;">${restaurant.phone}</div>
                    </div>
                </td>
                <td style="font-size: 0.875rem;">
                    <div>${restaurant.address?.street || 'N/A'}</div>
                    <div style="color: #6b7280;">${restaurant.address?.district || ''}, ${restaurant.address?.city || ''}</div>
                </td>
                <td>
                    <div style="font-size: 0.875rem;">
                        <div><strong>User:</strong> ${restaurant.ownerId?.username || 'N/A'}</div>
                        <div style="color: #6b7280;">Email: ${restaurant.ownerId?.email || 'N/A'}</div>
                        <div style="color: #6b7280;">Son Giriş: ${restaurant.ownerId?.lastLogin ? new Date(restaurant.ownerId.lastLogin).toLocaleDateString('tr-TR') : 'Hiç giriş yapmamış'}</div>
                    </div>
                </td>
                <td style="font-size: 0.875rem; color: #6b7280;">
                    ${new Date(restaurant.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <span class="status-badge ${restaurant.status}">
                            ${this.getRestaurantStatusText(restaurant.status)}
                        </span>
                        <button class="btn btn-info btn-sm" onclick="dashboard.viewRestaurant('${restaurant._id}')">
                            <i class="fas fa-eye"></i> Detay
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getRestaurantStatusText(status) {
        const statusMap = {
            active: 'Aktif',
            inactive: 'Pasif',
            suspended: 'Askıda'
        };
        return statusMap[status] || status;
    }

    async loadPackagesData() {
        console.log('📦 Packages section - Coming soon');
        const tbody = document.getElementById('packages-table');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-box" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        Bu özellik yakında aktif edilecek
                    </td>
                </tr>
            `;
        }
    }

    async loadOrdersData() {
        console.log('🛒 Orders section - Coming soon');
        const tbody = document.getElementById('orders-table');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        Bu özellik yakında aktif edilecek
                    </td>
                </tr>
            `;
        }
    }

    // User management
    async loadUsersData() {
        try {
            console.log('👥 Loading users data...');
            
            const response = await window.KapTazeAPIService.admin.getUsers();
            this.data.users = response.data.users || [];
            
            console.log(`✅ Loaded ${this.data.users.length} users`);
            
            // Update users table
            this.updateUsersTable();
            
        } catch (error) {
            console.error('❌ Users load failed:', error);
            this.showError('Kullanıcılar yüklenirken hata oluştu: ' + error.message);
        }
    }

    updateUsersTable() {
        const tbody = document.getElementById('users-table');
        if (!tbody) return;

        if (this.data.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        Henüz kullanıcı bulunmuyor
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.users.map(user => `
            <tr>
                <td>
                    <div>
                        <strong>${user.firstName} ${user.lastName}</strong><br>
                        <small style="color: #6b7280;">${user.email}</small>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${user.role === 'admin' ? 'purple' : user.role === 'restaurant' ? 'blue' : 'green'}">
                        ${this.getUserRoleText(user.role)}
                    </span>
                </td>
                <td style="font-size: 0.875rem;">
                    ${user.phone || 'N/A'}
                </td>
                <td>
                    <div style="font-size: 0.875rem;">
                        ${user.role === 'restaurant' && user.restaurantId ? `
                            <div><strong>${user.restaurantId.name}</strong></div>
                            <div style="color: #6b7280;">${user.restaurantId.category}</div>
                        ` : 'N/A'}
                    </div>
                </td>
                <td style="font-size: 0.875rem; color: #6b7280;">
                    ${new Date(user.createdAt).toLocaleDateString('tr-TR')}
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span class="status-badge ${user.status}">
                            ${this.getUserStatusText(user.status)}
                        </span>
                        ${user.role !== 'admin' ? `
                            <button class="btn btn-info btn-sm" onclick="dashboard.viewUser('${user._id}')">
                                <i class="fas fa-eye"></i> Detay
                            </button>
                            ${user.status === 'active' ? `
                                <button class="btn btn-warning btn-sm" onclick="dashboard.suspendUser('${user._id}', '${user.firstName} ${user.lastName}')">
                                    <i class="fas fa-pause"></i> Askıya Al
                                </button>
                            ` : `
                                <button class="btn btn-success btn-sm" onclick="dashboard.activateUser('${user._id}', '${user.firstName} ${user.lastName}')">
                                    <i class="fas fa-play"></i> Aktif Et
                                </button>
                            `}
                        ` : `
                            <span style="font-size: 0.75rem; color: #6b7280;">Admin Kullanıcısı</span>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getUserRoleText(role) {
        const roleMap = {
            admin: 'Admin',
            restaurant: 'Restoran Sahibi',
            customer: 'Müşteri'
        };
        return roleMap[role] || role;
    }

    getUserStatusText(status) {
        const statusMap = {
            active: 'Aktif',
            inactive: 'Pasif',
            suspended: 'Askıda'
        };
        return statusMap[status] || status;
    }

    async suspendUser(userId, userName) {
        if (!confirm(`${userName} kullanıcısını askıya almak istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            await window.KapTazeAPIService.admin.updateUser(userId, { status: 'suspended' });
            this.showSuccess(`${userName} askıya alındı.`);
            await this.loadUsersData();
        } catch (error) {
            this.showError('Kullanıcı askıya alınırken hata oluştu: ' + error.message);
        }
    }

    async activateUser(userId, userName) {
        try {
            await window.KapTazeAPIService.admin.updateUser(userId, { status: 'active' });
            this.showSuccess(`${userName} aktif edildi.`);
            await this.loadUsersData();
        } catch (error) {
            this.showError('Kullanıcı aktif edilirken hata oluştu: ' + error.message);
        }
    }

    async loadAnalyticsData() {
        console.log('📈 Analytics section - Coming soon');
        // Mock analytics data
        document.getElementById('total-revenue').textContent = '₺0';
        document.getElementById('orders-today').textContent = '0';
        document.getElementById('active-packages-analytics').textContent = '0';
        document.getElementById('conversion-rate').textContent = '%0';
    }

    setupAutoRefresh() {
        // Auto-refresh every 5 minutes
        setInterval(() => {
            if (this.currentSection === 'dashboard' || this.currentSection === 'applications') {
                this.loadApplicationsData();
            }
        }, 5 * 60 * 1000);
    }

    showSuccess(message) {
        // Create temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
        `;
        successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showError(message) {
        // Create temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
        `;
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Logout function
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        window.KapTazeAPI.clearAuth();
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin-login-v2.html';
    }
}

// Global navigation function
function showSection(section) {
    if (window.dashboard) {
        window.dashboard.showSection(section);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new KapTazeAdminDashboard();
});