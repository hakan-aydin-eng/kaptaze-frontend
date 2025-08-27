/**
 * KapTaze Professional Admin Dashboard
 * Backend Service Integration
 * Version: 2025.08.27.FIXED
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
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleGlobalSearch(e.target.value);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.handleStatusFilter(e.target.value);
            });
        }
    }

    showSection(sectionId) {
        console.log('🔄 Switching to section:', sectionId);
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show target section
        const targetSection = document.getElementById(sectionId + '-section');
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'applications': 'Başvuru Yönetimi', 
            'restaurants': 'Restoran Yönetimi',
            'packages': 'Paket Yönetimi',
            'consumers': 'Tüketici Yönetimi',
            'orders': 'Sipariş Yönetimi'
        };
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[sectionId] || sectionId;
        }

        this.currentSection = sectionId;

        // Load section data
        this.loadSectionData(sectionId);
    }

    async loadSectionData(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'applications':
                await this.loadApplications();
                break;
            case 'restaurants':
                await this.loadRestaurants();
                break;
            case 'packages':
                await this.loadPackages();
                break;
            case 'consumers':
                await this.loadConsumers();
                break;
            case 'orders':
                await this.loadOrders();
                break;
        }
    }

    async loadDashboardData() {
        console.log('📊 Loading dashboard data...');
        
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

    async loadOrders() {
        try {
            console.log('📋 Loading orders...');
            const orders = await this.backendService.getOrders();
            this.data.orders = orders || [];
            this.renderOrders();
            console.log(`✅ Loaded ${this.data.orders.length} orders`);
        } catch (error) {
            console.log('⚠️ Orders not available');
            this.data.orders = [];
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

    // Render functions
    renderApplications() {
        const container = document.getElementById('applications-list');
        if (!container) return;

        if (this.data.applications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Başvuru Bulunamadı</h3>
                    <p>Henüz restoran başvurusu bulunmuyor.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.applications.map(app => `
            <div class="application-card" data-id="${app.id}">
                <div class="app-header">
                    <div class="app-info">
                        <h4>${app.name}</h4>
                        <p class="restaurant-name">${app.restaurantName}</p>
                        <span class="status-badge status-${app.status}">
                            ${this.getStatusText(app.status)}
                        </span>
                    </div>
                    <div class="app-date">
                        ${this.formatDate(app.createdAt)}
                    </div>
                </div>
                <div class="app-details">
                    <p><i class="fas fa-envelope"></i> ${app.email}</p>
                    <p><i class="fas fa-phone"></i> ${app.phone}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${app.address}</p>
                </div>
                <div class="app-actions">
                    <button class="btn btn-sm btn-primary" onclick="dashboard.viewApplication('${app.id}')">
                        <i class="fas fa-eye"></i> İncele
                    </button>
                    ${app.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="dashboard.approveApplication('${app.id}')">
                            <i class="fas fa-check"></i> Onayla
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="dashboard.rejectApplication('${app.id}')">
                            <i class="fas fa-times"></i> Reddet
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    renderRestaurants() {
        const container = document.getElementById('restaurants-list');
        if (!container) return;

        if (this.data.restaurants.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-store"></i>
                    <h3>Restoran Bulunamadı</h3>
                    <p>Henüz onaylanmış restoran bulunmuyor.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.restaurants.map(restaurant => `
            <div class="restaurant-card" data-id="${restaurant.id}">
                <div class="rest-header">
                    <div class="rest-info">
                        <h4>${restaurant.name}</h4>
                        <p class="rest-address">${restaurant.address}</p>
                        <span class="status-badge status-${restaurant.status}">
                            ${this.getStatusText(restaurant.status)}
                        </span>
                    </div>
                    <div class="rest-stats">
                        <div class="stat">
                            <span class="stat-number">${restaurant.totalPackages || 0}</span>
                            <span class="stat-label">Paket</span>
                        </div>
                        <div class="stat">
                            <span class="stat-number">${restaurant.totalOrders || 0}</span>
                            <span class="stat-label">Sipariş</span>
                        </div>
                    </div>
                </div>
                <div class="rest-details">
                    <p><i class="fas fa-envelope"></i> ${restaurant.email}</p>
                    <p><i class="fas fa-phone"></i> ${restaurant.phone}</p>
                    <p><i class="fas fa-calendar"></i> Onaylandı: ${this.formatDate(restaurant.approvedAt)}</p>
                </div>
                <div class="rest-actions">
                    <button class="btn btn-sm btn-primary" onclick="dashboard.viewRestaurant('${restaurant.id}')">
                        <i class="fas fa-eye"></i> Detay
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="dashboard.editRestaurant('${restaurant.id}')">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPackages() {
        const container = document.getElementById('packages-list');
        if (!container) return;

        if (this.data.packages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box"></i>
                    <h3>Paket Bulunamadı</h3>
                    <p>Henüz restoran paketi bulunmuyor.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.packages.map(pkg => `
            <div class="package-card" data-id="${pkg.id}">
                <div class="pkg-header">
                    <div class="pkg-info">
                        <h4>${pkg.name}</h4>
                        <p class="pkg-restaurant">${pkg.restaurantName}</p>
                        <span class="status-badge status-${pkg.status}">
                            ${this.getStatusText(pkg.status)}
                        </span>
                    </div>
                    <div class="pkg-pricing">
                        <div class="price-original">₺${pkg.originalPrice}</div>
                        <div class="price-discounted">₺${pkg.discountedPrice}</div>
                        <div class="discount-percent">%${Math.round((1 - pkg.discountedPrice / pkg.originalPrice) * 100)}</div>
                    </div>
                </div>
                <div class="pkg-details">
                    <p><i class="fas fa-box"></i> ${pkg.quantity} adet</p>
                    <p><i class="fas fa-clock"></i> ${pkg.pickupTime}</p>
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(pkg.createdAt)}</p>
                </div>
                <div class="pkg-actions">
                    <button class="btn btn-sm btn-primary" onclick="dashboard.viewPackage('${pkg.id}')">
                        <i class="fas fa-eye"></i> Detay
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="dashboard.editPackage('${pkg.id}')">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderConsumers() {
        // Keep existing consumer functionality - don't touch
        console.log('👥 Consumer rendering - keeping existing functionality');
    }

    renderOrders() {
        const container = document.getElementById('orders-list');
        if (!container) return;

        if (this.data.orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Sipariş Bulunamadı</h3>
                    <p>Henüz sipariş bulunmuyor.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.data.orders.map(order => `
            <div class="order-card" data-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h4>Sipariş #${order.orderNumber || order.id}</h4>
                        <p class="order-customer">${order.customerName}</p>
                        <span class="status-badge status-${order.status}">
                            ${this.getStatusText(order.status)}
                        </span>
                    </div>
                    <div class="order-amount">
                        <span class="amount">₺${order.totalAmount}</span>
                    </div>
                </div>
                <div class="order-details">
                    <p><i class="fas fa-store"></i> ${order.restaurantName}</p>
                    <p><i class="fas fa-box"></i> ${order.packageName}</p>
                    <p><i class="fas fa-calendar"></i> ${this.formatDate(order.createdAt)}</p>
                </div>
                <div class="order-actions">
                    <button class="btn btn-sm btn-primary" onclick="dashboard.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i> Detay
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateDashboardStats() {
        // Update statistics cards
        const stats = {
            totalApplications: this.data.applications.length,
            pendingApplications: this.data.applications.filter(app => app.status === 'pending').length,
            totalRestaurants: this.data.restaurants.length,
            activePackages: this.data.packages.filter(pkg => pkg.status === 'active').length,
            totalOrders: this.data.orders.length,
            totalConsumers: this.data.consumers.length
        };

        // Update stat cards
        this.updateStatCard('total-applications', stats.totalApplications);
        this.updateStatCard('pending-applications', stats.pendingApplications);
        this.updateStatCard('total-restaurants', stats.totalRestaurants);
        this.updateStatCard('active-packages', stats.activePackages);
        this.updateStatCard('total-orders', stats.totalOrders);
        this.updateStatCard('total-consumers', stats.totalConsumers);
    }

    updateStatCard(cardId, value) {
        const card = document.getElementById(cardId);
        if (card) {
            const numberElement = card.querySelector('.stat-number');
            if (numberElement) {
                numberElement.textContent = value;
            }
        }
    }

    // Action handlers
    async approveApplication(applicationId) {
        const application = this.data.applications.find(app => app.id === applicationId);
        if (!application) return;

        if (confirm(`${application.restaurantName} başvurusunu onaylamak istediğinizden emin misiniz?`)) {
            try {
                // Try to approve via backend
                await this.backendService.makeRequest(`/api/admin/applications/${applicationId}/approve`, {
                    method: 'PUT',
                    body: JSON.stringify({ approved: true })
                });

                // Update local data
                application.status = 'approved';
                
                // Move to restaurants
                this.data.restaurants.push({
                    id: 'rest-' + applicationId,
                    name: application.restaurantName,
                    email: application.email,
                    phone: application.phone,
                    address: application.address,
                    status: 'active',
                    approvedAt: new Date(),
                    totalPackages: 0,
                    totalOrders: 0
                });

                // Send approval email (assuming SendGrid is working)
                await this.sendApprovalEmail(application);

                // Re-render
                this.renderApplications();
                this.renderRestaurants();
                this.updateDashboardStats();

                alert('Başvuru başarıyla onaylandı ve restoran sisteme eklendi!');

            } catch (error) {
                console.error('Approval error:', error);
                alert('Onay işlemi sırasında hata oluştu: ' + error.message);
            }
        }
    }

    async sendApprovalEmail(application) {
        // Email sending with existing SendGrid integration
        console.log('📧 Sending approval email to:', application.email);
        // Implementation would use existing SendGrid API
    }

    rejectApplication(applicationId) {
        const application = this.data.applications.find(app => app.id === applicationId);
        if (!application) return;

        if (confirm(`${application.restaurantName} başvurusunu reddetmek istediğinizden emin misiniz?`)) {
            application.status = 'rejected';
            this.renderApplications();
            this.updateDashboardStats();
            alert('Başvuru reddedildi.');
        }
    }

    viewApplication(applicationId) {
        const application = this.data.applications.find(app => app.id === applicationId);
        if (application) {
            // Show application details modal
            alert(`Başvuru Detayları:\n\nRestoran: ${application.restaurantName}\nSahip: ${application.name}\nEmail: ${application.email}\nTelefon: ${application.phone}\nAdres: ${application.address}`);
        }
    }

    viewRestaurant(restaurantId) {
        const restaurant = this.data.restaurants.find(rest => rest.id === restaurantId);
        if (restaurant) {
            alert(`Restoran Detayları:\n\nAd: ${restaurant.name}\nEmail: ${restaurant.email}\nTelefon: ${restaurant.phone}\nAdres: ${restaurant.address}\nToplam Paket: ${restaurant.totalPackages}\nToplam Sipariş: ${restaurant.totalOrders}`);
        }
    }

    viewPackage(packageId) {
        const pkg = this.data.packages.find(p => p.id === packageId);
        if (pkg) {
            alert(`Paket Detayları:\n\nAd: ${pkg.name}\nRestoran: ${pkg.restaurantName}\nOrijinal Fiyat: ₺${pkg.originalPrice}\nİndirimli Fiyat: ₺${pkg.discountedPrice}\nAdet: ${pkg.quantity}\nTeslim Saati: ${pkg.pickupTime}`);
        }
    }

    viewOrder(orderId) {
        const order = this.data.orders.find(o => o.id === orderId);
        if (order) {
            alert(`Sipariş Detayları:\n\nSipariş No: ${order.orderNumber || order.id}\nMüşteri: ${order.customerName}\nRestoran: ${order.restaurantName}\nPaket: ${order.packageName}\nTutar: ₺${order.totalAmount}\nDurum: ${this.getStatusText(order.status)}`);
        }
    }

    // Utility functions
    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': 'Beklemede',
            'approved': 'Onaylandı',
            'rejected': 'Reddedildi',
            'active': 'Aktif',
            'inactive': 'Pasif',
            'completed': 'Tamamlandı',
            'cancelled': 'İptal Edildi'
        };
        return statusTexts[status] || status;
    }

    setupAutoRefresh() {
        // Refresh data every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000);
    }

    handleGlobalSearch(query) {
        console.log('🔍 Global search:', query);
        // Implement global search functionality
    }

    handleStatusFilter(status) {
        console.log('📊 Status filter:', status);
        // Implement status filtering
    }

    showErrorMessage(message) {
        console.error('Error:', message);
        // Show error notification
    }

    // Make functions globally available for onclick handlers
    refreshApplications() {
        this.loadApplications();
    }
}

// Make AdminDashboard globally available
window.AdminDashboard = AdminDashboard;
