// KapTaze Admin Panel JavaScript - Database Integration

// Configuration - Fallback to database when API fails
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
let useDatabase = true; // Use local database as primary source

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
        window.location.href = '/admin-login.html';
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
            window.location.href = '/admin-login.html';
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
        window.location.href = '/admin-login.html';
        return false;
    }
}

// Logout function
function logout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin-login.html';
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

// Navigation - Make sure it's globally accessible
window.showSection = function showSection(sectionId) {
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
            timeout: 10000, // 10 second timeout
            ...options
        };
        
        console.log(`🌐 Making API call to: ${url}`);
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ API call successful: ${endpoint}`);
        return data;
    } catch (error) {
        console.warn(`⚠️ API Call failed for ${endpoint}:`, error.message);
        // Don't show error notification for expected API failures
        // showNotification('API bağlantı hatası: ' + error.message, 'error');
        return null;
    }
}

// Check API status
async function checkAPIStatus() {
    const statusElement = document.getElementById('api-status');
    const indicatorElement = document.getElementById('api-indicator');
    const statusTextElement = document.getElementById('api-status-text');
    
    try {
        console.log('🔄 Testing API connection...');
        
        // Test Netlify Functions API connection with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch('/.netlify/functions/shared-storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get' }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ API connection successful, data received');
            apiConnected = true;
            
            // Update UI for successful API connection
            if (statusElement) {
                statusElement.classList.remove('error');
                statusElement.querySelector('span').textContent = 'API Bağlı (Canlı)';
            }
            
            if (indicatorElement) {
                indicatorElement.classList.add('active');
            }
            
            if (statusTextElement) {
                statusTextElement.textContent = 'Aktif (Netlify)';
            }
        } else {
            throw new Error(`API responded with status: ${response.status}`);
        }
        
    } catch (error) {
        console.log('⚠️ API connection failed, using localStorage:', error.name);
        apiConnected = false;
        
        // Update UI for localStorage mode (not error state)
        if (statusElement) {
            statusElement.classList.remove('error');
            statusElement.querySelector('span').textContent = 'Yerel Veri Modu';
        }
        
        if (indicatorElement) {
            indicatorElement.classList.remove('active');
            indicatorElement.classList.add('warning');
        }
        
        if (statusTextElement) {
            statusTextElement.textContent = 'LocalStorage';
        }
        
        console.log('📁 Data Mode: Using LocalStorage fallback');
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        // Use centralized database system
        if (window.KapTazeDB) {
            const stats = window.KapTazeDB.getStatistics();
            console.log('📊 Dashboard stats from database:', stats);
            
            updateDashboardStats({
                totalUsers: stats.totalApplications, // All applications
                activeUsers: (window.KapTazeDB.getData().restaurantUsers.length + window.KapTazeDB.getData().customerUsers.length),
                totalRestaurants: stats.activeRestaurants,
                pendingApplications: stats.pendingApplications,
                totalPackages: stats.totalPackages,
                activePackages: stats.activePackages,
                totalOrders: stats.totalOrders
            });
            
            return;
        }
        
        // Mock data fallback
        console.log('📁 Using mock dashboard data...');
        const mockStats = {
            totalUsers: 1247,
            totalRestaurants: 89,
            totalPackages: 456,
            totalOrders: 2834
        };
        
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
        // Use centralized database system
        if (window.KapTazeDB) {
            const data = window.KapTazeDB.getData();
            
            // Combine restaurant and customer users
            const allUsers = [
                ...data.restaurantUsers.map(user => ({
                    ...user,
                    type: 'restaurant'
                })),
                ...data.customerUsers.map(user => ({
                    ...user,
                    type: 'customer'
                }))
            ];
            
            console.log('📊 Users from database:', allUsers.length);
            
            if (allUsers.length > 0) {
                renderUsersTable(allUsers);
                return;
            }
        }
        
        // Fallback to mock data
        console.log('📁 Fallback to mock users data...');
        renderMockUsersData();
        
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

// Render users table with database format
function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Henüz kullanıcı bulunmuyor</td></tr>';
        return;
    }
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>
                <strong>${user.email}</strong><br>
                <small style="color: #6b7280;">🔑 ${user.username}</small>
            </td>
            <td>
                <span class="user-type-badge ${user.type}">
                    ${user.type === 'restaurant' ? '🏪 Restoran' : '👤 Müşteri'}
                </span>
            </td>
            <td>${user.phone || 'Belirtilmemiş'}</td>
            <td>
                <span class="status-badge ${user.status === 'active' ? 'approved' : 'pending'}">
                    ${user.status === 'active' ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString('tr-TR')}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewUser('${user.id}')" class="btn-view" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editUser('${user.id}')" class="btn-edit" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleUserStatus('${user.id}', '${user.status}')" 
                        class="btn-toggle" title="Durumu Değiştir">
                        <i class="fas fa-power-off"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderMockUsersData() {
    // Load registrations from shared data system (with fallback)
    const registrations = window.KapTazeData ? 
        window.KapTazeData.getRegistrations() : 
        JSON.parse(localStorage.getItem('registrations') || '[]');
    
    const mockUsers = [
        { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@example.com', phone: '0532 XXX XX XX', date: '2024-01-15', status: 'active', type: 'customer' },
        { id: '2', name: 'Fatma Kaya', email: 'fatma@example.com', phone: '0542 XXX XX XX', date: '2024-01-20', status: 'active', type: 'customer' },
        { id: '3', name: 'Mehmet Demir', email: 'mehmet@example.com', phone: '0555 XXX XX XX', date: '2024-01-25', status: 'inactive', type: 'customer' }
    ];
    
    // Add all registrations (both customer and restaurant users)
    registrations.forEach(reg => {
        if (reg.type === 'customer') {
            mockUsers.push({
                id: reg.id,
                name: `${reg.firstName} ${reg.lastName}`,
                email: reg.email,
                phone: reg.phone,
                date: new Date(reg.createdAt).toLocaleDateString('tr-TR'),
                status: reg.status === 'approved' ? 'active' : 'pending',
                type: 'customer'
            });
        } else if (reg.type === 'restaurant' && reg.status === 'approved' && reg.restaurantUsername) {
            // Add restaurant user accounts
            mockUsers.push({
                id: reg.id + '_rest',
                name: `${reg.firstName} ${reg.lastName} (Restoran)`,
                email: reg.email,
                phone: reg.phone,
                date: new Date(reg.approvedAt || reg.createdAt).toLocaleDateString('tr-TR'),
                status: 'active',
                type: 'restaurant',
                username: reg.restaurantUsername,
                businessName: reg.businessName
            });
        }
    });
    
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = mockUsers.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>
                <strong>${user.name}</strong><br>
                ${user.username ? `<small style="color: #6b7280;">👤 ${user.username}</small>` : ''}
                ${user.businessName ? `<br><small style="color: #16a34a;">🏪 ${user.businessName}</small>` : ''}
            </td>
            <td>${user.email}</td>
            <td>${user.phone || 'Belirtilmemiş'}</td>
            <td>${user.date}</td>
            <td>
                <span class="status-badge ${user.status}">${getStatusText(user.status)}</span>
                ${user.type === 'restaurant' ? '<br><span class="type-badge restaurant">Restoran</span>' : '<span class="type-badge customer">Müşteri</span>'}
            </td>
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
        // Use centralized database system
        if (window.KapTazeDB) {
            const restaurants = window.KapTazeDB.getAllRestaurants();
            console.log('📊 Restaurants from database:', restaurants.length);
            
            if (restaurants.length > 0) {
                renderRestaurantsTable(restaurants);
                return;
            }
        }
        
        // Fallback to mock data
        console.log('📁 Fallback to mock restaurants data...');
        renderMockRestaurantsData();
        
    } catch (error) {
        console.error('❌ Error loading restaurants:', error);
        renderMockRestaurantsData();
    }
}

// Render restaurants table with database format
function renderRestaurantsTable(restaurants) {
    const tableBody = document.getElementById('restaurants-table-body');
    
    if (!restaurants || restaurants.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Henüz onaylanmış restoran bulunmuyor</td></tr>';
        return;
    }
    
    tableBody.innerHTML = restaurants.map(restaurant => {
        const user = restaurant.user || {};
        const application = restaurant.application || {};
        
        return `
            <tr>
                <td>${restaurant.id}</td>
                <td>
                    <strong>${restaurant.businessName}</strong><br>
                    <small style="color: #6b7280;">👤 ${user.email || 'N/A'}</small>
                    ${user.username ? `<br><small style="color: #059669;">🔑 ${user.username}</small>` : ''}
                    ${restaurant.businessType ? `<br><small style="color: #dc2626;">🏷️ ${restaurant.businessType}</small>` : ''}
                </td>
                <td>
                    ${application.email || user.email || 'N/A'}<br>
                    <small style="color: #6b7280;">${application.phone || user.phone || 'Telefon belirtilmemiş'}</small>
                </td>
                <td>
                    ${restaurant.address || 'Adres belirtilmemiş'}
                    ${restaurant.coordinates ? `<br><small style="color: #059669;" onclick="showOnMap(${restaurant.coordinates.lat}, ${restaurant.coordinates.lng})">📍 Haritada Göster</small>` : ''}
                </td>
                <td>
                    <span class="status-badge ${restaurant.status === 'active' ? 'approved' : 'pending'}">
                        ${restaurant.status === 'active' ? 'Aktif' : 'Pasif'}
                    </span>
                </td>
                <td>${restaurant.packageCount || '0'}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewRestaurant('${restaurant.id}')" class="btn-view" title="Görüntüle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editRestaurant('${restaurant.id}')" class="btn-edit" title="Düzenle">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleRestaurantStatus('${restaurant.id}', '${restaurant.status}')" 
                            class="btn-toggle" title="Durumu Değiştir">
                            <i class="fas fa-power-off"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
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
            packages: Math.floor(Math.random() * 5), // Random package count for demo
            category: reg.businessCategory,
            owner: `${reg.firstName} ${reg.lastName}`,
            phone: reg.phone,
            location: reg.businessLatitude && reg.businessLongitude ? {
                lat: parseFloat(reg.businessLatitude),
                lng: parseFloat(reg.businessLongitude)
            } : null,
            username: reg.restaurantUsername
        });
    });
    
    const tableBody = document.getElementById('restaurants-table-body');
    tableBody.innerHTML = mockRestaurants.map(restaurant => `
        <tr>
            <td>${restaurant.id}</td>
            <td>
                <strong>${restaurant.name}</strong><br>
                <small style="color: #6b7280;">👤 ${restaurant.owner || 'N/A'}</small>
                ${restaurant.username ? `<br><small style="color: #059669;">🔑 ${restaurant.username}</small>` : ''}
                ${restaurant.category ? `<br><small style="color: #dc2626;">🏷️ ${restaurant.category}</small>` : ''}
            </td>
            <td>
                ${restaurant.email}<br>
                <small style="color: #6b7280;">${restaurant.phone || 'Telefon belirtilmemiş'}</small>
            </td>
            <td>
                ${restaurant.address}
                ${restaurant.location ? `<br><small style="color: #059669;"><i class="fas fa-map-marker-alt"></i> Konum: ${restaurant.location.lat.toFixed(4)}, ${restaurant.location.lng.toFixed(4)}</small>` : ''}
            </td>
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
                ${restaurant.location ? `
                <button class="btn-secondary" onclick="showOnMap('${restaurant.id}', ${restaurant.location.lat}, ${restaurant.location.lng})" title="Haritada Göster">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                ` : ''}
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

function showOnMap(restaurantId, lat, lng) {
    // Open Google Maps with the restaurant location
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15&t=m`;
    window.open(mapsUrl, '_blank');
    showNotification(`Restoran konumu Google Maps'te açılıyor...`, 'info');
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

function generateRandomPassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
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
        // Use centralized database system
        if (window.KapTazeDB) {
            const applications = window.KapTazeDB.getAllApplications();
            console.log('📊 Applications from database:', applications.length);
            
            if (applications.length > 0) {
                renderApplicationsTable(applications);
                return;
            }
        }
        
        // Fallback to localStorage for backward compatibility
        console.log('📁 Fallback to localStorage data...');
        await renderMockApplicationsData();
        
    } catch (error) {
        console.error('❌ Error loading applications:', error);
        // Final fallback
        tableBody.innerHTML = '<tr><td colspan="8" class="error">Başvurular yüklenirken hata oluştu</td></tr>';
    }
}

