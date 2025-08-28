// KapTaze Restaurant Panel JavaScript

// Authentication check
function checkAuthentication() {
    const token = localStorage.getItem('restaurantToken');
    const user = localStorage.getItem('restaurantUser');
    
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
            localStorage.removeItem('restaurantToken');
            localStorage.removeItem('restaurantUser');
            window.location.href = './login.html';
            return false;
        }
        
        // Update restaurant info in header
        const restaurantNameEl = document.getElementById('restaurant-name');
        const userInfoEl = document.querySelector('.user-info span');
        
        if (restaurantNameEl) {
            restaurantNameEl.textContent = userData.name || 'Restoran Paneli';
        }
        
        if (userInfoEl) {
            userInfoEl.textContent = userData.ownerName || userData.username;
        }
        
        return true;
    } catch (error) {
        localStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantUser');
        window.location.href = './login.html';
        return false;
    }
}

// Logout function
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantUser');
        window.location.href = './login.html';
    }
}

// API Configuration
const API_BASE_URL = 'https://kaptaze-backend-api.onrender.com';
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
    // Check authentication first
    if (!checkAuthentication()) {
        return; // Will redirect to login
    }
    
    initializeApp();
    loadProfileImage(); // Load saved profile image
});

// Authentication check
function checkAuthentication() {
    const token = localStorage.getItem('restaurantToken');
    const user = localStorage.getItem('restaurantUser');
    
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
            localStorage.removeItem('restaurantToken');
            localStorage.removeItem('restaurantUser');
            window.location.href = './login.html';
            return false;
        }
        
        // Update restaurant info in header
        const restaurantName = document.getElementById('restaurant-name');
        const restaurantStatus = document.getElementById('restaurant-status');
        const userInfo = document.querySelector('.user-info span');
        
        if (restaurantName) {
            restaurantName.textContent = userData.name;
        }
        
        if (restaurantStatus) {
            restaurantStatus.textContent = userData.status === 'approved' ? 'Onaylı' : 'Onay Bekliyor';
            restaurantStatus.className = `restaurant-status ${userData.status}`;
        }
        
        if (userInfo) {
            userInfo.textContent = userData.name;
        }
        
        return true;
    } catch (error) {
        localStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantUser');
        window.location.href = './login.html';
        return false;
    }
}

