// Restaurant Orders Management System - Production Version
let socket = null;
let restaurantId = null;

// Initialize orders system
async function initializeOrdersSystem() {
    try {
        // Check authentication via API instead of localStorage
        console.log('🔐 Checking authentication via API...');
        
        if (!window.backendService) {
            throw new Error('Backend service not available');
        }
        
        // Update backendService token if it doesn't have one but localStorage does
        if (!window.backendService.authToken) {
            const localToken = localStorage.getItem('kaptaze_auth_token') || localStorage.getItem('kaptaze_token');
            if (localToken) {
                window.backendService.authToken = localToken;
                console.log('🔄 Updated backendService token from localStorage');
            }
        }
        
        console.log('🔍 TOKEN ANALYSIS before /restaurant/me:', {
            instanceToken: !!window.backendService.authToken,
            sessionToken: !!sessionStorage.getItem('kaptaze_session_token'),
            authToken: !!localStorage.getItem('kaptaze_auth_token'),
            localToken: !!localStorage.getItem('kaptaze_token'),
            backendServiceURL: window.backendService.baseURL,
            // Show actual token previews for debugging
            instanceTokenPreview: window.backendService.authToken?.substring(0, 20) + '...',
            sessionTokenPreview: sessionStorage.getItem('kaptaze_session_token')?.substring(0, 20) + '...',
            authTokenPreview: localStorage.getItem('kaptaze_auth_token')?.substring(0, 20) + '...',
            localTokenPreview: localStorage.getItem('kaptaze_token')?.substring(0, 20) + '...'
        });
        
        // Get current user from API (uses session/cookie)
        console.log('📞 Calling /restaurant/me API...');
        const userResponse = await window.backendService.makeRequest('/restaurant/me');
        console.log('📞 /restaurant/me Response:', userResponse);
        
        if (!userResponse || !userResponse.success) {
            console.log('❌ /restaurant/me failed:', {
                hasResponse: !!userResponse,
                success: userResponse?.success,
                error: userResponse?.error,
                message: userResponse?.message
            });
            throw new Error(userResponse?.error || userResponse?.message || 'Not authenticated');
        }
        
        const user = userResponse.data.user;
        const restaurant = userResponse.data.restaurant;
        
        restaurantId = user.restaurantId || restaurant?.id;
        
        console.log('✅ Authentication verified:', {
            user: user.username,
            restaurant: restaurant?.name,
            restaurantId: restaurantId
        });
        
        if (!restaurantId) {
            throw new Error('No restaurant ID found');
        }
        
    } catch (error) {
        console.error('❌ Authentication check failed:', error);
        alert('Lütfen önce giriş yapın.');
        window.location.href = '/restaurant-login.html';
        return;
    }
    
    // Request notification permission
    requestNotificationPermission();
    
    // Initialize Socket.IO connection
    initializeSocket();
    
    // Load existing orders
    await loadOrders();
}

// Request browser notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }
}

// Initialize Socket.IO connection
function initializeSocket() {
    const API_URL = 'https://kaptaze-backend-api.onrender.com';
    
    // Load Socket.IO from CDN
    if (!window.io) {
        const script = document.createElement('script');
        script.src = 'https://cdn.socket.io/4.5.4/socket.io.min.js';
        script.onload = connectSocket;
        document.head.appendChild(script);
    } else {
        connectSocket();
    }

    function connectSocket() {
        socket = io(API_URL);
        
        socket.on('connect', () => {
            console.log('✅ Socket.IO connected with ID:', socket.id);
            console.log('🏪 Connecting to restaurant room:', restaurantId);
            // Connect to restaurant room
            socket.emit('restaurant-connect', restaurantId);

            // Show connection status in UI
            showToast('✅ Real-time notifications active', 'success');
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
        });
        
        // Listen for new orders (support both event names for compatibility)
        socket.on('new-order', (data) => {
            console.log('🔔 New order received (new-order):', data);
            handleNewOrder(data.order);
        });

        socket.on('newOrder', (data) => {
            console.log('🔔 New order received (newOrder):', data);
            handleNewOrder(data.order);
        });
    }
}

