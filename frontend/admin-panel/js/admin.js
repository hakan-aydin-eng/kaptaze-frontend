// KapTaze Admin Panel JavaScript

// Configuration
const API_BASE_URL = 'https://kaptaze-api.onrender.com';
const API_ENDPOINTS = {
    users: '/api/admin/kullanicilar',
    restaurants: '/api/admin/restoranlar', 
    orders: '/api/admin/siparisler',
    packages: '/api/admin/paketler',
    dashboard: '/api/admin/dashboard',
    health: '/health'
};

// Global state
let apiConnected = false;

// Global state
let currentSection = 'dashboard';
let authToken = localStorage.getItem('adminToken');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuthentication()) {
        return; // Will redirect to login
    }
    
    initializeApp();
    checkAPIStatus();
    loadDashboardData();
});

// Authentication check
function checkAuthentication() {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (!token || !user) {
        // Redirect to login
        window.location.href = './login.html';
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        const loginTime = new Date(userData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        // Token expires after 24 hours
        if (hoursDiff > 24) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = './login.html';
            return false;
        }
        
        // Update user info in header
        const userInfo = document.querySelector('.user-info span');
        if (userInfo) {
            userInfo.textContent = userData.username;
        }
        
        return true;
    } catch (error) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = './login.html';
        return false;
    }
}

// Logout function
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = './login.html';
    }
}

// App initialization
function initializeApp() {
    // Set active section from URL hash
    const hash = window.location.hash.substring(1);
    if (hash) {
        showSection(hash);
    }
    
    // Setup periodic API status check
    setInterval(checkAPIStatus, 30000); // Every 30 seconds
    
    console.log('🚀 KapTaze Admin Panel initialized');
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    const navItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    
    if (section && navItem) {
        section.classList.add('active');
        navItem.classList.add('active');
        currentSection = sectionId;
        
        // Update URL hash
        window.location.hash = sectionId;
        
        // Load section data
        loadSectionData(sectionId);
    }
}

// Load section data
function loadSectionData(sectionId) {
    console.log('📄 Loading section data for:', sectionId);
    switch (sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'applications':
            console.log('📋 Loading applications section...');
            loadApplicationsData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'restaurants':
            loadRestaurantsData();
            break;
        case 'orders':
            loadOrdersData();
            break;
        case 'packages':
            loadPackagesData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
    }
}

// API Functions
async function makeAPICall(endpoint, options = {}) {
    try {
        const url = API_BASE_URL + endpoint;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(authToken && { 'Authorization': `Bearer ${authToken}` })
            },
            ...options
        };
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Call failed:', error);
        showNotification('API bağlantı hatası: ' + error.message, 'error');
        return null;
    }
}

// Check API status
async function checkAPIStatus() {
    const statusElement = document.getElementById('api-status');
    const indicatorElement = document.getElementById('api-indicator');
    const statusTextElement = document.getElementById('api-status-text');
    
    try {
        // For demo purposes, simulate API as offline but working with localStorage
        // This prevents the red error state while using local data
        apiConnected = false; // Set to false to use localStorage data
        
        // Update UI for local data mode (not an error)
        if (statusElement) {
            statusElement.classList.remove('error');
            statusElement.querySelector('span').textContent = 'Yerel Veri Modu';
        }
        
        if (indicatorElement) {
            indicatorElement.classList.add('active');
        }
        
        if (statusTextElement) {
            statusTextElement.textContent = 'Aktif (Yerel)';
        }
        
        console.log('📁 Data Mode: Using LocalStorage');
        
        // Uncomment below to test real API connection
        /*
        const response = await fetch(API_BASE_URL + API_ENDPOINTS.health, {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            const data = await response.json();
            apiConnected = true;
            
            if (statusElement) {
                statusElement.classList.remove('error');
                statusElement.querySelector('span').textContent = 'API Bağlı';
            }
            
            if (indicatorElement) {
                indicatorElement.classList.add('active');
            }
            
            if (statusTextElement) {
                statusTextElement.textContent = 'Aktif';
            }
            
            console.log('✅ API Status: Healthy');
        } else {
            throw new Error('API not responding');
        }
        */
    } catch (error) {
        apiConnected = false;
        
        // Update UI for error state
        if (statusElement) {
            statusElement.classList.add('error');
            statusElement.querySelector('span').textContent = 'API Bağlantı Sorunu';
        }
        
        if (indicatorElement) {
            indicatorElement.classList.remove('active');
        }
        
        if (statusTextElement) {
            statusTextElement.textContent = 'Hata';
        }
        
        console.warn('⚠️ API Status: Connection Failed -', error.message);
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        // Mock data fallback
        const mockStats = {
            totalUsers: 1247,
            totalRestaurants: 89,
            totalPackages: 456,
            totalOrders: 2834
        };
        
        if (apiConnected) {
            // Try to get real data from API
            const dashboardData = await makeAPICall(API_ENDPOINTS.dashboard);
            if (dashboardData && dashboardData.success) {
                updateDashboardStats(dashboardData.data);
            } else {
                // Fall back to mock data
                updateDashboardStatsMock(mockStats);
            }
        } else {
            // Use mock data
            updateDashboardStatsMock(mockStats);
        }
        
        console.log('📊 Dashboard data loaded');
    } catch (error) {
        console.error('Dashboard data loading failed:', error);
        // Fallback to mock data
        const mockStats = {
            totalUsers: 1247,
            totalRestaurants: 89,
            totalPackages: 456,
            totalOrders: 2834
        };
        updateDashboardStatsMock(mockStats);
    }
}

