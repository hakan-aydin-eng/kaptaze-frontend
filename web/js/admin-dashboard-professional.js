/**
 * KapTaze Professional Admin Dashboard
 * Backend Service Integration
 * Version: 2025.08.27.01
 */

class AdminDashboard {
    constructor(backendService) {
        this.backendService = backendService;
        this.currentSection = 'dashboard';
        this.currentUser = backendService.getCurrentUser();
        this.data = {
            applications: [],
            restaurants: [],
            packages: [],
            orders: [],
            users: [],
            consumers: []
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Professional Admin Dashboard initializing...');
        console.log('👤 Current admin:', this.currentUser.name);
        
        // Setup navigation
        this.setupNavigation();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Setup auto-refresh
        this.setupAutoRefresh();
        
        console.log('✅ Professional Admin Dashboard ready');
    }

    async loadDashboardData() {
        console.log('� Loading dashboard data...');
        
        try {
            // Load data from backend service
            await Promise.all([
                this.loadApplications(),
                this.loadRestaurants(), 
                this.loadPackages(),
                this.loadConsumers(),
                this.loadOrders()
            ]);
            
            // Update dashboard statistics
            this.updateDashboardStats();
            
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            this.showErrorMessage('Veri yüklenirken hata oluştu: ' + error.message);
        }
    }

    async loadApplications() {
        try {
            console.log('📋 Loading applications...');
            const applications = await this.backendService.makeRequest('/api/admin/applications');
            this.data.applications = applications || [];
            this.renderApplications();
            console.log(`✅ Loaded ${this.data.applications.length} applications`);
        } catch (error) {
            console.log('⚠️ Applications not available, using demo data');
            this.loadDemoApplications();
        }
    }

    async loadRestaurants() {
        try {
            console.log('🍽️ Loading restaurants...');
            const restaurants = await this.backendService.getRestaurants();
            this.data.restaurants = restaurants || [];
            this.renderRestaurants();
            console.log(`✅ Loaded ${this.data.restaurants.length} restaurants`);
        } catch (error) {
            console.log('⚠️ Restaurants not available, using demo data');
            this.loadDemoRestaurants();
        }
    }

    async loadPackages() {
        try {
            console.log('📦 Loading packages...');
            const packages = await this.backendService.getPackages();
            this.data.packages = packages || [];
            this.renderPackages();
            console.log(`✅ Loaded ${this.data.packages.length} packages`);
        } catch (error) {
            console.log('⚠️ Packages not available, using demo data');
            this.loadDemoPackages();
        }
    }

    async loadConsumers() {
        try {
            console.log('👥 Loading consumers...');
            // This is already working, don't touch it
            const consumers = await this.backendService.makeRequest('/api/admin/customers');
            this.data.consumers = consumers || [];
            this.renderConsumers();
            console.log(`✅ Loaded ${this.data.consumers.length} consumers`);
        } catch (error) {
            console.log('⚠️ Consumers not available, keeping existing functionality');
            // Keep existing consumer loading logic
        }
    }

    setupNavigation() {
        // Navigation items
        document.querySelectorAll('.nav-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Global search
        document.getElementById('global-search').addEventListener('input', (e) => {
            this.handleGlobalSearch(e.target.value);
        });

        // Status filter
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filterApplications(e.target.value);
        });
    }

    showSection(sectionId) {
        console.log(`📍 Navigating to: ${sectionId}`);
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    // Demo data for when backend is not available
    loadDemoApplications() {
        this.data.applications = [
            {
                id: 'demo-app-1',
                name: 'Ahmet Yılmaz',
                email: 'ahmet@restoran.com',
                phone: '+90 532 123 4567',
                restaurantName: 'Lezzet Durağı',
                address: 'Antalya, Muratpaşa',
                status: 'pending',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                documents: ['restoran-lisans.pdf', 'kimlik.pdf']
            },
            {
                id: 'demo-app-2', 
                name: 'Fatma Kaya',
                email: 'fatma@cafemarmaris.com',
                phone: '+90 535 987 6543',
                restaurantName: 'Cafe Marmaris',
                address: 'Muğla, Marmaris',
                status: 'pending',
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                documents: ['cafe-ruhsat.pdf', 'vergi-levha.pdf']
            }
        ];
        this.renderApplications();
    }

    loadDemoRestaurants() {
        this.data.restaurants = [
            {
                id: 'demo-rest-1',
                name: 'Seraser Restaurant',
                email: 'info@seraser.com',
                phone: '+90 242 123 4567',
                address: 'Antalya, Kaleiçi',
                status: 'active',
                approvedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                totalPackages: 45,
                totalOrders: 234
            },
            {
                id: 'demo-rest-2',
                name: 'Milano Pizzeria', 
                email: 'info@milano.com',
                phone: '+90 242 987 6543',
                address: 'Antalya, Lara',
                status: 'active',
                approvedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                totalPackages: 28,
                totalOrders: 156
            }
        ];
        this.renderRestaurants();
    }

    loadDemoPackages() {
        this.data.packages = [
            {
                id: 'demo-pkg-1',
                name: 'Karma Menü',
                restaurantName: 'Seraser Restaurant',
                originalPrice: 45,
                discountedPrice: 18,
                quantity: 5,
                status: 'active',
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                pickupTime: '18:00-20:00'
            },
            {
                id: 'demo-pkg-2',
                name: 'Pizza Çeşitleri',
                restaurantName: 'Milano Pizzeria', 
                originalPrice: 35,
                discountedPrice: 15,
                quantity: 3,
                status: 'active',
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                pickupTime: '19:00-21:00'
            }
        ];
        this.renderPackages();
    }
    }

    async loadSectionData(sectionId) {
        switch(sectionId) {
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
            case 'consumers':
                await this.loadConsumersData();
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
            
            // Try KapTazeShared first (matches customer registration system)
            if (window.KapTazeShared) {
                await this.loadDataFromSharedStorage();
            } else {
                await this.loadDataFromLocalStorage();
            }

            this.updateDashboardStats();
            this.updateRecentApplications();
            
        } catch (error) {
            console.error('❌ Dashboard data load error:', error);
            this.showError('Dashboard verileri yüklenirken hata: ' + error.message);
        }
    }

    async loadDataFromSharedStorage() {
        try {
            console.log('🌐 Loading from KapTaze Shared Storage...');
            
            // Get all data from shared storage
            const sharedData = await window.KapTazeShared.getAllData();
            console.log('📊 Shared storage data loaded:', sharedData);
            
            // Extract applications
            this.data.applications = sharedData.applications || [];
            
            // Extract packages  
            this.data.packages = sharedData.packages || [];
            
            // Extract restaurants from restaurantUsers (approved applications)
            const restaurantUsers = sharedData.restaurantUsers || [];
            const restaurantProfiles = sharedData.restaurantProfiles || [];
            
            // Combine restaurant data
            this.data.restaurants = [
                ...restaurantUsers.map(user => ({
                    ...user,
                    source: 'restaurantUser'
                })),
                ...restaurantProfiles
            ];
            
            // Extract orders
            this.data.orders = sharedData.orders || [];
            
            // Extract users
            this.data.users = [
                ...(sharedData.customerUsers || []),
                ...(sharedData.restaurantUsers || [])
            ];

            console.log('✅ Shared Storage data loaded:', {
                applications: this.data.applications.length,
                packages: this.data.packages.length,
                restaurants: this.data.restaurants.length,
                orders: this.data.orders.length,
                users: this.data.users.length
            });
            
        } catch (error) {
            console.warn('⚠️ Shared Storage failed, using localStorage:', error);
            await this.loadDataFromLocalStorage();
        }
    }