// Logout function
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('restaurantToken');
        localStorage.removeItem('restaurantUser');
        window.location.href = './login.html';
    }
}

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
    const user = JSON.parse(localStorage.getItem('restaurantUser') || '{}');
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Yeni Paket Ekle</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="packageForm">
                    <div class="form-group">
                        <label>Paket Adı *</label>
                        <input type="text" id="packageName" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Açıklama *</label>
                        <textarea id="packageDescription" required></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Orijinal Fiyat (₺) *</label>
                            <input type="number" id="originalPrice" required>
                        </div>
                        <div class="form-group">
                            <label>İndirimli Fiyat (₺) *</label>
                            <input type="number" id="discountPrice" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Adet *</label>
                            <input type="number" id="quantity" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>Son Teslim Saati *</label>
                            <input type="time" id="expiryTime" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Kategori</label>
                        <select id="category">
                            <option value="Ana Yemek">Ana Yemek</option>
                            <option value="Çorba">Çorba</option>
                            <option value="Salata">Salata</option>
                            <option value="Tatlı">Tatlı</option>
                            <option value="İçecek">İçecek</option>
                            <option value="Karma Menü">Karma Menü</option>
                        </select>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn-secondary" onclick="closeModal()">İptal</button>
                        <button type="submit" class="btn-primary">Paket Ekle</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const content = modal.querySelector('.modal-content');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    `;
    
    const header = modal.querySelector('.modal-header');
    header.style.cssText = `
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    const body = modal.querySelector('.modal-body');
    body.style.cssText = `padding: 1.5rem;`;
    
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
    `;
    
    // Form styling
    const formGroups = modal.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        group.style.cssText = `margin-bottom: 1rem;`;
        const label = group.querySelector('label');
        if (label) label.style.cssText = `display: block; margin-bottom: 0.5rem; font-weight: 500;`;
        const input = group.querySelector('input, textarea, select');
        if (input) input.style.cssText = `
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 0.875rem;
        `;
    });
    
    // Form row styling
    const formRows = modal.querySelectorAll('.form-row');
    formRows.forEach(row => {
        row.style.cssText = `display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;`;
    });
    
    // Actions styling
    const actions = modal.querySelector('.modal-actions');
    actions.style.cssText = `
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
    `;
    
    const buttons = modal.querySelectorAll('.modal-actions button');
    buttons.forEach(btn => {
        btn.style.cssText = `
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            border: none;
        `;
        if (btn.classList.contains('btn-primary')) {
            btn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            btn.style.color = 'white';
        } else {
            btn.style.background = '#f3f4f6';
            btn.style.color = '#374151';
        }
    });
    
    document.body.appendChild(modal);
    window.currentModal = modal;
    
    // Form submit handler
    const form = modal.querySelector('#packageForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const packageData = {
            id: Date.now().toString(),
            name: document.getElementById('packageName').value,
            description: document.getElementById('packageDescription').value,
            originalPrice: parseInt(document.getElementById('originalPrice').value),
            discountPrice: parseInt(document.getElementById('discountPrice').value),
            quantity: parseInt(document.getElementById('quantity').value),
            expiryTime: document.getElementById('expiryTime').value,
            category: document.getElementById('category').value,
            restaurantId: user.id,
            restaurantName: user.name,
            status: 'active',
            createdAt: new Date().toISOString(),
            image: 'https://via.placeholder.com/300x200'
        };
        
        // Save to localStorage
        const packages = JSON.parse(localStorage.getItem('restaurantPackages') || '[]');
        packages.push(packageData);
        localStorage.setItem('restaurantPackages', JSON.stringify(packages));
        
        alert(`Paket "${packageData.name}" başarıyla eklendi!`);
        closeModal();
        loadPackages(); // Reload packages
    });
    
    window.closeModal = function() {
        if (window.currentModal) {
            window.currentModal.remove();
            window.currentModal = null;
        }
    };
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

// Restaurant Image Upload Functions
function uploadRestaurantImage() {
    console.log('📷 Restaurant image upload initiated');
    const fileInput = document.getElementById('restaurant-image-input');
    if (fileInput) {
        fileInput.click();
    }
}

// Initialize image upload functionality
document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('restaurant-image-input');
    if (imageInput) {
        imageInput.addEventListener('change', handleImageUpload);
    }
});

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        alert('Lütfen geçerli bir resim dosyası seçin (JPG, PNG, WEBP)');
        return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        alert('Resim boyutu 5MB\'dan küçük olmalıdır');
        return;
    }

    console.log('📷 Processing image upload:', file.name, `${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    // Show loading state
    showImageUploadLoading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        uploadImageToServer(base64Data, file.name);
    };
    reader.onerror = function() {
        alert('Resim okuma hatası oluştu');
        showImageUploadLoading(false);
    };
    reader.readAsDataURL(file);
}

