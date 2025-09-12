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
        
        // Get current user from API (uses session/cookie)
        const userResponse = await window.backendService.makeRequest('/restaurant/me');
        
        if (!userResponse || !userResponse.success) {
            throw new Error('Not authenticated');
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
            console.log('✅ Socket.IO connected');
            console.log('🏪 Connecting to restaurant room:', restaurantId);
            // Connect to restaurant room
            socket.emit('restaurant-connect', restaurantId);
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
        });
        
        // Listen for new orders
        socket.on('new-order', (data) => {
            console.log('🔔 New order received:', data);
            handleNewOrder(data.order);
        });
    }
}

// Handle new order notification
function handleNewOrder(order) {
    console.log('Processing new order:', order);
    
    // Show browser notification
    showBrowserNotification(order);
    
    // Play notification sound
    playNotificationSound();
    
    // Reload orders list
    loadOrders();
    
    // Show toast notification
    showToast(`🔔 Yeni Sipariş: ${order.customer.name} - ₺${order.totalAmount}`, 'success');
}

// Show browser notification
function showBrowserNotification(order) {
    if (Notification.permission === 'granted') {
        const notification = new Notification('🔔 Yeni Sipariş!', {
            body: `${order.customer.name} - ₺${order.totalAmount.toFixed(2)}`,
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

// Play notification sound
function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi+Gy/LTgTAGKnjG8OGRQAoUXrTr7KlVFApGn+DxvmshBTCHzPLSgjEGJ3fH8OGRQAoUXrTq66hVFApGnuDyvmwiBTCGy/LTgjAGKXfH8OGQQAEIZO3kn0wQClatyuLa0bFc');
        audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
        console.log('Sound not supported');
    }
}

// Load orders from API
async function loadOrders() {
    if (!restaurantId) return;
    
    try {
        console.log('Loading orders for restaurant:', restaurantId);
        
        // Use backend service (handles auth automatically)
        const orders = await window.backendService.makeRequest(`/orders/restaurant/${restaurantId}`);
        
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
    const processingOrders = orders.filter(o => ['preparing', 'ready'].includes(o.status));
    
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
        preparing: '#2196f3', 
        ready: '#4caf50',
        delivered: '#607d8b',
        cancelled: '#f44336'
    };
    
    const statusTexts = {
        pending: 'Bekliyor',
        preparing: 'Hazırlanıyor',
        ready: 'Hazır',
        delivered: 'Teslim Edildi',
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
                    <strong>Toplam: ₺${order.totalAmount.toFixed(2)}</strong>
                </div>
                <div class="order-actions">
                    ${order.status === 'pending' ? 
                        `<button onclick="updateOrderStatus('${order._id}', 'preparing')" class="btn-orange">Hazırla</button>` : ''
                    }
                    ${order.status === 'preparing' ? 
                        `<button onclick="updateOrderStatus('${order._id}', 'ready')" class="btn-green">Hazır</button>` : ''
                    }
                    ${order.status === 'ready' ? 
                        `<button onclick="updateOrderStatus('${order._id}', 'delivered')" class="btn-blue">Teslim</button>` : ''
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
        // Use backend service for API calls
        const response = await window.backendService.makeRequest(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response && response.success) {
            showToast('Sipariş durumu güncellendi', 'success');
            loadOrders();
        } else {
            showToast('Güncelleme başarısız', 'error');
        }
    } catch (error) {
        console.error('Update failed:', error);
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('restaurant-panel') || window.location.pathname.includes('restaurant')) {
        console.log('🍽️ Initializing orders system for path:', window.location.pathname);
        initializeOrdersSystem();
        
        // Refresh orders every 30 seconds
        setInterval(loadOrders, 30000);
    } else {
        console.log('🍽️ Orders system not initialized - path:', window.location.pathname);
    }
});

console.log('🍽️ Restaurant Orders System Loaded');