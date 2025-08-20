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
    switch (sectionId) {
        case 'dashboard':
            loadDashboardData();
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
        const response = await fetch(API_BASE_URL + API_ENDPOINTS.health, {
            method: 'GET'
        });
        
        if (response.ok) {
            const data = await response.json();
            apiConnected = true;
            
            // Update UI elements
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
            statusTextElement.textContent = 'Mock Data';
        }
        
        console.warn('⚠️ API Status: Using Mock Data -', error.message);
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
    const mockUsers = [
        { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', phone: '0532 XXX XX XX', date: '2024-01-15', status: 'active' },
        { id: '2', name: 'Fatma Kaya', email: 'fatma@example.com', phone: '0542 XXX XX XX', date: '2024-01-20', status: 'active' },
        { id: '3', name: 'Mehmet Demir', email: 'mehmet@example.com', phone: '0555 XXX XX XX', date: '2024-01-25', status: 'inactive' }
    ];
    
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = mockUsers.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${user.date}</td>
            <td><span class="status-badge ${user.status}">${user.status === 'active' ? 'Aktif' : 'Pasif'}</span></td>
            <td>
                <button class="btn-secondary" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-secondary" onclick="toggleUserStatus('${user.id}', '${user.status}')">
                    <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
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
    const mockRestaurants = [
        { id: '1', name: 'Seraser Restaurant', email: 'info@seraser.com', address: 'Kaleiçi, Antalya', approved: 'active', packages: 12 },
        { id: '2', name: 'Lara Balık Evi', email: 'info@larabalik.com', address: 'Lara, Antalya', approved: 'pending', packages: 8 },
        { id: '3', name: 'Köşe Kebap', email: 'info@kosekebap.com', address: 'Konyaaltı, Antalya', approved: 'active', packages: 15 }
    ];
    
    const tableBody = document.getElementById('restaurants-table-body');
    tableBody.innerHTML = mockRestaurants.map(restaurant => `
        <tr>
            <td>${restaurant.id}</td>
            <td>${restaurant.name}</td>
            <td>${restaurant.email}</td>
            <td>${restaurant.address}</td>
            <td><span class="status-badge ${restaurant.approved}">${restaurant.approved === 'active' ? 'Onaylı' : 'Beklemede'}</span></td>
            <td>${restaurant.packages}</td>
            <td>
                <button class="btn-secondary" onclick="editRestaurant('${restaurant.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-primary" onclick="approveRestaurant('${restaurant.id}')">
                    <i class="fas fa-check"></i>
                </button>
            </td>
        </tr>
    `).join('');
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
    showNotification(`Restoran onaylama özelliği yakında aktif olacak (ID: ${restaurantId})`, 'info');
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