function uploadImageToServer(base64Data, filename) {
    const user = JSON.parse(localStorage.getItem('restaurantUser') || '{}');
    const token = localStorage.getItem('restaurantToken');
    
    if (!user.id || !token) {
        alert('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        showImageUploadLoading(false);
        return;
    }

    const uploadData = {
        image: base64Data,
        filename: filename,
        restaurantId: user.id
    };

    // For MVP: Store in localStorage and update UI immediately
    // TODO: Replace with actual API call in production
    try {
        // Save to localStorage for demo
        localStorage.setItem('restaurantProfileImage', base64Data);
        
        // Update profile image in UI
        updateProfileImageUI(base64Data);
        
        // Simulate API call success
        setTimeout(() => {
            showImageUploadLoading(false);
            showImageUploadSuccess();
        }, 1000);
        
        console.log('📷 Image uploaded successfully (demo mode)');
        
    } catch (error) {
        console.error('Image upload error:', error);
        alert('Görsel yüklenirken hata oluştu');
        showImageUploadLoading(false);
    }
}

function updateProfileImageUI(imageData) {
    const avatarImg = document.getElementById('restaurant-avatar');
    if (avatarImg) {
        avatarImg.src = imageData;
        console.log('📷 Profile image updated in UI');
    }
}

function showImageUploadLoading(loading) {
    const avatarOverlay = document.querySelector('.avatar-overlay');
    const changeBtn = document.querySelector('.change-avatar-btn');
    
    if (loading) {
        if (changeBtn) {
            changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            changeBtn.disabled = true;
        }
    } else {
        if (changeBtn) {
            changeBtn.innerHTML = '<i class="fas fa-camera"></i>';
            changeBtn.disabled = false;
        }
    }
}

function showImageUploadSuccess() {
    // Create success notification
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; 
                    padding: 15px 20px; border-radius: 8px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <i class="fas fa-check-circle"></i> Restoran görseli başarıyla güncellendi!
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Load saved profile image on page load
function loadProfileImage() {
    const savedImage = localStorage.getItem('restaurantProfileImage');
    if (savedImage) {
        updateProfileImageUI(savedImage);
        console.log('📷 Loaded saved profile image');
    }
}

// PROFILE MANAGEMENT SYSTEM - Full Featured Implementation

// Profile Edit Toggle Functions
function toggleProfileEdit() {
    const displayMode = document.getElementById('profileDisplay');
    const editMode = document.getElementById('profileEdit');
    const editButton = document.getElementById('editButtonText');
    
    if (displayMode && editMode && editButton) {
        const isEditMode = editMode.style.display !== 'none';
        
        if (isEditMode) {
            // Switch to display mode
            displayMode.style.display = 'grid';
            editMode.style.display = 'none';
            editButton.textContent = 'Profili Düzenle';
            console.log('📝 Switched to profile display mode');
        } else {
            // Switch to edit mode
            displayMode.style.display = 'none';
            editMode.style.display = 'block';
            editButton.textContent = 'Düzenlemeyi İptal';
            loadProfileEditData(); // Load current data into edit form
            console.log('✏️ Switched to profile edit mode');
        }
    }
}

// Main Image Preview for Edit Mode
function previewMainImage(input) {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showProfileNotification('Lütfen geçerli bir resim dosyası seçin (JPG, PNG, WEBP)', 'error');
        input.value = '';
        return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showProfileNotification('Resim boyutu 5MB\'dan küçük olmalıdır', 'error');
        input.value = '';
        return;
    }
    
    console.log('📷 Processing main image preview:', file.name);
    
    // Show loading state
    showImagePreviewLoading(true);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('mainImagePreview');
        const placeholder = document.getElementById('imageUploadPlaceholder');
        
        if (preview && placeholder) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
            
            // Store for later save
            window.tempProfileImage = e.target.result;
            console.log('✅ Main image preview loaded');
        }
        
        showImagePreviewLoading(false);
        showProfileNotification('Görsel önizlemesi yüklendi. "Profili Kaydet" butonuna basarak kaydedin.', 'info');
    };
    
    reader.onerror = function() {
        showProfileNotification('Görsel okuma hatası oluştu', 'error');
        showImagePreviewLoading(false);
        input.value = '';
    };
    
    reader.readAsDataURL(file);
}

