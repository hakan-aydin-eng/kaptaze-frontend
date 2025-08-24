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
            
            // Load applications for dashboard stats
            await this.loadApplicationsData();
            
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
        
        // Approved restaurants (mock for now)
        const approved = apps.filter(app => app.status === 'approved').length;
        document.getElementById('active-restaurants').textContent = approved;
        
        // Mock data for other stats
        document.getElementById('total-packages').textContent = '0';
        document.getElementById('today-applications').textContent = apps.filter(app => {
            const today = new Date().toDateString();
            return new Date(app.submittedAt).toDateString() === today;
        }).length;
        document.getElementById('week-approvals').textContent = '0';
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
                    <span class="status-badge ${app.status}">
                        ${this.getStatusText(app.status)}
                    </span>
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
            
            this.showSuccess(`${businessName} başvurusu onaylandı!`);
            
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

    // Placeholder methods for other sections
    async loadRestaurantsData() {
        console.log('🏪 Restaurants section - Coming soon');
        const tbody = document.getElementById('restaurants-table');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-store" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        Bu özellik yakında aktif edilecek
                    </td>
                </tr>
            `;
        }
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

    async loadUsersData() {
        console.log('👥 Users section - Coming soon');
        const tbody = document.getElementById('users-table');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                        Bu özellik yakında aktif edilecek
                    </td>
                </tr>
            `;
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