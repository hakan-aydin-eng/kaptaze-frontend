/**
 * KapTaze Admin Panel - Unified MongoDB Version
 * NO localStorage, NO sessionStorage - MongoDB Atlas only
 * Version: 2025.08.23.01
 */

// Global state - memory only
let currentSection = 'dashboard';
let currentUser = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Admin Panel - Unified MongoDB Loading...');
    
    // Check if unified MongoDB service is available
    if (!window.KapTazeMongoDB) {
        console.error('❌ Unified MongoDB service not loaded!');
        showError('System not properly initialized. Please refresh the page.');
        return;
    }
    
    initializeApp();
});

// App initialization
function initializeApp() {
    console.log('🔄 Initializing Admin Panel...');
    
    // Check authentication
    currentUser = window.KapTazeMongoDB.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        console.log('❌ No admin authentication found');
        redirectToLogin();
        return;
    }
    
    console.log('✅ Admin authenticated:', currentUser.username);
    
    // Update user info in header
    updateUserInfo();
    
    // Set active section from URL hash
    const hash = window.location.hash.substring(1);
    if (hash && isValidSection(hash)) {
        showSection(hash);
    } else {
        showSection('dashboard');
    }
    
    // Load initial dashboard data
    loadDashboardData();
    
    console.log('✅ Admin Panel initialized');
}

// Authentication functions
function redirectToLogin() {
    window.location.href = '/admin-login.html';
}

function updateUserInfo() {
    const userInfoEl = document.querySelector('.user-info span');
    if (userInfoEl && currentUser) {
        userInfoEl.textContent = currentUser.businessName || currentUser.username;
    }
}

function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        window.KapTazeMongoDB.clearSession();
        console.log('🚪 Admin logged out');
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
    
    console.log('📍 Admin navigating to:', sectionId);
    
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
    const validSections = ['dashboard', 'applications', 'users', 'packages', 'orders', 'restaurants', 'analytics', 'settings'];
    return validSections.includes(sectionId);
}

function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'applications':
            loadApplicationsData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'packages':
            loadPackagesData();
            break;
        case 'orders':
            loadOrdersData();
            break;
        case 'restaurants':
            loadRestaurantsData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        showLoading('dashboard-stats');
        
        const stats = await window.KapTazeMongoDB.getStatistics();
        updateDashboardStats(stats);
        
        // Load recent data
        const [applications, orders] = await Promise.all([
            window.KapTazeMongoDB.getApplications(),
            window.KapTazeMongoDB.getOrders()
        ]);
        
        updateRecentApplications(applications.slice(0, 5));
        updateRecentOrders(orders.slice(0, 5));
        
        hideLoading('dashboard-stats');
        console.log('✅ Dashboard data loaded');
        
    } catch (error) {
        console.error('❌ Dashboard data load error:', error);
        showError('Dashboard verileri yüklenirken hata oluştu: ' + error.message);
        hideLoading('dashboard-stats');
    }
}

