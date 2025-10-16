// Restaurant Orders Management System - Production Version
const API_URL = 'https://kaptaze-backend-api.onrender.com';
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

    // Initialize notification badge (start with 0)
    updateNotificationBadge();
}

// Request browser notification permission and audio permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }

    // Initialize AudioContext on user interaction to unlock audio
    // This prevents "NotAllowedError: play() failed because the user didn't interact with the document first"
    const unlockAudio = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContext();

            // Play silent sound to unlock audio
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            gainNode.gain.value = 0; // Silent
            oscillator.start(0);
            oscillator.stop(0.1);

            console.log('✅ Audio unlocked - notifications will have sound');

            // Store AudioContext for later use
            window.restaurantAudioContext = audioContext;

            // Remove listener after first interaction
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        } catch (e) {
            console.log('Audio unlock failed:', e);
        }
    };

    // Wait for user interaction
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
}

// Initialize Socket.IO connection
function initializeSocket() {
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
        });
        
        socket.on('disconnect', () => {
            console.log('❌ Socket.IO disconnected');
        });
        
        // Listen for new orders (support both event names and formats for compatibility)
        socket.on('new-order', (data) => {
            console.log('🔔 New order received (new-order):', data);

            // Handle different data formats from backend
            let order = null;
            if (data.order) {
                // Format 1: { order: {...}, message: "..." } ✅ FULL ORDER (preferred!)
                console.log('✅ Received FULL order object with customer phone');
                order = data.order;
            } else if (data.orderId && data.customerName) {
                // Format 2: MINIMAL DATA (legacy - shouldn't happen with new backend)
                console.warn('⚠️ Received minimal order data (legacy format) - creating fallback');

                // Create pseudo-order for popup (better than no notification!)
                order = {
                    _id: data.orderId,
                    customer: {
                        name: data.customerName,
                        phone: data.customerPhone || 'N/A' // May not be available
                    },
                    totalPrice: data.totalAmount || 0,
                    items: data.items || [],
                    paymentMethod: data.paymentMethod || 'online'
                };

                console.log('🔨 Created pseudo-order for popup:', order);

                // Still reload orders to get full details
                loadOrders();
            } else if (data._id && data.customer) {
                // Format 3: Direct order object
                console.log('✅ Received direct order object');
                order = data;
            } else {
                console.error('❌ Invalid order data format:', data);
            }

            if (order) {
                handleNewOrder(order);
            } else {
                console.error('❌ Could not process order notification');
            }
        });

        socket.on('newOrder', (data) => {
            console.log('🔔 New order received (newOrder):', data);

            // Same handling for newOrder event
            let order = data.order || data;
            if (order) {
                handleNewOrder(order);
            }
        });
    }
}

// Handle new order notification (unified format)
function handleNewOrder(order) {
    console.log('🎯 Processing new order (unified format):', order);

    // Show browser notification
    console.log('📢 Showing browser notification...');
    showBrowserNotification(order);

    // Play notification sound (enhanced)
    console.log('🔊 Playing notification sound...');
    playNotificationSound();

    // Reload orders list
    console.log('🔄 Reloading orders list...');
    loadOrders();

    // Show PERSISTENT toast notification (doesn't auto-close)
    console.log('🎨 Showing persistent popup notification...');
    showPersistentOrderNotification(order);

    // Add to notification panel (unified format)
    console.log('🔔 Adding to notification panel...');
    addNotificationToPanel(order);

    // Update notification badge count
    console.log('🔢 Updating notification badge...');
    updateNotificationBadge();

    console.log('✅ All notification handlers completed!');
}