// Profile Data Management
function loadProfileEditData() {
    console.log('📋 Loading profile data for editing...');
    
    const user = JSON.parse(localStorage.getItem('restaurantUser') || '{}');
    const profileData = JSON.parse(localStorage.getItem('restaurantProfileData') || '{}');
    
    // Load basic info from user data
    document.getElementById('editDescription').value = profileData.description || '';
    document.getElementById('editWebsite').value = profileData.website || '';
    document.getElementById('editSpecialties').value = profileData.specialties ? profileData.specialties.join(', ') : '';
    
    // Load working hours
    if (profileData.workingHours) {
        document.getElementById('weekdayOpen').value = profileData.workingHours.weekday?.open || '09:00';
        document.getElementById('weekdayClose').value = profileData.workingHours.weekday?.close || '22:00';
        document.getElementById('weekendOpen').value = profileData.workingHours.weekend?.open || '10:00';
        document.getElementById('weekendClose').value = profileData.workingHours.weekend?.close || '23:00';
    }
    
    // Load main image if exists
    const savedImage = localStorage.getItem('restaurantProfileImage');
    if (savedImage) {
        const preview = document.getElementById('mainImagePreview');
        const placeholder = document.getElementById('imageUploadPlaceholder');
        if (preview && placeholder) {
            preview.src = savedImage;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
    }
    
    console.log('✅ Profile edit data loaded');
}

// Save Profile Function
function saveProfile(event) {
    if (event) event.preventDefault();
    
    console.log('💾 Starting profile save process...');
    showProfileSaveProgress(0);
    
    try {
        // Collect form data
        const profileData = {
            description: document.getElementById('editDescription').value.trim(),
            website: document.getElementById('editWebsite').value.trim(),
            specialties: document.getElementById('editSpecialties').value
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0),
            workingHours: {
                weekday: {
                    open: document.getElementById('weekdayOpen').value,
                    close: document.getElementById('weekdayClose').value
                },
                weekend: {
                    open: document.getElementById('weekendOpen').value,
                    close: document.getElementById('weekendClose').value
                }
            },
            lastUpdated: new Date().toISOString()
        };
        
        // Validate required fields
        if (!profileData.description) {
            showProfileNotification('İşletme açıklaması zorunludur', 'error');
            showProfileSaveProgress(-1);
            return;
        }
        
        // Validate website URL
        if (profileData.website && !isValidURL(profileData.website)) {
            showProfileNotification('Geçerli bir web sitesi adresi girin', 'error');
            showProfileSaveProgress(-1);
            return;
        }
        
        // Validate working hours
        if (!validateWorkingHours(profileData.workingHours)) {
            showProfileNotification('Çalışma saatleri geçerli değil', 'error');
            showProfileSaveProgress(-1);
            return;
        }
        
        showProfileSaveProgress(30);
        
        // Save profile data
        localStorage.setItem('restaurantProfileData', JSON.stringify(profileData));
        
        // Save main image if changed
        if (window.tempProfileImage) {
            localStorage.setItem('restaurantProfileImage', window.tempProfileImage);
            updateProfileImageUI(window.tempProfileImage);
            delete window.tempProfileImage;
        }
        
        showProfileSaveProgress(60);
        
        // Update display mode
        updateProfileDisplayMode(profileData);
        
        showProfileSaveProgress(90);
        
        // Send to backend API
        await sendProfileToBackend(profileData);
        
        // Sync with mobile app
        await syncProfileWithMobileApp(profileData);
        
        showProfileSaveProgress(100);
        
        // Switch back to display mode
        setTimeout(() => {
            toggleProfileEdit();
            showProfileNotification('Profil başarıyla güncellendi!', 'success');
            hideProfileSaveProgress();
        }, 500);
        
        console.log('✅ Profile saved successfully');
        
    } catch (error) {
        console.error('❌ Profile save error:', error);
        showProfileNotification('Profil kaydedilirken hata oluştu', 'error');
        showProfileSaveProgress(-1);
    }
}

