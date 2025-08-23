/**
 * KapTaze Admin Dashboard - API Integration
 * Professional restaurant management system with API backend
 * Version: 2025.08.23
 */

class KapTazeAdminAPI {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentUser = null;
        this.data = {
            applications: [],
            restaurants: [],
            users: []
        };
        this.filters = {
            applications: { status: 'all', search: '' },
            restaurants: { status: 'all', search: '' }
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 KapTaze Admin Dashboard with API initializing...');
        
        // Check authentication
        if (!this.checkAuthentication()) {
            return;
        }

        // Load user profile
        await this.loadUserProfile();
        
        // Setup navigation
        this.setupNavigation();
        
        // Load initial dashboard data
        await this.loadDashboardData();
        
        // Setup event listeners
        this.setupEventListeners();
        
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
        
        return true;
    }

    async loadUserProfile() {
        try {
            const response = await window.KapTazeAPIService.auth.getMe();
            this.currentUser = response.data.user;
            this.updateUserInterface();
            console.log('✅ User profile loaded:', this.currentUser.username);
        } catch (error) {
            console.error('❌ Failed to load user profile:', error);
            // Token might be invalid, redirect to login
            window.KapTazeAPI.clearAuth();
            window.location.href = '/admin-login-v2.html';
        }
    }

    updateUserInterface() {
        if (!this.currentUser) return;
        
        // Update user info in the UI
        const userNameElement = document.getElementById('currentUserName');
        const userEmailElement = document.getElementById('currentUserEmail');
        
        if (userNameElement) {
            userNameElement.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
        
        if (userEmailElement) {
            userEmailElement.textContent = this.currentUser.email;
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }
    }

    async navigateToSection(section) {
        console.log(`🧭 Navigating to: ${section}`);
        
        this.currentSection = section;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show target section
        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Load section-specific data
        await this.loadSectionData(section);
    }

    async loadSectionData(section) {
        try {
            switch (section) {
                case 'applications':
                    await this.loadApplicationsData();
                    break;
                case 'restaurants':
                    await this.loadRestaurantsData();
                    break;
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
            }
        } catch (error) {
            console.error(`❌ Failed to load ${section} data:`, error);
            this.showError(`${section} verileri yüklenirken hata oluştu: ${error.message}`);
        }
    }

    async loadDashboardData() {
        try {
            console.log('📊 Loading dashboard data...');
            
            // Load applications summary
            const applicationsResponse = await window.KapTazeAPIService.admin.getApplications({ limit: 5 });
            this.data.applications = applicationsResponse.data.applications;
            
            // Load restaurants summary
            const restaurantsResponse = await window.KapTazeAPIService.admin.getRestaurants({ limit: 5 });
            this.data.restaurants = restaurantsResponse.data.restaurants;
            
            // Update dashboard statistics
            this.updateDashboardStats();
            
            // Update recent activities
            this.updateRecentActivities();
            
            console.log('✅ Dashboard data loaded');
            
        } catch (error) {
            console.error('❌ Dashboard data loading failed:', error);
            this.showError('Dashboard verileri yüklenirken hata oluştu');
        }
    }

    async loadApplicationsData() {
        try {
            console.log('📋 Loading applications data...');
            
            const response = await window.KapTazeAPIService.admin.getApplications(this.filters.applications);
            this.data.applications = response.data.applications;
            
            this.renderApplicationsTable();
            this.updateApplicationsStats(response.data.pagination);
            
            console.log(`✅ Loaded ${this.data.applications.length} applications`);
            
        } catch (error) {
            console.error('❌ Applications data loading failed:', error);
            this.showError('Başvuru verileri yüklenirken hata oluştu');
        }
    }

    async loadRestaurantsData() {
        try {
            console.log('🏪 Loading restaurants data...');
            
            const response = await window.KapTazeAPIService.admin.getRestaurants(this.filters.restaurants);
            this.data.restaurants = response.data.restaurants;
            
            this.renderRestaurantsTable();
            this.updateRestaurantsStats(response.data.pagination);
            
            console.log(`✅ Loaded ${this.data.restaurants.length} restaurants`);
            
        } catch (error) {
            console.error('❌ Restaurants data loading failed:', error);
            this.showError('Restoran verileri yüklenirken hata oluştu');
        }
    }

    renderApplicationsTable() {
        const tableBody = document.getElementById('applicationsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        this.data.applications.forEach(application => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="application-info">
                        <strong>${application.businessName}</strong><br>
                        <small>${application.firstName} ${application.lastName}</small>
                    </div>
                </td>
                <td>${application.businessCategory}</td>
                <td>${application.city}</td>
                <td>
                    <span class="status-badge status-${application.status}">
                        ${this.getStatusText(application.status)}
                    </span>
                </td>
                <td>
                    <small>${new Date(application.createdAt).toLocaleDateString('tr-TR')}</small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="adminDashboard.viewApplication('${application.applicationId}')" 
                                class="btn btn-sm btn-info">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${application.status === 'pending' ? `
                            <button onclick="adminDashboard.approveApplication('${application.applicationId}')" 
                                    class="btn btn-sm btn-success">
                                <i class="fas fa-check"></i>
                            </button>
                            <button onclick="adminDashboard.rejectApplication('${application.applicationId}')" 
                                    class="btn btn-sm btn-danger">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    renderRestaurantsTable() {
        const tableBody = document.getElementById('restaurantsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        this.data.restaurants.forEach(restaurant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="restaurant-info">
                        <strong>${restaurant.name}</strong><br>
                        <small>${restaurant.category}</small>
                    </div>
                </td>
                <td>${restaurant.owner.firstName} ${restaurant.owner.lastName}</td>
                <td>${restaurant.address.city}</td>
                <td>
                    <span class="status-badge status-${restaurant.status}">
                        ${this.getStatusText(restaurant.status)}
                    </span>
                </td>
                <td>
                    <small>${new Date(restaurant.createdAt).toLocaleDateString('tr-TR')}</small>
                </td>
                <td>
                    <div class="action-buttons">
                        <button onclick="adminDashboard.viewRestaurant('${restaurant._id}')" 
                                class="btn btn-sm btn-info">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="adminDashboard.editRestaurant('${restaurant._id}')" 
                                class="btn btn-sm btn-warning">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    updateDashboardStats() {
        // Update statistics cards
        const pendingCount = this.data.applications.filter(app => app.status === 'pending').length;
        const approvedCount = this.data.applications.filter(app => app.status === 'approved').length;
        const activeRestaurants = this.data.restaurants.filter(rest => rest.status === 'active').length;
        
        document.getElementById('pendingApplicationsCount')?.textContent = pendingCount;
        document.getElementById('approvedApplicationsCount')?.textContent = approvedCount;
        document.getElementById('activeRestaurantsCount')?.textContent = activeRestaurants;
    }

    updateRecentActivities() {
        const activitiesList = document.getElementById('recentActivitiesList');
        if (!activitiesList) return;
        
        activitiesList.innerHTML = '';
        
        // Combine and sort recent activities
        const recentActivities = [
            ...this.data.applications.slice(0, 5).map(app => ({
                type: 'application',
                title: `Yeni başvuru: ${app.businessName}`,
                time: app.createdAt,
                status: app.status
            })),
            ...this.data.restaurants.slice(0, 3).map(rest => ({
                type: 'restaurant',
                title: `Restoran: ${rest.name}`,
                time: rest.createdAt,
                status: rest.status
            }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);
        
        recentActivities.forEach(activity => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-content">
                    <i class="fas fa-${activity.type === 'application' ? 'file-alt' : 'store'} activity-icon"></i>
                    <div class="activity-text">
                        <span>${activity.title}</span>
                        <small>${new Date(activity.time).toLocaleString('tr-TR')}</small>
                    </div>
                </div>
            `;
            activitiesList.appendChild(item);
        });
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': 'Bekliyor',
            'approved': 'Onaylandı',
            'rejected': 'Reddedildi',
            'active': 'Aktif',
            'inactive': 'Pasif',
            'suspended': 'Askıya Alındı'
        };
        return statusTexts[status] || status;
    }

