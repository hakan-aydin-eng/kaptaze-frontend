// KapTaze Restaurant Panel JavaScript

// API Configuration
const API_BASE_URL = 'https://kaptaze-api.onrender.com';
const API_ENDPOINTS = {
    health: '/health',
    stats: '/api/restoran/istatistikler',
    packages: '/api/restoran/paketler', 
    orders: '/api/restoran/siparisler',
    customers: '/api/restoran/musteriler'
};

// Mock data for development
const MOCK_DATA = {
    stats: {
        totalPackages: 45,
        activePackages: 12,
        totalOrders: 187,
        todayRevenue: 2850
    },
    packages: [
        {
            id: 1,
            name: 'Karma Öğlen Menüsü',
            description: 'Ana yemek + garnitür + salata',
            originalPrice: 45,
            discountPrice: 25,
            quantity: 8,
            expiryTime: '18:00',
            status: 'active',
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 2,
            name: 'Günün Çorbası + Ekmek',
            description: 'Taze günlük çorba seçenekleri',
            originalPrice: 20,
            discountPrice: 12,
            quantity: 15,
            expiryTime: '17:30',
            status: 'active',
            image: 'https://via.placeholder.com/300x200'
        }
    ],
    orders: [
        {
            id: 'ORD001',
            customerName: 'Ahmet Yılmaz',
            packageName: 'Karma Öğlen Menüsü',
            amount: 25,
            status: 'beklemede',
            orderTime: '14:30',
            phone: '+90 532 123 4567'
        },
        {
            id: 'ORD002',
            customerName: 'Elif Kaya',
            packageName: 'Günün Çorbası + Ekmek',
            amount: 12,
            status: 'hazirlaniyor',
            orderTime: '14:15',
            phone: '+90 533 987 6543'
        }
    ],
    customers: [
        {
            id: 1,
            name: 'Ahmet Yılmaz',
            email: 'ahmet@example.com',
            phone: '+90 532 123 4567',
            totalOrders: 12,
            totalSpent: 340,
            lastOrder: '2024-08-20'
        },
        {
            id: 2,
            name: 'Elif Kaya',
            email: 'elif@example.com',
            phone: '+90 533 987 6543',
            totalOrders: 8,
            totalSpent: 230,
            lastOrder: '2024-08-19'
        }
    ]
};

// Global variables
let currentSection = 'dashboard';
let apiConnected = false;

// Initialize app when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    checkAPIConnection();
    loadDashboardStats();
    setupEventListeners();
    
    // Auto-refresh data every 30 seconds
    setInterval(() => {
        if (currentSection === 'dashboard') {
            loadDashboardStats();
        }
    }, 30000);
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
}

// API Connection Management
async function checkAPIConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        apiConnected = response.ok;
    } catch (error) {
        apiConnected = false;
    }
    
    updateAPIStatus();
}

function updateAPIStatus() {
    const statusElement = document.getElementById('api-status');
    const indicatorElement = document.getElementById('api-indicator');
    const statusTextElement = document.getElementById('api-status-text');
    
    if (apiConnected) {
        statusElement?.classList.remove('error');
        indicatorElement?.classList.add('active');
        if (statusTextElement) statusTextElement.textContent = 'Bağlı';
    } else {
        statusElement?.classList.add('error');
        indicatorElement?.classList.remove('active');
        if (statusTextElement) statusTextElement.textContent = 'Bağlantı Hatası';
    }
}

// Navigation Functions
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar?.classList.toggle('active');
}

function showSection(sectionId) {
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const activeNav = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    activeNav?.classList.add('active');
    
    // Update content sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    targetSection?.classList.add('active');
    
    currentSection = sectionId;
    
    // Load section-specific data
    switch(sectionId) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'packages':
            loadPackages();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'analytics':
            loadAnalytics();
            break;
    }
}

// Dashboard Functions
async function loadDashboardStats() {
    try {
        let stats;
        
        if (apiConnected) {
            const response = await fetch(`${API_BASE_URL}/restaurant/stats`);
            stats = response.ok ? await response.json() : MOCK_DATA.stats;
        } else {
            stats = MOCK_DATA.stats;
        }
        
        // Update stat cards
        updateElement('total-packages', stats.totalPackages);
        updateElement('active-packages', stats.activePackages);
        updateElement('total-orders', stats.totalOrders);
        updateElement('today-revenue', `₺${stats.todayRevenue}`);
        
    } catch (error) {
        console.error('Dashboard stats yüklenemedi:', error);
        // Fallback to mock data
        const stats = MOCK_DATA.stats;
        updateElement('total-packages', stats.totalPackages);
        updateElement('active-packages', stats.activePackages);
        updateElement('total-orders', stats.totalOrders);
        updateElement('today-revenue', `₺${stats.todayRevenue}`);
    }
}

// Package Management
async function loadPackages() {
    try {
        let packages;
        
        if (apiConnected) {
            const response = await fetch(`${API_BASE_URL}/restaurant/packages`);
            packages = response.ok ? await response.json() : MOCK_DATA.packages;
        } else {
            packages = MOCK_DATA.packages;
        }
        
        renderPackages(packages);
        
    } catch (error) {
        console.error('Paketler yüklenemedi:', error);
        renderPackages(MOCK_DATA.packages);
    }
}