// Handle new order notification
function handleNewOrder(order) {
    console.log('Processing new order:', order);
    
    // Show browser notification
    showBrowserNotification(order);
    
    // Play notification sound (enhanced)
    playNotificationSound();
    
    // Reload orders list
    loadOrders();
    
    // Show PERSISTENT toast notification (doesn't auto-close)
    showPersistentOrderNotification(order);
}

// Show browser notification
function showBrowserNotification(order) {
    if (Notification.permission === 'granted') {
        const notification = new Notification('🔔 Yeni Sipariş!', {
            body: `${order.customer.name} - ₺${order.totalPrice.toFixed(2)}`,
            icon: '/favicon.ico',
            requireInteraction: true
        });
        
        notification.onclick = () => {
            window.focus();
            showSection('orders', null);
            notification.close();
        };
        
        setTimeout(() => notification.close(), 10000);
    }
}

// Play enhanced notification sound
function playNotificationSound() {
    try {
        // Yumuşak bildirim sesi - 3 kez çalar
        const playSound = (count = 0) => {
            if (count < 3) {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi+Gy/LTgTAGKnjG8OGRQAoUXrTr7KlVFApGn+DxvmshBTCHzPLSgjEGJ3fH8OGRQAoUXrTq66hVFApGnuDyvmwiBTCGy/LTgjAGKXfH8OGQQAEIZO3kn0wQClatyuLa0bFc');
                audio.volume = 0.3; // Yumuşak ses seviyesi
                audio.play().catch(e => console.log('Sound play failed:', e));
                
                // 800ms sonra tekrar çal
                setTimeout(() => playSound(count + 1), 800);
            }
        };
        
        playSound();
    } catch (e) {
        console.log('Enhanced sound not supported');
    }
}