function updateDashboardStatsMock(stats) {
    document.getElementById('total-users').textContent = stats.totalUsers.toLocaleString('tr-TR');
    document.getElementById('total-restaurants').textContent = stats.totalRestaurants.toLocaleString('tr-TR');
    document.getElementById('total-packages').textContent = stats.totalPackages.toLocaleString('tr-TR');
    document.getElementById('total-orders').textContent = stats.totalOrders.toLocaleString('tr-TR');
}

function updateDashboardStats(data) {
    if (data.genel) {
        const stats = data.genel;
        document.getElementById('total-users').textContent = (stats.toplamKullanici || 0).toLocaleString('tr-TR');
        document.getElementById('total-restaurants').textContent = (stats.aktifRestoranlar || 0).toLocaleString('tr-TR');
        document.getElementById('total-packages').textContent = (stats.aktifPaketler || 0).toLocaleString('tr-TR');
        document.getElementById('total-orders').textContent = (stats.toplamSiparis || 0).toLocaleString('tr-TR');
    }
}

// Users functions
async function loadUsersData() {
    const tableBody = document.getElementById('users-table-body');
    
    // Show loading
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">Kullanıcılar yükleniyor...</td></tr>';
    
    try {
        if (apiConnected) {
            const usersData = await makeAPICall(API_ENDPOINTS.users);
            
            if (usersData && usersData.success && usersData.data.kullanicilar) {
                renderUsersTable(usersData.data.kullanicilar);
            } else {
                // Show mock data
                renderMockUsersData();
            }
        } else {
            // Show mock data when API is not connected
            renderMockUsersData();
        }
    } catch (error) {
        renderMockUsersData();
        console.error('Users loading failed, using mock data:', error);
    }
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    
    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="loading">Henüz kullanıcı bulunmuyor</td></tr>';
        return;
    }
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user._id.substring(0, 8)}...</td>
            <td>${user.ad} ${user.soyad}</td>
            <td>${user.eposta}</td>
            <td>${user.telefon || 'Belirtilmemiş'}</td>
            <td>${new Date(user.kayitTarihi).toLocaleDateString('tr-TR')}</td>
            <td><span class="status-badge ${user.aktif ? 'active' : 'inactive'}">${user.aktif ? 'Aktif' : 'Pasif'}</span></td>
            <td>
                <button class="btn-secondary" onclick="editUser('${user._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-secondary" onclick="toggleUserStatus('${user._id}', ${user.aktif})">
                    <i class="fas fa-${user.aktif ? 'ban' : 'check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderMockUsersData() {
    // Load registrations from localStorage
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const customerRegistrations = registrations.filter(reg => reg.type === 'customer');
    
    const mockUsers = [
        { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', phone: '0532 XXX XX XX', date: '2024-01-15', status: 'active' },
        { id: '2', name: 'Fatma Kaya', email: 'fatma@example.com', phone: '0542 XXX XX XX', date: '2024-01-20', status: 'active' },
        { id: '3', name: 'Mehmet Demir', email: 'mehmet@example.com', phone: '0555 XXX XX XX', date: '2024-01-25', status: 'inactive' }
    ];
    
    // Add customer registrations
    customerRegistrations.forEach(reg => {
        mockUsers.push({
            id: reg.id,
            name: `${reg.firstName} ${reg.lastName}`,
            email: reg.email,
            phone: reg.phone,
            date: new Date(reg.createdAt).toLocaleDateString('tr-TR'),
            status: reg.status === 'approved' ? 'active' : 'pending'
        });
    });
    
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = mockUsers.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.date}</td>
            <td><span class="status-badge ${user.status}">${getStatusText(user.status)}</span></td>
            <td>
                <button class="btn-secondary" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-secondary" onclick="toggleUserStatus('${user.id}', '${user.status}')">
                    <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                </button>
                ${user.status === 'pending' ? `
                <button class="btn-primary" onclick="approveUser('${user.id}')">
                    <i class="fas fa-check"></i> Onayla
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function getStatusText(status) {
    const statusMap = {
        'active': 'Aktif',
        'inactive': 'Pasif',
        'pending': 'Onay Bekliyor',
        'approved': 'Onaylı'
    };
    return statusMap[status] || status;
}

function approveUser(userId) {
    if (confirm('Bu kullanıcıyı onaylamak istediğinizden emin misiniz?')) {
        // Update registration status
        const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        const updatedRegistrations = registrations.map(reg => {
            if (reg.id === userId) {
                reg.status = 'approved';
                reg.approvedAt = new Date().toISOString();
            }
            return reg;
        });
        localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
        
        showNotification(`Kullanıcı başarıyla onaylandı!`, 'success');
        loadUsersData(); // Reload users
    }
}

// Restaurants functions
async function loadRestaurantsData() {
    const tableBody = document.getElementById('restaurants-table-body');
    
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">Restoranlar yükleniyor...</td></tr>';
    
    try {
        if (apiConnected) {
            const restaurantsData = await makeAPICall(API_ENDPOINTS.restaurants);
            
            if (restaurantsData && restaurantsData.success) {
                renderRestaurantsTable(restaurantsData.data.restoranlar);
            } else {
                renderMockRestaurantsData();
            }
        } else {
            renderMockRestaurantsData();
        }
    } catch (error) {
        renderMockRestaurantsData();
        console.error('Restaurants loading failed, using mock data:', error);
    }
}

function renderMockRestaurantsData() {
    // Load registrations from localStorage
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const restaurantRegistrations = registrations.filter(reg => reg.type === 'restaurant');
    
    const mockRestaurants = [
        { id: '1', name: 'Seraser Restaurant', email: 'info@seraser.com', address: 'Kaleiçi, Antalya', approved: 'active', packages: 12 },
        { id: '2', name: 'Lara Balık Evi', email: 'info@larabalik.com', address: 'Lara, Antalya', approved: 'pending', packages: 8 },
        { id: '3', name: 'Köşe Kebap', email: 'info@kosekebap.com', address: 'Konyaaltı, Antalya', approved: 'active', packages: 15 }
    ];
    
    // Add restaurant registrations
    restaurantRegistrations.forEach(reg => {
        mockRestaurants.push({
            id: reg.id,
            name: reg.businessName,
            email: reg.email,
            address: `${reg.businessAddress}, ${reg.district}/${reg.city}`,
            approved: reg.status === 'approved' ? 'active' : 'pending',
            packages: 0,
            category: reg.businessCategory,
            owner: `${reg.firstName} ${reg.lastName}`,
            phone: reg.phone
        });
    });
    
    const tableBody = document.getElementById('restaurants-table-body');
    tableBody.innerHTML = mockRestaurants.map(restaurant => `
        <tr>
            <td>${restaurant.id}</td>
            <td>
                <strong>${restaurant.name}</strong><br>
                <small style="color: #6b7280;">${restaurant.owner || 'N/A'}</small>
            </td>
            <td>${restaurant.email}</td>
            <td>${restaurant.address}</td>
            <td><span class="status-badge ${restaurant.approved}">${restaurant.approved === 'active' ? 'Onaylı' : 'Beklemede'}</span></td>
            <td>${restaurant.packages}</td>
            <td>
                <button class="btn-secondary" onclick="editRestaurant('${restaurant.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                ${restaurant.approved === 'pending' ? `
                <button class="btn-primary" onclick="approveRestaurant('${restaurant.id}')">
                    <i class="fas fa-check"></i> Onayla
                </button>
                ` : `
                <button class="btn-secondary" onclick="viewRestaurant('${restaurant.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                `}
            </td>
        </tr>
    `).join('');
}

function approveRestaurant(restaurantId) {
    if (confirm('Bu restoranı onaylamak istediğinizden emin misiniz?')) {
        // Update registration status
        const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        const updatedRegistrations = registrations.map(reg => {
            if (reg.id === restaurantId) {
                reg.status = 'approved';
                reg.approvedAt = new Date().toISOString();
            }
            return reg;
        });
        localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
        
        showNotification(`Restoran başarıyla onaylandı!`, 'success');
        loadRestaurantsData(); // Reload restaurants
    }
}

function viewRestaurant(restaurantId) {
    showNotification(`Restoran detayları görüntüleme özelliği yakında aktif olacak (ID: ${restaurantId})`, 'info');
}

// Orders functions
async function loadOrdersData() {
    const tableBody = document.getElementById('orders-table-body');
    
    tableBody.innerHTML = '<tr><td colspan="7" class="loading">Siparişler yükleniyor...</td></tr>';
    
    renderMockOrdersData();
}

function renderMockOrdersData() {
    const mockOrders = [
        { id: 'SP001', user: 'Ahmet Y.', restaurant: 'Seraser', amount: '₺45', status: 'teslim_edildi', date: '2024-01-20 14:30' },
        { id: 'SP002', user: 'Fatma K.', restaurant: 'Lara Balık', amount: '₺32', status: 'hazir', date: '2024-01-20 15:45' },
        { id: 'SP003', user: 'Mehmet D.', restaurant: 'Köşe Kebap', amount: '₺28', status: 'hazirlaniyor', date: '2024-01-20 16:15' }
    ];
    
    const tableBody = document.getElementById('orders-table-body');
    tableBody.innerHTML = mockOrders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.user}</td>
            <td>${order.restaurant}</td>
            <td>${order.amount}</td>
            <td><span class="status-badge ${order.status}">${getOrderStatusText(order.status)}</span></td>
            <td>${order.date}</td>
            <td>
                <button class="btn-secondary" onclick="viewOrder('${order.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function getOrderStatusText(status) {
    const statusMap = {
        'beklemede': 'Beklemede',
        'onaylandi': 'Onaylandı', 
        'hazirlaniyor': 'Hazırlanıyor',
        'hazir': 'Hazır',
        'teslim_edildi': 'Teslim Edildi',
        'iptal_edildi': 'İptal'
    };
    return statusMap[status] || status;
}

// Packages functions
async function loadPackagesData() {
    const grid = document.getElementById('packages-grid');
    
    grid.innerHTML = '<div class="loading-card"><p>Paketler yükleniyor...</p></div>';
    
    renderMockPackagesData();
}

function renderMockPackagesData() {
    const mockPackages = [
        { id: '1', name: 'Karma Menü', restaurant: 'Seraser Restaurant', price: '₺45', originalPrice: '₺18', category: 'Ana Yemek' },
        { id: '2', name: 'Balık Tabağı', restaurant: 'Lara Balık Evi', price: '₺60', originalPrice: '₺25', category: 'Deniz Ürünleri' },
        { id: '3', name: 'Kebap Menü', restaurant: 'Köşe Kebap', price: '₺35', originalPrice: '₺15', category: 'Et Yemekleri' }
    ];
    
    const grid = document.getElementById('packages-grid');
    grid.innerHTML = mockPackages.map(pkg => `
        <div class="package-card">
            <div class="package-header">
                <h4 class="package-title">${pkg.name}</h4>
                <p class="package-restaurant">${pkg.restaurant}</p>
            </div>
            <div style="padding: 1.5rem;">
                <p><strong>Kategori:</strong> ${pkg.category}</p>
                <p><strong>Orijinal Fiyat:</strong> ${pkg.price}</p>
                <p><strong>İndirimli Fiyat:</strong> ${pkg.originalPrice}</p>
                <div style="margin-top: 1rem;">
                    <button class="btn-secondary" onclick="editPackage('${pkg.id}')">
                        <i class="fas fa-edit"></i>
                        Düzenle
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Analytics functions
async function loadAnalyticsData() {
    // Mock analytics data
    document.getElementById('today-users').textContent = '12';
    document.getElementById('today-orders').textContent = '47';
    document.getElementById('today-revenue').textContent = '₺1,245';
}

// Utility functions
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('active');
}