    async loadDataFromLocalStorage() {
        console.log('📂 Loading from localStorage...');
        
        // Get registrations (customer applications)
        const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        
        // Filter for restaurant applications
        this.data.applications = registrations.filter(r => 
            r.type === 'restaurant' || r.businessType === 'restaurant'
        );
        
        // Get packages
        const packages = JSON.parse(localStorage.getItem('packages') || '[]');
        this.data.packages = packages;
        
        // Get approved restaurants (from shared storage or database)
        if (window.KapTazeDB) {
            try {
                const dbData = await window.KapTazeDB.getAllData();
                this.data.restaurants = dbData.restaurantProfiles || [];
            } catch (error) {
                console.warn('Database load failed:', error);
                this.data.restaurants = [];
            }
        }

        console.log('✅ LocalStorage data loaded:', {
            applications: this.data.applications.length,
            packages: this.data.packages.length,
            restaurants: this.data.restaurants.length
        });
    }

    updateDashboardStats() {
        // Calculate statistics
        const stats = {
            totalApplications: this.data.applications.length,
            pendingApplications: this.data.applications.filter(app => 
                app.status === 'pending' || !app.status
            ).length,
            activeRestaurants: this.data.restaurants.filter(rest => 
                rest.status === 'active'
            ).length,
            totalPackages: this.data.packages.length,
            activePackages: this.data.packages.filter(pkg => 
                pkg.status === 'active'
            ).length,
            totalOrders: this.data.orders.length
        };

        // Update stat cards
        document.getElementById('total-applications').textContent = stats.totalApplications;
        document.getElementById('pending-applications').textContent = stats.pendingApplications;
        document.getElementById('active-restaurants').textContent = stats.activeRestaurants;
        document.getElementById('total-packages').textContent = stats.totalPackages;

        // Update badges
        document.getElementById('pending-count').textContent = stats.pendingApplications;

        // Update quick stats
        document.getElementById('today-applications').textContent = this.getTodayApplications();
        document.getElementById('week-approvals').textContent = this.getWeekApprovals();
        document.getElementById('active-packages').textContent = stats.activePackages;
        document.getElementById('total-orders').textContent = stats.totalOrders;

        console.log('📊 Dashboard stats updated:', stats);
    }