// Kalıcı sipariş bildirimi (otomatik kapanmaz)
function showPersistentOrderNotification(order) {
    // Mevcut bildirimleri temizle
    const existingNotifications = document.querySelectorAll('.persistent-order-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = 'persistent-order-notification';
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-icon">🔔</div>
            <div class="notification-title">YENİ SİPARİŞ!</div>
            <div class="notification-close" onclick="this.parentElement.parentElement.remove()">×</div>
        </div>
        <div class="notification-content">
            <div class="customer-info">
                <strong>${order.customer.name}</strong>
                <div class="phone">📞 ${order.customer.phone}</div>
            </div>
            <div class="order-total">₺${order.totalPrice.toFixed(2)}</div>
        </div>
        <div class="notification-actions">
            <button class="accept-btn" onclick="handleOrderAcceptance('${order._id}', this.parentElement.parentElement)">
                ✅ Siparişi Onayla
            </button>
            <button class="details-btn" onclick="showOrderDetails('${order._id}')">
                📋 Detaylar
            </button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 350px;
        background: linear-gradient(135deg, #16a34a, #15803d);
        color: white;
        border-radius: 15px;
        box-shadow: 0 8px 32px rgba(22, 163, 74, 0.4);
        z-index: 10000;
        font-family: Arial, sans-serif;
        overflow: hidden;
        animation: slideIn 0.5s ease-out, pulse 2s infinite;
        border: 2px solid #22c55e;
    `;
    
    // Animasyon stilleri ekle
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes pulse {
                0%, 100% { box-shadow: 0 8px 32px rgba(22, 163, 74, 0.4); }
                50% { box-shadow: 0 8px 32px rgba(22, 163, 74, 0.8); }
            }
            .persistent-order-notification .notification-header {
                display: flex;
                align-items: center;
                padding: 15px;
                background: rgba(0, 0, 0, 0.1);
                font-weight: bold;
            }
            .persistent-order-notification .notification-icon {
                font-size: 24px;
                margin-right: 10px;
            }
            .persistent-order-notification .notification-title {
                flex: 1;
                font-size: 16px;
                font-weight: bold;
            }
            .persistent-order-notification .notification-close {
                font-size: 24px;
                cursor: pointer;
                padding: 0 5px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
            }
            .persistent-order-notification .notification-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            .persistent-order-notification .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
            }
            .persistent-order-notification .customer-info {
                flex: 1;
            }
            .persistent-order-notification .customer-info strong {
                font-size: 16px;
                display: block;
                margin-bottom: 5px;
            }
            .persistent-order-notification .phone {
                font-size: 14px;
                opacity: 0.9;
            }
            .persistent-order-notification .order-total {
                font-size: 24px;
                font-weight: bold;
                text-align: right;
            }
            .persistent-order-notification .notification-actions {
                padding: 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                gap: 10px;
            }
            .persistent-order-notification .accept-btn {
                flex: 1;
                padding: 12px;
                background: #ffffff;
                color: #16a34a;
                border: none;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            .persistent-order-notification .accept-btn:hover {
                background: #f0f9ff;
                transform: translateY(-2px);
            }
            .persistent-order-notification .details-btn {
                padding: 12px 20px;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.3s ease;
            }
            .persistent-order-notification .details-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    console.log('🔔 Persistent notification created for order:', order._id);
}

// Sipariş onaylama işlemi
function handleOrderAcceptance(orderId, notificationElement) {
    console.log('✅ Accepting order:', orderId);
    
    // Siparişi onayla (mevcut fonksiyonu kullan)
    updateOrderStatus(orderId, 'confirmed');
    
    // Bildirimi kapat
    notificationElement.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
        notificationElement.remove();
    }, 300);
    
    // Başarı mesajı
    showToast('✅ Sipariş onaylandı ve hazırlanmaya başlandı!', 'success');
}

// Sipariş detaylarını göster
function showOrderDetails(orderId) {
    console.log('📋 Showing order details:', orderId);
    
    // Orders sekmesini aktif yap (restaurant panel'de)
    if (typeof showSection === 'function') {
        showSection('orders', null);
    } else {
        // Alternative: orders sayfasına scroll et
        const ordersSection = document.getElementById('orders-content');
        if (ordersSection) {
            ordersSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Specific order'ı highlight et
        setTimeout(() => {
            const orderCards = document.querySelectorAll('.order-card');
            orderCards.forEach(card => {
                if (card.innerHTML.includes(orderId.slice(-6))) {
                    card.style.border = '3px solid #16a34a';
                    card.style.backgroundColor = '#f0fdf4';
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }, 500);
    }
}

// Load orders from API
async function loadOrders() {
    if (!restaurantId) return;
    
    try {
        console.log('Loading orders for restaurant:', restaurantId);
        
        // Use restaurant-specific orders endpoint with proper auth
        console.log('🔍 Loading orders via /restaurant/orders endpoint...');
        const response = await window.backendService.makeRequest(`/restaurant/orders`);
        console.log('🔍 Restaurant orders response:', response);

        const orders = response.success ? response.data.orders : [];
        
        if (orders && Array.isArray(orders)) {
            console.log('Orders loaded:', orders.length);
            updateOrdersUI(orders);
        } else {
            console.log('No orders found or invalid response');
            updateOrdersUI([]);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        updateOrdersUI([]);
    }
}

// Update orders UI
function updateOrdersUI(orders) {
    const ordersSection = document.getElementById('orders-content');
    if (!ordersSection) {
        console.log('Orders section not found - will retry in 1 second');
        setTimeout(() => updateOrdersUI(orders), 1000);
        return;
    }
    
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const processingOrders = orders.filter(o => ['confirmed', 'ready'].includes(o.status));
    
    ordersSection.innerHTML = `
        <div class="orders-summary">
            <div class="summary-card">
                <h3>Bekleyen Siparişler</h3>
                <div class="count">${pendingOrders.length}</div>
            </div>
            <div class="summary-card">
                <h3>İşlemde</h3>
                <div class="count">${processingOrders.length}</div>
            </div>
            <div class="summary-card">
                <h3>Toplam</h3>
                <div class="count">${orders.length}</div>
            </div>
        </div>
        
        <div class="orders-list">
            ${orders.length === 0 ? 
                '<div class="no-orders">Henüz sipariş bulunmuyor</div>' :
                orders.map(createOrderCard).join('')
            }
        </div>
    `;
}

// Create order card
function createOrderCard(order) {
    const statusColors = {
        pending: '#ff9800',
        confirmed: '#2196f3',
        ready: '#4caf50',
        completed: '#607d8b',
        cancelled: '#f44336'
    };
    
    const statusTexts = {
        pending: 'Bekliyor',
        confirmed: 'Onaylandı',
        ready: 'Hazır',
        completed: 'Teslim Edildi',
        cancelled: 'İptal'
    };
    
    return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">#${order._id.slice(-6)}</span>
                <span class="order-status" style="background: ${statusColors[order.status]}">
                    ${statusTexts[order.status]}
                </span>
                <span class="order-time">${formatTime(order.createdAt)}</span>
            </div>
            
            <div class="order-customer">
                <strong>${order.customer.name}</strong>
                <div>📞 ${order.customer.phone}</div>
            </div>
            
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        ${item.quantity}x ${item.name} - ₺${item.total.toFixed(2)}
                    </div>
                `).join('')}
            </div>
            
            <div class="order-footer">
                <div class="order-total">
                    <strong>Toplam: ₺${order.totalPrice.toFixed(2)}</strong>
                </div>
                <div class="order-actions">
                    ${order.status === 'pending' ?
                        `<button onclick="updateOrderStatus('${order._id}', 'confirmed')" class="btn-orange">Onayla</button>` : ''
                    }
                    ${order.status === 'confirmed' ?
                        `<button onclick="updateOrderStatus('${order._id}', 'ready')" class="btn-green">Hazır</button>` : ''
                    }
                    ${order.status === 'ready' ?
                        `<button onclick="updateOrderStatus('${order._id}', 'completed')" class="btn-blue">Teslim</button>` : ''
                    }
                </div>
            </div>
            
            ${order.notes ? `<div class="order-notes">📝 ${order.notes}</div>` : ''}
        </div>
    `;
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        console.log(`🔄 Updating order ${orderId} to status: ${newStatus}`);

        // Use restaurant orders endpoint for status updates
        const response = await window.backendService.makeRequest(`/restaurant/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus })
        });

        console.log('🔄 Status update response:', response);

        if (response && response.success) {
            showToast(`✅ Sipariş ${newStatus === 'confirmed' ? 'onaylandı' : newStatus === 'ready' ? 'hazır' : newStatus === 'completed' ? 'teslim edildi' : 'güncellendi'}`, 'success');
            loadOrders();
        } else {
            console.error('❌ Status update failed:', response);
            showToast('Güncelleme başarısız', 'error');
        }
    } catch (error) {
        console.error('❌ Update failed:', error);
        showToast('Bağlantı hatası', 'error');
    }
}

// Helper functions
function formatTime(dateString) {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Global functions
window.updateOrderStatus = updateOrderStatus;
window.loadRestaurantOrders = loadOrders;

// Initialize when page loads - Only if called manually, not auto-init
// document.addEventListener('DOMContentLoaded', () => {
//     if (window.location.pathname.includes('restaurant-panel') || window.location.pathname.includes('restaurant')) {
//         console.log('🍽️ Initializing orders system for path:', window.location.pathname);
//         initializeOrdersSystem();
        
//         // Refresh orders every 30 seconds
//         setInterval(loadOrders, 30000);
//     } else {
//         console.log('🍽️ Orders system not initialized - path:', window.location.pathname);
//     }
// });

// Manual initialization function - called by restaurant-panel.js
window.initializeRestaurantOrders = initializeOrdersSystem;

console.log('🍽️ Restaurant Orders System Loaded');