function renderPackages(packages) {
    const container = document.getElementById('packages-grid');
    if (!container) return;
    
    container.innerHTML = packages.map(pkg => `
        <div class="package-card">
            <div class="package-image">
                <img src="${pkg.image}" alt="${pkg.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Paket+Görseli'">
                <div class="package-status ${pkg.status}">${getStatusText(pkg.status)}</div>
            </div>
            <div class="package-content">
                <h3 class="package-name">${pkg.name}</h3>
                <p class="package-description">${pkg.description}</p>
                <div class="package-pricing">
                    <span class="original-price">₺${pkg.originalPrice}</span>
                    <span class="discount-price">₺${pkg.discountPrice}</span>
                </div>
                <div class="package-details">
                    <div class="detail-item">
                        <i class="fas fa-box"></i>
                        <span>${pkg.quantity} adet</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${pkg.expiryTime}'e kadar</span>
                    </div>
                </div>
                <div class="package-actions">
                    <button class="btn-secondary" onclick="editPackage(${pkg.id})">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn-primary" onclick="togglePackageStatus(${pkg.id})">
                        <i class="fas fa-power-off"></i>
                        ${pkg.status === 'active' ? 'Devre Dışı' : 'Aktif Et'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Order Management
async function loadOrders() {
    try {
        let orders;
        
        if (apiConnected) {
            const response = await fetch(`${API_BASE_URL}/restaurant/orders`);
            orders = response.ok ? await response.json() : MOCK_DATA.orders;
        } else {
            orders = MOCK_DATA.orders;
        }
        
        renderOrdersTable(orders);
        
    } catch (error) {
        console.error('Siparişler yüklenemedi:', error);
        renderOrdersTable(MOCK_DATA.orders);
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">Henüz sipariş bulunmamaktadır.</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>${order.id}</strong></td>
            <td>${order.customerName}</td>
            <td>${order.packageName}</td>
            <td>₺${order.amount}</td>
            <td><span class="status-badge ${order.status}">${getStatusText(order.status)}</span></td>
            <td>${order.orderTime}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-sm btn-primary" onclick="updateOrderStatus('${order.id}', 'onaylandi')" title="Onayla">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-sm btn-secondary" onclick="viewOrderDetails('${order.id}')" title="Detaylar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-sm btn-secondary" onclick="callCustomer('${order.phone}')" title="Ara">
                        <i class="fas fa-phone"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Customer Management
async function loadCustomers() {
    try {
        let customers;
        
        if (apiConnected) {
            const response = await fetch(`${API_BASE_URL}/restaurant/customers`);
            customers = response.ok ? await response.json() : MOCK_DATA.customers;
        } else {
            customers = MOCK_DATA.customers;
        }
        
        renderCustomersTable(customers);
        
    } catch (error) {
        console.error('Müşteriler yüklenemedi:', error);
        renderCustomersTable(MOCK_DATA.customers);
    }
}

function renderCustomersTable(customers) {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;
    
    if (customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Henüz müşteri bulunmamaktadır.</td></tr>';
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td><strong>${customer.id}</strong></td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.totalOrders}</td>
            <td>₺${customer.totalSpent}</td>
        </tr>
    `).join('');
}

// Analytics
function loadAnalytics() {
    // Update today's stats
    updateElement('today-packages', MOCK_DATA.stats.activePackages);
    updateElement('today-orders-analytics', '8');
    updateElement('today-revenue-analytics', `₺${MOCK_DATA.stats.todayRevenue}`);
}

// Utility Functions
function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function getStatusText(status) {
    const statusMap = {
        'active': 'Aktif',
        'inactive': 'Pasif',
        'beklemede': 'Beklemede',
        'onaylandi': 'Onaylandı',
        'hazirlaniyor': 'Hazırlanıyor',
        'hazir': 'Hazır',
        'teslim_edildi': 'Teslim Edildi',
        'iptal_edildi': 'İptal'
    };
    return statusMap[status] || status;
}

// Package Management Functions
function showAddPackageModal() {
    // Modal implementation would go here
    alert('Yeni paket ekleme modalı açılacak (geliştirme aşamasında)');
}

function editPackage(packageId) {
    alert(`Paket ID ${packageId} düzenleme modalı açılacak (geliştirme aşamasında)`);
}

function togglePackageStatus(packageId) {
    // This would make an API call to toggle package status
    alert(`Paket ID ${packageId} durumu değiştirildi`);
    loadPackages(); // Reload packages
}

// Order Management Functions
function updateOrderStatus(orderId, newStatus) {
    // This would make an API call to update order status
    alert(`Sipariş ${orderId} durumu ${getStatusText(newStatus)} olarak güncellendi`);
    loadOrders(); // Reload orders
}

function viewOrderDetails(orderId) {
    alert(`Sipariş ${orderId} detayları gösterilecek (geliştirme aşamasında)`);
}

function callCustomer(phoneNumber) {
    if (phoneNumber) {
        window.open(`tel:${phoneNumber}`, '_self');
    }
}

function filterOrders() {
    const status = document.getElementById('order-status-filter')?.value;
    // Implementation for filtering orders would go here
    console.log('Sipariş filtreleme:', status);
}

// Settings Functions
function updateProfile() {
    alert('Profil güncelleme özelliği geliştirme aşamasında');
}

function testAPIConnection() {
    checkAPIConnection().then(() => {
        const message = apiConnected ? 
            'API bağlantısı başarılı!' : 
            'API bağlantısında sorun var. Lütfen sistem yöneticisine başvurun.';
        alert(message);
    });
}

// Payment Functions
function viewPaymentHistory() {
    alert('Ödeme geçmişi görüntüleme özelliği geliştirme aşamasında');
}

function updatePaymentSettings() {
    alert('Ödeme ayarları güncelleme özelliği geliştirme aşamasında');
}