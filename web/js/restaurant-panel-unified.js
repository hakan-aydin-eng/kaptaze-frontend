/**
 * KapTaze Restaurant Panel - Unified MongoDB Version
 * NO localStorage, NO sessionStorage - MongoDB Atlas only
 * Version: 2025.08.23.01
 */

// Global state - memory only
let currentSection = 'dashboard';
let currentUser = null;
let currentRestaurant = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Restaurant Panel - Unified MongoDB Loading...');
    
    // Check if unified MongoDB service is available
    if (!window.KapTazeMongoDB) {
        console.error('❌ Unified MongoDB service not loaded!');
        showError('System not properly initialized. Please refresh the page.');
        return;
    }
    
    initializeRestaurantPanel();
});

// App initialization
function initializeRestaurantPanel() {
    console.log('🔄 Initializing Restaurant Panel...');
    
    // Check authentication
    currentUser = window.KapTazeMongoDB.getCurrentUser();
    if (!currentUser || currentUser.role !== 'restaurant') {
        console.log('❌ No restaurant authentication found');
        redirectToLogin();
        return;
    }
    
    console.log('✅ Restaurant authenticated:', currentUser.username);
    
    // Get restaurant data
    loadRestaurantData();
    
    // Set active section from URL hash
    const hash = window.location.hash.substring(1);
    if (hash && isValidSection(hash)) {
        showSection(hash);
    } else {
        showSection('dashboard');
    }
    
    console.log('✅ Restaurant Panel initialized');
}

// Load restaurant data
async function loadRestaurantData() {
    try {
        console.log('📊 Loading restaurant data...');
        
        const restaurant = await window.KapTazeMongoDB.getRestaurantByUserId(currentUser.id);
        if (restaurant) {
            currentRestaurant = restaurant;
            updateRestaurantInfo(currentUser, restaurant);
            console.log('✅ Restaurant data loaded:', restaurant.businessName);
        } else {
            console.warn('⚠️ Restaurant profile not found for user:', currentUser.username);
        }
        
        // Load dashboard data
        loadDashboardData();
        
    } catch (error) {
        console.error('❌ Restaurant data load error:', error);
        showError('Restaurant bilgileri yüklenirken hata: ' + error.message);
    }
}

// Authentication functions
function redirectToLogin() {
    window.location.href = '/restaurant-login-unified.html';
}

function updateRestaurantInfo(user, restaurant = null) {
    // Update restaurant name in header
    const restaurantNameEl = document.getElementById('restaurant-name');
    if (restaurantNameEl) {
        restaurantNameEl.textContent = restaurant ? restaurant.businessName : user.businessName || user.username;
    }
    
    // Update user info in header
    const userInfoEls = document.querySelectorAll('.user-info span');
    userInfoEls.forEach(el => {
        if (!el.classList.contains('restaurant-status')) {
            el.textContent = restaurant ? restaurant.businessName : user.businessName || user.username;
        }
    });
    
    // Update restaurant status
    const statusEl = document.getElementById('restaurant-status');
    if (statusEl) {
        statusEl.textContent = restaurant && restaurant.status === 'active' ? 'Aktif' : 'Beklemede';
        statusEl.className = `restaurant-status ${restaurant && restaurant.status === 'active' ? 'active' : 'pending'}`;
    }
    
    console.log('📊 Restaurant panel info updated');
}

function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        window.KapTazeMongoDB.clearSession();
        console.log('🚪 Restaurant logged out');
        redirectToLogin();
    }
}

