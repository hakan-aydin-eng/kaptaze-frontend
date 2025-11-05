// Notification Manager for KapTaze Admin Dashboard
const notificationManager = {

    // Initialize notification system
    init() {
        console.log('🔔 Initializing Notification Manager');
        this.loadNotificationStats();
        this.loadNotificationHistory();
        this.setupFormListeners();
    },

    // Load notification statistics
    async loadNotificationStats() {
        try {
            const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/notification-stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('kaptaze_auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const data = result.data;

                    // Update dashboard statistics
                    const totalNotificationsEl = document.querySelector('[data-stat="totalNotifications"]');
                    const reachedNotificationsEl = document.querySelector('[data-stat="reachedNotifications"]');
                    const favoriteNotificationsEl = document.querySelector('[data-stat="favoriteNotifications"]');
                    const proximityNotificationsEl = document.querySelector('[data-stat="proximityNotifications"]');

                    if (totalNotificationsEl) totalNotificationsEl.textContent = data.total || data.today || 0;
                    if (reachedNotificationsEl) reachedNotificationsEl.textContent = data.week || 0;
                    if (favoriteNotificationsEl) favoriteNotificationsEl.textContent = data.unread || 0;
                    if (proximityNotificationsEl) proximityNotificationsEl.textContent = data.total || 0;

                    // Update delivery rate display
                    const deliveryRateEl = document.querySelector('[data-stat="deliveryRate"]');
                    if (deliveryRateEl) {
                        const rate = data.averageDeliveryRate || 0;
                        deliveryRateEl.textContent = `${rate}%`;
                        deliveryRateEl.className = `delivery-rate ${rate >= 80 ? 'success' : rate >= 60 ? 'warning' : 'danger'}`;
                    }

                    console.log('✅ Notification stats loaded:', data);
                }
            } else {
                throw new Error('Failed to fetch notification stats');
            }

            // Load restaurants for restaurant-based notifications
            await this.loadRestaurants();

        } catch (error) {
            console.error('Failed to load notification stats:', error);
            // Fallback to mock data
            document.getElementById('totalConsumers').textContent = '---';
            document.getElementById('activeDevices').textContent = '---';
        }
    },

    // Load restaurants for restaurant-based notifications
    async loadRestaurants() {
        try {
            const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/restaurants', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('kaptaze_auth_token')}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const restaurants = Array.isArray(result.data) ? result.data : [];

                const restaurantSelect = document.getElementById('targetRestaurant');
                if (restaurantSelect) {
                    restaurantSelect.innerHTML = '<option value="">Restoran seçiniz...</option>';

                    restaurants.forEach(restaurant => {
                        const option = document.createElement('option');
                        option.value = restaurant._id;
                        option.textContent = `${restaurant.name} (${restaurant.category})`;
                        restaurantSelect.appendChild(option);
                    });

                    console.log(`✅ Loaded ${restaurants.length} restaurants`);
                }
            }
        } catch (error) {
            console.error('❌ Failed to load restaurants:', error);
        }
    },

    // Load notification history
    async loadNotificationHistory() {
        try {
            const historyContainer = document.getElementById('notificationHistory');
            if (!historyContainer) return;

            const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/notification-history?limit=20', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('kaptaze_auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    const notifications = Array.isArray(result.data) ? result.data : (result.data.notifications || []);
                    historyContainer.innerHTML = this.renderNotificationHistory(notifications);
                    console.log('✅ Notification history loaded:', notifications.length, 'notifications');
                } else {
                    throw new Error('Invalid response format');
                }
            } else {
                throw new Error('Failed to fetch notification history');
            }
        } catch (error) {
            console.error('❌ Failed to load notification history:', error);
            const historyContainer = document.getElementById('notificationHistory');
            if (historyContainer) {
                // Show fallback mock data
                const mockNotifications = [
                    {
                        id: 'mock-1',
                        title: "Bildirim Geçmişi",
                        message: "Backend'e bağlanılamadı, real-time veriler yüklenecek",
                        type: "general",
                        targetName: "All Users",
                        stats: { delivered: 0, failed: 0, total: 0, deliveryRate: 0 },
                        sentAt: new Date().toISOString(),
                        status: "pending"
                    }
                ];
                historyContainer.innerHTML = this.renderNotificationHistory(mockNotifications);
            }
        }
    },

    // Render notification history table
    renderNotificationHistory(notifications) {
        if (notifications.length === 0) {
            return '<div class="empty-state">Henüz bildirim gönderilmemiş</div>';
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Başlık</th>
                        <th>Tür</th>
                        <th>Gönderilme</th>
                        <th>Ulaşan</th>
                        <th>Tıklayan</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
        `;

        notifications.forEach(notification => {
            const typeLabels = {
                general: '🔔 Genel',
                promotion: '🔥 Promosyon',
                restaurant: '🍽️ Restoran',
                city: '🏙️ Şehir',
                test: '🧪 Test'
            };

            const sentAt = new Date(notification.sentAt || notification.createdAt).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Calculate delivery rate using real data
            const deliveryRate = notification.stats && notification.stats.validTokens > 0
                ? Math.round((notification.stats.successCount / notification.stats.validTokens) * 100)
                : (notification.deliveryRate || 0);

            const statusBadge = notification.status === 'completed'
                ? '<span class="status-badge success">✅ Tamamlandı</span>'
                : notification.status === 'failed'
                ? '<span class="status-badge error">❌ Başarısız</span>'
                : notification.status === 'sending'
                ? '<span class="status-badge warning">📤 Gönderiliyor</span>'
                : '<span class="status-badge pending">⏳ Beklemede</span>';

            // Get target information
            let targetInfo = 'Tüm Kullanıcılar';
            if (notification.targetType === 'city' && notification.targetDetails?.city) {
                targetInfo = `🏙️ ${notification.targetDetails.city}`;
            } else if (notification.targetType === 'restaurant' && notification.targetDetails?.restaurantName) {
                targetInfo = `🍽️ ${notification.targetDetails.restaurantName}`;
            } else if (notification.targetType === 'location' && notification.targetDetails?.coordinates) {
                const coords = notification.targetDetails.coordinates;
                const radius = notification.targetDetails.radius || 5;
                targetInfo = `📍 ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} (${radius}km)`;
            }

            // Calculate click rate (if available)
            const successCount = notification.stats?.successCount || 0;
            const clickCount = 0; // Not tracked yet
            const clickRate = successCount > 0 ? Math.round((clickCount / successCount) * 100) : 0;

            html += `
                <tr>
                    <td>
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-preview">${notification.message.substring(0, 50)}${notification.message.length > 50 ? '...' : ''}</div>
                        <div class="notification-target">📍 ${targetInfo}</div>
                    </td>
                    <td>
                        <span class="badge badge-${notification.type}">
                            ${typeLabels[notification.type] || notification.type}
                        </span>
                        <div class="priority-indicator priority-${notification.priority || 'normal'}">
                            ${notification.priority || 'normal'}
                        </div>
                    </td>
                    <td>
                        ${sentAt}
                        ${statusBadge}
                    </td>
                    <td>
                        <span class="stat-number">${successCount}</span>
                        <div class="stat-details">
                            <small>Toplam: ${notification.stats?.totalTokens || 0}</small><br>
                            <small>Başarı: ${deliveryRate}%</small>
                        </div>
                    </td>
                    <td>
                        <span class="stat-number">${clickCount}</span>
                        <span class="stat-percentage">(${clickRate}%)</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="notificationManager.viewDetails('${notification._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="notificationManager.resendNotification('${notification._id}')">
                            <i class="fas fa-redo"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;

        return html;
    },

    // Setup form event listeners
    setupFormListeners() {
        // Title input listener for preview
        const titleInput = document.getElementById('notificationTitle');
        if (titleInput) {
            titleInput.addEventListener('input', () => this.updatePreview());
        }

        // Message input listener for preview
        const messageInput = document.getElementById('notificationMessage');
        if (messageInput) {
            messageInput.addEventListener('input', () => this.updatePreview());
        }

        // Type change listener
        const typeSelect = document.getElementById('notificationType');
        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                this.toggleFormOptions();
                this.updatePreview();
            });
        }

        // City select listener
        const citySelect = document.getElementById('citySelect');
        if (citySelect) {
            citySelect.addEventListener('change', () => this.toggleCustomCoordinates());
        }
    },

    // Toggle form options based on notification type
    toggleFormOptions() {
        const typeSelect = document.getElementById('notificationType');
        const cityOptions = document.getElementById('cityOptions');
        const restaurantOptions = document.getElementById('restaurantOptions');

        if (!typeSelect || !cityOptions || !restaurantOptions) return;

        const selectedType = typeSelect.value;

        // Hide all options first
        cityOptions.style.display = 'none';
        restaurantOptions.style.display = 'none';

        // Show relevant options
        if (selectedType === 'city') {
            cityOptions.style.display = 'block';
        } else if (selectedType === 'restaurant') {
            restaurantOptions.style.display = 'block';
        }
    },

    // Toggle custom coordinates fields
    toggleCustomCoordinates() {
        const citySelect = document.getElementById('citySelect');
        const customCoordinates = document.getElementById('customCoordinates');

        if (!citySelect || !customCoordinates) return;

        if (citySelect.value === 'custom') {
            customCoordinates.style.display = 'block';
        } else {
            customCoordinates.style.display = 'none';
        }
    },

    // Update notification preview (if preview exists)
    updatePreview() {
        const title = document.getElementById('notificationTitle')?.value || 'Bildirim Başlığı';
        const message = document.getElementById('notificationMessage')?.value || 'Bildirim mesajınız burada görünecek';

        const previewTitle = document.getElementById('previewTitle');
        const previewMessage = document.getElementById('previewMessage');

        if (previewTitle) previewTitle.textContent = title;
        if (previewMessage) previewMessage.textContent = message;
    },

    // Send notification
    async sendNotification() {
        try {
            const type = document.getElementById('notificationType').value;
            const priority = document.getElementById('notificationPriority').value;
            const title = document.getElementById('notificationTitle').value.trim();
            const message = document.getElementById('notificationMessage').value.trim();

            // Validation
            if (!title) {
                alert('Lütfen bildirim başlığı girin');
                return;
            }

            if (!message) {
                alert('Lütfen bildirim mesajı girin');
                return;
            }

            if (title.length > 100) {
                alert('Başlık 100 karakterden uzun olamaz');
                return;
            }

            if (message.length > 500) {
                alert('Mesaj 500 karakterden uzun olamaz');
                return;
            }

            // Map form values to backend expected values
            const typeMapping = {
                'general': 'all',
                
                'city': 'city',
                'restaurant': 'restaurant'
            };

            // Prepare notification data
            const notificationData = {
                type: typeMapping[type] || type,
                priority,
                title,
                body: message,
                targetData: {}
            };

            // Add specific target data based on notification type
            if (type === 'city') {
                // Get city coordinates
                const citySelect = document.getElementById('citySelect');
                const radiusKm = parseInt(document.getElementById('radiusKm')?.value) || 5;

                if (citySelect?.value === 'custom') {
                    // Use custom coordinates
                    const latitude = parseFloat(document.getElementById('latitude')?.value);
                    const longitude = parseFloat(document.getElementById('longitude')?.value);

                    if (!latitude || !longitude) {
                        alert('Lütfen geçerli koordinatlar girin');
                        return;
                    }

                    notificationData.targetData = { latitude, longitude, radiusKm };
                } else {
                    // Use predefined city coordinates
                    const cityCoordinates = {
                        'istanbul': { latitude: 41.0082, longitude: 28.9784 },
                        'ankara': { latitude: 39.9334, longitude: 32.8597 },
                        'izmir': { latitude: 38.4192, longitude: 27.1287 },
                        'bursa': { latitude: 40.1826, longitude: 29.0669 },
                        'antalya': { latitude: 36.8969, longitude: 30.7133 }
                    };

                    const coords = cityCoordinates[citySelect?.value];
                    if (!coords) {
                        alert('Lütfen bir şehir seçin');
                        return;
                    }

                    notificationData.targetData = {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        radiusKm
                    };
                }
            } else if (type === 'restaurant') {
                // Get selected restaurant
                const restaurantId = document.getElementById('targetRestaurant')?.value;
                if (!restaurantId) {
                    alert('Lütfen bir restoran seçin');
                    return;
                }
                notificationData.targetData.restaurantId = restaurantId;
            }

            console.log('Sending notification:', notificationData);

            // Show loading state
            const sendButton = document.querySelector('button[onclick="notificationManager.sendNotification()"]');
            const originalText = sendButton.innerHTML;
            sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
            sendButton.disabled = true;

            // Make API call to backend
            const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/notifications/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('kaptaze_auth_token')}`
                },
                body: JSON.stringify(notificationData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Show success message with details
                const successMsg = `✅ Bildirim başarıyla gönderildi!\n\nTür: ${type}\nUlaşan: ${result.data.successCount || 'Bilinmiyor'}\nToplam token: ${result.data.tokenCount || 'Bilinmiyor'}`;
                alert(successMsg);

                // Reset form
                this.resetForm();

                // Refresh data
                this.loadNotificationHistory();
                this.loadNotificationStats();
            } else {
                throw new Error(result.error || 'Bildirim gönderilemedi');
            }

            // Restore button
            sendButton.innerHTML = originalText;
            sendButton.disabled = false;

        } catch (error) {
            console.error('Failed to send notification:', error);
            alert(`❌ Bildirim gönderilemedi: ${error.message}`);

            // Restore button
            const sendButton = document.querySelector('button[onclick="notificationManager.sendNotification()"]');
            if (sendButton) {
                sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Gönder';
                sendButton.disabled = false;
            }
        }
    },

    // Send test notification
    async sendTestNotification() {
        try {
            console.log('Sending test notification...');

            const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/notifications/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('kaptaze_auth_token')}`
                },
                body: JSON.stringify({
                    email: 'test@kaptaze.com'
                })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('✅ Test bildirimi gönderildi!');
            } else {
                throw new Error(result.error || 'Test bildirimi gönderilemedi');
            }

        } catch (error) {
            console.error('Failed to send test notification:', error);
            alert(`❌ Test bildirimi gönderilemedi: ${error.message}`);
        }
    },

    // Reset notification form
    resetForm() {
        const form = document.querySelector('.notification-form');
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.type === 'select-one') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            });
        }

        // Hide optional sections
        document.getElementById('cityOptions').style.display = 'none';
        document.getElementById('restaurantOptions').style.display = 'none';
        document.getElementById('customCoordinates').style.display = 'none';

        // Reset specific values
        document.getElementById('radiusKm').value = '5';

        // Reset preview
        this.updatePreview();
    },

    // Refresh notifications
    async refreshNotifications() {
        console.log('Refreshing notifications...');
        await Promise.all([
            this.loadNotificationStats(),
            this.loadNotificationHistory()
        ]);
    },

    // View notification details
    viewDetails(notificationId) {
        console.log('Viewing notification details:', notificationId);
        // Implementation for viewing details
        alert(`Bildirim detayları: ${notificationId}`);
    },

    // Resend notification
    async resendNotification(notificationId) {
        console.log('Resending notification:', notificationId);
        if (confirm('Bu bildirimi tekrar göndermek istediğinize emin misiniz?')) {
            // Implementation for resending
            alert('Bildirim tekrar gönderiliyor...');
        }
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the notifications page
    if (document.getElementById('notifications')) {
        notificationManager.init();
    }
});

console.log('🔔 Notification Manager loaded');