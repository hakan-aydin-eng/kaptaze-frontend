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
            // Mock data for now - will be replaced with API call
            const stats = {
                total: 1247,
                delivered: 1156,
                favorites: 234,
                proximity: 89
            };

            document.getElementById('totalNotifications').textContent = stats.total;
            document.getElementById('deliveredNotifications').textContent = stats.delivered;
            document.getElementById('favoriteNotifications').textContent = stats.favorites;
            document.getElementById('proximityNotifications').textContent = stats.proximity;
        } catch (error) {
            console.error('Failed to load notification stats:', error);
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
            typeSelect.addEventListener('change', () => this.updatePreview());
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

            if (title.length > 50) {
                alert('Başlık 50 karakterden uzun olamaz');
                return;
            }

            if (message.length > 200) {
                alert('Mesaj 200 karakterden uzun olamaz');
                return;
            }

            // Prepare notification data
            const notificationData = {
                type,
                priority,
                title,
                message,
                timestamp: new Date().toISOString()
            };

            console.log('Sending notification:', notificationData);

            // Show loading state
            const sendButton = document.querySelector('button[onclick="notificationManager.sendNotification()"]');
            const originalText = sendButton.innerHTML;
            sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
            sendButton.disabled = true;

            // Here you would make API call to backend
            // For now, simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show success message
            alert('Bildirim başarıyla gönderildi!');

            // Reset form
            this.resetForm();

            // Refresh history
            this.loadNotificationHistory();
            this.loadNotificationStats();

            // Restore button
            sendButton.innerHTML = originalText;
            sendButton.disabled = false;

        } catch (error) {
            console.error('Failed to send notification:', error);
            alert('Bildirim gönderilemedi. Lütfen tekrar deneyin.');

            // Restore button
            const sendButton = document.querySelector('button[onclick="notificationManager.sendNotification()"]');
            if (sendButton) {
                sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Gönder';
                sendButton.disabled = false;
            }
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