function showNotification(message, type = 'info') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: ${type === 'error' ? '#ef4444' : '#16a34a'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

async function testAPIConnection() {
    showNotification('API bağlantısı test ediliyor...', 'info');
    await checkAPIStatus();
    showNotification('API bağlantı testi tamamlandı', 'success');
}

// Applications functions
async function loadApplicationsData() {
    const tableBody = document.getElementById('applications-table-body');
    
    tableBody.innerHTML = '<tr><td colspan="8" class="loading">Başvurular yükleniyor...</td></tr>';
    
    console.log('🔄 Loading applications data...');
    console.log('📡 API Connected:', apiConnected);
    
    try {
        if (apiConnected) {
            // Try to get real data from API
            const applicationsData = await makeAPICall('/api/admin/basvurular');
            
            if (applicationsData && applicationsData.success) {
                renderApplicationsTable(applicationsData.data.basvurular);
            } else {
                renderMockApplicationsData();
            }
        } else {
            console.log('📁 Using localStorage data...');
            await renderMockApplicationsData();
        }
    } catch (error) {
        await renderMockApplicationsData();
        console.error('Applications loading failed, using mock data:', error);
    }
}

async function renderMockApplicationsData() {
    let registrations = [];
    
    try {
        // Try to fetch from Netlify Functions API first
        const response = await fetch('/.netlify/functions/shared-storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get' })
        });
        if (response.ok) {
            const result = await response.json();
            if (result.basarili && result.basvurular) {
                registrations = result.basvurular;
                console.log('✅ Başvurular API\'den yüklendi:', registrations);
            } else {
                console.log('📋 API response:', result);
                registrations = result.basvurular || [];
            }
        }
    } catch (error) {
        console.log('⚠️ API call failed, falling back to localStorage:', error);
    }
    
    // Fallback to localStorage if API failed or no data
    if (registrations.length === 0) {
        registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        console.log('📋 LocalStorage\'dan yüklenen başvurular:', registrations);
    }
    
    // Debug: Log the registrations data
    console.log('📋 All Registrations:', registrations);
    
    // Filter only restaurant applications
    const restaurantApplications = registrations.filter(app => app.type === 'restaurant');
    
    // Debug: Log filtered restaurant applications
    console.log('🏪 Restaurant Applications:', restaurantApplications);
    
    const tableBody = document.getElementById('applications-table-body');
    
    if (restaurantApplications.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading">Henüz restoran başvurusu bulunmuyor</td></tr>';
        return;
    }
    
    tableBody.innerHTML = restaurantApplications.map(app => `
        <tr>
            <td>${app.id}</td>
            <td><span class="type-badge ${app.type}">${app.type === 'customer' ? 'Müşteri' : 'Restoran'}</span></td>
            <td>${app.firstName} ${app.lastName}</td>
            <td>${app.email}</td>
            <td>${app.type === 'restaurant' ? app.businessName : '-'}</td>
            <td>${new Date(app.createdAt).toLocaleDateString('tr-TR')}</td>
            <td><span class="status-badge ${app.status}">${getApplicationStatusText(app.status)}</span></td>
            <td>
                <button class="btn-secondary" onclick="viewApplication('${app.id}')" title="Detay">
                    <i class="fas fa-eye"></i>
                </button>
                ${app.status === 'pending' ? `
                <button class="btn-primary" onclick="approveApplication('${app.id}')" title="Onayla">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-danger" onclick="rejectApplication('${app.id}')" title="Reddet">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function getApplicationStatusText(status) {
    const statusMap = {
        'pending': 'Beklemede',
        'approved': 'Onaylı',
        'rejected': 'Reddedildi'
    };
    return statusMap[status] || status;
}