function updateDashboardStats(stats) {
    const elements = {
        'total-applications': stats.totalApplications || 0,
        'pending-applications': stats.pendingApplications || 0,
        'approved-applications': stats.approvedApplications || 0,
        'active-restaurants': stats.activeRestaurants || 0,
        'total-users': stats.totalUsers || 0,
        'total-packages': stats.totalPackages || 0,
        'active-packages': stats.activePackages || 0,
        'total-orders': stats.totalOrders || 0
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

function updateRecentApplications(applications) {
    const container = document.getElementById('recent-applications');
    if (!container) return;
    
    if (applications.length === 0) {
        container.innerHTML = '<div class="no-data">Henüz başvuru bulunmuyor</div>';
        return;
    }
    
    container.innerHTML = applications.map(app => `
        <div class="recent-item">
            <div class="recent-info">
                <h4>${app.businessName}</h4>
                <p>${app.category}</p>
                <span class="time">${formatDate(app.createdAt)}</span>
            </div>
            <span class="status status-${app.status}">${formatStatus(app.status)}</span>
        </div>
    `).join('');
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

// Applications functions
async function loadApplicationsData() {
    try {
        console.log('📝 Loading applications data...');
        showLoading('applications-table-body');
        
        const applications = await window.KapTazeMongoDB.getApplications();
        updateApplicationsTable(applications);
        
        hideLoading('applications-table-body');
        console.log(`✅ Loaded ${applications.length} applications`);
        
    } catch (error) {
        console.error('❌ Applications data load error:', error);
        showError('Başvuru verileri yüklenirken hata oluştu: ' + error.message);
        hideLoading('applications-table-body');
    }
}

function updateApplicationsTable(applications) {
    const tbody = document.getElementById('applications-table-body');
    if (!tbody) return;
    
    if (applications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Henüz başvuru bulunmuyor</td></tr>';
        return;
    }
    
    tbody.innerHTML = applications.map(app => `
        <tr class="application-row" data-id="${app.id}">
            <td>
                <div class="business-info">
                    <strong>${app.businessName}</strong>
                    <small>${app.email}</small>
                </div>
            </td>
            <td>${app.category}</td>
            <td>${app.address}</td>
            <td>${formatDate(app.createdAt)}</td>
            <td>
                <span class="status status-${app.status}">${formatStatus(app.status)}</span>
            </td>
            <td>
                <div class="action-buttons">
                    ${app.status === 'pending' ? `
                        <button class="btn btn-success" onclick="showApprovalModal('${app.id}')">
                            <i class="fas fa-check"></i> Onayla
                        </button>
                        <button class="btn btn-danger" onclick="rejectApplication('${app.id}')">
                            <i class="fas fa-times"></i> Reddet
                        </button>
                    ` : ''}
                    <button class="btn btn-info" onclick="viewApplicationDetails('${app.id}')">
                        <i class="fas fa-eye"></i> Detay
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function showApprovalModal(applicationId) {
    console.log('📋 Showing approval modal for:', applicationId);
    
    // Show modal and populate with application data
    const modal = document.getElementById('approval-modal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Store application ID for approval
        window.currentApplicationId = applicationId;
        
        // Generate credentials
        const applications = await window.KapTazeMongoDB.getApplications();
        const application = applications.find(app => app.id === applicationId);
        
        if (application) {
            document.getElementById('approval-business-name').textContent = application.businessName;
            document.getElementById('generated-username').value = generateUsername(application.businessName);
            document.getElementById('generated-password').value = generatePassword();
        }
    }
}

async function approveApplication() {
    try {
        const applicationId = window.currentApplicationId;
        const username = document.getElementById('generated-username').value;
        const password = document.getElementById('generated-password').value;
        
        if (!applicationId || !username || !password) {
            showError('Eksik bilgiler. Lütfen tekrar deneyin.');
            return;
        }
        
        console.log('✅ Approving application:', applicationId);
        showLoading('approve-btn');
        
        await window.KapTazeMongoDB.approveApplication(applicationId, {
            username,
            password
        });
        
        // Close modal
        hideApprovalModal();
        
        // Refresh applications table
        loadApplicationsData();
        
        // Refresh dashboard stats
        if (currentSection === 'dashboard') {
            loadDashboardData();
        }
        
        showSuccess('Başvuru başarıyla onaylandı! Restaurant girişi için kullanıcı adı: ' + username);
        hideLoading('approve-btn');
        
    } catch (error) {
        console.error('❌ Application approval error:', error);
        showError('Başvuru onaylanırken hata oluştu: ' + error.message);
        hideLoading('approve-btn');
    }
}

// Packages functions
async function loadPackagesData() {
    try {
        console.log('📦 Loading packages data...');
        showLoading('packages-grid');
        
        const packages = await window.KapTazeMongoDB.getPackages();
        updatePackagesGrid(packages);
        
        hideLoading('packages-grid');
        console.log(`✅ Loaded ${packages.length} packages`);
        
    } catch (error) {
        console.error('❌ Packages data load error:', error);
        showError('Paket verileri yüklenirken hata oluştu: ' + error.message);
        hideLoading('packages-grid');
    }
}

function updatePackagesGrid(packages) {
    const grid = document.getElementById('packages-grid');
    if (!grid) return;
    
    if (packages.length === 0) {
        grid.innerHTML = '<div class="no-data">Henüz paket bulunmuyor</div>';
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
                <div class="package-status">
                    <span class="status status-${pkg.status}">${formatStatus(pkg.status)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Utility functions
function generateUsername(businessName) {
    const cleaned = businessName.toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 10);
    const timestamp = Date.now().toString().slice(-4);
    return cleaned + timestamp;
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

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
        element.innerHTML = '<div class="loading">Yükleniyor...</div>';
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

function hideApprovalModal() {
    const modal = document.getElementById('approval-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.currentApplicationId = null;
}

// Make functions globally available
window.showSection = showSection;
window.logout = logout;
window.showApprovalModal = showApprovalModal;
window.approveApplication = approveApplication;
window.hideApprovalModal = hideApprovalModal;

console.log('🌐 Admin Panel - Unified MongoDB Service loaded');