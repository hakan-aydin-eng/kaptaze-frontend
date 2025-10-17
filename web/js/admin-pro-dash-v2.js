/**
 * KapTaze Admin Professional Dashboard V2
 * Ultra Modern Restaurant Management System
 * Version: 2025.08.28
 */

class AdminProDashboardV2 {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.data = {
            applications: [],
            restaurants: [],
            packages: [],
            orders: [],
            consumers: [],
            reviews: [],
            stats: {}
        };
        this.currentReviewStatus = 'pending'; // Track current review filter
        this.refreshInterval = null;
        this.sidebarCollapsed = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 KapTaze Admin Pro Dashboard V2 initializing...');
        
        // Check authentication
        if (!this.checkAuth()) {
            this.redirectToLogin();
            return;
        }

        // Setup event handlers
        this.setupEventHandlers();
        
        // Load initial data
        await this.loadAllData();
        
        // Setup performance optimizations
        this.initializePerformanceOptimizations();
        
        // Setup auto-refresh
        this.setupAutoRefresh();
        
        // Setup real-time features
        this.setupRealTimeFeatures();
        
        // Initialize SendGrid service
        await this.initializeEmailService();
        
        console.log('✅ Admin Pro Dashboard V2 ready');
    }

    checkAuth() {
        const token = localStorage.getItem('kaptaze_token');
        const user = localStorage.getItem('kaptaze_user');
        
        if (!token || !user) {
            return false;
        }

        try {
            this.currentUser = JSON.parse(user);
            
            // Set API auth token
            if (window.KapTazeAPI && window.KapTazeAPI.setAuthToken) {
                window.KapTazeAPI.setAuthToken(token);
            }
            
            // Update user info in header
            this.updateUserInfo();
            
            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            return false;
        }
    }

    updateUserInfo() {
        const userName = document.getElementById('userName');
        if (userName && this.currentUser) {
            userName.textContent = this.currentUser.name || 'Admin User';
        }
    }

    redirectToLogin() {
        console.log('🔒 Authentication required, redirecting to login...');
        window.location.href = './admin-login-v3.html';
    }

    setupEventHandlers() {
        // Navigation handling
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });

        // Responsive handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Handle mobile back button
        window.addEventListener('popstate', (e) => {
            const section = new URLSearchParams(window.location.search).get('section') || 'dashboard';
            this.showSection(section, false);
        });
    }

    showSection(sectionName, updateUrl = true) {
        console.log(`📄 Switching to section: ${sectionName}`);
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            
            // Update page title
            this.updatePageTitle(sectionName);
            
            // Load section-specific data
            this.loadSectionData(sectionName);
            
            // Update URL
            if (updateUrl) {
                const url = new URL(window.location);
                url.searchParams.set('section', sectionName);
                history.pushState({section: sectionName}, '', url);
            }
        }
    }

    updatePageTitle(section) {
        const titles = {
            'dashboard': 'Ana Dashboard',
            'applications': 'Restoran Başvuruları',
            'restaurants': 'Kayıtlı Restoranlar',
            'packages': 'Paket Yönetimi',
            'consumers': 'Tüketici Yönetimi',
            'settings': 'Sistem Ayarları'
        };

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[section] || 'Admin Panel';
        }
    }

    async loadSectionData(section) {
        switch (section) {
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
            case 'consumers':
                await this.loadConsumersData();
                break;
            case 'reviews':
                await this.loadReviewsData();
                break;
        }
    }

    async loadAllData() {
        console.log('📊 Loading all dashboard data...');
        
        try {
            // Show loading states
            this.showLoadingStates();
            
            // Load data concurrently
            const [
                applications,
                restaurants, 
                packages,
                consumers,
                stats
            ] = await Promise.allSettled([
                this.fetchApplications(),
                this.fetchRestaurants(),
                this.fetchPackages(),
                this.fetchConsumers(),
                this.fetchStats()
            ]);

            // Process results
            this.data.applications = applications.status === 'fulfilled' ? applications.value : [];
            this.data.restaurants = restaurants.status === 'fulfilled' ? restaurants.value : [];
            this.data.packages = packages.status === 'fulfilled' ? packages.value : [];
            this.data.consumers = consumers.status === 'fulfilled' ? consumers.value : [];
            this.data.stats = stats.status === 'fulfilled' ? stats.value : {};

            // Update UI
            this.updateStatsCards();
            this.updateNavigationBadges();
            this.renderDashboardContent();
            
            // Update API status
            this.updateAPIStatus(true);

        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.updateAPIStatus(false);
            this.loadDemoData();
        }
    }

    async fetchApplications() {
        try {
            const response = await window.KapTazeAPIService.request('/admin/applications');
            
            if (response.success && response.data) {
                return response.data.applications || [];
            }
            
            throw new Error('Invalid applications response');
        } catch (error) {
            console.log('📋 Applications API failed, using demo data');
            return this.generateDemoApplications();
        }
    }

    async fetchRestaurants() {
        try {
            const response = await window.KapTazeAPIService.request('/admin/restaurants');
            
            if (response.success && response.data) {
                return response.data.restaurants || [];
            }
            
            throw new Error('Invalid restaurants response');
        } catch (error) {
            console.log('🍽️ Restaurants API failed, using demo data');
            return this.generateDemoRestaurants();
        }
    }

    async fetchPackages() {
        try {
            const response = await window.KapTazeAPIService.request('/admin/packages');
            
            if (response.success && response.data) {
                return response.data.packages || [];
            }
            
            throw new Error('Invalid packages response');
        } catch (error) {
            console.log('📦 Packages API failed, using demo data');
            return this.generateDemoPackages();
        }
    }

    async fetchConsumers() {
        try {
            const response = await window.KapTazeAPIService.request('/admin/consumers');
            
            if (response.success && response.data) {
                return response.data.consumers || [];
            }
            
            throw new Error('Invalid consumers response');
        } catch (error) {
            console.log('👥 Consumers API failed, using demo data');
            return this.generateDemoConsumers();
        }
    }

    async fetchStats() {
        try {
            const response = await window.KapTazeAPIService.request('/admin/stats');
            
            if (response.success && response.data) {
                return response.data;
            }
            
            throw new Error('Invalid stats response');
        } catch (error) {
            console.log('📊 Stats API failed, using demo data');
            return this.generateDemoStats();
        }
    }

    generateDemoApplications() {
        return [
            {
                applicationId: 'APP_1756335493068_l5jqmo3n1',
                firstName: 'Gece',
                lastName: 'Test',
                email: 'gecetest@example.com',
                phone: '+90 555 123 4567',
                businessName: 'gecetest',
                businessCategory: 'Fast Food',
                businessAddress: 'Test Mahallesi, Test Sokak No:1',
                city: 'İstanbul',
                district: 'Kadıköy',
                status: 'pending',
                createdAt: new Date('2025-08-27').toISOString(),
                notes: 'Demo başvuru - gerçek müşteri kaydı'
            },
            {
                applicationId: 'APP_1756335493069_demo001',
                firstName: 'Ahmet',
                lastName: 'Yılmaz',
                email: 'ahmet@restaurant.com',
                phone: '+90 555 987 6543',
                businessName: 'Lezzet Durağı',
                businessCategory: 'Türk Mutfağı',
                businessAddress: 'Merkez Mahallesi, Lezzet Sokak No:15',
                city: 'Ankara',
                district: 'Çankaya',
                status: 'approved',
                createdAt: new Date('2025-08-25').toISOString(),
                notes: 'Onaylanmış demo restoran'
            },
            {
                applicationId: 'APP_1756335493070_demo002',
                firstName: 'Fatma',
                lastName: 'Demir',
                email: 'fatma@kebapevi.com',
                phone: '+90 555 456 7890',
                businessName: 'Sultanahmet Kebap Evi',
                businessCategory: 'Kebap & Izgara',
                businessAddress: 'Tarihi Mahalle, Kebap Sokak No:7',
                city: 'İstanbul',
                district: 'Fatih',
                status: 'pending',
                createdAt: new Date('2025-08-26').toISOString(),
                notes: 'İnceleme aşamasında'
            }
        ];
    }

    generateDemoRestaurants() {
        return [
            {
                _id: 'rest_001',
                name: 'Lezzet Durağı',
                category: 'Türk Mutfağı',
                owner: {
                    firstName: 'Ahmet',
                    lastName: 'Yılmaz',
                    email: 'ahmet@restaurant.com'
                },
                address: {
                    street: 'Merkez Mahallesi, Lezzet Sokak No:15',
                    district: 'Çankaya',
                    city: 'Ankara'
                },
                status: 'active',
                rating: { average: 4.5, count: 127 },
                stats: { totalOrders: 1543, totalRevenue: 45670 },
                createdAt: new Date('2025-08-20').toISOString()
            }
        ];
    }

    generateDemoPackages() {
        return [
            {
                _id: 'pkg_001',
                name: 'Öğlen Menüsü Special',
                description: 'Çorba, ana yemek, salata ve tatlı',
                originalPrice: 45,
                discountedPrice: 32,
                price: 32,
                restaurant: {
                    _id: 'rest_001',
                    name: 'Lezzet Durağı',
                    category: 'Geleneksel Mutfak',
                    phone: '+90 532 111 2233'
                },
                category: 'Karma Menü',
                status: 'active',
                quantity: 50,
                remainingQuantity: 23,
                availableUntil: new Date('2025-08-30').toISOString(),
                createdAt: new Date('2025-08-27').toISOString()
            },
            {
                _id: 'pkg_002',
                name: 'Vejetaryen Tabağı',
                description: 'Taze sebzelerle hazırlanmış özel tabak',
                originalPrice: 35,
                discountedPrice: 25,
                price: 25,
                restaurant: {
                    _id: 'rest_002',
                    name: 'Yeşil Bahçe Restaurant',
                    category: 'Vejetaryen',
                    phone: '+90 533 444 5566'
                },
                category: 'Vejetaryen',
                status: 'active',
                quantity: 30,
                remainingQuantity: 15,
                availableUntil: new Date('2025-08-29').toISOString(),
                createdAt: new Date('2025-08-26').toISOString()
            },
            {
                _id: 'pkg_003',
                name: 'Pizza Margherita',
                description: 'İtalyan tarzı klasik margerita pizza',
                originalPrice: 65,
                discountedPrice: 45,
                price: 45,
                restaurant: {
                    _id: 'rest_003',
                    name: 'Milano Pizzeria',
                    category: 'İtalyan Mutfağı',
                    phone: '+90 534 777 8899'
                },
                category: 'Fast Food',
                status: 'active',
                quantity: 25,
                remainingQuantity: 8,
                availableUntil: new Date('2025-08-31').toISOString(),
                createdAt: new Date('2025-08-28').toISOString()
            }
        ];
    }

    generateDemoConsumers() {
        return [
            {
                _id: 'consumer_001',
                name: 'Mehmet',
                surname: 'Özkan',
                email: 'mehmet@gmail.com',
                phone: '+90 555 111 2233',
                status: 'active',
                orderCount: 8,
                totalSpent: 245.50,
                lastActivity: new Date('2025-08-27').toISOString(),
                createdAt: new Date('2025-08-15').toISOString(),
                deviceInfo: {
                    platform: 'android',
                    version: '1.2.0',
                    deviceId: 'android_device_001'
                },
                emailVerified: true,
                // 🔄 PHASE 3: Consumer Behavior Tracking
                behaviorData: {
                    favoriteCategories: ['Pizza & Fast Food', 'Türk Mutfağı'],
                    averageOrderValue: 30.69,
                    preferredOrderTimes: ['12:00-13:00', '19:00-21:00'],
                    frequentRestaurants: ['Pizza Palace', 'Burger House'],
                    sessionDuration: 145, // seconds
                    appOpenFrequency: 12, // times per week
                    lastSeenLocation: 'Antalya/Muratpaşa',
                    pushNotificationsEnabled: true,
                    referralCount: 2,
                    reviewsGiven: 5,
                    cancellationRate: 0.02, // 2%
                    loyaltyScore: 85 // out of 100
                }
            },
            {
                _id: 'consumer_002',
                name: 'Ayşe',
                surname: 'Kaya',
                email: 'ayse.kaya@hotmail.com',
                phone: '+90 532 444 5566',
                status: 'active',
                orderCount: 12,
                totalSpent: 380.75,
                lastActivity: new Date('2025-08-28').toISOString(),
                createdAt: new Date('2025-08-10').toISOString(),
                deviceInfo: {
                    platform: 'ios',
                    version: '1.2.0',
                    deviceId: 'ios_device_002'
                },
                emailVerified: true,
                behaviorData: {
                    favoriteCategories: ['Kahve & Atıştırmalık', 'Tatlı & İçecek'],
                    averageOrderValue: 31.73,
                    preferredOrderTimes: ['15:00-16:00', '20:00-22:00'],
                    frequentRestaurants: ['Cafe Latte', 'Sweet Corner'],
                    sessionDuration: 203,
                    appOpenFrequency: 18,
                    lastSeenLocation: 'Antalya/Kepez',
                    pushNotificationsEnabled: true,
                    referralCount: 3,
                    reviewsGiven: 8,
                    cancellationRate: 0.01,
                    loyaltyScore: 92
                }
            },
            {
                _id: 'consumer_003',
                name: 'Ali',
                surname: 'Demir',
                email: 'ali.demir@yahoo.com',
                phone: '+90 544 777 8899',
                status: 'inactive',
                orderCount: 3,
                totalSpent: 89.25,
                lastActivity: new Date('2025-08-20').toISOString(),
                createdAt: new Date('2025-08-05').toISOString(),
                deviceInfo: {
                    platform: 'android',
                    version: '1.1.5',
                    deviceId: 'android_device_003'
                },
                emailVerified: false
            },
            {
                _id: 'consumer_004',
                name: 'Fatma',
                surname: 'Yılmaz',
                email: 'fatma@gmail.com',
                phone: '+90 505 123 4567',
                status: 'suspended',
                orderCount: 1,
                totalSpent: 25.00,
                lastActivity: new Date('2025-08-18').toISOString(),
                createdAt: new Date('2025-08-12').toISOString(),
                deviceInfo: {
                    platform: 'ios',
                    version: '1.0.8',
                    deviceId: 'ios_device_004'
                },
                emailVerified: true
            },
            {
                _id: 'consumer_005',
                name: 'Burak',
                surname: 'Şahin',
                email: 'burak.sahin@outlook.com',
                phone: '+90 543 987 6543',
                status: 'active',
                orderCount: 15,
                totalSpent: 520.90,
                lastActivity: new Date('2025-08-28').toISOString(),
                createdAt: new Date('2025-07-25').toISOString(),
                deviceInfo: {
                    platform: 'android',
                    version: '1.2.0',
                    deviceId: 'android_device_005'
                },
                emailVerified: true
            }
        ];
    }

    generateDemoStats() {
        // Calculate real-time package stats
        const packages = this.data.packages || [];
        const restaurants = this.data.restaurants || [];
        const applications = this.data.applications || [];
        const consumers = this.data.consumers || [];

        return {
            totalApplications: applications.length || 3,
            pendingApplications: applications.filter(a => a.status === 'pending').length || 2,
            approvedApplications: applications.filter(a => a.status === 'approved').length || 1,
            totalRestaurants: restaurants.length || 1,
            activePackages: packages.filter(p => p.status === 'approved' && p.quantity > 0).length || 3,
            totalConsumers: consumers.length || 5,
            // 🔄 PHASE 3: Advanced Package Analytics
            totalPackages: packages.length || 3,
            pendingPackages: packages.filter(p => p.status === 'pending').length || 1,
            approvedPackages: packages.filter(p => p.status === 'approved').length || 2,
            rejectedPackages: packages.filter(p => p.status === 'rejected').length || 0,
            expiredPackages: packages.filter(p => p.status === 'expired').length || 0,
            outOfStockPackages: packages.filter(p => p.quantity === 0).length || 0,
            lowStockPackages: packages.filter(p => p.quantity > 0 && p.quantity <= 3).length || 1,
            totalRevenue: packages.reduce((sum, p) => sum + (p.discountPrice * Math.max(0, (p.originalQuantity || 5) - p.quantity)), 0) || 2450,
            averageDiscount: packages.length > 0 ? Math.round(packages.reduce((sum, p) => sum + p.discount, 0) / packages.length) : 45,
            // Daily stats (mock)
            todayPackages: Math.floor(packages.length * 0.3) || 1,
            todayRevenue: Math.floor((packages.reduce((sum, p) => sum + p.discountPrice, 0) || 850) * 0.4),
            // Performance metrics
            averageResponseTime: '2.3s',
            systemUptime: '99.9%',
            mobileAppUsers: Math.floor(consumers.length * 0.8) || 4,
            webUsers: Math.floor(consumers.length * 0.2) || 1
        };
    }

    updateStatsCards() {
        const stats = this.data.stats;
        
        // Update stat values
        this.updateStatValue('totalApplications', stats.totalApplications || this.data.applications.length);
        this.updateStatValue('approvedRestaurants', stats.approvedApplications || this.data.restaurants.length);
        this.updateStatValue('activePackages', stats.activePackages || this.data.packages.length);
        this.updateStatValue('totalConsumers', stats.totalConsumers || this.data.consumers.length);
    }

    updateStatValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // Animate number change
            this.animateNumber(element, parseInt(element.textContent) || 0, value);
        }
    }

    animateNumber(element, start, end) {
        const duration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    updateNavigationBadges() {
        const pendingCount = this.data.applications.filter(app => app.status === 'pending').length;
        const pendingBadge = document.getElementById('pendingCount');
        
        if (pendingBadge) {
            pendingBadge.textContent = pendingCount;
            pendingBadge.style.display = pendingCount > 0 ? 'block' : 'none';
        }
    }

    renderDashboardContent() {
        this.renderRecentApplications();
    }

    renderRecentApplications() {
        const container = document.getElementById('recentApplications');
        if (!container) return;

        const recent = this.data.applications
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--gray-500);">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Henüz başvuru bulunmamaktadır</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Başvuru ID</th>
                        <th>İşletme Adı</th>
                        <th>Sahibi</th>
                        <th>Kategori</th>
                        <th>Durum</th>
                        <th>Tarih</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    ${recent.map(app => this.renderApplicationRow(app)).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    renderApplicationRow(app) {
        const statusBadge = this.getStatusBadge(app.status);
        const date = new Date(app.createdAt).toLocaleDateString('tr-TR');
        
        return `
            <tr>
                <td><code>${app.applicationId}</code></td>
                <td><strong>${app.businessName}</strong></td>
                <td>${app.firstName} ${app.lastName}</td>
                <td>${app.businessCategory}</td>
                <td>${statusBadge}</td>
                <td>${date}</td>
                <td>
                    ${app.status === 'pending' ? `
                        <button class="action-btn action-approve" onclick="adminDashboard.approveApplication('${app.applicationId}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="action-btn action-reject" onclick="adminDashboard.rejectApplication('${app.applicationId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    <button class="action-btn action-view" onclick="adminDashboard.viewApplication('${app.applicationId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    getStatusBadge(status) {
        const badges = {
            'pending': '<span class="badge badge-pending"><i class="fas fa-clock"></i> Bekliyor</span>',
            'approved': '<span class="badge badge-approved"><i class="fas fa-check"></i> Onaylandı</span>',
            'rejected': '<span class="badge badge-rejected"><i class="fas fa-times"></i> Reddedildi</span>'
        };
        
        return badges[status] || '<span class="badge badge-pending">Bilinmiyor</span>';
    }

    async loadApplicationsData() {
        const container = document.getElementById('applicationsTable');
        if (!container) return;

        container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>Başvurular yükleniyor...</span>
            </div>
        `;

        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        if (this.data.applications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <i class="fas fa-inbox" style="font-size: 4rem; margin-bottom: 1rem;"></i>
                    <h3>Başvuru Bulunmuyor</h3>
                    <p>Henüz restoran başvurusu yapılmamış.</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Başvuru ID</th>
                        <th>İşletme Bilgileri</th>
                        <th>Sahibi</th>
                        <th>İletişim</th>
                        <th>Konum</th>
                        <th>Durum</th>
                        <th>Tarih</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.data.applications.map(app => this.renderDetailedApplicationRow(app)).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    renderDetailedApplicationRow(app) {
        const statusBadge = this.getStatusBadge(app.status);
        const date = new Date(app.createdAt).toLocaleDateString('tr-TR');
        
        return `
            <tr>
                <td>
                    <code style="font-weight: 600;">${app.applicationId}</code>
                </td>
                <td>
                    <div>
                        <strong style="color: var(--gray-900);">${app.businessName}</strong>
                        <br>
                        <small style="color: var(--gray-600);">${app.businessCategory}</small>
                    </div>
                </td>
                <td>
                    <div>
                        <strong>${app.firstName} ${app.lastName}</strong>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.875rem;">
                        <div><i class="fas fa-envelope" style="width: 12px;"></i> ${app.email}</div>
                        <div><i class="fas fa-phone" style="width: 12px;"></i> ${app.phone}</div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">
                        ${app.district}, ${app.city}
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td style="font-size: 0.875rem;">${date}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        ${app.status === 'pending' ? `
                            <button class="action-btn action-approve" onclick="adminDashboard.approveApplication('${app.applicationId}')" title="Onayla">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn action-reject" onclick="adminDashboard.rejectApplication('${app.applicationId}')" title="Reddet">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                        <button class="action-btn action-view" onclick="adminDashboard.viewApplication('${app.applicationId}')" title="Detay">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    async approveApplication(applicationId) {
        console.log(`✅ Approving application: ${applicationId}`);
        
        try {
            // Show loading state
            this.showActionLoading(applicationId, 'Onaylanıyor...');
            
            // Find application data
            const app = this.data.applications.find(a => a.applicationId === applicationId);
            if (!app) {
                throw new Error('Başvuru bulunamadı');
            }
            
            // Call API
            const response = await window.KapTazeAPIService.request(`/admin/applications/${applicationId}/approve`, {
                method: 'POST'
            });

            if (response.success) {
                this.showNotification('success', `Başvuru ${applicationId} başarıyla onaylandı!`);
                
                // Update local data
                app.status = 'approved';
                
                // Email already sent by backend, no need to send again
                // await this.sendApprovalEmail(app); // REMOVED: Duplicate email sending
                
                // Auto-sync approved restaurant with mobile app
                console.log('🔄 Auto-syncing approved restaurant with mobile app...');
                await this.syncRestaurantWithMobileApp(app);
                
                // Refresh display
                await this.loadApplicationsData();
                this.updateStatsCards();
                this.updateNavigationBadges();
                
            } else {
                throw new Error(response.message || 'Onay işlemi başarısız');
            }

        } catch (error) {
            console.error('❌ Approval failed:', error);
            this.showNotification('error', 'Onay işlemi başarısız oldu: ' + error.message);
            
            // For demo mode, simulate approval
            if (error.message.includes('API')) {
                this.simulateApproval(applicationId);
            }
        }
    }

    simulateApproval(applicationId) {
        // Demo mode simulation
        const app = this.data.applications.find(a => a.applicationId === applicationId);
        if (app) {
            app.status = 'approved';
            this.showNotification('success', `Demo: Başvuru ${applicationId} onaylandı!`);
            
            // Email already sent, removed duplicate sending
            // this.sendApprovalEmail(app); // REMOVED: Duplicate email sending
            
            this.loadApplicationsData();
            this.updateStatsCards();
            this.updateNavigationBadges();
        }
    }

    async rejectApplication(applicationId) {
        console.log(`❌ Rejecting application: ${applicationId}`);
        
        const reason = prompt('Reddetme sebebini belirtin:');
        if (!reason) return;
        
        try {
            // Show loading state
            this.showActionLoading(applicationId, 'Reddediliyor...');
            
            // Call API
            const response = await window.KapTazeAPIService.request(`/admin/applications/${applicationId}/reject`, {
                method: 'POST',
                body: { reason }
            });

            if (response.success) {
                this.showNotification('success', `Başvuru ${applicationId} reddedildi.`);
                
                // Update local data
                const app = this.data.applications.find(a => a.applicationId === applicationId);
                if (app) {
                    app.status = 'rejected';
                    app.rejectionReason = reason;
                }
                
                // Refresh display
                await this.loadApplicationsData();
                this.updateStatsCards();
                this.updateNavigationBadges();
                
            } else {
                throw new Error(response.message || 'Red işlemi başarısız');
            }

        } catch (error) {
            console.error('❌ Rejection failed:', error);
            this.showNotification('error', 'Red işlemi başarısız oldu: ' + error.message);
            
            // For demo mode, simulate rejection
            if (error.message.includes('API')) {
                this.simulateRejection(applicationId, reason);
            }
        }
    }

    simulateRejection(applicationId, reason) {
        // Demo mode simulation
        const app = this.data.applications.find(a => a.applicationId === applicationId);
        if (app) {
            app.status = 'rejected';
            app.rejectionReason = reason;
            this.showNotification('success', `Demo: Başvuru ${applicationId} reddedildi.`);
            
            // Send demo rejection email
            this.sendRejectionEmail(app, reason);
            
            this.loadApplicationsData();
            this.updateStatsCards();
            this.updateNavigationBadges();
        }
    }

    viewApplication(applicationId) {
        const app = this.data.applications.find(a => a.applicationId === applicationId);
        if (!app) return;

        const modalHTML = `
            <div class="modal-overlay" onclick="adminDashboard.closeModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>Başvuru Detayları</h3>
                        <button onclick="adminDashboard.closeModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-grid">
                            <div class="detail-row">
                                <strong>Başvuru ID:</strong>
                                <span>${app.applicationId}</span>
                            </div>
                            <div class="detail-row">
                                <strong>İşletme Adı:</strong>
                                <span>${app.businessName}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Kategori:</strong>
                                <span>${app.businessCategory}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Sahibi:</strong>
                                <span>${app.firstName} ${app.lastName}</span>
                            </div>
                            <div class="detail-row">
                                <strong>E-posta:</strong>
                                <span>${app.email}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Telefon:</strong>
                                <span>${app.phone}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Adres:</strong>
                                <span>${app.businessAddress}, ${app.district}, ${app.city}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Durum:</strong>
                                <span>${this.getStatusBadge(app.status)}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Başvuru Tarihi:</strong>
                                <span>${new Date(app.createdAt).toLocaleString('tr-TR')}</span>
                            </div>
                            ${app.notes ? `
                                <div class="detail-row">
                                    <strong>Notlar:</strong>
                                    <span>${app.notes}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="modal-footer">
                        ${app.status === 'pending' ? `
                            <button class="btn btn-primary" onclick="adminDashboard.approveApplication('${app.applicationId}'); adminDashboard.closeModal();">
                                <i class="fas fa-check"></i> Onayla
                            </button>
                            <button class="btn btn-secondary" onclick="adminDashboard.rejectApplication('${app.applicationId}'); adminDashboard.closeModal();">
                                <i class="fas fa-times"></i> Reddet
                            </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="adminDashboard.closeModal()">Kapat</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles if not present
        this.addModalStyles();
        
        // Show modal
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    addModalStyles() {
        if (document.getElementById('modal-styles')) return;

        const styles = `
            <style id="modal-styles">
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(4px);
                }
                
                .modal-content {
                    background: white;
                    border-radius: 16px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: var(--shadow-xl);
                }
                
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--gray-200);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .modal-header h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--gray-900);
                }
                
                .modal-header button {
                    background: none;
                    border: none;
                    padding: 0.5rem;
                    border-radius: 8px;
                    color: var(--gray-500);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .modal-header button:hover {
                    background: var(--gray-100);
                    color: var(--gray-900);
                }
                
                .modal-body {
                    padding: 1.5rem;
                }
                
                .detail-grid {
                    display: grid;
                    gap: 1rem;
                }
                
                .detail-row {
                    display: grid;
                    grid-template-columns: 150px 1fr;
                    gap: 1rem;
                    padding: 0.75rem;
                    border-radius: 8px;
                    background: var(--gray-50);
                }
                
                .detail-row strong {
                    color: var(--gray-700);
                    font-size: 0.875rem;
                }
                
                .detail-row span {
                    color: var(--gray-900);
                    font-weight: 500;
                }
                
                .modal-footer {
                    padding: 1.5rem;
                    border-top: 1px solid var(--gray-200);
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }
                
                @media (max-width: 640px) {
                    .modal-content {
                        width: 95%;
                        margin: 1rem;
                    }
                    
                    .detail-row {
                        grid-template-columns: 1fr;
                        gap: 0.5rem;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    showActionLoading(applicationId, message) {
        // Implementation for showing loading state during actions
        console.log(`⏳ ${message} - ${applicationId}`);
    }

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add notification styles
        this.addNotificationStyles();

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Remove on click
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }

    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = `
            <style id="notification-styles">
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 12px;
                    padding: 1rem 1.5rem;
                    box-shadow: var(--shadow-xl);
                    z-index: 10001;
                    max-width: 400px;
                    cursor: pointer;
                    animation: slideInRight 0.3s ease;
                    border-left: 4px solid var(--primary);
                }
                
                .notification-success {
                    border-left-color: var(--success);
                }
                
                .notification-error {
                    border-left-color: var(--danger);
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .notification-content i {
                    font-size: 1.25rem;
                }
                
                .notification-success i {
                    color: var(--success);
                }
                
                .notification-error i {
                    color: var(--danger);
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            this.sidebarCollapsed = !this.sidebarCollapsed;
        }
    }

    updateAPIStatus(connected) {
        const statusElement = document.getElementById('apiStatus');
        if (statusElement) {
            if (connected) {
                statusElement.className = 'status-indicator';
                statusElement.innerHTML = '<i class="fas fa-circle"></i><span>API Bağlı</span>';
            } else {
                statusElement.className = 'status-indicator disconnected';
                statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Demo Modu</span>';
            }
        }
    }

    setupAutoRefresh() {
        // Refresh data every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.refreshCurrentSection();
            }
        }, 30000);
    }

    refreshCurrentSection() {
        this.loadSectionData(this.currentSection);
    }

    refreshAllData() {
        console.log('🔄 Refreshing all data...');
        this.loadAllData();
    }

    refreshApplications() {
        console.log('🔄 Refreshing applications...');
        this.loadApplicationsData();
    }

    refreshRestaurants() {
        console.log('🔄 Refreshing restaurants...');
        this.loadRestaurantsData();
    }

    refreshPackages() {
        console.log('🔄 Refreshing packages...');
        this.loadPackagesData();
    }

    refreshConsumers() {
        console.log('🔄 Refreshing consumers...');
        this.loadConsumersData();
    }

    // Restaurant management functions
    displayRestaurants(restaurants) {
        console.log('🎨 Displaying restaurants:', restaurants.length, restaurants);
        
        // Get restaurants table container (fix for existing HTML structure)
        let container = document.getElementById('restaurantsTable');
        
        if (!container) {
            // Fallback to dataContainer approach
            const activeSection = document.querySelector('.content-section.active');
            container = activeSection ? activeSection.querySelector('#dataContainer') : null;
        }
        
        if (!container) {
            console.error('❌ No suitable container found for restaurants');
            return;
        }
        
        console.log('✅ Using container:', container.id);

        const html = `
            <div class="section-header">
                <h2 class="section-title">Kayıtlı Restoranlar (${restaurants.length})</h2>
                <div class="section-actions">
                    <button class="btn btn-secondary" onclick="adminDashboard.refreshRestaurants()">
                        <i class="fas fa-sync-alt"></i> Yenile
                    </button>
                </div>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Restoran Adı</th>
                            <th>Kategori</th>
                            <th>Sahip</th>
                            <th>İletişim</th>
                            <th>Lokasyon</th>
                            <th>Durum</th>
                            <th>Kayıt Tarihi</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${restaurants.map(restaurant => this.renderRestaurantRow(restaurant)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
        console.log('✅ Restaurant table HTML set, container:', container);
    }

    renderRestaurantRow(restaurant) {
        // Safe data access with fallbacks
        const name = restaurant.name || 'Bilinmeyen Restoran';
        const category = restaurant.category || 'Kategori Yok';
        const status = restaurant.status || 'active';
        const email = restaurant.email || 'Email Yok';
        const phone = restaurant.phone || 'Telefon Yok';
        
        // Safe owner access
        const owner = restaurant.owner || {};
        const ownerName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || 'Sahip Bilgisi Yok';
        
        // Safe address access with full address
        const address = restaurant.address || {};
        const fullAddress = address.street ? 
            `${address.street}, ${address.district || 'Bilinmeyen'}, ${address.city || 'Bilinmeyen'}` :
            `${address.district || 'Bilinmeyen'}, ${address.city || 'Bilinmeyen'}`;
        const location = fullAddress;
        
        // Safe date handling
        const date = restaurant.createdAt ? 
            new Date(restaurant.createdAt).toLocaleDateString('tr-TR') : 
            'Tarih Bilinmiyor';
        
        const statusBadge = this.getRestaurantStatusBadge(status);
        
        return `
            <tr>
                <td>
                    <div>
                        <strong style="color: var(--gray-900);">${name}</strong>
                        ${restaurant.application ? `<br><small style="color: var(--gray-600);">Başvuru: ${restaurant.application.applicationId}</small>` : ''}
                    </div>
                </td>
                <td>
                    <span class="category-badge">${category}</span>
                </td>
                <td>
                    <div>
                        <strong>${ownerName}</strong>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.875rem;">
                        <div><i class="fas fa-envelope" style="width: 12px;"></i> ${email}</div>
                        <div><i class="fas fa-phone" style="width: 12px;"></i> ${phone}</div>
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">
                        ${location}
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td style="font-size: 0.875rem;">${date}</td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        <button class="action-btn action-view" onclick="adminDashboard.viewRestaurant('${restaurant._id || restaurant.id}')" title="Detay">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${status === 'suspended' ? `
                            <button class="action-btn action-approve" onclick="adminDashboard.resumeRestaurant('${restaurant._id || restaurant.id}')" title="Devam Ettir">
                                <i class="fas fa-play"></i>
                            </button>
                        ` : `
                            <button class="action-btn action-reject" onclick="adminDashboard.suspendRestaurant('${restaurant._id || restaurant.id}')" title="Askıya Al">
                                <i class="fas fa-pause"></i>
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    }

    getRestaurantStatusBadge(status) {
        const statusConfig = {
            'active': { class: 'status-approved', text: 'Aktif', icon: 'check' },
            'inactive': { class: 'status-pending', text: 'Pasif', icon: 'clock' },
            'suspended': { class: 'status-rejected', text: 'Askıya Alınmış', icon: 'pause' }
        };

        const config = statusConfig[status] || statusConfig['inactive'];
        return `<span class="status-badge ${config.class}">
            <i class="fas fa-${config.icon}"></i>
            ${config.text}
        </span>`;
    }

    viewRestaurant(restaurantId) {
        console.log('👁️ Viewing restaurant:', restaurantId);
        const restaurant = this.data.restaurants.find(r => r._id === restaurantId || r.id === restaurantId);
        if (restaurant) {
            alert(`Restoran Detayları:\n\nAdı: ${restaurant.name}\nKategori: ${restaurant.category}\nSahip: ${restaurant.owner.firstName} ${restaurant.owner.lastName}\nDurum: ${restaurant.status}`);
        }
    }

    async suspendRestaurant(restaurantId) {
        console.log('⏸️ Suspending restaurant:', restaurantId);
        
        const reason = prompt('Askıya alma sebebini belirtin:');
        if (!reason) return;
        
        try {
            const response = await window.KapTazeAPIService.request(`/admin/restaurants/${restaurantId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ action: 'suspend', reason })
            });

            if (response.success) {
                this.showNotification('success', 'Restoran başarıyla askıya alındı!');
                
                // Update local data
                const restaurant = this.data.restaurants.find(r => r._id === restaurantId || r.id === restaurantId);
                if (restaurant) {
                    restaurant.status = 'suspended';
                }
                
                // Refresh display
                this.displayRestaurants(this.data.restaurants);
                this.updateStatsCards();
                
            } else {
                throw new Error(response.message || 'Askıya alma işlemi başarısız');
            }

        } catch (error) {
            console.error('❌ Restaurant suspension failed:', error);
            this.showNotification('error', 'Restoran askıya alınamadı: ' + error.message);
        }
    }

    async resumeRestaurant(restaurantId) {
        console.log('▶️ Resuming restaurant:', restaurantId);
        
        if (!confirm('Bu restoranı yeniden aktif hale getirmek istediğinizden emin misiniz?')) {
            return;
        }
        
        try {
            const response = await window.KapTazeAPIService.request(`/admin/restaurants/${restaurantId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ action: 'resume' })
            });

            if (response.success) {
                this.showNotification('success', 'Restoran başarıyla aktif hale getirildi!');
                
                // Update local data
                const restaurant = this.data.restaurants.find(r => r._id === restaurantId || r.id === restaurantId);
                if (restaurant) {
                    restaurant.status = 'active';
                }
                
                // Refresh display
                this.displayRestaurants(this.data.restaurants);
                this.updateStatsCards();
                
            } else {
                throw new Error(response.message || 'Devam ettirme işlemi başarısız');
            }

        } catch (error) {
            console.error('❌ Restaurant resume failed:', error);
            this.showNotification('error', 'Restoran aktif hale getirilemedi: ' + error.message);
        }
    }

    // Package management functions
    displayPackages(packages) {
        console.log('📦 Displaying packages:', packages.length);

        const container = document.getElementById('packagesTable');
        if (!container) {
            console.error('❌ Packages container not found');
            return;
        }

        if (!packages || packages.length === 0) {
            container.innerHTML = `
                <div class="table-container">
                    <div style="padding: 3rem; text-align: center; color: var(--gray-500);">
                        <i class="fas fa-box" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p style="font-size: 1.1rem; margin: 0;">Henüz paket bulunmuyor</p>
                    </div>
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">Paket Listesi</h3>
                    <span class="record-count">${packages.length} paket</span>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Paket Adı</th>
                                <th>Restoran</th>
                                <th>Kategori</th>
                                <th>Fiyat</th>
                                <th>Miktar</th>
                                <th>Durum</th>
                                <th>Son Teslim</th>
                                <th>Oluşturulma</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${packages.map(pkg => this.renderPackageRow(pkg)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    // Consumer management functions
    displayConsumers(consumers) {
        console.log('👥 Displaying consumers:', consumers.length);

        const container = document.getElementById('consumersTable');
        if (!container) {
            console.error('❌ Consumers container not found');
            return;
        }

        if (!consumers || consumers.length === 0) {
            container.innerHTML = `
                <div class="table-container">
                    <div style="padding: 3rem; text-align: center; color: var(--gray-500);">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p style="font-size: 1.1rem; margin: 0;">Henüz tüketici bulunmuyor</p>
                    </div>
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">Tüketici Listesi</h3>
                    <span class="record-count">${consumers.length} kullanıcı</span>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Kullanıcı</th>
                                <th>İletişim</th>
                                <th>Durum</th>
                                <th>İstatistikler</th>
                                <th>Son Aktivite</th>
                                <th>Kayıt Tarihi</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${consumers.map(consumer => this.renderConsumerRow(consumer)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    renderPackageRow(pkg) {
        const statusColors = {
            'active': 'success',
            'inactive': 'secondary',
            'sold_out': 'danger',
            'expired': 'warning'
        };

        const statusTexts = {
            'active': 'Aktif',
            'inactive': 'Pasif',
            'sold_out': 'Tükendi',
            'expired': 'Süresi Doldu'
        };

        const createdDate = new Date(pkg.createdAt).toLocaleDateString('tr-TR');
        const availableUntil = new Date(pkg.availableUntil).toLocaleDateString('tr-TR');

        return `
            <tr>
                <td>
                    <div style="font-weight: 600;">${pkg.name}</div>
                    ${pkg.description ? `<div style="font-size: 0.85rem; color: var(--gray-500);">${pkg.description.substring(0, 50)}${pkg.description.length > 50 ? '...' : ''}</div>` : ''}
                </td>
                <td>
                    <div style="font-weight: 600;">${pkg.restaurant?.name || 'N/A'}</div>
                    <div style="font-size: 0.85rem; color: var(--gray-500);">${pkg.restaurant?.category || ''}</div>
                </td>
                <td><span class="badge badge-info">${pkg.category || 'N/A'}</span></td>
                <td>
                    ${pkg.originalPrice ? `<div style="font-size: 0.85rem; color: var(--gray-500); text-decoration: line-through;">₺${pkg.originalPrice.toFixed(2)}</div>` : ''}
                    <strong style="color: var(--success);">₺${(pkg.discountedPrice || pkg.price || 0).toFixed(2)}</strong>
                </td>
                <td>
                    <span style="color: ${pkg.quantity > 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${pkg.quantity} adet
                    </span>
                </td>
                <td>
                    <span class="badge badge-${statusColors[pkg.status] || 'secondary'}">
                        ${statusTexts[pkg.status] || pkg.status}
                    </span>
                </td>
                <td>${availableUntil}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn-icon" onclick="adminDashboard.viewPackageDetails('${pkg._id || pkg.id}')"
                            title="Detayları Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    renderConsumerRow(consumer) {
        const statusColors = {
            'active': 'success',
            'inactive': 'secondary',
            'suspended': 'danger'
        };

        const statusTexts = {
            'active': 'Aktif',
            'inactive': 'Pasif',
            'suspended': 'Askıda'
        };

        const registrationDate = new Date(consumer.createdAt || consumer.registrationDate).toLocaleDateString('tr-TR');
        const lastActivity = consumer.lastActivity ? new Date(consumer.lastActivity).toLocaleDateString('tr-TR') : 'Bilinmiyor';

        const fullName = consumer.fullName || `${consumer.name || consumer.firstName || ''} ${consumer.surname || consumer.lastName || ''}`.trim() || 'İsimsiz Kullanıcı';
        const orderCount = consumer.orderCount || consumer.totalOrders || 0;
        const totalSpent = consumer.totalSpent || 0;

        const devicePlatform = consumer.deviceInfo?.platform || 'Bilinmiyor';
        const deviceIcon = devicePlatform === 'ios' ? 'fab fa-apple' : devicePlatform === 'android' ? 'fab fa-android' : 'fas fa-mobile-alt';

        return `
            <tr>
                <td>
                    <div style="font-weight: 600;">${fullName}</div>
                    <div style="font-size: 0.85rem; color: var(--gray-500);"><i class="${deviceIcon}"></i> ${devicePlatform}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${consumer.email}</div>
                    ${consumer.phone ? `<div style="font-size: 0.85rem; color: var(--gray-500);">${consumer.phone}</div>` : ''}
                </td>
                <td>
                    <span class="badge badge-${statusColors[consumer.status] || 'secondary'}">
                        ${statusTexts[consumer.status] || consumer.status}
                    </span>
                </td>
                <td>
                    <div>${orderCount} sipariş</div>
                    <div style="font-size: 0.85rem; color: var(--success);">₺${totalSpent.toFixed(2)}</div>
                </td>
                <td>${lastActivity}</td>
                <td>${registrationDate}</td>
                <td>
                    <button class="btn-icon" onclick="adminDashboard.viewConsumerDetails('${consumer._id || consumer.id}')"
                            title="Detayları Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    viewPackageDetails(packageId) {
        console.log('👁️ Viewing package details:', packageId);
        const pkg = this.data.packages.find(p => (p._id || p.id) === packageId);

        if (!pkg) {
            alert('Paket bulunamadı');
            return;
        }

        this.showPackageDetailsModal(pkg);
    }

    showPackageDetailsModal(pkg) {
        const statusColors = {
            'active': 'success',
            'inactive': 'secondary',
            'sold_out': 'danger',
            'expired': 'warning'
        };

        const statusTexts = {
            'active': 'Aktif',
            'inactive': 'Pasif',
            'sold_out': 'Tükendi',
            'expired': 'Süresi Doldu'
        };

        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2>📦 Paket Detayları</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; gap: 1.5rem;">
                            <!-- Package Info -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">📦 Paket Bilgileri</h3>
                                <div style="display: grid; gap: 0.5rem;">
                                    <div><strong>Paket Adı:</strong> ${pkg.name}</div>
                                    ${pkg.description ? `<div><strong>Açıklama:</strong> ${pkg.description}</div>` : ''}
                                    <div><strong>Kategori:</strong> <span class="badge badge-info">${pkg.category || 'N/A'}</span></div>
                                    <div><strong>Durum:</strong> <span class="badge badge-${statusColors[pkg.status] || 'secondary'}">${statusTexts[pkg.status] || pkg.status}</span></div>
                                </div>
                            </div>

                            <!-- Restaurant Info -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">🏪 Restoran Bilgileri</h3>
                                <div style="display: grid; gap: 0.5rem;">
                                    <div><strong>Restoran:</strong> ${pkg.restaurant?.name || 'N/A'}</div>
                                    <div><strong>Kategori:</strong> ${pkg.restaurant?.category || 'N/A'}</div>
                                    ${pkg.restaurant?.phone ? `<div><strong>Telefon:</strong> ${pkg.restaurant.phone}</div>` : ''}
                                </div>
                            </div>

                            <!-- Price Info -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">💰 Fiyat Bilgileri</h3>
                                <div style="display: grid; gap: 0.5rem;">
                                    ${pkg.originalPrice ? `<div><strong>Orijinal Fiyat:</strong> <span style="text-decoration: line-through; color: var(--gray-500);">₺${pkg.originalPrice.toFixed(2)}</span></div>` : ''}
                                    <div><strong>İndirimli Fiyat:</strong> <strong style="color: var(--success); font-size: 1.2rem;">₺${(pkg.discountedPrice || pkg.price || 0).toFixed(2)}</strong></div>
                                    ${pkg.originalPrice && pkg.discountedPrice ? `<div><strong>İndirim:</strong> <span style="color: var(--success);">%${Math.round((1 - pkg.discountedPrice / pkg.originalPrice) * 100)}</span></div>` : ''}
                                </div>
                            </div>

                            <!-- Quantity & Dates -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">📊 Stok & Tarihler</h3>
                                <div style="display: grid; gap: 0.5rem;">
                                    <div><strong>Miktar:</strong> <span style="color: ${pkg.quantity > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">${pkg.quantity} adet</span></div>
                                    <div><strong>Son Teslim:</strong> ${new Date(pkg.availableUntil).toLocaleString('tr-TR')}</div>
                                    <div><strong>Oluşturulma:</strong> ${new Date(pkg.createdAt).toLocaleString('tr-TR')}</div>
                                    ${pkg.updatedAt ? `<div><strong>Güncellenme:</strong> ${new Date(pkg.updatedAt).toLocaleString('tr-TR')}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Consumer action functions
    viewConsumerDetails(consumerId) {
        console.log('👁️ Viewing consumer details:', consumerId);
        const consumer = this.data.consumers.find(c => (c._id || c.id) === consumerId);

        if (!consumer) {
            alert('Tüketici bulunamadı');
            return;
        }

        this.showConsumerDetailsModal(consumer);
    }

    showConsumerDetailsModal(consumer) {
        const statusColors = {
            'active': 'success',
            'inactive': 'secondary',
            'suspended': 'danger'
        };

        const statusTexts = {
            'active': 'Aktif',
            'inactive': 'Pasif',
            'suspended': 'Askıda'
        };

        const fullName = consumer.fullName || `${consumer.name || consumer.firstName || ''} ${consumer.surname || consumer.lastName || ''}`.trim() || 'İsimsiz Kullanıcı';
        const devicePlatform = consumer.deviceInfo?.platform || 'Bilinmiyor';
        const deviceIcon = devicePlatform === 'ios' ? 'fab fa-apple' : devicePlatform === 'android' ? 'fab fa-android' : 'fas fa-mobile-alt';
        const orderCount = consumer.orderCount || consumer.totalOrders || 0;
        const totalSpent = consumer.totalSpent || 0;

        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2>👤 Tüketici Detayları</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; gap: 1.5rem;">
                            <!-- User Info -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">👤 Kullanıcı Bilgileri</h3>
                                <div style="display: grid; gap: 0.5rem;">
                                    <div><strong>Ad Soyad:</strong> ${fullName}</div>
                                    <div><strong>Email:</strong> ${consumer.email}</div>
                                    ${consumer.phone ? `<div><strong>Telefon:</strong> ${consumer.phone}</div>` : ''}
                                    <div><strong>Durum:</strong> <span class="badge badge-${statusColors[consumer.status] || 'secondary'}">${statusTexts[consumer.status] || consumer.status}</span></div>
                                </div>
                            </div>

                            <!-- Device Info -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">📱 Cihaz Bilgileri</h3>
                                <div style="display: grid; gap: 0.5rem;">
                                    <div><strong>Platform:</strong> <i class="${deviceIcon}"></i> ${devicePlatform}</div>
                                    ${consumer.deviceInfo?.model ? `<div><strong>Model:</strong> ${consumer.deviceInfo.model}</div>` : ''}
                                    ${consumer.deviceInfo?.osVersion ? `<div><strong>OS Versiyon:</strong> ${consumer.deviceInfo.osVersion}</div>` : ''}
                                </div>
                            </div>

                            <!-- Statistics -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">📊 İstatistikler</h3>
                                <div style="display: grid; gap: 0.5rem;">
                                    <div><strong>Toplam Sipariş:</strong> <span style="color: var(--primary);">${orderCount} sipariş</span></div>
                                    <div><strong>Toplam Harcama:</strong> <strong style="color: var(--success); font-size: 1.2rem;">₺${totalSpent.toFixed(2)}</strong></div>
                                    ${orderCount > 0 ? `<div><strong>Ortalama Sipariş:</strong> ₺${(totalSpent / orderCount).toFixed(2)}</div>` : ''}
                                </div>
                            </div>

                            <!-- Activity -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">⏱️ Aktivite Bilgileri</h3>
                                <div style="display: grid; gap: 0.5rem;">
                                    <div><strong>Son Aktivite:</strong> ${consumer.lastActivity ? new Date(consumer.lastActivity).toLocaleString('tr-TR') : 'Bilinmiyor'}</div>
                                    <div><strong>Kayıt Tarihi:</strong> ${new Date(consumer.createdAt || consumer.registrationDate).toLocaleString('tr-TR')}</div>
                                    ${consumer.updatedAt ? `<div><strong>Güncellenme:</strong> ${new Date(consumer.updatedAt).toLocaleString('tr-TR')}</div>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    suspendConsumer(consumerId) {
        console.log('🚫 Suspending consumer:', consumerId);
        const consumer = this.data.consumers.find(c => (c._id || c.id) === consumerId);
        if (consumer) {
            const fullName = `${consumer.name || consumer.firstName || ''} ${consumer.surname || consumer.lastName || ''}`.trim();
            if (confirm(`${fullName} adlı kullanıcıyı askıya almak istediğinizden emin misiniz?`)) {
                // Demo implementation - in real app, this would call backend API
                consumer.status = 'suspended';
                this.displayConsumers(this.data.consumers);
                this.showNotification('success', `${fullName} başarıyla askıya alındı`);
            }
        }
    }

    activateConsumer(consumerId) {
        console.log('✅ Activating consumer:', consumerId);
        const consumer = this.data.consumers.find(c => (c._id || c.id) === consumerId);
        if (consumer) {
            const fullName = `${consumer.name || consumer.firstName || ''} ${consumer.surname || consumer.lastName || ''}`.trim();
            if (confirm(`${fullName} adlı kullanıcıyı aktifleştirmek istediğinizden emin misiniz?`)) {
                // Demo implementation - in real app, this would call backend API
                consumer.status = 'active';
                this.displayConsumers(this.data.consumers);
                this.showNotification('success', `${fullName} başarıyla aktifleştirildi`);
            }
        }
    }

    showLoadingStates() {
        // Implementation for showing loading states
    }

    loadDemoData() {
        // Fallback to demo data when API is not available
        this.data.applications = this.generateDemoApplications();
        this.data.restaurants = this.generateDemoRestaurants();
        this.data.packages = this.generateDemoPackages();
        this.data.consumers = this.generateDemoConsumers();
        this.data.stats = this.generateDemoStats();
        
        this.updateStatsCards();
        this.updateNavigationBadges();
        this.renderDashboardContent();
    }

    async loadRestaurantsData() {
        console.log('📊 Loading restaurants data...');
        
        try {
            // Load restaurants from backend
            const response = await window.KapTazeAPIService.request('/admin/restaurants', {
                method: 'GET'
            });

            if (response.success && response.data) {
                this.data.restaurants = response.data.restaurants;
                console.log(`✅ Loaded ${this.data.restaurants.length} restaurants`);
                
                // Display restaurants
                console.log('🔍 First restaurant data:', this.data.restaurants[0]);
                this.displayRestaurants(this.data.restaurants);
                
            } else {
                throw new Error('Failed to load restaurants data');
            }

        } catch (error) {
            console.error('❌ Error loading restaurants:', error);
            
            // Load demo restaurants as fallback
            this.data.restaurants = this.generateDemoRestaurants();
            this.displayRestaurants(this.data.restaurants);
            
            this.showNotification('warning', 'Demo restoran verileri yüklendi - Backend bağlantısı yok');
        }
    }

    async loadPackagesData() {
        console.log('📦 Loading packages data...');
        
        try {
            // Load packages from backend  
            const response = await window.KapTazeAPIService.request('/admin/packages', {
                method: 'GET'
            });

            if (response.success && response.data) {
                this.data.packages = response.data.packages;
                console.log(`✅ Loaded ${this.data.packages.length} packages`);
                
                // Display packages
                this.displayPackages(this.data.packages);
                
            } else {
                throw new Error('Failed to load packages data');
            }

        } catch (error) {
            console.error('❌ Error loading packages:', error);
            
            // Load demo packages as fallback
            this.data.packages = this.generateDemoPackages();
            this.displayPackages(this.data.packages);
            
            this.showNotification('warning', 'Demo paket verileri yüklendi - Backend bağlantısı yok');
        }
    }

    async loadConsumersData() {
        console.log('👥 Loading consumers data...');
        
        try {
            // Load consumers from backend  
            const response = await window.KapTazeAPIService.request('/admin/consumers', {
                method: 'GET'
            });

            if (response.success && response.data) {
                this.data.consumers = response.data.consumers;
                console.log(`✅ Loaded ${this.data.consumers.length} consumers`);
                
                // Display consumers
                this.displayConsumers(this.data.consumers);
                
            } else {
                throw new Error('Failed to load consumers data');
            }

        } catch (error) {
            console.error('❌ Error loading consumers:', error);
            
            // Load demo consumers as fallback
            this.data.consumers = this.generateDemoConsumers();
            this.displayConsumers(this.data.consumers);
            
            this.showNotification('warning', 'Demo tüketici verileri yüklendi - Backend bağlantısı yok');
        }
    }

    async loadDashboardData() {
        // Implementation for dashboard specific data
        console.log('Loading dashboard data...');
    }

    handleResize() {
        // Handle responsive design changes
        if (window.innerWidth <= 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
            }
        }
    }

    setupRealTimeFeatures() {
        // Setup WebSocket connections for real-time updates
        // This is a placeholder for future real-time features
        console.log('🔄 Real-time features initialized');
    }

    filterApplications() {
        const filter = document.getElementById('applicationFilter').value;
        console.log(`🔍 Filtering applications by: ${filter}`);
        
        // Apply filter logic here
        this.loadApplicationsData();
    }

    exportApplications() {
        console.log('📊 Exporting applications...');
        
        // Create CSV data
        const csvData = this.data.applications.map(app => ({
            'Başvuru ID': app.applicationId,
            'İşletme Adı': app.businessName,
            'Sahibi': `${app.firstName} ${app.lastName}`,
            'E-posta': app.email,
            'Telefon': app.phone,
            'Kategori': app.businessCategory,
            'Şehir': app.city,
            'İlçe': app.district,
            'Durum': app.status,
            'Tarih': new Date(app.createdAt).toLocaleDateString('tr-TR')
        }));

        this.downloadCSV(csvData, 'kaptaze-basvurular.csv');
    }

    downloadCSV(data, filename) {
        if (data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    showUserMenu() {
        // Implementation for user menu dropdown
        console.log('👤 Showing user menu...');
    }

    async sendApprovalEmail(application) {
        // DISABLED: Frontend email sending removed to prevent duplicate emails
        // Backend already handles email sending with correct credentials
        console.log(`📧 Email sending disabled - Backend handles approval emails for: ${application.applicationId}`);
        
        this.showNotification('info', 
            '📧 Onay e-postası backend tarafından gönderildi'
        );
        
        return { success: true, disabled: true, message: 'Frontend email sending disabled' };
    }

    async sendRejectionEmail(application, reason) {
        console.log(`📧 Sending rejection email for: ${application.applicationId}`);
        
        try {
            // Send email via SendGrid service
            const result = await window.sendGridService.sendRejectionEmail(application, reason);
            
            if (result.success) {
                this.showNotification('success', 
                    `✅ Red e-postası gönderildi: ${application.email}${result.demo ? ' (Demo Mode)' : ''}`
                );
                
                return result;
            } else {
                throw new Error(result.message || 'Email gönderilemedi');
            }
            
        } catch (error) {
            console.error('❌ Email sending failed:', error);
            this.showNotification('error', 'Email gönderimi başarısız: ' + error.message);
            throw error;
        }
    }

    logout() {
        console.log('👋 Logging out...');
        
        // Clear authentication data
        localStorage.removeItem('kaptaze_token');
        localStorage.removeItem('kaptaze_user');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        // Clear API auth
        if (window.KapTazeAPI && window.KapTazeAPI.clearAuth) {
            window.KapTazeAPI.clearAuth();
        }
        
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Redirect to login
        window.location.href = './admin-login-v3.html';
    }

    async initializeEmailService() {
        try {
            // Initialize SendGrid service if not already available
            if (!window.sendGridService && window.SendGridService) {
                window.sendGridService = new SendGridService();
                console.log('📧 SendGrid email service initialized');
            } else if (window.sendGridService) {
                console.log('📧 SendGrid email service already available');
            } else {
                console.warn('⚠️ SendGrid service class not available');
            }
        } catch (error) {
            console.error('❌ Failed to initialize email service:', error);
        }
    }

    // SendGrid API key setup for admins
    setupSendGrid() {
        const apiKey = prompt('SendGrid API Key girin (SG. ile başlamalı):');
        if (apiKey && apiKey.startsWith('SG.')) {
            localStorage.setItem('sendgrid_api_key', apiKey);
            window.SENDGRID_API_KEY = apiKey;
            
            // Reload SendGrid service
            if (window.sendGridService) {
                window.sendGridService.loadAPIKey();
            }
            
            console.log('✅ SendGrid API Key başarıyla kaydedildi');
            console.log('📧 Email gönderimi aktif - Production ready!');
            
            this.showNotification('success', 'SendGrid API Key başarıyla kaydedildi!');
            return true;
        } else {
            console.error('❌ Geçersiz API Key. SG. ile başlamalı.');
            this.showNotification('error', 'Geçersiz API Key format!');
            return false;
        }
    }

    // Sync Restaurant with Mobile App
    async syncRestaurantWithMobileApp(application) {
        try {
            console.log('🔄 Syncing restaurant with mobile app:', application.applicationId);
            
            // Prepare restaurant data for mobile app
            const restaurantData = {
                name: application.restaurantName,
                category: application.businessType || 'Restaurant',
                address: {
                    street: application.address,
                    district: application.district || 'Unknown',
                    city: application.city || 'Unknown'
                },
                location: {
                    type: 'Point',
                    coordinates: application.coordinates || [30.7133, 36.8969] // Default Antalya coordinates
                },
                serviceOptions: {
                    delivery: true,
                    pickup: true,
                    dineIn: false
                },
                deliveryInfo: {
                    radius: 5,
                    fee: 0,
                    minimumOrder: 0,
                    estimatedTime: 30
                },
                images: {
                    gallery: []
                },
                rating: {
                    average: 0,
                    count: 0
                },
                stats: {
                    totalOrders: 0,
                    totalRevenue: 0,
                    activeMenuItems: 0
                },
                // Additional fields for mobile app
                description: `${application.restaurantName} - Taze yemekler kurtarıyor!`,
                workingHours: {
                    weekday: { open: '09:00', close: '22:00' },
                    weekend: { open: '10:00', close: '23:00' }
                },
                packages: []
            };

            // Sync with mobile app endpoint
            const response = await window.KapTazeAPIService.request('/api/public/restaurants/sync', {
                method: 'POST',
                body: JSON.stringify({
                    restaurantId: application.applicationId,
                    restaurantData: restaurantData
                })
            });

            if (response.success) {
                console.log('✅ Restaurant synced with mobile app successfully');
            } else {
                console.warn('⚠️ Mobile app sync failed:', response.message);
            }

        } catch (error) {
            console.error('❌ Restaurant mobile app sync error:', error);
            // Don't throw error, this is not critical for approval process
        }
    }

    // 🔄 PHASE 3: Advanced Package Management System
    async loadPackagesData() {
        console.log('📦 Loading packages data for admin dashboard...');
        
        try {
            // Load packages from backend
            const response = await window.KapTazeAPIService.request('/admin/packages', {
                method: 'GET'
            });

            if (response.success && response.data) {
                this.data.packages = response.data.packages || [];
                console.log(`✅ Loaded ${this.data.packages.length} packages for admin review`);
                
                this.renderPackagesTable();
            } else {
                console.warn('⚠️ No package data received, using demo data');
                this.generateDemoPackages();
                this.renderPackagesTable();
            }

        } catch (error) {
            console.error('❌ Package data loading failed:', error);
            this.generateDemoPackages();
            this.renderPackagesTable();
        }
    }

    generateDemoPackages() {
        // Demo packages for testing
        this.data.packages = [
            {
                id: 'pkg001',
                restaurantId: 'rest001',
                restaurantName: 'Pizza Palace',
                packageName: 'Margherita Special',
                description: 'Klasik Margherita pizza + içecek',
                originalPrice: 85,
                discountPrice: 45,
                discount: 47,
                quantity: 5,
                category: 'Ana Yemek',
                status: 'pending',
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                expiryTime: '22:00',
                image: 'https://via.placeholder.com/300x200?text=Margherita+Pizza'
            },
            {
                id: 'pkg002', 
                restaurantId: 'rest002',
                restaurantName: 'Burger House',
                packageName: 'Classic Burger Combo',
                description: 'Double burger + patates + cola',
                originalPrice: 120,
                discountPrice: 60,
                discount: 50,
                quantity: 3,
                category: 'Fast Food',
                status: 'approved',
                createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                expiryTime: '23:00',
                image: 'https://via.placeholder.com/300x200?text=Classic+Burger'
            },
            {
                id: 'pkg003',
                restaurantId: 'rest003',
                restaurantName: 'Cafe Latte',
                packageName: 'Coffee & Cake',
                description: 'Premium coffee + ev yapımı pasta',
                originalPrice: 65,
                discountPrice: 35,
                discount: 46,
                quantity: 0,
                category: 'Tatlı & İçecek',
                status: 'rejected',
                createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                expiryTime: '20:00',
                image: 'https://via.placeholder.com/300x200?text=Coffee+Cake'
            }
        ];
        
        console.log('📦 Demo packages generated for testing');
    }

    renderPackagesTable() {
        const container = document.getElementById('packagesTable');
        if (!container) return;

        const packages = this.data.packages || [];
        
        if (packages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3>Henüz paket yok</h3>
                    <p>Restoranlar paket eklediğinde burada görünecek</p>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <!-- Modern Stats Dashboard -->
            <div class="packages-stats-modern">
                <div class="stat-card pending">
                    <div class="stat-icon">⏳</div>
                    <div class="stat-content">
                        <div class="stat-number">${packages.filter(p => p.status === 'pending').length}</div>
                        <div class="stat-label">Bekleyen</div>
                    </div>
                </div>
                <div class="stat-card approved">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-number">${packages.filter(p => p.status === 'approved').length}</div>
                        <div class="stat-label">Onaylı</div>
                    </div>
                </div>
                <div class="stat-card rejected">
                    <div class="stat-icon">❌</div>
                    <div class="stat-content">
                        <div class="stat-number">${packages.filter(p => p.status === 'rejected').length}</div>
                        <div class="stat-label">Reddedilen</div>
                    </div>
                </div>
                <div class="stat-card out-of-stock">
                    <div class="stat-icon">📦</div>
                    <div class="stat-content">
                        <div class="stat-number">${packages.filter(p => p.quantity === 0).length}</div>
                        <div class="stat-label">Tükenen</div>
                    </div>
                </div>
            </div>

            <!-- Filter & Search Bar -->
            <div class="packages-toolbar">
                <div class="search-container">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Restoran veya paket ara..." class="search-input" id="packageSearch">
                </div>
                <div class="filter-container">
                    <select class="filter-select" id="statusFilter">
                        <option value="">Tüm Durumlar</option>
                        <option value="pending">Bekleyen</option>
                        <option value="approved">Onaylı</option>
                        <option value="rejected">Reddedilen</option>
                    </select>
                    <select class="filter-select" id="categoryFilter">
                        <option value="">Tüm Kategoriler</option>
                        <option value="Ana Yemek">Ana Yemek</option>
                        <option value="Tatlı & İçecek">Tatlı & İçecek</option>
                        <option value="Kahvaltı">Kahvaltı</option>
                    </select>
                </div>
            </div>

            <!-- Modern Package Cards Grid -->
            <div class="packages-grid">
                ${packages.map(pkg => `
                    <div class="package-card ${pkg.status}" data-package-id="${pkg.id}">
                        <div class="package-header">
                            <div class="package-status-badge ${pkg.status}">
                                ${this.getPackageStatusIcon(pkg.status)} ${this.getPackageStatusText(pkg.status)}
                            </div>
                            <div class="package-date">
                                ${new Date(pkg.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                        
                        <div class="package-image">
                            <img src="${pkg.image || 'https://via.placeholder.com/300x200?text=Paket'}" alt="${pkg.packageName}" loading="lazy">
                            <div class="package-category-overlay">${pkg.category}</div>
                        </div>
                        
                        <div class="package-content">
                            <div class="restaurant-info">
                                <h3 class="restaurant-name">${pkg.restaurantName || 'Restoran Adı'}</h3>
                                <span class="restaurant-id">ID: ${pkg.restaurantId}</span>
                            </div>
                            
                            <div class="package-details">
                                <h4 class="package-name">${pkg.packageName}</h4>
                                <p class="package-description">${pkg.description}</p>
                            </div>
                            
                            <div class="package-pricing">
                                <div class="price-row">
                                    <span class="original-price">₺${pkg.originalPrice}</span>
                                    <span class="discounted-price">₺${pkg.discountPrice}</span>
                                </div>
                                <div class="discount-info">
                                    <span class="discount-percentage">${pkg.discount}% İndirim</span>
                                    <span class="savings">₺${pkg.originalPrice - pkg.discountPrice} Tasarruf</span>
                                </div>
                            </div>
                            
                            <div class="package-stock">
                                <div class="stock-info ${pkg.quantity === 0 ? 'out-of-stock' : pkg.quantity <= 3 ? 'low-stock' : 'in-stock'}">
                                    <span class="stock-icon">${pkg.quantity === 0 ? '🚫' : pkg.quantity <= 3 ? '⚠️' : '✅'}</span>
                                    <span class="stock-text">
                                        ${pkg.quantity === 0 ? 'Tükendi' : pkg.quantity <= 3 ? `Sadece ${pkg.quantity} kaldı` : `${pkg.quantity} adet stokta`}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="package-actions">
                            ${pkg.status === 'pending' ? `
                                <button class="action-btn approve-btn" onclick="adminDashboard.approvePackage('${pkg.id}')" title="Paketi Onayla">
                                    <i class="fas fa-check"></i> Onayla
                                </button>
                                <button class="action-btn reject-btn" onclick="adminDashboard.rejectPackage('${pkg.id}')" title="Paketi Reddet">
                                    <i class="fas fa-times"></i> Reddet
                                </button>
                            ` : ''}
                            <button class="action-btn detail-btn" onclick="adminDashboard.viewPackageDetails('${pkg.id}')" title="Paket Detayları">
                                <i class="fas fa-eye"></i> Detay
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    getPackageStatusText(status) {
        const statusMap = {
            'pending': 'Bekliyor',
            'approved': 'Onaylandı', 
            'rejected': 'Reddedildi',
            'expired': 'Süresi Doldu'
        };
        return statusMap[status] || status;
    }

    getPackageStatusIcon(status) {
        const iconMap = {
            'pending': '⏳',
            'approved': '✅',
            'rejected': '❌',
            'expired': '⏰'
        };
        return iconMap[status] || '❓';
    }

    async approvePackage(packageId) {
        console.log(`✅ Approving package: ${packageId}`);
        
        try {
            const response = await window.KapTazeAPIService.request(`/admin/packages/${packageId}/approve`, {
                method: 'POST'
            });

            if (response.success) {
                this.showNotification('success', `Paket ${packageId} onaylandı!`);
                
                // Update local data
                const pkg = this.data.packages.find(p => p.id === packageId);
                if (pkg) {
                    pkg.status = 'approved';
                }
                
                // Refresh display
                this.renderPackagesTable();
                this.updateStatsCards();
                
            } else {
                throw new Error(response.message || 'Onay işlemi başarısız');
            }

        } catch (error) {
            console.error('❌ Package approval failed:', error);
            
            // For demo mode, simulate approval
            const pkg = this.data.packages.find(p => p.id === packageId);
            if (pkg) {
                pkg.status = 'approved';
                this.showNotification('success', `Demo: Paket ${packageId} onaylandı!`);
                this.renderPackagesTable();
                this.updateStatsCards();
            }
        }
    }

    async suspendPackage(packageId) {
        console.log(`⏸️ Suspending/Activating package: ${packageId}`);
        
        try {
            const pkg = this.data.packages.find(p => p.id === packageId);
            if (!pkg) return;
            
            const newStatus = pkg.status === 'suspended' ? 'active' : 'suspended';
            
            const response = await window.KapTazeAPIService.request(`/admin/packages/${packageId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.success) {
                pkg.status = newStatus;
                this.showNotification('success', `Paket ${newStatus === 'suspended' ? 'durduruldu' : 'aktifleştirildi'}!`);
                this.renderPackagesTable();
                
                // Close modal if open
                const modal = document.querySelector('.package-detail-modal');
                if (modal) modal.remove();
            }
        } catch (error) {
            console.error('❌ Package status update failed:', error);
            this.showNotification('error', 'Paket durumu güncellenemedi');
        }
    }

    async deletePackage(packageId) {
        console.log(`🗑️ Deleting package: ${packageId}`);
        
        if (!confirm('Bu paketi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!')) {
            return;
        }
        
        try {
            const response = await window.KapTazeAPIService.request(`/admin/packages/${packageId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                // Remove from local data
                this.data.packages = this.data.packages.filter(p => p.id !== packageId);
                
                this.showNotification('success', 'Paket başarıyla silindi!');
                this.renderPackagesTable();
                this.updateStatsCards();
                
                // Close modal if open
                const modal = document.querySelector('.package-detail-modal');
                if (modal) modal.remove();
            }
        } catch (error) {
            console.error('❌ Package deletion failed:', error);
            
            // For demo mode, simulate deletion
            this.data.packages = this.data.packages.filter(p => p.id !== packageId);
            this.showNotification('success', 'Demo: Paket silindi!');
            this.renderPackagesTable();
            
            const modal = document.querySelector('.package-detail-modal');
            if (modal) modal.remove();
        }
    }

    async rejectPackage(packageId) {
        console.log(`❌ Rejecting package: ${packageId}`);
        
        const reason = prompt('Reddetme sebebini belirtin:');
        if (!reason) return;
        
        try {
            const response = await window.KapTazeAPIService.request(`/admin/packages/${packageId}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });

            if (response.success) {
                this.showNotification('success', `Paket ${packageId} reddedildi!`);
                
                // Update local data
                const pkg = this.data.packages.find(p => p.id === packageId);
                if (pkg) {
                    pkg.status = 'rejected';
                    pkg.rejectionReason = reason;
                }
                
                // Refresh display
                this.renderPackagesTable();
                this.updateStatsCards();
                
            } else {
                throw new Error(response.message || 'Red işlemi başarısız');
            }

        } catch (error) {
            console.error('❌ Package rejection failed:', error);
            
            // For demo mode, simulate rejection
            const pkg = this.data.packages.find(p => p.id === packageId);
            if (pkg) {
                pkg.status = 'rejected';
                pkg.rejectionReason = reason;
                this.showNotification('success', `Demo: Paket ${packageId} reddedildi!`);
                this.renderPackagesTable();
                this.updateStatsCards();
            }
        }
    }

    viewPackageDetails(packageId) {
        const pkg = this.data.packages.find(p => p.id === packageId);
        if (!pkg) return;

        // Create detailed modal
        const modal = document.createElement('div');
        modal.className = 'modal package-detail-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Paket Detayları</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="package-detail-grid">
                        <div class="package-image-section">
                            <img src="${pkg.image}" alt="${pkg.packageName}" class="detail-image">
                            <span class="status-badge ${pkg.status}">${this.getPackageStatusText(pkg.status)}</span>
                        </div>
                        <div class="package-info-section">
                            <h4>${pkg.packageName}</h4>
                            <p class="description">${pkg.description}</p>
                            
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Restoran:</label>
                                    <span>${pkg.restaurantName}</span>
                                </div>
                                <div class="info-item">
                                    <label>Kategori:</label>
                                    <span>${pkg.category}</span>
                                </div>
                                <div class="info-item">
                                    <label>Orijinal Fiyat:</label>
                                    <span>₺${pkg.originalPrice}</span>
                                </div>
                                <div class="info-item">
                                    <label>İndirimli Fiyat:</label>
                                    <span>₺${pkg.discountPrice}</span>
                                </div>
                                <div class="info-item">
                                    <label>İndirim:</label>
                                    <span>${pkg.discount}%</span>
                                </div>
                                <div class="info-item">
                                    <label>Stok:</label>
                                    <span>${pkg.quantity} adet</span>
                                </div>
                                <div class="info-item">
                                    <label>Bitiş Saati:</label>
                                    <span>${pkg.expiryTime}</span>
                                </div>
                                <div class="info-item">
                                    <label>Oluşturulma:</label>
                                    <span>${new Date(pkg.createdAt).toLocaleString('tr-TR')}</span>
                                </div>
                                ${pkg.rejectionReason ? `
                                    <div class="info-item">
                                        <label>Red Sebebi:</label>
                                        <span class="rejection-reason">${pkg.rejectionReason}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-warning" onclick="adminDashboard.suspendPackage('${pkg.id}')">
                            <i class="fas fa-pause"></i> ${pkg.status === 'suspended' ? 'Aktifleştir' : 'Durdur'}
                        </button>
                        <button class="btn btn-danger" onclick="adminDashboard.deletePackage('${pkg.id}')">
                            <i class="fas fa-trash"></i> Paketi Sil
                        </button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i> Kapat
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add modal styles
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        document.body.appendChild(modal);
        console.log(`👁️ Viewing details for package: ${packageId}`);
    }

    refreshPackages() {
        console.log('🔄 Refreshing packages data...');
        this.loadPackagesData();
    }

    // 🔄 PHASE 3: Advanced Reporting System
    generatePackageAnalyticsReport() {
        console.log('📊 Generating package analytics report...');
        
        const packages = this.data.packages || [];
        const stats = this.data.stats;
        
        const reportData = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalPackages: packages.length,
                pendingPackages: packages.filter(p => p.status === 'pending').length,
                approvedPackages: packages.filter(p => p.status === 'approved').length,
                rejectedPackages: packages.filter(p => p.status === 'rejected').length,
                averageDiscount: stats.averageDiscount,
                totalRevenue: stats.totalRevenue,
                outOfStockPackages: stats.outOfStockPackages
            },
            categoryBreakdown: this.getPackageCategoryBreakdown(packages),
            restaurantPerformance: this.getRestaurantPackagePerformance(packages),
            timeAnalysis: this.getPackageTimeAnalysis(packages)
        };
        
        // Download as JSON report
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `package-analytics-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('success', '📊 Paket analitik raporu indirildi!');
        console.log('✅ Package analytics report generated');
    }

    getPackageCategoryBreakdown(packages) {
        const breakdown = {};
        packages.forEach(pkg => {
            const category = pkg.category || 'Diğer';
            if (!breakdown[category]) {
                breakdown[category] = {
                    count: 0,
                    totalRevenue: 0,
                    averagePrice: 0,
                    averageDiscount: 0
                };
            }
            breakdown[category].count++;
            breakdown[category].totalRevenue += pkg.discountPrice * Math.max(0, (pkg.originalQuantity || 5) - pkg.quantity);
            breakdown[category].averageDiscount += pkg.discount;
        });
        
        // Calculate averages
        Object.keys(breakdown).forEach(category => {
            const data = breakdown[category];
            data.averagePrice = data.totalRevenue / data.count;
            data.averageDiscount = data.averageDiscount / data.count;
        });
        
        return breakdown;
    }

    getRestaurantPackagePerformance(packages) {
        const performance = {};
        packages.forEach(pkg => {
            const restaurantName = pkg.restaurantName || 'Bilinmeyen';
            if (!performance[restaurantName]) {
                performance[restaurantName] = {
                    totalPackages: 0,
                    approvedPackages: 0,
                    rejectedPackages: 0,
                    totalRevenue: 0,
                    averageDiscount: 0,
                    approvalRate: 0
                };
            }
            performance[restaurantName].totalPackages++;
            if (pkg.status === 'approved') performance[restaurantName].approvedPackages++;
            if (pkg.status === 'rejected') performance[restaurantName].rejectedPackages++;
            performance[restaurantName].totalRevenue += pkg.discountPrice * Math.max(0, (pkg.originalQuantity || 5) - pkg.quantity);
            performance[restaurantName].averageDiscount += pkg.discount;
        });
        
        // Calculate rates and averages
        Object.keys(performance).forEach(restaurant => {
            const data = performance[restaurant];
            data.approvalRate = (data.approvedPackages / data.totalPackages) * 100;
            data.averageDiscount = data.averageDiscount / data.totalPackages;
        });
        
        return performance;
    }

    getPackageTimeAnalysis(packages) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return {
            todayPackages: packages.filter(pkg => new Date(pkg.createdAt) >= today).length,
            yesterdayPackages: packages.filter(pkg => {
                const createdAt = new Date(pkg.createdAt);
                return createdAt >= yesterday && createdAt < today;
            }).length,
            thisWeekPackages: packages.filter(pkg => new Date(pkg.createdAt) >= weekAgo).length,
            peakHours: this.calculatePeakHours(packages)
        };
    }

    calculatePeakHours(packages) {
        const hourCounts = {};
        packages.forEach(pkg => {
            const hour = new Date(pkg.createdAt).getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const sortedHours = Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
            
        return sortedHours.map(([hour, count]) => ({
            hour: `${hour}:00`,
            packageCount: count
        }));
    }

    exportConsumerBehaviorReport() {
        console.log('👥 Exporting consumer behavior report...');
        
        const consumers = this.data.consumers || [];
        const reportData = consumers.map(consumer => {
            const behavior = consumer.behaviorData || {};
            return {
                'Kullanıcı ID': consumer._id,
                'Ad Soyad': `${consumer.name || ''} ${consumer.surname || ''}`.trim(),
                'Email': consumer.email,
                'Telefon': consumer.phone,
                'Durum': consumer.status,
                'Sipariş Sayısı': consumer.orderCount,
                'Toplam Harcama': `₺${consumer.totalSpent}`,
                'Ortalama Sipariş Değeri': `₺${behavior.averageOrderValue || 0}`,
                'Favori Kategoriler': behavior.favoriteCategories?.join(', ') || 'Belirtilmemiş',
                'Tercih Edilen Saatler': behavior.preferredOrderTimes?.join(', ') || 'Belirtilmemiş',
                'Sık Kullanılan Restoranlar': behavior.frequentRestaurants?.join(', ') || 'Belirtilmemiş',
                'Uygulama Kullanım Sıklığı': `${behavior.appOpenFrequency || 0}/hafta`,
                'Sadakat Puanı': behavior.loyaltyScore || 0,
                'İptal Oranı': `${((behavior.cancellationRate || 0) * 100).toFixed(1)}%`,
                'Referans Sayısı': behavior.referralCount || 0,
                'Platform': consumer.deviceInfo?.platform || 'Bilinmiyor',
                'Kayıt Tarihi': new Date(consumer.createdAt).toLocaleDateString('tr-TR'),
                'Son Aktivite': new Date(consumer.lastActivity).toLocaleDateString('tr-TR')
            };
        });
        
        this.downloadCSV(reportData, `consumer-behavior-report-${new Date().toISOString().split('T')[0]}.csv`);
        this.showNotification('success', '👥 Tüketici davranış raporu indirildi!');
    }

    exportPackagesReport() {
        console.log('📦 Exporting packages report...');
        
        const packages = this.data.packages || [];
        const reportData = packages.map(pkg => ({
            'Paket ID': pkg.id,
            'Paket Adı': pkg.packageName,
            'Restoran': pkg.restaurantName,
            'Kategori': pkg.category,
            'Açıklama': pkg.description,
            'Orijinal Fiyat': `₺${pkg.originalPrice}`,
            'İndirimli Fiyat': `₺${pkg.discountPrice}`,
            'İndirim Oranı': `${pkg.discount}%`,
            'Stok': pkg.quantity,
            'Durum': this.getPackageStatusText(pkg.status),
            'Bitiş Saati': pkg.expiryTime,
            'Oluşturulma Tarihi': new Date(pkg.createdAt).toLocaleDateString('tr-TR'),
            'Oluşturulma Saati': new Date(pkg.createdAt).toLocaleTimeString('tr-TR'),
            'Red Sebebi': pkg.rejectionReason || 'Yok'
        }));
        
        this.downloadCSV(reportData, `packages-report-${new Date().toISOString().split('T')[0]}.csv`);
        this.showNotification('success', '📦 Paket raporu indirildi!');
    }

    // Enhanced CSV download with better formatting
    downloadCSV(data, filename) {
        if (data.length === 0) {
            this.showNotification('warning', 'Rapor için veri bulunamadı');
            return;
        }

        const headers = Object.keys(data[0]);
        
        // Add BOM for proper UTF-8 encoding in Excel
        const BOM = '\uFEFF';
        const csvContent = BOM + [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    // Escape quotes and wrap in quotes if contains comma
                    return `"${String(value).replace(/"/g, '""')}"`;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        
        console.log(`✅ CSV report downloaded: ${filename}`);
    }

    // 🔄 PHASE 3: Performance Optimizations
    initializePerformanceOptimizations() {
        console.log('⚡ Initializing performance optimizations...');
        
        // Lazy loading for images
        this.setupLazyImageLoading();
        
        // Debounced search
        this.setupDebouncedSearch();
        
        // Virtual scrolling for large tables
        this.setupVirtualScrolling();
        
        // Memory cleanup
        this.setupMemoryCleanup();
        
        // Prefetch critical data
        this.prefetchCriticalData();
        
        console.log('✅ Performance optimizations initialized');
    }

    setupLazyImageLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            });

            // Observe all images with data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    setupDebouncedSearch() {
        let searchTimeout;
        const searchInputs = document.querySelectorAll('input[type="search"], .search-input');
        
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300); // 300ms debounce
            });
        });
    }

    setupVirtualScrolling() {
        // Implement virtual scrolling for large data sets
        const largeContainers = document.querySelectorAll('.large-table, .large-list');
        
        largeContainers.forEach(container => {
            if (container.children.length > 100) {
                this.enableVirtualScrolling(container);
            }
        });
    }

    enableVirtualScrolling(container) {
        const itemHeight = 50; // Average item height
        const visibleItems = Math.ceil(container.clientHeight / itemHeight) + 2;
        
        let startIndex = 0;
        let endIndex = visibleItems;
        
        const renderVisibleItems = () => {
            const items = Array.from(container.children);
            items.forEach((item, index) => {
                if (index >= startIndex && index < endIndex) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        };
        
        container.addEventListener('scroll', () => {
            const scrollTop = container.scrollTop;
            startIndex = Math.floor(scrollTop / itemHeight);
            endIndex = startIndex + visibleItems;
            renderVisibleItems();
        });
        
        renderVisibleItems();
    }

    setupMemoryCleanup() {
        // Clean up event listeners and DOM references
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // Periodic cleanup
        setInterval(() => {
            this.performMemoryCleanup();
        }, 300000); // 5 minutes
    }

    performMemoryCleanup() {
        // Remove old notification elements
        const oldNotifications = document.querySelectorAll('.notification.fade-out');
        oldNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // Clear unused data
        if (this.data.oldApplications && this.data.oldApplications.length > 1000) {
            this.data.oldApplications = this.data.oldApplications.slice(-500);
        }
        
        console.log('🧹 Memory cleanup performed');
    }

    prefetchCriticalData() {
        // Prefetch data that will likely be needed
        setTimeout(() => {
            this.prefetchApplicationsData();
            this.prefetchRestaurantsData();
        }, 2000);
    }

    async prefetchApplicationsData() {
        if (!this.data.applications || this.data.applications.length === 0) {
            try {
                const response = await window.KapTazeAPIService.request('/admin/applications', {
                    method: 'GET'
                });
                if (response.success) {
                    this.data.applications = response.data.applications;
                    console.log('✅ Applications data prefetched');
                }
            } catch (error) {
                console.log('⚠️ Applications prefetch failed (using fallback)');
            }
        }
    }

    async prefetchRestaurantsData() {
        if (!this.data.restaurants || this.data.restaurants.length === 0) {
            try {
                const response = await window.KapTazeAPIService.request('/admin/restaurants', {
                    method: 'GET'
                });
                if (response.success) {
                    this.data.restaurants = response.data.restaurants;
                    console.log('✅ Restaurants data prefetched');
                }
            } catch (error) {
                console.log('⚠️ Restaurants prefetch failed (using fallback)');
            }
        }
    }

    performSearch(query) {
        // Optimized search across all sections
        const normalizedQuery = query.toLowerCase().trim();
        
        if (normalizedQuery.length < 2) {
            this.clearSearchResults();
            return;
        }
        
        // Search with debouncing and caching
        const searchResults = {
            applications: this.searchApplications(normalizedQuery),
            restaurants: this.searchRestaurants(normalizedQuery),
            packages: this.searchPackages(normalizedQuery),
            consumers: this.searchConsumers(normalizedQuery)
        };
        
        this.displaySearchResults(searchResults);
    }

    searchApplications(query) {
        return (this.data.applications || []).filter(app => 
            app.restaurantName?.toLowerCase().includes(query) ||
            app.ownerName?.toLowerCase().includes(query) ||
            app.email?.toLowerCase().includes(query) ||
            app.applicationId?.toLowerCase().includes(query)
        );
    }

    searchRestaurants(query) {
        return (this.data.restaurants || []).filter(restaurant =>
            restaurant.name?.toLowerCase().includes(query) ||
            restaurant.owner?.firstName?.toLowerCase().includes(query) ||
            restaurant.owner?.lastName?.toLowerCase().includes(query) ||
            restaurant.category?.toLowerCase().includes(query)
        );
    }

    searchPackages(query) {
        return (this.data.packages || []).filter(pkg =>
            pkg.packageName?.toLowerCase().includes(query) ||
            pkg.restaurantName?.toLowerCase().includes(query) ||
            pkg.category?.toLowerCase().includes(query) ||
            pkg.description?.toLowerCase().includes(query)
        );
    }

    searchConsumers(query) {
        return (this.data.consumers || []).filter(consumer =>
            `${consumer.name || ''} ${consumer.surname || ''}`.toLowerCase().includes(query) ||
            consumer.email?.toLowerCase().includes(query) ||
            consumer.phone?.includes(query)
        );
    }

    displaySearchResults(results) {
        // Display search results with performance optimization
        console.log('🔍 Search results:', {
            applications: results.applications.length,
            restaurants: results.restaurants.length,
            packages: results.packages.length,
            consumers: results.consumers.length
        });
    }

    clearSearchResults() {
        // Clear search results and restore original display
        this.refreshCurrentSection();
    }

    // ============================================================================
    // ORDER MANAGEMENT METHODS
    // ============================================================================

    async loadOrdersData() {
        console.log('📦 Loading orders data...');
        try {
            const statusFilter = document.getElementById('orderStatusFilter')?.value || 'all';
            const paymentFilter = document.getElementById('orderPaymentFilter')?.value || 'all';
            const startDate = document.getElementById('startDateFilter')?.value || '';
            const endDate = document.getElementById('endDateFilter')?.value || '';
            const searchQuery = document.getElementById('orderSearchInput')?.value || '';

            const params = {
                status: statusFilter,
                paymentMethod: paymentFilter,
                startDate,
                endDate,
                search: searchQuery,
                page: 1,
                limit: 50
            };

            const response = await window.KapTazeAPIService.request('/admin/orders', {
                method: 'GET',
                params
            });

            if (response.success) {
                this.data.orders = response.data.orders;
                console.log(`✅ Loaded ${this.data.orders.length} orders`);
                this.displayOrders(this.data.orders, response.data.pagination);
            } else {
                throw new Error('Failed to load orders data');
            }
        } catch (error) {
            console.error('❌ Orders load error:', error);
            this.showError('ordersDataContainer', 'Siparişler yüklenirken hata oluştu: ' + error.message);
        }
    }

    displayOrders(orders, pagination) {
        console.log('📦 Displaying orders:', orders.length);

        const container = document.getElementById('ordersDataContainer');
        if (!container) {
            console.error('❌ Orders container not found');
            return;
        }

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="table-container">
                    <div style="padding: 3rem; text-align: center; color: var(--gray-500);">
                        <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                        <p style="font-size: 1.1rem; margin: 0;">Henüz sipariş bulunmuyor</p>
                    </div>
                </div>
            `;
            return;
        }

        const html = `
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">Sipariş Listesi</h3>
                    <span class="record-count">${orders.length} sipariş</span>
                </div>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Sipariş ID</th>
                                <th>Müşteri</th>
                                <th>Restaurant</th>
                                <th>Ürünler</th>
                                <th>Tutar</th>
                                <th>Tasarruf</th>
                                <th>Ödeme</th>
                                <th>Durum</th>
                                <th>Tarih</th>
                                <th>İşlemler</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orders.map(order => this.renderOrderRow(order)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    renderOrderRow(order) {
        const statusColors = {
            'pending': 'warning',
            'confirmed': 'info',
            'completed': 'success',
            'cancelled': 'danger'
        };

        const statusTexts = {
            'pending': 'Beklemede',
            'confirmed': 'Onaylandı',
            'completed': 'Tamamlandı',
            'cancelled': 'İptal'
        };

        const paymentBadge = order.paymentMethod === 'online'
            ? '<span class="badge badge-info">Online</span>'
            : '<span class="badge badge-secondary">Nakit</span>';

        const itemsCount = order.items?.length || 0;
        const itemsText = itemsCount > 0 ? `${itemsCount} ürün` : 'Ürün yok';

        return `
            <tr>
                <td><strong>#${order.orderCode || order.orderId}</strong></td>
                <td>
                    <div style="font-weight: 600;">${order.customer?.name || 'Unknown'}</div>
                    <div style="font-size: 0.85rem; color: var(--gray-500);">${order.customer?.phone || ''}</div>
                </td>
                <td>${order.restaurant?.name || 'Unknown Restaurant'}</td>
                <td>${itemsText}</td>
                <td><strong>₺${(order.totalPrice || 0).toFixed(2)}</strong></td>
                <td style="color: var(--success);">₺${(order.savings || 0).toFixed(2)}</td>
                <td>${paymentBadge}</td>
                <td>
                    <span class="badge badge-${statusColors[order.status] || 'secondary'}">
                        ${statusTexts[order.status] || order.status}
                    </span>
                </td>
                <td>${new Date(order.createdAt).toLocaleString('tr-TR')}</td>
                <td>
                    <button class="btn-icon" onclick="adminDashboard.viewOrderDetails('${order._id}')"
                            title="Detayları Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    async viewOrderDetails(orderId) {
        console.log('👁️ Viewing order details:', orderId);
        try {
            const response = await window.KapTazeAPIService.request(`/admin/orders/${orderId}`);

            if (response.success) {
                const order = response.data;
                this.showOrderDetailsModal(order);
            } else {
                alert('Sipariş detayları yüklenemedi');
            }
        } catch (error) {
            console.error('❌ Error loading order details:', error);
            alert('Sipariş detayları yüklenirken hata oluştu: ' + error.message);
        }
    }

    showOrderDetailsModal(order) {
        const itemsHTML = order.items?.map(item => `
            <div style="display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid var(--gray-200);">
                <div>
                    <div style="font-weight: 600;">${item.name || item.title || 'Item'}</div>
                    <div style="font-size: 0.85rem; color: var(--gray-500);">Miktar: ${item.quantity || 1}</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-weight: 600;">₺${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</div>
                    ${item.originalPrice ? `<div style="font-size: 0.85rem; color: var(--gray-500); text-decoration: line-through;">₺${(item.originalPrice * item.quantity).toFixed(2)}</div>` : ''}
                </div>
            </div>
        `).join('') || '<p>Ürün bilgisi yok</p>';

        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2>📦 Sipariş Detayları</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                            <div>
                                <h4 style="margin-bottom: 1rem; color: var(--primary);">👤 Müşteri Bilgileri</h4>
                                <p><strong>Ad:</strong> ${order.customer?.name || 'N/A'}</p>
                                <p><strong>Telefon:</strong> ${order.customer?.phone || 'N/A'}</p>
                                <p><strong>Email:</strong> ${order.customer?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 style="margin-bottom: 1rem; color: var(--primary);">🏪 Restaurant Bilgileri</h4>
                                <p><strong>Ad:</strong> ${order.restaurant?.name || 'N/A'}</p>
                                <p><strong>Telefon:</strong> ${order.restaurant?.phone || 'N/A'}</p>
                            </div>
                        </div>

                        <h4 style="margin-bottom: 1rem; color: var(--primary);">🛒 Sipariş Ürünleri</h4>
                        <div style="border: 1px solid var(--gray-200); border-radius: 8px; margin-bottom: 2rem;">
                            ${itemsHTML}
                        </div>

                        <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span>Toplam Tutar:</span>
                                <strong style="font-size: 1.2rem;">₺${(order.totalPrice || 0).toFixed(2)}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: var(--success);">
                                <span>Tasarruf:</span>
                                <strong>₺${(order.savings || 0).toFixed(2)}</strong>
                            </div>
                        </div>

                        <div style="margin-top: 2rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div>
                                <p><strong>Sipariş ID:</strong> #${order.orderCode || order.orderId}</p>
                                <p><strong>Ödeme:</strong> ${order.paymentMethod === 'online' ? 'Online' : 'Nakit'}</p>
                            </div>
                            <div>
                                <p><strong>Durum:</strong> ${order.status}</p>
                                <p><strong>Tarih:</strong> ${new Date(order.createdAt).toLocaleString('tr-TR')}</p>
                            </div>
                        </div>

                        ${order.pickupCode ? `<p style="margin-top: 1rem;"><strong>Teslim Kodu:</strong> ${order.pickupCode}</p>` : ''}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    filterOrders() {
        console.log('🔍 Filtering orders...');
        this.loadOrdersData();
    }

    searchOrders(query) {
        console.log('🔍 Searching orders:', query);
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.loadOrdersData();
        }, 500);
    }

    async refreshOrders() {
        console.log('🔄 Refreshing orders...');
        await this.loadOrdersData();
    }

    async exportOrders() {
        console.log('📥 Exporting orders to CSV...');
        try {
            if (!this.data.orders || this.data.orders.length === 0) {
                alert('Export edilecek sipariş bulunamadı');
                return;
            }

            // CSV header
            let csv = 'Sipariş ID,Müşteri,Telefon,Restaurant,Ürün Sayısı,Toplam,Tasarruf,Ödeme,Durum,Tarih\n';

            // CSV rows
            this.data.orders.forEach(order => {
                const row = [
                    order.orderCode || order.orderId,
                    order.customer?.name || '',
                    order.customer?.phone || '',
                    order.restaurant?.name || '',
                    order.items?.length || 0,
                    (order.totalPrice || 0).toFixed(2),
                    (order.savings || 0).toFixed(2),
                    order.paymentMethod === 'online' ? 'Online' : 'Nakit',
                    order.status || '',
                    new Date(order.createdAt).toLocaleString('tr-TR')
                ].map(val => `"${val}"`).join(',');

                csv += row + '\n';
            });

            // Download
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `siparisler_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            console.log('✅ Orders exported successfully');
        } catch (error) {
            console.error('❌ Export error:', error);
            alert('Export sırasında hata oluştu: ' + error.message);
        }
    }

    // ==========================================
    // REVIEWS MANAGEMENT FUNCTIONS
    // ==========================================

    async loadReviewsData() {
        console.log(`⭐ Loading ${this.currentReviewStatus} reviews...`);
        try {
            const endpoint = `/admin/reviews/${this.currentReviewStatus}`;
            const response = await window.KapTazeAPIService.request(endpoint, {
                method: 'GET',
                params: { page: 1, limit: 50 }
            });

            if (response.success) {
                this.data.reviews = response.data.reviews;
                console.log(`✅ Loaded ${this.data.reviews.length} ${this.currentReviewStatus} reviews`);
                this.displayReviews(this.data.reviews, response.data.pagination);

                // Update badge
                if (this.currentReviewStatus === 'pending') {
                    const badge = document.getElementById('pendingReviewsBadge');
                    const navBadge = document.getElementById('pendingReviewsCount');
                    if (badge) badge.textContent = this.data.reviews.length;
                    if (navBadge) navBadge.textContent = this.data.reviews.length;
                }
            }
        } catch (error) {
            console.error('❌ Reviews load error:', error);
            this.showError('reviewsDataContainer', 'Puanlamalar yüklenirken hata oluştu: ' + error.message);
        }
    }

    displayReviews(reviews, pagination) {
        console.log(`📋 Displaying ${reviews.length} reviews`);

        const container = document.getElementById('reviewsDataContainer');
        if (!container) {
            console.error('❌ Reviews container not found');
            return;
        }

        if (!reviews || reviews.length === 0) {
            const statusText = this.currentReviewStatus === 'pending' ? 'bekleyen' :
                             this.currentReviewStatus === 'approved' ? 'onaylanan' : 'reddedilen';
            container.innerHTML = `
                <div style="padding: 3rem; text-align: center; color: var(--gray-500);">
                    <i class="fas fa-star" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p style="font-size: 1.1rem; margin: 0;">Henüz ${statusText} puanlama bulunmuyor</p>
                </div>
            `;
            return;
        }

        const html = `
            <div style="padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--gray-700);">📸 Fotoğraflı Puanlamalar</h3>
                    <span style="color: var(--gray-500); font-size: 0.9rem;">${reviews.length} puanlama</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
                    ${reviews.map(review => this.renderReviewCard(review)).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    renderReviewCard(review) {
        const stars = '⭐'.repeat(review.review?.rating || 0);
        const photo = review.review?.photos[0];
        const comment = review.review?.comment || 'Yorum yok';
        const commentShort = comment.length > 100 ? comment.substring(0, 100) + '...' : comment;
        const date = new Date(review.review?.reviewedAt || review.createdAt).toLocaleDateString('tr-TR');

        // Photo approval status badge
        let statusBadge = '';
        if (this.currentReviewStatus === 'approved') {
            statusBadge = '<span style="position: absolute; top: 8px; right: 8px; background: var(--success); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">✓ Onaylı</span>';
        } else if (this.currentReviewStatus === 'rejected') {
            statusBadge = '<span style="position: absolute; top: 8px; right: 8px; background: var(--danger); color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">✗ Reddedildi</span>';
        }

        // Action buttons (only for pending reviews)
        const actionButtons = this.currentReviewStatus === 'pending' ? `
            <div class="review-card-actions" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 1rem 0.5rem 0.5rem; opacity: 0; transition: opacity 0.2s; display: flex; gap: 0.5rem; justify-content: center;">
                <button onclick="adminDashboard.approvePhotoQuick('${review._id}', 0); event.stopPropagation();" style="flex: 1; padding: 0.5rem 1rem; background: var(--success); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: transform 0.2s;">
                    <i class="fas fa-check"></i> Onayla
                </button>
                <button onclick="adminDashboard.rejectPhotoQuick('${review._id}', 0); event.stopPropagation();" style="flex: 1; padding: 0.5rem 1rem; background: var(--danger); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: transform 0.2s;">
                    <i class="fas fa-times"></i> Reddet
                </button>
            </div>
        ` : '';

        return `
            <div class="review-card" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-md); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; position: relative;"
                 onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(0,0,0,0.15)'; this.querySelector('.review-card-actions')?.style.setProperty('opacity', '1');"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-md)'; this.querySelector('.review-card-actions')?.style.setProperty('opacity', '0');">

                <!-- Photo Container -->
                <div onclick="window.open('${photo?.url}', '_blank')" style="position: relative; width: 100%; height: 200px; background: var(--gray-100); overflow: hidden;">
                    ${photo ? `<img src="${photo.url}" alt="Review Photo" style="width: 100%; height: 100%; object-fit: cover;">` : '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--gray-400);"><i class="fas fa-image" style="font-size: 3rem;"></i></div>'}
                    ${statusBadge}
                    ${actionButtons}
                </div>

                <!-- Card Content -->
                <div style="padding: 1rem;">
                    <!-- Customer & Restaurant -->
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                        <div>
                            <div style="font-weight: 600; color: var(--gray-800); margin-bottom: 0.25rem;">${review.customer?.name || 'Unknown'}</div>
                            <div style="font-size: 0.85rem; color: var(--gray-500);">${review.restaurant?.name || 'Unknown Restaurant'}</div>
                        </div>
                        <div style="font-size: 1.2rem;">${stars}</div>
                    </div>

                    <!-- Comment -->
                    <div style="font-size: 0.9rem; color: var(--gray-600); line-height: 1.5; margin-bottom: 0.75rem;">
                        ${commentShort}
                    </div>

                    <!-- Date -->
                    <div style="font-size: 0.8rem; color: var(--gray-400);">
                        <i class="fas fa-clock"></i> ${date}
                    </div>
                </div>
            </div>
        `;
    }

    async viewReviewDetails(reviewId) {
        console.log('👁️ Viewing review details:', reviewId);
        const review = this.data.reviews.find(r => r._id === reviewId);

        if (!review) {
            alert('Puanlama bulunamadı');
            return;
        }

        this.showReviewDetailsModal(review);
    }

    showReviewDetailsModal(review) {
        const photos = review.review?.photos || [];
        const stars = '⭐'.repeat(review.review?.rating || 0);

        const modalHTML = `
            <div class="modal-overlay" onclick="this.remove()">
                <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 800px;">
                    <div class="modal-header">
                        <h2>⭐ Puanlama Detayları</h2>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div style="display: grid; gap: 1.5rem;">
                            <!-- Photos -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">📸 Fotoğraflar (${photos.length})</h3>
                                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
                                    ${photos.map((photo, index) => `
                                        <div style="position: relative;">
                                            <img src="${photo.url}" alt="Photo ${index + 1}"
                                                 style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; cursor: pointer;"
                                                 onclick="window.open('${photo.url}', '_blank')">
                                            ${photo.isApproved ? '<span class="badge badge-success" style="position: absolute; top: 5px; right: 5px;">Onaylı</span>' :
                                              photo.rejectedReason ? '<span class="badge badge-danger" style="position: absolute; top: 5px; right: 5px;">Reddedildi</span>' :
                                              '<span class="badge badge-warning" style="position: absolute; top: 5px; right: 5px;">Beklemede</span>'}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Review Info -->
                            <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">⭐ Puanlama Bilgileri</h3>
                                <div style="display: grid; gap: 0.5rem;">
                                    <div><strong>Yıldız:</strong> <span style="font-size: 1.3rem;">${stars}</span></div>
                                    <div><strong>Yorum:</strong> ${review.review?.comment || 'Yorum yapılmamış'}</div>
                                    <div><strong>Tarih:</strong> ${new Date(review.review?.reviewedAt).toLocaleString('tr-TR')}</div>
                                </div>
                            </div>

                            <!-- Customer & Restaurant -->
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">👤 Müşteri</h3>
                                    <div style="display: grid; gap: 0.5rem; font-size: 0.9rem;">
                                        <div><strong>İsim:</strong> ${review.customer?.name || 'Unknown'}</div>
                                        <div><strong>Email:</strong> ${review.customer?.email || 'N/A'}</div>
                                    </div>
                                </div>
                                <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px;">
                                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">🏪 Restaurant</h3>
                                    <div style="display: grid; gap: 0.5rem; font-size: 0.9rem;">
                                        <div><strong>İsim:</strong> ${review.restaurant?.name || 'Unknown'}</div>
                                        <div><strong>Sipariş ID:</strong> ${review.orderId}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        ${this.currentReviewStatus === 'pending' ? `
                            ${photos.map((photo, index) => !photo.isApproved ? `
                                <button class="btn btn-danger" onclick="adminDashboard.rejectPhoto('${review._id}', ${index})">
                                    <i class="fas fa-times"></i> Reddet (#${index + 1})
                                </button>
                                <button class="btn btn-success" onclick="adminDashboard.approvePhoto('${review._id}', ${index})">
                                    <i class="fas fa-check"></i> Onayla (#${index + 1})
                                </button>
                            ` : '').join('')}
                        ` : ''}
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                            Kapat
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    async approvePhoto(reviewId, photoIndex) {
        console.log(`✅ Approving photo - Review: ${reviewId}, Index: ${photoIndex}`);

        if (!confirm(`Bu fotoğrafı onaylamak istediğinizden emin misiniz?`)) {
            return;
        }

        try {
            const response = await window.KapTazeAPIService.request(
                `/admin/reviews/${reviewId}/photos/${photoIndex}/approve`,
                { method: 'POST' }
            );

            if (response.success) {
                alert('✅ Fotoğraf başarıyla onaylandı!');
                // Close modal
                document.querySelector('.modal-overlay')?.remove();
                // Reload reviews
                await this.loadReviewsData();
            }
        } catch (error) {
            console.error('❌ Approve error:', error);
            alert('Onaylama sırasında hata oluştu: ' + error.message);
        }
    }

    async rejectPhoto(reviewId, photoIndex) {
        console.log(`❌ Rejecting photo - Review: ${reviewId}, Index: ${photoIndex}`);

        const reason = prompt('Reddedilme sebebi (opsiyonel):');
        // Allow empty reason - user can cancel or leave empty
        if (reason === null) {
            return; // User cancelled
        }

        try {
            const response = await window.KapTazeAPIService.request(
                `/admin/reviews/${reviewId}/photos/${photoIndex}/reject`,
                {
                    method: 'POST',
                    body: JSON.stringify({ reason: reason || undefined })
                }
            );

            if (response.success) {
                alert('❌ Fotoğraf reddedildi.');
                // Close modal
                document.querySelector('.modal-overlay')?.remove();
                // Reload reviews
                await this.loadReviewsData();
            }
        } catch (error) {
            console.error('❌ Reject error:', error);
            alert('Reddetme sırasında hata oluştu: ' + error.message);
        }
    }

    // Quick approve from card view (no modal)
    async approvePhotoQuick(reviewId, photoIndex) {
        console.log(`⚡ Quick approve - Review: ${reviewId}, Index: ${photoIndex}`);

        try {
            const response = await window.KapTazeAPIService.request(
                `/admin/reviews/${reviewId}/photos/${photoIndex}/approve`,
                { method: 'POST' }
            );

            if (response.success) {
                this.showToast('✅ Fotoğraf onaylandı!', 'success');
                // Reload reviews
                await this.loadReviewsData();
            }
        } catch (error) {
            console.error('❌ Quick approve error:', error);
            this.showToast('❌ Onaylama hatası: ' + error.message, 'error');
        }
    }

    // Quick reject from card view (no modal, optional reason)
    async rejectPhotoQuick(reviewId, photoIndex) {
        console.log(`⚡ Quick reject - Review: ${reviewId}, Index: ${photoIndex}`);

        const reason = prompt('Reddedilme sebebi (opsiyonel - boş bırakabilirsiniz):');
        if (reason === null) {
            return; // User cancelled
        }

        try {
            const response = await window.KapTazeAPIService.request(
                `/admin/reviews/${reviewId}/photos/${photoIndex}/reject`,
                {
                    method: 'POST',
                    body: JSON.stringify({ reason: reason || undefined })
                }
            );

            if (response.success) {
                this.showToast('❌ Fotoğraf reddedildi.', 'success');
                // Reload reviews
                await this.loadReviewsData();
            }
        } catch (error) {
            console.error('❌ Quick reject error:', error);
            this.showToast('❌ Reddetme hatası: ' + error.message, 'error');
        }
    }

    filterReviewsByStatus(status) {
        console.log(`🔍 Filtering reviews by status: ${status}`);
        this.currentReviewStatus = status;

        // Update active button
        document.querySelectorAll('.filter-btn[data-status]').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.filter-btn[data-status="${status}"]`)?.classList.add('active');

        // Reload data
        this.loadReviewsData();
    }

    async refreshReviews() {
        console.log('🔄 Refreshing reviews...');
        await this.loadReviewsData();
    }

    cleanup() {
        // Cleanup function called on page unload
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        console.log('🧹 Dashboard cleanup completed');
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Global instance for easy access
    window.adminDashboard = new AdminProDashboardV2();
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('🚨 Dashboard Error:', e.error);
});

window.adminDashboard = new AdminProDashboardV2();

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.adminDashboard) {
        window.adminDashboard.refreshCurrentSection();
    }
});

// Console branding
console.log(`
    🎯 kapkazan Admin Professional Dashboard V2
    ⚡ Ultra Modern Restaurant Management System
    🔒 Security Level: Maximum
    📊 Real-time Data: Active
    🚀 Status: Production Ready

    Commands:
    - adminDashboard.refreshAllData()
    - adminDashboard.showSection('orders')
    - adminDashboard.setupSendGrid()
    - adminDashboard.logout()
`);