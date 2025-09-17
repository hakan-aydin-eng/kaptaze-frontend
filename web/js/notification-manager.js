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
            const response = await fetch('https://kaptaze-backend-api.onrender.com/admin/notifications/stats', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('kaptaze_auth_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    const data = result.data;

                    // Update statistics display
                    const totalConsumersEl = document.getElementById('totalConsumers');
                    const activeDevicesEl = document.getElementById('activeDevices');
                    const iosDevicesEl = document.getElementById('iosDevices');
                    const androidDevicesEl = document.getElementById('androidDevices');

                    if (totalConsumersEl) totalConsumersEl.textContent = data.consumers.total || 0;
                    if (activeDevicesEl) activeDevicesEl.textContent = data.pushTokens.total || 0;
                    if (iosDevicesEl) iosDevicesEl.textContent = data.pushTokens.byPlatform.ios || 0;
                    if (androidDevicesEl) androidDevicesEl.textContent = data.pushTokens.byPlatform.android || 0;

                    // Update configuration status
                    const configStatus = document.getElementById('firebaseStatus');
                    if (configStatus) {
                        configStatus.innerHTML = data.firebase.configured
                            ? '✅ Firebase yapılandırıldı'
                            : '⚠️ Firebase yapılandırılması gerekiyor (Mock mode)';
                        configStatus.className = data.firebase.configured ? 'status-success' : 'status-warning';
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
                const restaurants = result.data || [];

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

            // Mock data for now - will be replaced with API call
            const notifications = [
                {
                    id: 1,
                    title: "Yeni İndirim Kampanyası",
                    message: "%50 indirim fırsatını kaçırmayın!",
                    type: "promotion",
                    sentAt: "2025-01-15T10:30:00Z",
                    delivered: 156,
                    clicked: 23
                },
                {
                    id: 2,
                    title: "Yeni Restoran",
                    message: "Yakınınızda yeni restoran açıldı!",
                    type: "new_restaurant",
                    sentAt: "2025-01-14T15:45:00Z",
                    delivered: 89,
                    clicked: 12
                }
            ];

            historyContainer.innerHTML = this.renderNotificationHistory(notifications);
        } catch (error) {
            console.error('Failed to load notification history:', error);
            const historyContainer = document.getElementById('notificationHistory');
            if (historyContainer) {
                historyContainer.innerHTML = '<div class="error">Bildirim geçmişi yüklenemedi</div>';
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
                new_restaurant: '🏪 Yeni Restoran',
                city: '🏙️ Şehir'
            };

            const sentAt = new Date(notification.sentAt).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            html += `
                <tr>
                    <td>
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-preview">${notification.message}</div>
                    </td>
                    <td>
                        <span class="badge badge-${notification.type}">
                            ${typeLabels[notification.type] || notification.type}
                        </span>
                    </td>
                    <td>${sentAt}</td>
                    <td>
                        <span class="stat-number">${notification.delivered}</span>
                    </td>
                    <td>
                        <span class="stat-number">${notification.clicked}</span>
                        <span class="stat-percentage">(${Math.round((notification.clicked / notification.delivered) * 100)}%)</span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="notificationManager.viewDetails(${notification.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="notificationManager.resendNotification(${notification.id})">
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
                'general': 'genel',
                'promotion': 'promosyon',
                'city': 'şehir',
                'restaurant': 'restoran'
            };

            // Prepare notification data
            const notificationData = {
                type: typeMapping[type] || type,
                priority,
                title,
                message,
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