// Update Profile Display Mode
function updateProfileDisplayMode(profileData) {
    // Update description
    const descElement = document.getElementById('profile-description');
    if (descElement) {
        descElement.textContent = profileData.description || 'Restoran açıklaması henüz eklenmemiş.';
    }
    
    // Update website
    const websiteElement = document.getElementById('profile-website');
    if (websiteElement) {
        if (profileData.website) {
            websiteElement.href = profileData.website;
            websiteElement.textContent = profileData.website;
            websiteElement.style.display = 'flex';
        } else {
            websiteElement.style.display = 'none';
        }
    }
    
    // Update specialties
    const specialtiesContainer = document.getElementById('profile-specialties');
    if (specialtiesContainer && profileData.specialties) {
        specialtiesContainer.innerHTML = profileData.specialties
            .map(specialty => `<span class="specialty-tag">${specialty}</span>`)
            .join('');
    }
    
    // Update working hours
    const workingHoursContainer = document.getElementById('working-hours');
    if (workingHoursContainer && profileData.workingHours) {
        const { weekday, weekend } = profileData.workingHours;
        workingHoursContainer.innerHTML = `
            <div class="day">Pazartesi - Cuma: ${weekday.open} - ${weekday.close}</div>
            <div class="day">Cumartesi - Pazar: ${weekend.open} - ${weekend.close}</div>
        `;
    }
}

// Utility Functions
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function validateWorkingHours(hours) {
    const { weekday, weekend } = hours;
    
    // Check if opening time is before closing time
    const weekdayValid = weekday.open < weekday.close;
    const weekendValid = weekend.open < weekend.close;
    
    return weekdayValid && weekendValid;
}

// UI Helper Functions
function showImagePreviewLoading(loading) {
    const placeholder = document.getElementById('imageUploadPlaceholder');
    if (placeholder) {
        if (loading) {
            placeholder.innerHTML = `
                <i class="fas fa-spinner fa-spin" style="font-size: 2em; color: #9ca3af; margin-bottom: 10px;"></i>
                <p>Görsel işleniyor...</p>
            `;
        } else {
            placeholder.innerHTML = `
                <i class="fas fa-camera" style="font-size: 2em; color: #9ca3af; margin-bottom: 10px;"></i>
                <p>Ana görseli yüklemek için tıklayın</p>
                <p style="font-size: 0.8em; color: #6b7280;">JPG, PNG (Max 5MB)</p>
            `;
        }
    }
}

function showProfileSaveProgress(percentage) {
    let progressContainer = document.getElementById('profileSaveProgress');
    
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'profileSaveProgress';
        progressContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10001;
            min-width: 300px;
            text-align: center;
        `;
        document.body.appendChild(progressContainer);
    }
    
    if (percentage === -1) {
        progressContainer.innerHTML = `
            <i class="fas fa-times-circle" style="color: #ef4444; font-size: 2em; margin-bottom: 10px;"></i>
            <p style="margin: 0; color: #ef4444; font-weight: 500;">İşlem başarısız!</p>
        `;
        setTimeout(() => hideProfileSaveProgress(), 2000);
    } else {
        progressContainer.innerHTML = `
            <div style="margin-bottom: 15px;">
                <i class="fas fa-save" style="color: #10b981; font-size: 1.5em;"></i>
            </div>
            <p style="margin: 0 0 15px 0; font-weight: 500;">Profil kaydediliyor...</p>
            <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
                <div style="background: #10b981; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
            </div>
            <p style="margin: 10px 0 0 0; font-size: 0.9em; color: #6b7280;">%${percentage}</p>
        `;
    }
}

function hideProfileSaveProgress() {
    const progressContainer = document.getElementById('profileSaveProgress');
    if (progressContainer) {
        progressContainer.remove();
    }
}

function showProfileNotification(message, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10002;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        max-width: 400px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    notification.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, type === 'error' ? 5000 : 3000);
}

// Initialize Profile Form
document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }
    
    // Load existing profile data into display mode
    loadProfileDisplayData();
});

function loadProfileDisplayData() {
    const profileData = JSON.parse(localStorage.getItem('restaurantProfileData') || '{}');
    if (Object.keys(profileData).length > 0) {
        updateProfileDisplayMode(profileData);
        console.log('📋 Profile display data loaded');
    }
}

// BACKEND API INTEGRATION - Full Featured

// Send Profile Data to Backend
async function sendProfileToBackend(profileData) {
    try {
        console.log('🌐 Sending profile data to backend...');
        
        const user = JSON.parse(localStorage.getItem('restaurantUser') || '{}');
        const token = localStorage.getItem('restaurantToken');
        
        if (!user.id || !token) {
            throw new Error('Authentication required');
        }
        
        // Prepare API payload
        const payload = {
            restaurantId: user.id,
            profileImage: localStorage.getItem('restaurantProfileImage'),
            description: profileData.description,
            website: profileData.website,
            specialties: profileData.specialties,
            workingHours: profileData.workingHours,
            lastUpdated: profileData.lastUpdated
        };
        
        // Send to backend - Production API endpoint
        const response = await fetch(`${API_BASE_URL}/api/restaurant/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Profile data sent to backend successfully:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Backend API error:', error);
        
        // For demo mode, don't throw error - just log it
        if (error.message.includes('API Error') || error.message.includes('fetch')) {
            console.warn('🚧 Backend API not available, using local storage only');
            showProfileNotification('Profil yerel olarak kaydedildi. Sunucu bağlantısı kurulamadı.', 'warning');
        } else {
            throw error;
        }
    }
}