    async approveApplication(applicationId) {
        if (!confirm('Bu başvuruyu onaylamak istediğinizden emin misiniz?')) {
            return;
        }
        
        try {
            console.log(`✅ Approving application: ${applicationId}`);
            
            const response = await window.KapTazeAPIService.admin.approveApplication(applicationId);
            
            console.log('✅ Application approved:', response.data);
            
            // Show success message with credentials
            this.showSuccess(`Başvuru onaylandı!<br>
                <strong>Kullanıcı Adı:</strong> ${response.data.credentials.username}<br>
                <strong>Şifre:</strong> ${response.data.credentials.password}<br>
                <em>Bu bilgiler e-posta ile de gönderilecektir.</em>`);
            
            // Reload applications data
            await this.loadApplicationsData();
            
        } catch (error) {
            console.error('❌ Application approval failed:', error);
            this.showError('Başvuru onaylanırken hata oluştu: ' + error.message);
        }
    }

    async rejectApplication(applicationId) {
        const reason = prompt('Red nedeni giriniz:');
        if (!reason) return;
        
        try {
            console.log(`❌ Rejecting application: ${applicationId}`);
            
            const response = await window.KapTazeAPIService.admin.rejectApplication(applicationId, reason);
            
            console.log('✅ Application rejected:', response.data);
            
            this.showSuccess('Başvuru reddedildi ve ilgili kişiye bildirildi.');
            
            // Reload applications data
            await this.loadApplicationsData();
            
        } catch (error) {
            console.error('❌ Application rejection failed:', error);
            this.showError('Başvuru reddedilirken hata oluştu: ' + error.message);
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const section = e.target.getAttribute('data-section');
                if (section && this.filters[section]) {
                    this.filters[section].search = e.target.value;
                    clearTimeout(this.searchTimeout);
                    this.searchTimeout = setTimeout(() => {
                        this.loadSectionData(section);
                    }, 500);
                }
            });
        });

        // Filter dropdowns
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const section = e.target.getAttribute('data-section');
                const filterType = e.target.getAttribute('data-filter');
                if (section && filterType && this.filters[section]) {
                    this.filters[section][filterType] = e.target.value;
                    this.loadSectionData(section);
                }
            });
        });
    }

    async handleLogout() {
        try {
            await window.KapTazeAPIService.auth.logout();
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            window.KapTazeAPI.clearAuth();
            window.location.href = '/admin-login-v2.html';
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
            ${message}
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Show animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 5000);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM loaded, initializing Admin Dashboard...');
    
    // Check if API config is loaded
    if (typeof window.KapTazeAPI === 'undefined') {
        console.error('❌ KapTaze API configuration not loaded');
        return;
    }
    
    // Initialize dashboard
    window.adminDashboard = new KapTazeAdminAPI();
});