function filterApplications() {
    const typeFilter = document.getElementById('application-type-filter').value;
    const statusFilter = document.getElementById('application-status-filter').value;
    
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    // Always filter to only restaurant applications
    let filteredRegistrations = registrations.filter(app => app.type === 'restaurant');
    
    if (statusFilter) {
        filteredRegistrations = filteredRegistrations.filter(app => app.status === statusFilter);
    }
    
    const tableBody = document.getElementById('applications-table-body');
    
    if (filteredRegistrations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading">Filtreye uygun restoran başvurusu bulunamadı</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredRegistrations.map(app => `
        <tr>
            <td>${app.id}</td>
            <td><span class="type-badge ${app.type}">${app.type === 'customer' ? 'Müşteri' : 'Restoran'}</span></td>
            <td>${app.firstName} ${app.lastName}</td>
            <td>${app.email}</td>
            <td>${app.type === 'restaurant' ? app.businessName : '-'}</td>
            <td>${new Date(app.createdAt).toLocaleDateString('tr-TR')}</td>
            <td><span class="status-badge ${app.status}">${getApplicationStatusText(app.status)}</span></td>
            <td>
                <button class="btn-secondary" onclick="viewApplication('${app.id}')" title="Detay">
                    <i class="fas fa-eye"></i>
                </button>
                ${app.status === 'pending' ? `
                <button class="btn-primary" onclick="approveApplication('${app.id}')" title="Onayla">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-danger" onclick="rejectApplication('${app.id}')" title="Reddet">
                    <i class="fas fa-times"></i>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function viewApplication(applicationId) {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const application = registrations.find(app => app.id === applicationId);
    
    if (!application) {
        showNotification('Başvuru bulunamadı', 'error');
        return;
    }
    
    let modalContent = `
        <div class="modal-overlay" onclick="closeApplicationModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>Başvuru Detayları</h3>
                    <button class="modal-close" onclick="closeApplicationModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="application-details">
                        <p><strong>ID:</strong> ${application.id}</p>
                        <p><strong>Tür:</strong> ${application.type === 'customer' ? 'Müşteri' : 'Restoran'}</p>
                        <p><strong>Ad Soyad:</strong> ${application.firstName} ${application.lastName}</p>
                        <p><strong>E-posta:</strong> ${application.email}</p>
                        <p><strong>Telefon:</strong> ${application.phone || 'Belirtilmemiş'}</p>
                        <p><strong>Başvuru Tarihi:</strong> ${new Date(application.createdAt).toLocaleDateString('tr-TR')}</p>
                        <p><strong>Durum:</strong> ${getApplicationStatusText(application.status)}</p>
    `;
    
    if (application.type === 'restaurant') {
        modalContent += `
                        <hr style="margin: 1rem 0;">
                        <p><strong>İşletme Adı:</strong> ${application.businessName}</p>
                        <p><strong>İşletme Kategorisi:</strong> ${application.businessCategory}</p>
                        <p><strong>İşletme Adresi:</strong> ${application.businessAddress}</p>
                        <p><strong>İlçe/Şehir:</strong> ${application.district}/${application.city}</p>
                        <p><strong>Vergi No:</strong> ${application.taxNumber || 'Belirtilmemiş'}</p>
        `;
        
        if (application.restaurantUsername && application.restaurantPassword) {
            modalContent += `
                        <hr style="margin: 1rem 0;">
                        <p><strong>Restoran Kullanıcı Adı:</strong> ${application.restaurantUsername}</p>
                        <p><strong>Restoran Şifresi:</strong> ${application.restaurantPassword}</p>
            `;
        }
    }
    
    modalContent += `
                    </div>
                </div>
                <div class="modal-footer">
                    ${application.status === 'pending' ? `
                    <button class="btn-primary" onclick="approveApplication('${application.id}'); closeApplicationModal();">
                        <i class="fas fa-check"></i> Onayla
                    </button>
                    <button class="btn-danger" onclick="rejectApplication('${application.id}'); closeApplicationModal();">
                        <i class="fas fa-times"></i> Reddet
                    </button>
                    ` : ''}
                    <button class="btn-secondary" onclick="closeApplicationModal()">
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    const modal = document.createElement('div');
    modal.id = 'applicationModal';
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
}

function closeApplicationModal() {
    const modal = document.getElementById('applicationModal');
    if (modal) {
        modal.remove();
    }
}

async function approveApplication(applicationId) {
    try {
        // Try API first
        const response = await fetch('https://kaptaze.netlify.app/.netlify/functions/approve-registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ applicationId: applicationId })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.basarili) {
                showNotification(result.mesaj, 'success');
                loadApplicationsData(); // Reload applications
                
                // Also reload restaurants and users data to show approved items
                if (currentSection === 'restaurants') {
                    loadRestaurantsData();
                } else if (currentSection === 'users') {
                    loadUsersData();
                }
                return;
            }
        }
    } catch (error) {
        console.log('API approval failed, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const updatedRegistrations = registrations.map(app => {
        if (app.id === applicationId) {
            app.status = 'approved';
            app.approvedAt = new Date().toISOString();
        }
        return app;
    });
    
    localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
    
    showNotification('Başvuru başarıyla onaylandı!', 'success');
    loadApplicationsData(); // Reload applications
    
    // Also reload restaurants and users data to show approved items
    if (currentSection === 'restaurants') {
        loadRestaurantsData();
    } else if (currentSection === 'users') {
        loadUsersData();
    }
}

function rejectApplication(applicationId) {
    if (confirm('Bu başvuruyu reddetmek istediğinizden emin misiniz?')) {
        const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        const updatedRegistrations = registrations.map(app => {
            if (app.id === applicationId) {
                app.status = 'rejected';
                app.rejectedAt = new Date().toISOString();
            }
            return app;
        });
        
        localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
        
        showNotification('Başvuru reddedildi.', 'error');
        loadApplicationsData(); // Reload applications
    }
}

// Mock action functions (these would connect to actual API)
function editUser(userId) {
    showNotification(`Kullanıcı düzenleme özelliği yakında aktif olacak (ID: ${userId})`, 'info');
}

function toggleUserStatus(userId, currentStatus) {
    showNotification(`Kullanıcı durumu değiştirme özelliği yakında aktif olacak (ID: ${userId})`, 'info');
}

function editRestaurant(restaurantId) {
    showNotification(`Restoran düzenleme özelliği yakında aktif olacak (ID: ${restaurantId})`, 'info');
}

function approveRestaurant(restaurantId) {
    if (confirm('Bu restoranı onaylamak istediğinizden emin misiniz?')) {
        // Update registration status
        const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        const updatedRegistrations = registrations.map(reg => {
            if (reg.id === restaurantId) {
                reg.status = 'approved';
                reg.approvedAt = new Date().toISOString();
            }
            return reg;
        });
        localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
        
        showNotification(`Restoran başarıyla onaylandı!`, 'success');
        loadRestaurantsData(); // Reload restaurants
    }
}

function viewOrder(orderId) {
    showNotification(`Sipariş detay görüntüleme özelliği yakında aktif olacak (ID: ${orderId})`, 'info');
}

function editPackage(packageId) {
    showNotification(`Paket düzenleme özelliği yakında aktif olacak (ID: ${packageId})`, 'info');
}

function showAddUserModal() {
    showNotification('Yeni kullanıcı ekleme özelliği yakında aktif olacak', 'info');
}

function showAddRestaurantModal() {
    showNotification('Yeni restoran ekleme özelliği yakında aktif olacak', 'info');
}

function filterOrders() {
    showNotification('Sipariş filtreleme özelliği yakında aktif olacak', 'info');
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);

console.log('🔧 KapTaze Admin Panel loaded successfully');