    updateRecentApplications() {
        const recentApps = this.data.applications
            .sort((a, b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
            .slice(0, 5);

        const tbody = document.getElementById('recent-applications');
        
        if (recentApps.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #6b7280; padding: 2rem;">
                        Henüz başvuru bulunmuyor
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = recentApps.map(app => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${app.businessName || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${app.firstName} ${app.lastName}</div>
                </td>
                <td>${app.businessCategory || app.category || 'N/A'}</td>
                <td>${this.formatDate(app.createdAt || app.timestamp)}</td>
                <td>${this.getStatusBadge(app.status || 'pending')}</td>
                <td>
                    ${app.status === 'pending' || !app.status ? `
                        <button class="btn btn-success btn-sm" onclick="dashboard.showApprovalModal('${app.id || app.timestamp}')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-primary btn-sm" onclick="dashboard.viewApplication('${app.id || app.timestamp}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async loadApplicationsData() {
        const tbody = document.getElementById('applications-table');
        if (!tbody) {
            console.error('Applications table not found');
            return;
        }

        try {
            console.log('📝 Loading applications data...');
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading">
                        <i class="fas fa-spinner"></i>
                        Başvurular yükleniyor...
                    </td>
                </tr>
            `;

            // Fetch applications from backend API
            const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/applications', {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const apiData = await response.json();
                console.log('📋 Applications API Response:', apiData);
                if (apiData.success && apiData.data && apiData.data.applications) {
                    this.data.applications = apiData.data.applications;
                    console.log(`✅ Loaded ${this.data.applications.length} applications from API`);
                } else {
                    console.log('⚠️ No applications data in API response, structure:', apiData);
                    this.data.applications = [];
                }
            } else {
                console.log(`⚠️ Applications API call failed with status: ${response.status}`);
                const errorText = await response.text();
                console.log('Error details:', errorText);
                this.data.applications = [];
            }

            if (this.data.applications.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #6b7280; padding: 2rem;">
                            Henüz başvuru bulunmuyor
                        </td>
                    </tr>
                `;
                return;
            }
        } catch (error) {
            console.error('❌ Error loading applications:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #ef4444; padding: 2rem;">
                        Başvurular yüklenirken hata oluştu
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.applications.map(app => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${app.businessName || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${app.businessAddress || app.address || 'Adres belirtilmemiş'}</div>
                </td>
                <td>
                    <div>${app.firstName} ${app.lastName}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${app.email}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${app.phone}</div>
                </td>
                <td>${app.businessCategory || app.category || 'N/A'}</td>
                <td>${this.formatDate(app.createdAt || app.timestamp)}</td>
                <td>${this.getStatusBadge(app.status || 'pending')}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        ${app.status === 'pending' || !app.status ? `
                            <button class="btn btn-success btn-sm" onclick="dashboard.showApprovalModal('${app.id || app.timestamp}')">
                                <i class="fas fa-check"></i>
                                Onayla
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="dashboard.rejectApplication('${app.id || app.timestamp}')">
                                <i class="fas fa-times"></i>
                                Reddet
                            </button>
                        ` : ''}
                        <button class="btn btn-primary btn-sm" onclick="dashboard.viewApplication('${app.id || app.timestamp}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // APPLICATION MANAGEMENT
    showApprovalModal(applicationId) {
        const app = this.data.applications.find(a => (a.id || a.timestamp) == applicationId);
        if (!app) {
            alert('Başvuru bulunamadı');
            return;
        }

        // Populate modal
        document.getElementById('approval-business-name').textContent = app.businessName || 'N/A';
        document.getElementById('approval-username').value = this.generateUsername(app.businessName);
        document.getElementById('approval-password').value = this.generatePassword();

        // Store current application for approval
        window.currentApprovalApplication = app;

        // Show modal
        document.getElementById('approval-modal').style.display = 'block';
    }

    closeApprovalModal() {
        document.getElementById('approval-modal').style.display = 'none';
        window.currentApprovalApplication = null;
    }

    async confirmApproval() {
        const app = window.currentApprovalApplication;
        if (!app) return;

        const username = document.getElementById('approval-username').value;
        const password = document.getElementById('approval-password').value;

        if (!username || !password) {
            alert('Kullanıcı adı ve şifre gerekli');
            return;
        }

        try {
            console.log('✅ Approving application:', app.businessName);

            // Use MongoDB if available
            if (window.KapTazeMongoDB) {
                await window.KapTazeMongoDB.approveApplication(app.id || app.timestamp, {
                    username,
                    password
                });
            } else {
                // Fallback to localStorage
                await this.approveApplicationLocally(app, username, password);
            }

            this.closeApprovalModal();
            await this.loadDashboardData();
            
            if (this.currentSection === 'applications') {
                await this.loadApplicationsData();
            }

            alert(`Başvuru onaylandı!\nKullanıcı: ${username}\nŞifre: ${password}`);

        } catch (error) {
            console.error('❌ Approval error:', error);
            alert('Onay işlemi başarısız: ' + error.message);
        }
    }

    async approveApplicationLocally(app, username, password) {
        // Update application status in localStorage
        const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        const index = registrations.findIndex(r => (r.id || r.timestamp) == (app.id || app.timestamp));
        
        if (index !== -1) {
            registrations[index].status = 'approved';
            registrations[index].approvedAt = new Date().toISOString();
            registrations[index].restaurantCredentials = { username, password };
            localStorage.setItem('registrations', JSON.stringify(registrations));
        }

        // Create restaurant user for login system
        try {
            // 1. Add to KapTaze Shared Storage if available
            if (window.KapTazeShared) {
                const restaurantUser = {
                    id: `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    username: username,
                    password: password,
                    firstName: app.firstName,
                    lastName: app.lastName,
                    email: app.email,
                    phone: app.phone,
                    businessName: app.businessName,
                    businessType: 'restaurant',
                    businessCategory: app.businessCategory,
                    businessAddress: app.businessAddress,
                    city: app.city,
                    district: app.district,
                    businessLatitude: app.businessLatitude,
                    businessLongitude: app.businessLongitude,
                    role: 'restaurant',
                    status: 'active',
                    registrationDate: app.createdAt || app.timestamp,
                    approvalDate: new Date().toISOString(),
                    approvedBy: 'admin'
                };
                
                await window.KapTazeShared.addRestaurantUser(restaurantUser);
                console.log('✅ Restaurant user added to shared storage:', restaurantUser.username);
            }
            
            // 2. Add to local approved users list (fallback)
            const approvedUsers = JSON.parse(localStorage.getItem('kaptaze_approved_users') || '[]');
            const localUser = {
                id: `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                username: username,
                password: password,
                firstName: app.firstName,
                lastName: app.lastName,
                email: app.email,
                phone: app.phone,
                businessName: app.businessName,
                businessType: 'restaurant',
                role: 'restaurant',
                status: 'active',
                registrationDate: app.createdAt || app.timestamp,
                approvalDate: new Date().toISOString(),
                source: 'admin_approval'
            };
            
            approvedUsers.push(localUser);
            localStorage.setItem('kaptaze_approved_users', JSON.stringify(approvedUsers));
            console.log('✅ Restaurant user added to local approved users:', localUser.username);
            
            // 3. Add to database if available
            if (window.KapTazeDB) {
                await window.KapTazeDB.createRestaurantUser(app, username, password);
                console.log('✅ Restaurant user added to database');
            }
            
        } catch (error) {
            console.error('❌ Failed to create restaurant user:', error);
            throw new Error('Restoran kullanıcısı oluşturulamadı: ' + error.message);
        }
    }

    // UTILITY FUNCTIONS
    generateUsername(businessName) {
        const cleaned = (businessName || 'restaurant')
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 8);
        return cleaned + Math.floor(Math.random() * 1000);
    }

    generatePassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 8; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    getStatusBadge(status) {
        const badges = {
            'pending': '<span class="status-badge pending"><i class="fas fa-clock"></i> Beklemede</span>',
            'approved': '<span class="status-badge approved"><i class="fas fa-check"></i> Onaylandı</span>',
            'rejected': '<span class="status-badge rejected"><i class="fas fa-times"></i> Reddedildi</span>',
            'active': '<span class="status-badge active"><i class="fas fa-check-circle"></i> Aktif</span>'
        };
        return badges[status] || badges['pending'];
    }

    getTodayApplications() {
        const today = new Date().toDateString();
        return this.data.applications.filter(app => {
            const appDate = new Date(app.createdAt || app.timestamp).toDateString();
            return appDate === today;
        }).length;
    }

    getWeekApprovals() {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return this.data.applications.filter(app => {
            return app.status === 'approved' && 
                   new Date(app.approvedAt || app.createdAt || app.timestamp) > weekAgo;
        }).length;
    }
    
    // Utility functions for filtering and display
    getFilteredRestaurants(searchTerm) {
        const approvedRestaurants = this.data.applications.filter(app => 
            app.status === 'approved' && app.businessType === 'restaurant'
        );
        const allRestaurants = [...approvedRestaurants, ...this.data.restaurants];
        
        return allRestaurants.filter(restaurant =>
            (restaurant.businessName && restaurant.businessName.toLowerCase().includes(searchTerm)) ||
            (restaurant.name && restaurant.name.toLowerCase().includes(searchTerm)) ||
            (restaurant.firstName && restaurant.firstName.toLowerCase().includes(searchTerm)) ||
            (restaurant.lastName && restaurant.lastName.toLowerCase().includes(searchTerm)) ||
            (restaurant.email && restaurant.email.toLowerCase().includes(searchTerm)) ||
            (restaurant.businessCategory && restaurant.businessCategory.toLowerCase().includes(searchTerm))
        );
    }
    
    displayFilteredRestaurants(restaurants) {
        const tbody = document.getElementById('restaurants-table');
        
        if (restaurants.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #6b7280; padding: 2rem;">
                        Arama kriterlerine uygun restoran bulunamadı
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = restaurants.map(restaurant => {
            const isFromApplication = restaurant.businessName !== undefined;
            
            return `
                <tr>
                    <td>
                        <div style="font-weight: 600;">${restaurant.businessName || restaurant.name || 'N/A'}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${restaurant.businessCategory || restaurant.category || 'N/A'}</div>
                    </td>
                    <td>
                        <div>${restaurant.firstName || restaurant.ownerName || ''} ${restaurant.lastName || ''}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${restaurant.email || 'N/A'}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${restaurant.phone || 'N/A'}</div>
                    </td>
                    <td>
                        <div>${restaurant.businessAddress || restaurant.address || 'N/A'}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${restaurant.city || ''} ${restaurant.district || ''}</div>
                    </td>
                    <td>
                        <div style="font-weight: 600;">${restaurant.restaurantCredentials?.username || restaurant.username || 'N/A'}</div>
                        <div style="font-size: 0.75rem; color: #6b7280;">Kullanıcı adı</div>
                    </td>
                    <td>${this.formatDate(restaurant.approvedAt || restaurant.createdAt || restaurant.timestamp)}</td>
                    <td>
                        <div style="display: flex; gap: 0.25rem;">
                            <button class="btn btn-primary btn-sm" onclick="dashboard.viewRestaurant('${restaurant.id || restaurant.timestamp}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-success btn-sm" onclick="dashboard.editRestaurant('${restaurant.id || restaurant.timestamp}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${restaurant.status === 'active' ? `
                                <button class="btn btn-warning btn-sm" onclick="dashboard.suspendRestaurant('${restaurant.id || restaurant.timestamp}')">
                                    <i class="fas fa-pause"></i>
                                </button>
                            ` : `
                                <button class="btn btn-success btn-sm" onclick="dashboard.activateRestaurant('${restaurant.id || restaurant.timestamp}')">
                                    <i class="fas fa-play"></i>
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    displayFilteredPackages(packages) {
        const tbody = document.getElementById('packages-table');
        
        if (packages.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #6b7280; padding: 2rem;">
                        Arama kriterlerine uygun paket bulunamadı
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = packages.map(pkg => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${pkg.name || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${pkg.description || ''}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${pkg.restaurant?.name || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${pkg.restaurant?.address || ''}</div>
                </td>
                <td>
                    <span style="background: #f0fdf4; color: #15803d; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem;">
                        ${pkg.category || 'Genel'}
                    </span>
                </td>
                <td>
                    <div style="font-weight: 600; color: #dc2626;">${pkg.originalPrice || '0'}₺</div>
                    <div style="font-size: 0.875rem; text-decoration: line-through; color: #9ca3af;">${pkg.discountedPrice || '0'}₺</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${pkg.quantity || 0}</div>
                    <div style="font-size: 0.75rem; color: #6b7280;">adet</div>
                </td>
                <td>
                    <div>${this.formatDate(pkg.expiryDate)}</div>
                    <div style="font-size: 0.75rem; color: ${this.getExpiryColor(pkg.expiryDate)};">
                        ${this.getExpiryStatus(pkg.expiryDate)}
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-primary btn-sm" onclick="dashboard.viewPackage('${pkg.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="dashboard.editPackage('${pkg.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${pkg.status === 'active' ? `
                            <button class="btn btn-warning btn-sm" onclick="dashboard.deactivatePackage('${pkg.id}')">
                                <i class="fas fa-pause"></i>
                            </button>
                        ` : `
                            <button class="btn btn-success btn-sm" onclick="dashboard.activatePackage('${pkg.id}')">
                                <i class="fas fa-play"></i>
                            </button>
                        `}
                        <button class="btn btn-danger btn-sm" onclick="dashboard.deletePackage('${pkg.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    displayFilteredOrders(orders) {
        const tbody = document.getElementById('orders-table');
        
        if (orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #6b7280; padding: 2rem;">
                        Arama kriterlerine uygun sipariş bulunamadı
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>
                    <div style="font-weight: 600;">#${order.id || order.orderNumber}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${this.formatDate(order.createdAt)}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${order.customer?.name || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${order.customer?.email || ''}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${order.customer?.phone || ''}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${order.restaurant?.name || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${order.restaurant?.address || ''}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${order.items?.length || 0} ürün</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">₺${order.totalAmount || '0'}</div>
                </td>
                <td>${this.getOrderStatusBadge(order.status)}</td>
                <td>${order.paymentMethod || 'N/A'}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-primary btn-sm" onclick="dashboard.viewOrder('${order.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${order.status === 'pending' ? `
                            <button class="btn btn-success btn-sm" onclick="dashboard.confirmOrder('${order.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="dashboard.cancelOrder('${order.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-info btn-sm" onclick="dashboard.trackOrder('${order.id}')">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    displayFilteredUsers(users) {
        const tbody = document.getElementById('users-table');
        
        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #6b7280; padding: 2rem;">
                        Arama kriterlerine uygun kullanıcı bulunamadı
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${user.name || `${user.firstName || ''} ${user.lastName || ''}`}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${user.email || 'N/A'}</div>
                </td>
                <td>
                    <span style="background: ${this.getUserTypeBadgeColor(user.userType)}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem;">
                        ${this.getUserTypeLabel(user.userType)}
                    </span>
                </td>
                <td>${user.phone || 'N/A'}</td>
                <td>${user.business || user.businessName || '-'}</td>
                <td>${this.formatDate(user.createdAt || user.timestamp)}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-primary btn-sm" onclick="dashboard.viewUser('${user.id || user.timestamp}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="dashboard.editUser('${user.id || user.timestamp}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.status === 'active' ? `
                            <button class="btn btn-warning btn-sm" onclick="dashboard.suspendUser('${user.id || user.timestamp}')">
                                <i class="fas fa-user-slash"></i>
                            </button>
                        ` : `
                            <button class="btn btn-success btn-sm" onclick="dashboard.activateUser('${user.id || user.timestamp}')">
                                <i class="fas fa-user-check"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    getAllUsers() {
        return [
            ...this.data.applications.map(app => ({
                ...app,
                userType: 'restaurant_owner',
                name: `${app.firstName} ${app.lastName}`,
                business: app.businessName
            })),
            ...this.data.users
        ];
    }

    handleGlobalSearch(query) {
        console.log('🔍 Searching:', query);
        
        if (!query || query.length < 2) {
            // Clear search filters
            this.loadSectionData(this.currentSection);
            return;
        }
        
        const searchTerm = query.toLowerCase();
        
        // Search in current section data
        let filteredData = [];
        
        switch(this.currentSection) {
            case 'applications':
                filteredData = this.data.applications.filter(app => 
                    (app.businessName && app.businessName.toLowerCase().includes(searchTerm)) ||
                    (app.firstName && app.firstName.toLowerCase().includes(searchTerm)) ||
                    (app.lastName && app.lastName.toLowerCase().includes(searchTerm)) ||
                    (app.email && app.email.toLowerCase().includes(searchTerm)) ||
                    (app.businessCategory && app.businessCategory.toLowerCase().includes(searchTerm))
                );
                this.displayFilteredApplications(filteredData);
                break;
                
            case 'restaurants':
                filteredData = this.getFilteredRestaurants(searchTerm);
                this.displayFilteredRestaurants(filteredData);
                break;
                
            case 'packages':
                filteredData = this.data.packages.filter(pkg =>
                    (pkg.name && pkg.name.toLowerCase().includes(searchTerm)) ||
                    (pkg.restaurant && pkg.restaurant.name && pkg.restaurant.name.toLowerCase().includes(searchTerm)) ||
                    (pkg.category && pkg.category.toLowerCase().includes(searchTerm))
                );
                this.displayFilteredPackages(filteredData);
                break;
                
            case 'orders':
                filteredData = this.data.orders.filter(order =>
                    (order.id && order.id.toString().includes(searchTerm)) ||
                    (order.customer && order.customer.name && order.customer.name.toLowerCase().includes(searchTerm)) ||
                    (order.restaurant && order.restaurant.name && order.restaurant.name.toLowerCase().includes(searchTerm))
                );
                this.displayFilteredOrders(filteredData);
                break;
                
            case 'users':
                filteredData = this.getAllUsers().filter(user =>
                    (user.name && user.name.toLowerCase().includes(searchTerm)) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm)) ||
                    (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
                    (user.lastName && user.lastName.toLowerCase().includes(searchTerm))
                );
                this.displayFilteredUsers(filteredData);
                break;
        }
    }

    filterApplications(status) {
        console.log('🔽 Filtering by status:', status);
        
        let filteredApplications;
        
        if (!status) {
            filteredApplications = this.data.applications;
        } else {
            filteredApplications = this.data.applications.filter(app => 
                (app.status || 'pending') === status
            );
        }
        
        this.displayFilteredApplications(filteredApplications);
    }
    
    displayFilteredApplications(applications) {
        const tbody = document.getElementById('applications-table');
        
        if (applications.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #6b7280; padding: 2rem;">
                        Arama kriterlerine uygun başvuru bulunamadı
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = applications.map(app => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${app.businessName || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${app.businessAddress || app.address || 'Adres belirtilmemiş'}</div>
                </td>
                <td>
                    <div>${app.firstName} ${app.lastName}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${app.email}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${app.phone}</div>
                </td>
                <td>${app.businessCategory || app.category || 'N/A'}</td>
                <td>${this.formatDate(app.createdAt || app.timestamp)}</td>
                <td>${this.getStatusBadge(app.status || 'pending')}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        ${app.status === 'pending' || !app.status ? `
                            <button class="btn btn-success btn-sm" onclick="dashboard.showApprovalModal('${app.id || app.timestamp}')">
                                <i class="fas fa-check"></i>
                                Onayla
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="dashboard.rejectApplication('${app.id || app.timestamp}')">
                                <i class="fas fa-times"></i>
                                Reddet
                            </button>
                        ` : ''}
                        <button class="btn btn-primary btn-sm" onclick="dashboard.viewApplication('${app.id || app.timestamp}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    refreshApplications() {
        this.loadApplicationsData();
    }

    viewApplication(applicationId) {
        console.log('👁️ Viewing application:', applicationId);
        const app = this.data.applications.find(a => (a.id || a.timestamp) == applicationId);
        if (!app) {
            alert('Başvuru bulunamadı');
            return;
        }

        // Create modal content
        const modalContent = `
            <div class="modal" id="view-application-modal" style="display: block; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 2rem; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80%; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h2 style="margin: 0; color: #1f2937;">Başvuru Detayları</h2>
                        <button onclick="document.getElementById('view-application-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    
                    <div style="display: grid; gap: 1rem;">
                        <div style="background: #f9fafb; padding: 1rem; border-radius: 8px;">
                            <h3 style="margin: 0 0 0.5rem 0; color: #374151;">İşletme Bilgileri</h3>
                            <p><strong>İşletme Adı:</strong> ${app.businessName || 'N/A'}</p>
                            <p><strong>Kategori:</strong> ${app.businessCategory || 'N/A'}</p>
                            <p><strong>Adres:</strong> ${app.businessAddress || 'N/A'}</p>
                            <p><strong>Şehir/İlçe:</strong> ${app.city || ''} ${app.district || ''}</p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 1rem; border-radius: 8px;">
                            <h3 style="margin: 0 0 0.5rem 0; color: #374151;">İletişim Bilgileri</h3>
                            <p><strong>Ad Soyad:</strong> ${app.firstName || ''} ${app.lastName || ''}</p>
                            <p><strong>E-posta:</strong> ${app.email || 'N/A'}</p>
                            <p><strong>Telefon:</strong> ${app.phone || 'N/A'}</p>
                        </div>
                        
                        <div style="background: #f9fafb; padding: 1rem; border-radius: 8px;">
                            <h3 style="margin: 0 0 0.5rem 0; color: #374151;">Sistem Bilgileri</h3>
                            <p><strong>Başvuru Tarihi:</strong> ${this.formatDate(app.createdAt || app.timestamp)}</p>
                            <p><strong>Durum:</strong> ${this.getStatusBadge(app.status || 'pending')}</p>
                            ${app.restaurantUsername ? `<p><strong>Kullanıcı Adı:</strong> ${app.restaurantUsername}</p>` : ''}
                            ${app.approvedAt ? `<p><strong>Onay Tarihi:</strong> ${this.formatDate(app.approvedAt)}</p>` : ''}
                        </div>
                        
                        ${app.businessLatitude && app.businessLongitude ? `
                            <div style="background: #f9fafb; padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; color: #374151;">Konum Bilgisi</h3>
                                <p><strong>Koordinatlar:</strong> ${app.businessLatitude}, ${app.businessLongitude}</p>
                                <a href="https://maps.google.com/?q=${app.businessLatitude},${app.businessLongitude}" target="_blank" style="color: #16a34a; text-decoration: none;">
                                    <i class="fas fa-map-marker-alt"></i> Haritada Görüntüle
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalContent);
    }

    async rejectApplication(applicationId) {
        if (confirm('Bu başvuruyu reddetmek istediğinizden emin misiniz?')) {
            console.log('❌ Rejecting application:', applicationId);
            
            try {
                // Use MongoDB if available
                if (window.KapTazeMongoDB) {
                    await window.KapTazeMongoDB.rejectApplication(applicationId);
                } else {
                    // Fallback to localStorage
                    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
                    const index = registrations.findIndex(r => (r.id || r.timestamp) == applicationId);
                    
                    if (index !== -1) {
                        registrations[index].status = 'rejected';
                        registrations[index].rejectedAt = new Date().toISOString();
                        localStorage.setItem('registrations', JSON.stringify(registrations));
                    }
                }

                await this.loadDashboardData();
                
                if (this.currentSection === 'applications') {
                    await this.loadApplicationsData();
                }

                alert('Başvuru reddedildi.');

            } catch (error) {
                console.error('❌ Reject error:', error);
                alert('Reddetme işlemi başarısız: ' + error.message);
            }
        }
    }

    async loadRestaurantsData() {
        const tbody = document.getElementById('restaurants-table');
        if (!tbody) {
            console.error('Restaurants table not found');
            return;
        }

        try {
            console.log('🏪 Loading restaurants data...');
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading">
                        <i class="fas fa-spinner"></i>
                        Restoranlar yükleniyor...
                    </td>
                </tr>
            `;

            // Fetch restaurants from backend API
            const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/restaurants', {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            let allRestaurants = [];
            if (response.ok) {
                const apiData = await response.json();
                console.log('🏪 Restaurants API Response:', apiData);
                if (apiData.success && apiData.data && apiData.data.restaurants) {
                    allRestaurants = apiData.data.restaurants;
                    console.log(`✅ Loaded ${allRestaurants.length} restaurants from API`);
                } else {
                    console.log('⚠️ No restaurants data in API response, structure:', apiData);
                }
            } else {
                console.log(`⚠️ Restaurants API call failed with status: ${response.status}`);
                const errorText = await response.text();
                console.log('Error details:', errorText);
            }

            if (allRestaurants.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" style="text-align: center; color: #6b7280; padding: 2rem;">
                            Henüz onaylanmış restoran bulunmuyor
                        </td>
                    </tr>
                `;
                return;
            }
        } catch (error) {
            console.error('❌ Error loading restaurants:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #ef4444; padding: 2rem;">
                        Restoranlar yüklenirken hata oluştu
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allRestaurants.map(restaurant => {
            const isFromApplication = restaurant.businessName !== undefined;
            
            return `
                <tr>
                    <td>
                        <div style="font-weight: 600;">${restaurant.businessName || restaurant.name || 'N/A'}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${restaurant.businessCategory || restaurant.category || 'N/A'}</div>
                    </td>
                    <td>
                        <div>${restaurant.firstName || restaurant.ownerName || ''} ${restaurant.lastName || ''}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${restaurant.email || 'N/A'}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${restaurant.phone || 'N/A'}</div>
                    </td>
                    <td>
                        <div>${restaurant.businessAddress || restaurant.address || 'N/A'}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${restaurant.city || ''} ${restaurant.district || ''}</div>
                    </td>
                    <td>
                        <div style="font-weight: 600;">${restaurant.restaurantCredentials?.username || restaurant.username || 'N/A'}</div>
                        <div style="font-size: 0.75rem; color: #6b7280;">Kullanıcı adı</div>
                    </td>
                    <td>${this.formatDate(restaurant.approvedAt || restaurant.createdAt || restaurant.timestamp)}</td>
                    <td>
                        <div style="display: flex; gap: 0.25rem;">
                            <button class="btn btn-primary btn-sm" onclick="dashboard.viewRestaurant('${restaurant.id || restaurant.timestamp}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-success btn-sm" onclick="dashboard.editRestaurant('${restaurant.id || restaurant.timestamp}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${restaurant.status === 'active' ? `
                                <button class="btn btn-warning btn-sm" onclick="dashboard.suspendRestaurant('${restaurant.id || restaurant.timestamp}')">
                                    <i class="fas fa-pause"></i>
                                </button>
                            ` : `
                                <button class="btn btn-success btn-sm" onclick="dashboard.activateRestaurant('${restaurant.id || restaurant.timestamp}')">
                                    <i class="fas fa-play"></i>
                                </button>
                            `}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    async loadPackagesData() {
        const tbody = document.getElementById('packages-table');
        if (!tbody) {
            console.error('Packages table not found');
            return;
        }

        try {
            console.log('📦 Loading packages data...');
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading">
                        <i class="fas fa-spinner"></i>
                        Paketler yükleniyor...
                    </td>
                </tr>
            `;

            // Fetch packages from backend API
            const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/packages', {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            if (response.ok) {
                const apiData = await response.json();
                console.log('📦 Packages API Response:', apiData);
                if (apiData.success && apiData.data && apiData.data.packages) {
                    this.data.packages = apiData.data.packages;
                    console.log(`✅ Loaded ${this.data.packages.length} packages from API`);
                } else {
                    console.log('⚠️ No packages data in API response, structure:', apiData);
                    this.data.packages = [];
                }
            } else {
                console.log(`⚠️ Packages API call failed with status: ${response.status}`);
                const errorText = await response.text();
                console.log('Error details:', errorText);
                this.data.packages = [];
            }

            if (this.data.packages.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; color: #6b7280; padding: 2rem;">
                            Henüz paket bulunmuyor
                        </td>
                    </tr>
                `;
                return;
            }
        } catch (error) {
            console.error('❌ Error loading packages:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #ef4444; padding: 2rem;">
                        Paketler yüklenirken hata oluştu
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.packages.map(pkg => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${pkg.name || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${pkg.description || ''}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${pkg.restaurant?.name || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${pkg.restaurant?.address || ''}</div>
                </td>
                <td>
                    <span style="background: #f0fdf4; color: #15803d; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem;">
                        ${pkg.category || 'Genel'}
                    </span>
                </td>
                <td>
                    <div style="font-weight: 600; color: #dc2626;">${pkg.originalPrice || '0'}₺</div>
                    <div style="font-size: 0.875rem; text-decoration: line-through; color: #9ca3af;">${pkg.discountedPrice || '0'}₺</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${pkg.quantity || 0}</div>
                    <div style="font-size: 0.75rem; color: #6b7280;">adet</div>
                </td>
                <td>
                    <div>${this.formatDate(pkg.expiryDate)}</div>
                    <div style="font-size: 0.75rem; color: ${this.getExpiryColor(pkg.expiryDate)};">
                        ${this.getExpiryStatus(pkg.expiryDate)}
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-primary btn-sm" onclick="dashboard.viewPackage('${pkg.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="dashboard.editPackage('${pkg.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${pkg.status === 'active' ? `
                            <button class="btn btn-warning btn-sm" onclick="dashboard.deactivatePackage('${pkg.id}')">
                                <i class="fas fa-pause"></i>
                            </button>
                        ` : `
                            <button class="btn btn-success btn-sm" onclick="dashboard.activatePackage('${pkg.id}')">
                                <i class="fas fa-play"></i>
                            </button>
                        `}
                        <button class="btn btn-danger btn-sm" onclick="dashboard.deletePackage('${pkg.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadOrdersData() {
        console.log('🛒 Loading orders data...');
        
        const tbody = document.getElementById('orders-table');
        if (!tbody) {
            console.warn('Orders table not found');
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    <i class="fas fa-spinner"></i>
                    Siparişler yükleniyor...
                </td>
            </tr>
        `;

        if (this.data.orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #6b7280; padding: 2rem;">
                        Henüz sipariş bulunmuyor
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.orders.map(order => `
            <tr>
                <td>
                    <div style="font-weight: 600;">#${order.id || order.orderNumber}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${this.formatDate(order.createdAt)}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${order.customer?.name || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${order.customer?.email || ''}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${order.customer?.phone || ''}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${order.restaurant?.name || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${order.restaurant?.address || ''}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${order.items?.length || 0} ürün</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">₺${order.totalAmount || '0'}</div>
                </td>
                <td>${this.getOrderStatusBadge(order.status)}</td>
                <td>${order.paymentMethod || 'N/A'}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-primary btn-sm" onclick="dashboard.viewOrder('${order.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${order.status === 'pending' ? `
                            <button class="btn btn-success btn-sm" onclick="dashboard.confirmOrder('${order.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="dashboard.cancelOrder('${order.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="btn btn-info btn-sm" onclick="dashboard.trackOrder('${order.id}')">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadUsersData() {
        console.log('👥 Loading users data...');
        
        const tbody = document.getElementById('users-table');
        if (!tbody) {
            console.warn('Users table not found');
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loading">
                    <i class="fas fa-spinner"></i>
                    Kullanıcılar yükleniyor...
                </td>
            </tr>
        `;

        // Combine all users (customers, restaurant owners, etc.)
        const allUsers = [
            ...this.data.applications.map(app => ({
                ...app,
                userType: 'restaurant_owner',
                name: `${app.firstName} ${app.lastName}`,
                business: app.businessName
            })),
            ...this.data.users
        ];

        if (allUsers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #6b7280; padding: 2rem;">
                        Henüz kullanıcı bulunmuyor
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allUsers.map(user => `
            <tr>
                <td>
                    <div style="font-weight: 600;">${user.name || `${user.firstName || ''} ${user.lastName || ''}`}</div>
                    <div style="font-size: 0.875rem; color: #6b7280;">${user.email || 'N/A'}</div>
                </td>
                <td>
                    <span style="background: ${this.getUserTypeBadgeColor(user.userType)}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem;">
                        ${this.getUserTypeLabel(user.userType)}
                    </span>
                </td>
                <td>${user.phone || 'N/A'}</td>
                <td>${user.business || user.businessName || '-'}</td>
                <td>${this.formatDate(user.createdAt || user.timestamp)}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="btn btn-primary btn-sm" onclick="dashboard.viewUser('${user.id || user.timestamp}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success btn-sm" onclick="dashboard.editUser('${user.id || user.timestamp}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.status === 'active' ? `
                            <button class="btn btn-warning btn-sm" onclick="dashboard.suspendUser('${user.id || user.timestamp}')">
                                <i class="fas fa-user-slash"></i>
                            </button>
                        ` : `
                            <button class="btn btn-success btn-sm" onclick="dashboard.activateUser('${user.id || user.timestamp}')">
                                <i class="fas fa-user-check"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadAnalyticsData() {
        console.log('📈 Loading analytics data...');
        
        // Calculate analytics
        const analytics = {
            totalRevenue: this.data.orders.reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0),
            ordersToday: this.data.orders.filter(order => 
                new Date(order.createdAt).toDateString() === new Date().toDateString()
            ).length,
            activePackages: this.data.packages.filter(pkg => pkg.status === 'active').length,
            conversionRate: this.data.applications.length > 0 ? 
                (this.data.applications.filter(app => app.status === 'approved').length / this.data.applications.length * 100).toFixed(1) : 0,
            topCategories: this.getTopCategories(),
            recentOrders: this.data.orders.slice(-5).reverse(),
            monthlyStats: this.getMonthlyStats()
        };

        // Update analytics cards
        document.getElementById('total-revenue').textContent = `₺${analytics.totalRevenue.toLocaleString()}`;
        document.getElementById('orders-today').textContent = analytics.ordersToday;
        document.getElementById('active-packages-analytics').textContent = analytics.activePackages;
        document.getElementById('conversion-rate').textContent = `%${analytics.conversionRate}`;

        // Update top categories
        const categoriesList = document.getElementById('top-categories');
        if (categoriesList) {
            categoriesList.innerHTML = analytics.topCategories.map(cat => `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #f3f4f6;">
                    <span>${cat.category}</span>
                    <span style="font-weight: 600;">${cat.count}</span>
                </div>
            `).join('');
        }

        // Update recent orders
        const recentOrdersList = document.getElementById('recent-orders-analytics');
        if (recentOrdersList) {
            recentOrdersList.innerHTML = analytics.recentOrders.map(order => `
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid #f3f4f6;">
                    <div>
                        <div style="font-weight: 600;">#${order.id || order.orderNumber}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${order.customer?.name || 'N/A'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600;">₺${order.totalAmount || '0'}</div>
                        <div style="font-size: 0.875rem; color: #6b7280;">${this.formatDate(order.createdAt)}</div>
                    </div>
                </div>
            `).join('');
        }

        console.log('📊 Analytics updated:', analytics);
    }
    
    // Missing utility functions
    getExpiryColor(expiryDate) {
        if (!expiryDate) return '#6b7280';
        
        const expiry = new Date(expiryDate);
        const now = new Date();
        const diffHours = (expiry - now) / (1000 * 60 * 60);
        
        if (diffHours < 0) return '#dc2626'; // Expired - red
        if (diffHours < 24) return '#f59e0b'; // Less than 24 hours - orange
        if (diffHours < 48) return '#eab308'; // Less than 48 hours - yellow
        return '#059669'; // More than 48 hours - green
    }
    
    getExpiryStatus(expiryDate) {
        if (!expiryDate) return 'Belirtilmemiş';
        
        const expiry = new Date(expiryDate);
        const now = new Date();
        const diffHours = (expiry - now) / (1000 * 60 * 60);
        
        if (diffHours < 0) return 'Süresi dolmuş';
        if (diffHours < 6) return `${Math.floor(diffHours)} saat kaldı`;
        if (diffHours < 24) return `${Math.floor(diffHours)} saat kaldı`;
        if (diffHours < 48) return '1 gün kaldı';
        return `${Math.floor(diffHours / 24)} gün kaldı`;
    }
    
    getOrderStatusBadge(status) {
        const badges = {
            'pending': '<span class="status-badge pending"><i class="fas fa-clock"></i> Beklemede</span>',
            'confirmed': '<span class="status-badge confirmed"><i class="fas fa-check"></i> Onaylandı</span>',
            'preparing': '<span class="status-badge preparing"><i class="fas fa-utensils"></i> Hazırlanıyor</span>',
            'ready': '<span class="status-badge ready"><i class="fas fa-bell"></i> Hazır</span>',
            'delivered': '<span class="status-badge delivered"><i class="fas fa-check-circle"></i> Teslim Edildi</span>',
            'cancelled': '<span class="status-badge cancelled"><i class="fas fa-times-circle"></i> İptal Edildi</span>'
        };
        return badges[status] || badges['pending'];
    }
    
    getUserTypeBadgeColor(userType) {
        const colors = {
            'customer': '#3b82f6',
            'restaurant_owner': '#059669',
            'admin': '#dc2626'
        };
        return colors[userType] || '#6b7280';
    }
    
    getUserTypeLabel(userType) {
        const labels = {
            'customer': 'Müşteri',
            'restaurant_owner': 'Restoran Sahibi',
            'admin': 'Admin'
        };
        return labels[userType] || 'Bilinmeyen';
    }
    
    getTopCategories() {
        const categoryCount = {};
        
        // Count from applications
        this.data.applications.forEach(app => {
            const category = app.businessCategory || 'Diğer';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        // Count from packages
        this.data.packages.forEach(pkg => {
            const category = pkg.category || 'Diğer';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        // Sort and return top 5
        return Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([category, count]) => ({ category, count }));
    }
    
    getMonthlyStats() {
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        const monthlyApplications = this.data.applications.filter(app =>
            new Date(app.createdAt || app.timestamp) > monthAgo
        ).length;
        
        const monthlyOrders = this.data.orders.filter(order =>
            new Date(order.createdAt) > monthAgo
        ).length;
        
        return {
            applications: monthlyApplications,
            orders: monthlyOrders
        };
    }
    
    // Restaurant management functions
    viewRestaurant(restaurantId) {
        console.log('👁️ Viewing restaurant:', restaurantId);
        // Implementation for viewing restaurant details
        alert(`Restoran detayları görüntüleniyor: ${restaurantId}`);
    }
    
    editRestaurant(restaurantId) {
        console.log('✏️ Editing restaurant:', restaurantId);
        alert(`Restoran düzenleniyor: ${restaurantId}`);
    }
    
    suspendRestaurant(restaurantId) {
        if (confirm('Bu restoranı askıya almak istediğinizden emin misiniz?')) {
            console.log('⏸️ Suspending restaurant:', restaurantId);
            alert(`Restoran askıya alındı: ${restaurantId}`);
        }
    }
    
    activateRestaurant(restaurantId) {
        console.log('▶️ Activating restaurant:', restaurantId);
        alert(`Restoran aktifleştirildi: ${restaurantId}`);
    }
    
    // Package management functions
    viewPackage(packageId) {
        console.log('👁️ Viewing package:', packageId);
        alert(`Paket detayları görüntüleniyor: ${packageId}`);
    }
    
    editPackage(packageId) {
        console.log('✏️ Editing package:', packageId);
        alert(`Paket düzenleniyor: ${packageId}`);
    }
    
    deactivatePackage(packageId) {
        console.log('⏸️ Deactivating package:', packageId);
        alert(`Paket deaktif edildi: ${packageId}`);
    }
    
    activatePackage(packageId) {
        console.log('▶️ Activating package:', packageId);
        alert(`Paket aktifleştirildi: ${packageId}`);
    }
    
    deletePackage(packageId) {
        if (confirm('Bu paketi silmek istediğinizden emin misiniz?')) {
            console.log('🗑️ Deleting package:', packageId);
            alert(`Paket silindi: ${packageId}`);
        }
    }
    
    // Order management functions
    viewOrder(orderId) {
        console.log('👁️ Viewing order:', orderId);
        alert(`Sipariş detayları görüntüleniyor: ${orderId}`);
    }
    
    confirmOrder(orderId) {
        console.log('✅ Confirming order:', orderId);
        alert(`Sipariş onaylandı: ${orderId}`);
    }
    
    cancelOrder(orderId) {
        if (confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) {
            console.log('❌ Cancelling order:', orderId);
            alert(`Sipariş iptal edildi: ${orderId}`);
        }
    }
    
    trackOrder(orderId) {
        console.log('📍 Tracking order:', orderId);
        alert(`Sipariş takip ediliyor: ${orderId}`);
    }
    
    // User management functions
    viewUser(userId) {
        console.log('👁️ Viewing user:', userId);
        alert(`Kullanıcı detayları görüntüleniyor: ${userId}`);
    }
    
    editUser(userId) {
        console.log('✏️ Editing user:', userId);
        alert(`Kullanıcı düzenleniyor: ${userId}`);
    }
    
    suspendUser(userId) {
        if (confirm('Bu kullanıcıyı askıya almak istediğinizden emin misiniz?')) {
            console.log('⏸️ Suspending user:', userId);
            alert(`Kullanıcı askıya alındı: ${userId}`);
        }
    }
    
    activateUser(userId) {
        console.log('▶️ Activating user:', userId);
        alert(`Kullanıcı aktifleştirildi: ${userId}`);
    }

    setupAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000);
    }

    showError(message) {
        console.error('❌', message);
        // Could implement a toast notification here
        alert('Hata: ' + message);
    }

    // CONSUMERS DATA METHODS
    async loadConsumersData() {
        try {
            console.log('👥 Loading consumers data...');
            
            // Try to fetch real consumer data from KapTaze backend API
            let apiConsumers = [];
            let apiStatus = 'pending';
            
            try {
                const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/consumers', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
                    }
                });
                
                if (response.ok) {
                    const apiData = await response.json();
                    if (apiData.success && apiData.data && apiData.data.consumers) {
                        apiConsumers = apiData.data.consumers.map(consumer => ({
                            _id: consumer._id,
                            name: consumer.name,
                            surname: consumer.surname,
                            email: consumer.email,
                            phone: consumer.phone || 'Belirtilmemiş',
                            registrationDate: new Date(consumer.createdAt || consumer.registrationDate),
                            lastActivity: new Date(consumer.lastActivity || consumer.updatedAt || consumer.createdAt),
                            orderCount: consumer.orders?.length || consumer.orderCount || 0,
                            totalSpent: consumer.totalSpent || 0,
                            status: consumer.status || 'active'
                        }));
                        apiStatus = 'connected';
                        console.log(`✅ Loaded ${apiConsumers.length} consumers from API`);
                    }
                } else {
                    const errorData = await response.json();
                    if (errorData.message && errorData.message.includes('Route not found')) {
                        apiStatus = 'not_implemented';
                        console.log('⚠️ Consumer API endpoints not yet implemented in backend');
                    } else {
                        apiStatus = 'error';
                        console.log('⚠️ API response not ok, using fallback data');
                    }
                }
            } catch (apiError) {
                apiStatus = 'error';
                console.log('⚠️ API call failed, using fallback data:', apiError.message);
            }
            
            // Store API status for display
            this.apiStatus = apiStatus;
            
            // Fallback to mock data if API fails or returns no data
            const mockConsumers = [
                {
                    _id: 'mock1',
                    name: 'Ahmet',
                    surname: 'Yılmaz', 
                    email: 'ahmet@example.com',
                    phone: '+905551234567',
                    registrationDate: new Date('2025-01-15'),
                    lastActivity: new Date('2025-08-26'),
                    orderCount: 12,
                    totalSpent: 450,
                    status: 'active'
                },
                {
                    _id: 'mock2',
                    name: 'Ayşe',
                    surname: 'Demir',
                    email: 'ayse@example.com',
                    phone: '+905559876543',
                    registrationDate: new Date('2025-02-20'),
                    lastActivity: new Date('2025-08-25'),
                    orderCount: 8,
                    totalSpent: 320,
                    status: 'active'
                },
                {
                    _id: 'mock3',
                    name: 'Mehmet',
                    surname: 'Kaya',
                    email: 'mehmet@example.com',
                    phone: '+905556789012',
                    registrationDate: new Date('2025-03-10'),
                    lastActivity: new Date('2025-07-15'),
                    orderCount: 3,
                    totalSpent: 75,
                    status: 'inactive'
                }
            ];

            // Combine API data with fallback data
            this.data.consumers = apiConsumers.length > 0 ? apiConsumers : mockConsumers;
            
            this.renderConsumersTable();
            this.updateConsumersStats();
            this.updateApiStatusIndicator();
            
            console.log(`✅ Consumers data loaded: ${this.data.consumers.length} total consumers`);
        } catch (error) {
            console.error('❌ Error loading consumers:', error);
            this.showError('Tüketici verileri yüklenirken hata oluştu');
        }
    }

    renderConsumersTable() {
        const tbody = document.getElementById('consumers-table');
        if (!tbody) return;

        if (this.data.consumers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">
                        <i class="fas fa-users"></i>
                        <p>Henüz kayıtlı tüketici bulunmuyor</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.consumers.map(consumer => {
            const statusClass = consumer.status === 'active' ? 'success' : 
                              consumer.status === 'inactive' ? 'warning' : 'danger';
            const statusText = consumer.status === 'active' ? 'Aktif' : 
                             consumer.status === 'inactive' ? 'Pasif' : 'Yasaklı';

            return `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div>
                                <div class="user-name">${consumer.name} ${consumer.surname}</div>
                                <div class="user-id">ID: ${consumer._id}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="email-info">
                            <span>${consumer.email}</span>
                        </div>
                    </td>
                    <td>${consumer.phone || '-'}</td>
                    <td>${new Date(consumer.registrationDate).toLocaleDateString('tr-TR')}</td>
                    <td>${new Date(consumer.lastActivity).toLocaleDateString('tr-TR')}</td>
                    <td>
                        <div class="order-info">
                            <span class="order-count">${consumer.orderCount}</span>
                            <small>sipariş</small>
                        </div>
                    </td>
                    <td>
                        <div class="spending-info">
                            <span class="amount">₺${consumer.totalSpent}</span>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="viewConsumerDetails('${consumer._id}')" title="Detayları Görüntüle">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="editConsumer('${consumer._id}')" title="Düzenle">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="toggleConsumerStatus('${consumer._id}')" title="Durumu Değiştir">
                                <i class="fas fa-ban"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateConsumersStats() {
        const totalConsumers = this.data.consumers.length;
        const activeConsumers = this.data.consumers.filter(c => c.status === 'active').length;
        const monthlyRegistrations = this.data.consumers.filter(c => {
            const regDate = new Date(c.registrationDate);
            const now = new Date();
            return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear();
        }).length;
        const avgSpending = totalConsumers > 0 ? 
            Math.round(this.data.consumers.reduce((sum, c) => sum + c.totalSpent, 0) / totalConsumers) : 0;

        // Update DOM elements
        document.getElementById('total-consumers').textContent = totalConsumers;
        document.getElementById('active-consumers').textContent = activeConsumers;
        document.getElementById('monthly-registrations').textContent = monthlyRegistrations;
        document.getElementById('avg-orders').textContent = `₺${avgSpending}`;
    }
    
    updateApiStatusIndicator() {
        const statusText = document.getElementById('api-status-text');
        const statusIcon = document.getElementById('api-status-icon');
        
        if (!statusText || !statusIcon) return;
        
        switch (this.apiStatus) {
            case 'connected':
                statusText.textContent = 'Backend API bağlantısı aktif';
                statusText.style.color = '#10b981';
                statusIcon.textContent = '✅';
                break;
            case 'not_implemented':
                statusText.textContent = 'API endpoints henüz backend\'e eklenmemiş (mock data gösteriliyor)';
                statusText.style.color = '#f59e0b';
                statusIcon.textContent = '⚠️';
                break;
            case 'error':
                statusText.textContent = 'Backend bağlantı hatası (mock data gösteriliyor)';
                statusText.style.color = '#ef4444';
                statusIcon.textContent = '❌';
                break;
            default:
                statusText.textContent = 'Backend bağlantısı kontrol ediliyor...';
                statusText.style.color = '#6b7280';
                statusIcon.textContent = '⏳';
        }
    }
}

// CONSUMERS GLOBAL FUNCTIONS
window.refreshConsumers = function() {
    if (window.dashboard) {
        window.dashboard.loadConsumersData();
    }
};

window.exportConsumers = function() {
    if (window.dashboard && window.dashboard.data.consumers.length > 0) {
        // Create CSV content
        const csvContent = [
            ['Ad', 'Soyad', 'Email', 'Telefon', 'Kayıt Tarihi', 'Son Aktivite', 'Sipariş Sayısı', 'Toplam Harcama', 'Durum'],
            ...window.dashboard.data.consumers.map(c => [
                c.name,
                c.surname, 
                c.email,
                c.phone || '',
                new Date(c.registrationDate).toLocaleDateString('tr-TR'),
                new Date(c.lastActivity).toLocaleDateString('tr-TR'),
                c.orderCount,
                c.totalSpent,
                c.status === 'active' ? 'Aktif' : c.status === 'inactive' ? 'Pasif' : 'Yasaklı'
            ])
        ].map(row => row.join(',')).join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `kaptaze-tuketiciler-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        console.log('📊 Consumers data exported');
    }
};

window.viewConsumerDetails = function(consumerId) {
    const consumer = window.dashboard.data.consumers.find(c => c._id === consumerId);
    if (consumer) {
        alert(`Tüketici Detayları:\n\nAd: ${consumer.name} ${consumer.surname}\nEmail: ${consumer.email}\nTelefon: ${consumer.phone || 'Belirtilmemiş'}\nKayıt: ${new Date(consumer.registrationDate).toLocaleDateString('tr-TR')}\nSipariş: ${consumer.orderCount}\nHarcama: ₺${consumer.totalSpent}`);
    }
};

window.editConsumer = function(consumerId) {
    alert('Tüketici düzenleme özelliği yakında eklenecek.');
};

window.toggleConsumerStatus = function(consumerId) {
    const consumer = window.dashboard.data.consumers.find(c => c._id === consumerId);
    if (consumer && confirm(`${consumer.name} ${consumer.surname} adlı tüketicinin durumunu değiştirmek istiyor musunuz?`)) {
        consumer.status = consumer.status === 'active' ? 'inactive' : 'active';
        window.dashboard.renderConsumersTable();
        window.dashboard.updateConsumersStats();
        console.log(`👤 Consumer ${consumerId} status changed to ${consumer.status}`);
    }
};

// LOGOUT FUNCTION
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        // Clear localStorage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        // Clear MongoDB session if available
        if (window.KapTazeMongoDB) {
            window.KapTazeMongoDB.clearSession();
        }
        
        console.log('🚪 Admin logged out');
        window.location.href = '/admin-login.html';
    }
}

// GLOBAL FUNCTIONS
window.showSection = function(sectionId) {
    if (window.dashboard) {
        window.dashboard.showSection(sectionId);
    }
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🏁 DOM loaded, initializing admin dashboard...');
        window.dashboard = new KapTazeAdminDashboard();
        console.log('🚀 Admin dashboard fully initialized');
    } catch (error) {
        console.error('❌ Dashboard initialization failed:', error);
    }
});

// Global close modal function
window.closeApprovalModal = function() {
    if (window.dashboard) {
        window.dashboard.closeApprovalModal();
    }
};

window.confirmApproval = function() {
    if (window.dashboard) {
        window.dashboard.confirmApproval();
    }
};

console.log('🌐 KapTaze Professional Admin Dashboard Script Loaded v2025.08.23.02');