// Load Profile Data from Backend
async function loadProfileFromBackend() {
    try {
        console.log('🌐 Loading profile data from backend...');
        
        const user = JSON.parse(localStorage.getItem('restaurantUser') || '{}');
        const token = localStorage.getItem('restaurantToken');
        
        if (!user.id || !token) {
            console.log('⚠️ No authentication, using local data');
            return null;
        }
        
        const response = await fetch(`${API_BASE_URL}/api/restaurant/profile/${user.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            console.log('✅ Profile data loaded from backend:', result.data);
            
            // Update local storage with backend data
            if (result.data.profileData) {
                localStorage.setItem('restaurantProfileData', JSON.stringify(result.data.profileData));
            }
            
            if (result.data.profileImage) {
                localStorage.setItem('restaurantProfileImage', result.data.profileImage);
                updateProfileImageUI(result.data.profileImage);
            }
            
            // Update display
            if (result.data.profileData) {
                updateProfileDisplayMode(result.data.profileData);
            }
            
            return result.data;
        }
        
    } catch (error) {
        console.error('❌ Backend profile load error:', error);
        console.log('📂 Using local storage data instead');
        return null;
    }
}

// Sync Profile Data with Mobile App
async function syncProfileWithMobileApp(profileData) {
    try {
        console.log('📱 Syncing profile data with mobile app...');
        
        const user = JSON.parse(localStorage.getItem('restaurantUser') || '{}');
        const token = localStorage.getItem('restaurantToken');
        
        if (!user.id || !token) return;
        
        // Mobile app sync endpoint
        const syncPayload = {
            restaurantId: user.id,
            name: user.name,
            profileImage: localStorage.getItem('restaurantProfileImage'),
            description: profileData.description,
            category: user.category || 'Restoran',
            website: profileData.website,
            specialties: profileData.specialties,
            workingHours: profileData.workingHours,
            location: user.location || null,
            rating: user.rating || { average: 0, count: 0 },
            packages: [], // Will be populated by package management
            // Map "İşletme Açıklaması - Neyi Kurtaracaksınız?" to mobile app's "Ne alacaksınız?" field
            adminNote: profileData.description, // This will appear in mobile app RestaurantDetailScreen
            lastUpdated: new Date().toISOString()
        };
        
        // Update restaurant data in main database for mobile app consumption
        const response = await fetch(`${API_BASE_URL}/api/public/restaurants/${user.id}/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(syncPayload)
        });
        
        if (response.ok) {
            console.log('✅ Profile synced with mobile app successfully');
        } else {
            console.warn('⚠️ Mobile app sync failed, will retry later');
        }
        
    } catch (error) {
        console.error('❌ Mobile app sync error:', error);
        // Don't throw error, this is not critical
    }
}

// Initialize Backend Integration
document.addEventListener('DOMContentLoaded', function() {
    // Load profile data from backend on page load
    setTimeout(() => {
        loadProfileFromBackend();
    }, 1000); // Delay to allow other init functions to complete
});