// Render applications table with database format
function renderApplicationsTable(applications) {
    const tableBody = document.getElementById('applications-table-body');
    
    if (!applications || applications.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Henüz başvuru bulunmuyor</td></tr>';
        return;
    }
    
    const pendingApplications = applications.filter(app => app.status === 'pending');
    
    if (pendingApplications.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="no-data">Bekleyen başvuru bulunmuyor</td></tr>';
        return;
    }
    
    tableBody.innerHTML = pendingApplications.map(application => `
        <tr>
            <td>${application.id}</td>
            <td>
                <strong>${application.businessName}</strong><br>
                <small style="color: #6b7280;">👤 ${application.firstName} ${application.lastName}</small><br>
                <small style="color: #dc2626;">🏷️ ${application.businessType || application.businessCategory}</small>
            </td>
            <td>
                ${application.email}<br>
                <small style="color: #6b7280;">${application.phone || 'Telefon belirtilmemiş'}</small>
            </td>
            <td>
                ${application.businessAddress || 'Adres belirtilmemiş'}<br>
                <small style="color: #6b7280;">${application.district}/${application.city}</small>
                ${application.businessLatitude ? `<br><small style="color: #059669;" onclick="showOnMap(${application.businessLatitude}, ${application.businessLongitude})">📍 Haritada Göster</small>` : ''}
            </td>
            <td>
                <span class="status-badge pending">Bekliyor</span>
            </td>
            <td>${new Date(application.createdAt).toLocaleDateString('tr-TR')}</td>
            <td>
                ${application.restaurantUsername ? `<small style="color: #059669;">🔑 ${application.restaurantUsername}</small>` : 'N/A'}
            </td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewApplication('${application.id}')" class="btn-view" title="Görüntüle">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="approveApplication('${application.id}')" class="btn-approve" title="Onayla">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="rejectApplication('${application.id}')" class="btn-reject" title="Reddet">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function renderMockApplicationsData() {
    let registrations = [];
    
    try {
        // Try to fetch from Netlify Functions API first
        console.log('🔄 Admin panel API call başlatılıyor...');
        const response = await fetch('/.netlify/functions/shared-storage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get' })
        });
        
        console.log('📡 API Response Status:', response.status, response.statusText);
        
        if (response.ok) {
            const result = await response.json();
            console.log('📋 Full API response:', result);
            
            if (result.basarili && result.basvurular) {
                registrations = result.basvurular;
                console.log('✅ Başvurular API\'den yüklendi:', registrations.length, 'adet');
                console.log('📄 İlk başvuru örneği:', registrations[0]);
            } else {
                console.log('⚠️ API response format unexpected:', result);
                registrations = result.basvurular || [];
            }
        } else {
            console.error('❌ API HTTP Error:', response.status);
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
    console.log('🔄 Approving application:', applicationId);
    
    try {
        // Use centralized database system
        if (window.KapTazeDB) {
            // Generate restaurant credentials
            const credentials = {
                username: `resto_${Date.now().toString(36)}`,
                password: Math.random().toString(36).substring(2, 10)
            };
            
            const approvalResult = window.KapTazeDB.approveApplication(applicationId, credentials);
            
            if (approvalResult) {
                const { application, user, profile } = approvalResult;
                
                showNotification(
                    `Başvuru onaylandı! Restaurant kullanıcı adı: ${credentials.username}, Şifre: ${credentials.password}`, 
                    'success'
                );
                
                console.log('✅ Application approved:', {
                    applicationId,
                    restaurantUser: user.id,
                    restaurantProfile: profile.id
                });
                
                // Reload all sections
                loadApplicationsData();
                loadRestaurantsData();
                loadUsersData();
                loadDashboardData();
                
                return;
            } else {
                throw new Error('Database approval failed');
            }
        }
        
        // Fallback to localStorage for backward compatibility
        console.log('📁 Fallback to localStorage...');
        await approveApplicationLegacy(applicationId);
        
    } catch (error) {
        console.error('❌ Application approval failed:', error);
        showNotification('Başvuru onaylanırken hata oluştu: ' + error.message, 'error');
    }
}

async function approveApplicationLegacy(applicationId) {
    // Fallback to localStorage
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const application = registrations.find(app => app.id === applicationId);
    
    if (!application) {
        showNotification('Başvuru bulunamadı!', 'error');
        return;
    }
    
    const updatedRegistrations = registrations.map(app => {
        if (app.id === applicationId) {
            app.status = 'approved';
            app.approvedAt = new Date().toISOString();
            
            // If it's a restaurant application, create restaurant credentials
            if (app.type === 'restaurant' && !app.restaurantUsername) {
                const businessName = app.businessName.toLowerCase().replace(/\s+/g, '');
                app.restaurantUsername = businessName;
                app.restaurantPassword = generateRandomPassword();
                console.log(`🏪 Restaurant credentials created: ${app.restaurantUsername} / ${app.restaurantPassword}`);
            }
        }
        return app;
    });
    
    localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
    
    const successMessage = application.type === 'restaurant' 
        ? 'Restoran başvurusu onaylandı! Giriş bilgileri oluşturuldu.' 
        : 'Müşteri başvurusu onaylandı!';
    
    showNotification(successMessage, 'success');
    
    // Reload all related sections
    loadApplicationsData();
    loadRestaurantsData();
    loadUsersData(); 
    loadDashboardData(); // Update dashboard stats
}

function rejectApplication(applicationId) {
    if (confirm('Bu başvuruyu reddetmek istediğinizden emin misiniz?')) {
        const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        const application = registrations.find(app => app.id === applicationId);
        
        if (!application) {
            showNotification('Başvuru bulunamadı!', 'error');
            return;
        }
        
        const updatedRegistrations = registrations.map(app => {
            if (app.id === applicationId) {
                app.status = 'rejected';
                app.rejectedAt = new Date().toISOString();
                app.rejectionReason = 'Admin tarafından reddedildi';
            }
            return app;
        });
        
        localStorage.setItem('registrations', JSON.stringify(updatedRegistrations));
        
        const rejectionMessage = application.type === 'restaurant' 
            ? 'Restoran başvurusu reddedildi.' 
            : 'Müşteri başvurusu reddedildi.';
        
        showNotification(rejectionMessage, 'error');
        
        // Reload applications data
        loadApplicationsData();
        loadDashboardData(); // Update dashboard stats
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

// Global functions - Ensure they're accessible from HTML onclick events
window.approveApplication = window.approveApplication || approveApplication;
window.rejectApplication = window.rejectApplication || rejectApplication;
window.viewApplication = window.viewApplication || viewApplication;
window.closeApplicationModal = window.closeApplicationModal || closeApplicationModal;
window.editUser = window.editUser || editUser;
window.toggleUserStatus = window.toggleUserStatus || toggleUserStatus;
window.viewUser = window.viewUser || viewUser;
window.editRestaurant = window.editRestaurant || editRestaurant;
window.viewRestaurant = window.viewRestaurant || viewRestaurant;
window.toggleRestaurantStatus = window.toggleRestaurantStatus || toggleRestaurantStatus;
window.showAddUserModal = window.showAddUserModal || showAddUserModal;
window.showAddRestaurantModal = window.showAddRestaurantModal || showAddRestaurantModal;
window.loadApplicationsData = window.loadApplicationsData || loadApplicationsData;
window.filterApplications = window.filterApplications || filterApplications;
window.filterOrders = window.filterOrders || filterOrders;
window.testAPIConnection = window.testAPIConnection || testAPIConnection;
window.toggleSidebar = window.toggleSidebar || toggleSidebar;
window.showOnMap = window.showOnMap || function(lat, lng) {
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15`;
    window.open(mapsUrl, '_blank');
};

console.log('🔧 KapTaze Admin Panel loaded successfully');
console.log('🌐 Global functions registered:', {
    showSection: typeof window.showSection,
    approveApplication: typeof window.approveApplication,
    rejectApplication: typeof window.rejectApplication
});