// Add notification to panel (unified format)
function addNotificationToPanel(order) {
    const notificationList = document.getElementById('notification-list');
    if (!notificationList) return;

    // Remove "no notifications" message if exists
    const emptyMessage = notificationList.querySelector('[style*="text-align: center"]');
    if (emptyMessage) {
        emptyMessage.remove();
    }

    // Create notification item (unified format: order.customer.name, order.totalPrice)
    const notificationItem = document.createElement('div');
    notificationItem.className = 'notification-item unread';
    notificationItem.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
        <div>
            <p>Yeni sipariş: ${order.customer?.name || 'Müşteri'} - ₺${(order.totalPrice || 0).toFixed(2)}</p>
            <span>Şimdi</span>
        </div>
    `;

    // Add click handler to navigate to orders
    notificationItem.onclick = () => {
        if (window.showSection) {
            window.showSection('orders', null);
        }
        notificationItem.classList.remove('unread');
        updateNotificationBadge();
    };

    // Add to top of list
    notificationList.insertBefore(notificationItem, notificationList.firstChild);

    // Keep only last 20 notifications
    const notifications = notificationList.querySelectorAll('.notification-item');
    if (notifications.length > 20) {
        notifications[notifications.length - 1].remove();
    }
}

// Update notification badge count
function updateNotificationBadge() {
    const badge = document.getElementById('notification-count');
    if (!badge) return;

    const notificationList = document.getElementById('notification-list');
    if (!notificationList) return;

    const unreadCount = notificationList.querySelectorAll('.notification-item.unread').length;

    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
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

// Play enhanced notification sound (Web Audio API - more reliable)
function playNotificationSound() {
    try {
        console.log('🔊 Playing notification sound...');

        // Use stored AudioContext or create new one
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = window.restaurantAudioContext || new AudioContext();

        // Play 5 beeps for better attention
        const playBeep = (count = 0) => {
            if (count < 5) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                // Bell-like sound (higher frequency)
                oscillator.frequency.value = 800; // 800 Hz - pleasant notification sound
                oscillator.type = 'sine';

                // Volume envelope (fade in/out for pleasant sound)
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
                gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);

                console.log(`🔔 Beep ${count + 1}/5`);

                // Play next beep after 400ms
                setTimeout(() => playBeep(count + 1), 400);
            }
        };

        playBeep();

    } catch (e) {
        console.error('❌ Sound playback failed:', e);

        // Fallback: Try simple beep
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi+Gy/LTgTAGKnjG8OGRQAoUXrTr7KlVFApGn+DxvmshBTCHzPLSgjEGJ3fH8OGRQAoUXrTq66hVFApGnuDyvmwiBTCGy/LTgjAGKXfH8OGQQAEIZO3kn0wQClatyuLa0bFc');
            audio.volume = 0.5;
            audio.play().catch(err => console.log('Fallback sound also failed:', err));
        } catch (fallbackError) {
            console.log('⚠️ All sound methods failed - browser may block audio');
        }
    }
}

// Kalıcı sipariş bildirimi (otomatik kapanmaz)
function showPersistentOrderNotification(order) {
    console.log('🎨 Creating persistent popup for order:', order._id);

    // Mevcut bildirimleri temizle
    const existingNotifications = document.querySelectorAll('.persistent-order-notification');
    console.log('🧹 Removing', existingNotifications.length, 'existing notifications');
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
                <strong>${order.customer?.name || 'Müşteri'}</strong>
                <div class="phone">📞 ${order.customer?.phone || 'N/A'}</div>
            </div>
            <div class="order-total">₺${(order.totalPrice || 0).toFixed(2)}</div>
        </div>
        <div class="notification-actions">
            <button class="acknowledge-btn" onclick="handleOrderAcknowledgment('${order._id}', this.parentElement.parentElement)">
                👁️ GÖRDÜM
            </button>
            <button class="details-btn" onclick="showOrderDetails('${order._id}'); this.parentElement.parentElement.remove();">
                📋 Detaylar
            </button>
        </div>
    `;

    // MUCH MORE VISIBLE STYLING
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 30px;
        width: 400px;
        max-width: 90vw;
        background: linear-gradient(135deg, #059669, #047857);
        color: white;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(5, 150, 105, 0.6), 0 0 0 4px rgba(16, 185, 129, 0.4);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
        overflow: hidden;
        animation: slideInBounce 0.6s ease-out, pulseBorder 2s infinite;
        border: 3px solid #10b981;
        backdrop-filter: blur(10px);
    `;
    
    // Animasyon stilleri ekle
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            @keyframes slideInBounce {
                0% { transform: translateX(120%) scale(0.8); opacity: 0; }
                60% { transform: translateX(-10px) scale(1.05); opacity: 1; }
                80% { transform: translateX(5px) scale(0.98); }
                100% { transform: translateX(0) scale(1); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0) scale(1); opacity: 1; }
                to { transform: translateX(120%) scale(0.8); opacity: 0; }
            }
            @keyframes pulseBorder {
                0%, 100% {
                    box-shadow: 0 20px 60px rgba(5, 150, 105, 0.6), 0 0 0 4px rgba(16, 185, 129, 0.4);
                }
                50% {
                    box-shadow: 0 20px 60px rgba(5, 150, 105, 0.9), 0 0 0 6px rgba(16, 185, 129, 0.7);
                    transform: scale(1.02);
                }
            }
            .persistent-order-notification .notification-header {
                display: flex;
                align-items: center;
                padding: 20px;
                background: rgba(0, 0, 0, 0.15);
                font-weight: bold;
            }
            .persistent-order-notification .notification-icon {
                font-size: 32px;
                margin-right: 12px;
                animation: ring 1s ease-in-out infinite;
            }
            @keyframes ring {
                0%, 100% { transform: rotate(0deg); }
                10%, 30% { transform: rotate(-10deg); }
                20%, 40% { transform: rotate(10deg); }
            }
            .persistent-order-notification .notification-title {
                flex: 1;
                font-size: 20px;
                font-weight: 900;
                letter-spacing: 0.5px;
            }
            .persistent-order-notification .notification-close {
                font-size: 28px;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                line-height: 1;
                transition: all 0.2s;
            }
            .persistent-order-notification .notification-close:hover {
                background: rgba(255, 255, 255, 0.4);
                transform: rotate(90deg);
            }
            .persistent-order-notification .notification-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                gap: 15px;
            }
            .persistent-order-notification .customer-info {
                flex: 1;
            }
            .persistent-order-notification .customer-info strong {
                font-size: 18px;
                display: block;
                margin-bottom: 8px;
                font-weight: 700;
            }
            .persistent-order-notification .phone {
                font-size: 15px;
                opacity: 0.95;
            }
            .persistent-order-notification .order-total {
                font-size: 24px;
                font-weight: bold;
                text-align: right;
            }
            .persistent-order-notification .notification-actions {
                padding: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.2);
                display: flex;
                gap: 12px;
            }
            .persistent-order-notification .acknowledge-btn {
                flex: 1;
                padding: 16px;
                background: #ffffff;
                color: #059669;
                border: none;
                border-radius: 12px;
                font-weight: 900;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .persistent-order-notification .acknowledge-btn:hover {
                background: #f0fdf4;
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
            }
            .persistent-order-notification .acknowledge-btn:active {
                transform: translateY(-1px) scale(1.02);
            }
            .persistent-order-notification .details-btn {
                padding: 16px 24px;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 2px solid rgba(255, 255, 255, 0.4);
                border-radius: 12px;
                cursor: pointer;
                font-size: 15px;
                font-weight: 700;
                transition: all 0.3s ease;
            }
            .persistent-order-notification .details-btn:hover {
                background: rgba(255, 255, 255, 0.35);
                border-color: rgba(255, 255, 255, 0.6);
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);

    console.log('✅ Persistent notification added to DOM!');
    console.log('📍 Notification position:', {
        top: notification.style.top,
        right: notification.style.right,
        zIndex: notification.style.zIndex,
        display: notification.style.display || 'block'
    });
    console.log('🎯 Notification element:', notification);

    // Force reflow to ensure animation triggers
    notification.offsetHeight;

    console.log('🔔 Persistent notification fully rendered for order:', order._id);
}

// Sipariş onaylama işlemi
// Handle order acknowledgment (GÖRDÜM butonu)
async function handleOrderAcknowledgment(orderId, notificationElement) {
    console.log('👁️ Acknowledging order (GÖRDÜM):', orderId);

    try {
        // Backend'e siparişi gördüğünü bildir (unified format)
        const response = await fetch(`${API_URL}/restaurant/orders/${orderId}/acknowledge`, {
            method: 'PATCH',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to acknowledge order');
        }

        const result = await response.json();
        console.log('✅ Order acknowledged:', result);

        // Persistent notification'ı kapat
        notificationElement.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            notificationElement.remove();
        }, 300);

        // Başarı mesajı
        showToast('👁️ Sipariş görüldü olarak işaretlendi', 'success');

        // Siparişler listesini yenile
        loadOrders();

    } catch (error) {
        console.error('❌ Error acknowledging order:', error);
        showToast('❌ Sipariş işaretlenirken hata oluştu', 'error');
    }
}

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
                <span class="order-id">#${order.pickupCode || order.orderId || order._id}</span>
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