// Section management
function showSection(sectionId, event) {
    if (event) {
        event.preventDefault();
    }
    
    if (!isValidSection(sectionId)) {
        console.error('❌ Invalid section:', sectionId);
        return false;
    }
    
    console.log('📍 Restaurant navigating to:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Add active class to corresponding nav item
        const navItem = document.querySelector(`a[href="#${sectionId}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Update URL hash
        window.location.hash = sectionId;
        currentSection = sectionId;
        
        // Load section-specific data
        loadSectionData(sectionId);
        
        console.log(`✅ Section ${sectionId} activated`);
    }
    
    return false;
}

function isValidSection(sectionId) {
    const validSections = ['dashboard', 'packages', 'orders', 'customers', 'analytics', 'payments', 'profile'];
    return validSections.includes(sectionId);
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'packages':
            loadPackagesData();
            break;
        case 'orders':
            loadOrdersData();
            break;
        case 'customers':
            loadCustomersData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'payments':
            loadPaymentsData();
            break;
        case 'profile':
            loadProfileData();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    if (!currentUser) return;
    
    try {
        console.log('📊 Loading dashboard data...');
        showLoading('dashboard-stats');
        
        // Load restaurant-specific packages and orders
        const [packages, orders] = await Promise.all([
            window.KapTazeMongoDB.getPackages(currentUser.id),
            window.KapTazeMongoDB.getOrders(currentUser.id)
        ]);
        
        updateDashboardStats(packages, orders);
        updateRecentOrders(orders.slice(0, 5));
        
        hideLoading('dashboard-stats');
        console.log('✅ Dashboard data loaded');
        
    } catch (error) {
        console.error('❌ Dashboard data load error:', error);
        showError('Dashboard verileri yüklenirken hata: ' + error.message);
        hideLoading('dashboard-stats');
    }
}

function updateDashboardStats(packages, orders) {
    const stats = {
        totalEarnings: orders.reduce((sum, order) => sum + (order.total || 0), 0),
        totalOrders: orders.length,
        activePackages: packages.filter(pkg => pkg.status === 'active').length,
        restaurantRating: 4.7 // Mock rating
    };
    
    const elements = {
        'total-earnings': `₺${stats.totalEarnings}`,
        'total-orders': stats.totalOrders,
        'active-packages': stats.activePackages,
        'restaurant-rating': stats.restaurantRating
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function updateRecentOrders(orders) {
    const container = document.getElementById('recent-orders');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<div class="no-data">Henüz sipariş bulunmuyor</div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="recent-item">
            <div class="recent-info">
                <h4>Sipariş #${order.id}</h4>
                <p>₺${order.total}</p>
                <span class="time">${formatDate(order.createdAt)}</span>
            </div>
            <span class="status status-${order.status}">${formatStatus(order.status)}</span>
        </div>
    `).join('');
}

// Package functions
async function loadPackagesData() {
    if (!currentUser) return;
    
    try {
        console.log('📦 Loading packages data...');
        showLoading('packages-grid');
        
        const packages = await window.KapTazeMongoDB.getPackages(currentUser.id);
        updatePackagesGrid(packages);
        
        hideLoading('packages-grid');
        console.log(`✅ Loaded ${packages.length} packages`);
        
    } catch (error) {
        console.error('❌ Packages data load error:', error);
        showError('Paket verileri yüklenirken hata: ' + error.message);
        hideLoading('packages-grid');
    }
}

function updatePackagesGrid(packages) {
    const grid = document.getElementById('packages-grid');
    if (!grid) return;
    
    if (packages.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <h3>Henüz paket eklenmemiş</h3>
                <p>İlk paketinizi ekleyerek başlayın</p>
                <button class="btn btn-primary" onclick="showAddPackageModal()">
                    <i class="fas fa-plus"></i> Yeni Paket Ekle
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = packages.map(pkg => `
        <div class="package-card" data-id="${pkg.id}">
            <div class="package-image">
                <img src="${pkg.image || 'https://via.placeholder.com/300x200?text=Paket'}" 
                     alt="${pkg.name}" onerror="this.src='https://via.placeholder.com/300x200?text=Paket'">
            </div>
            <div class="package-content">
                <div class="package-header">
                    <h3>${pkg.name}</h3>
                    <span class="package-category">${pkg.category}</span>
                </div>
                <p class="package-description">${pkg.description}</p>
                <div class="package-price">
                    <span class="discounted-price">₺${pkg.discountedPrice}</span>
                    <span class="original-price">₺${pkg.originalPrice}</span>
                    <span class="discount-badge">${Math.round((1 - pkg.discountedPrice / pkg.originalPrice) * 100)}% İndirim</span>
                </div>
                <div class="package-meta">
                    <span class="quantity">Stok: ${pkg.quantity}</span>
                    <span class="created-date">${formatDate(pkg.createdAt)}</span>
                </div>
                <div class="package-actions">
                    <button class="btn btn-sm btn-primary" onclick="editPackage('${pkg.id}')">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deletePackage('${pkg.id}')">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Package management functions
function showAddPackageModal() {
    const modal = document.getElementById('addPackageModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Reset form
        const form = document.getElementById('addPackageForm');
        if (form) {
            form.reset();
        }
        
        // Update modal title
        const title = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('submitButtonText');
        if (title) title.textContent = 'Yeni Paket Ekle';
        if (submitBtn) submitBtn.textContent = 'Paket Ekle';
        
        // Clear any existing package ID
        window.currentEditingPackageId = null;
    }
}

function hideAddPackageModal() {
    const modal = document.getElementById('addPackageModal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.currentEditingPackageId = null;
}

// Add package form handler
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('addPackageForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                showError('Kullanıcı oturumu bulunamadı');
                return;
            }
            
            try {
                const formData = new FormData(form);
                const packageData = {
                    name: formData.get('packageName') || document.getElementById('packageName').value,
                    category: formData.get('packageCategory') || document.getElementById('packageCategory').value,
                    description: formData.get('packageDescription') || document.getElementById('packageDescription').value,
                    originalPrice: parseFloat(formData.get('originalPrice') || document.getElementById('originalPrice').value),
                    discountedPrice: parseFloat(formData.get('discountedPrice') || document.getElementById('discountedPrice').value),
                    quantity: parseInt(formData.get('quantity') || document.getElementById('quantity').value),
                    availableUntil: formData.get('availableUntil') || document.getElementById('availableUntil').value,
                    tags: formData.get('packageTags') || document.getElementById('packageTags').value,
                    specialInstructions: formData.get('specialInstructions') || document.getElementById('specialInstructions').value
                };
                
                // Validation
                if (!packageData.name || !packageData.category || !packageData.description) {
                    showError('Paket adı, kategori ve açıklama gereklidir');
                    return;
                }
                
                if (!packageData.originalPrice || !packageData.discountedPrice || !packageData.quantity) {
                    showError('Fiyat ve stok bilgileri gereklidir');
                    return;
                }
                
                console.log('💾 Saving package to MongoDB:', packageData);
                showLoading('submitButtonText');
                
                await window.KapTazeMongoDB.addPackage(currentUser.id, packageData);
                
                hideAddPackageModal();
                loadPackagesData(); // Refresh packages
                
                // Update dashboard if we're on dashboard
                if (currentSection === 'dashboard') {
                    loadDashboardData();
                }
                
                showSuccess('Paket başarıyla eklendi!');
                hideLoading('submitButtonText');
                
            } catch (error) {
                console.error('❌ Package save error:', error);
                showError('Paket kaydedilirken hata: ' + error.message);
                hideLoading('submitButtonText');
            }
        });
    }
});

// Other section functions (stubs for now)
async function loadOrdersData() {
    console.log('📝 Loading orders data...');
    // Implementation for orders
}

async function loadCustomersData() {
    console.log('👥 Loading customers data...');
    // Implementation for customers
}

async function loadAnalyticsData() {
    console.log('📊 Loading analytics data...');
    // Implementation for analytics
}

async function loadPaymentsData() {
    console.log('💳 Loading payments data...');
    // Implementation for payments
}

async function loadProfileData() {
    console.log('👤 Loading profile data...');
    // Implementation for profile
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR') + ' ' + date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatStatus(status) {
    const statusMap = {
        'pending': 'Beklemede',
        'approved': 'Onaylandı',
        'rejected': 'Reddedildi',
        'active': 'Aktif',
        'inactive': 'Pasif',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi'
    };
    return statusMap[status] || status;
}

// UI Helper functions
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        if (element.tagName === 'BUTTON') {
            element.disabled = true;
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Yükleniyor...';
        } else {
            element.innerHTML = '<div class="loading">Yükleniyor...</div>';
        }
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element && element.innerHTML.includes('loading')) {
        element.innerHTML = '';
    }
}

function showError(message) {
    console.error('❌', message);
    alert('Hata: ' + message);
}

function showSuccess(message) {
    console.log('✅', message);
    alert('Başarılı: ' + message);
}

// UI functions
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notification-panel');
    if (panel) {
        panel.classList.toggle('active');
    }
}

// Make functions globally available
window.showSection = showSection;
window.logout = logout;
window.showAddPackageModal = showAddPackageModal;
window.hideAddPackageModal = hideAddPackageModal;
window.toggleSidebar = toggleSidebar;
window.toggleNotifications = toggleNotifications;
window.initializeRestaurantPanel = initializeRestaurantPanel;

console.log('🌐 Restaurant Panel - Unified MongoDB Service loaded');