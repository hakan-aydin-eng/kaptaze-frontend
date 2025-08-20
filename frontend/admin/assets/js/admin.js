// KAPTAZEAPPV5 Admin Panel JavaScript
// Türkçe mesajlar ve fonksiyonlar ile

class KapTazeAdmin {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.currentUser = null;
        this.socket = null;
        
        this.init();
    }

    // Başlangıç fonksiyonu
    init() {
        this.checkAuth();
        this.initEventListeners();
        this.loadDashboardData();
        this.initRealTimeUpdates();
        
        console.log('🚀 KAPTAZEAPPV5 Admin Panel başlatıldı');
    }

    // Olay dinleyicilerini başlat
    initEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Çıkış butonu
        document.querySelector('[href="#cikis"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Bildirim butonu
        document.querySelector('[data-lucide="bell"]')?.parentElement?.addEventListener('click', () => {
            this.showNotifications();
        });

        // Responsive sidebar toggle
        this.setupResponsiveSidebar();
    }

    // Kimlik doğrulama kontrolü
    checkAuth() {
        const token = localStorage.getItem('kaptaze_admin_token');
        if (!token) {
            this.redirectToLogin();
            return;
        }

        // Token geçerliliğini kontrol et
        this.validateToken(token).then(isValid => {
            if (!isValid) {
                this.redirectToLogin();
            }
        });
    }

    // Token doğrulama
    async validateToken(token) {
        try {
            const response = await fetch(`${this.apiUrl}/admin/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.admin;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token doğrulama hatası:', error);
            return false;
        }
    }

    // Giriş sayfasına yönlendir
    redirectToLogin() {
        window.location.href = '/admin/login.html';
    }

    // Dashboard verilerini yükle
    async loadDashboardData() {
        try {
            this.showLoading('Dashboard verileri yükleniyor...');
            
            const [stats, orders, restaurants] = await Promise.all([
                this.fetchStats(),
                this.fetchRecentOrders(),
                this.fetchTopRestaurants()
            ]);

            this.updateStatsCards(stats);
            this.updateOrdersTable(orders);
            this.updatePopularCategories(restaurants);
            
            this.hideLoading();
            this.showToast('Dashboard verileri başarıyla yüklendi', 'success');
            
        } catch (error) {
            console.error('Dashboard yükleme hatası:', error);
            this.showToast('Dashboard verileri yüklenirken hata oluştu', 'error');
            this.hideLoading();
        }
    }

    // İstatistikleri getir
    async fetchStats() {
        const response = await fetch(`${this.apiUrl}/admin/stats`, {
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('İstatistikler alınamadı');
        return await response.json();
    }

    // Son siparişleri getir
    async fetchRecentOrders() {
        const response = await fetch(`${this.apiUrl}/admin/orders/recent`, {
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Siparişler alınamadı');
        return await response.json();
    }

    // En iyi restoranları getir
    async fetchTopRestaurants() {
        const response = await fetch(`${this.apiUrl}/admin/restaurants/top`, {
            headers: this.getAuthHeaders()
        });
        
        if (!response.ok) throw new Error('Restoran verileri alınamadı');
        return await response.json();
    }

    // İstatistik kartlarını güncelle
    updateStatsCards(stats) {
        const cards = [
            { selector: '.stat-card:nth-child(1) .text-3xl', value: stats.toplamKullanici || 1247 },
            { selector: '.stat-card:nth-child(2) .text-3xl', value: stats.aktifRestoran || 89 },
            { selector: '.stat-card:nth-child(3) .text-3xl', value: stats.gunlukSiparis || 234 },
            { selector: '.stat-card:nth-child(4) .text-3xl', value: `₺${(stats.aylikGelir || 45680).toLocaleString('tr-TR')}` }
        ];

        cards.forEach(card => {
            const element = document.querySelector(card.selector);
            if (element) {
                this.animateCounter(element, card.value);
            }
        });
    }

    // Sayaç animasyonu
    animateCounter(element, targetValue) {
        const isMonetary = typeof targetValue === 'string' && targetValue.includes('₺');
        const numericValue = isMonetary ? 
            parseInt(targetValue.replace(/[^\d]/g, '')) : 
            parseInt(targetValue);
        
        const currentValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        const increment = Math.ceil((numericValue - currentValue) / 20);
        
        const timer = setInterval(() => {
            const current = parseInt(element.textContent.replace(/[^\d]/g, ''));
            if (current < numericValue) {
                const newValue = Math.min(current + increment, numericValue);
                element.textContent = isMonetary ? 
                    `₺${newValue.toLocaleString('tr-TR')}` : 
                    newValue.toLocaleString('tr-TR');
            } else {
                clearInterval(timer);
            }
        }, 50);
    }

    // Siparişler tablosunu güncelle
    updateOrdersTable(orders) {
        const tableBody = document.querySelector('tbody');
        if (!tableBody || !orders.siparisler) return;

        const rows = orders.siparisler.map(order => `
            <tr class="hover:bg-gray-50 table-row">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">#${order.id}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${order.musteri}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${order.restoran}</td>
                <td class="px-6 py-4 text-sm text-gray-700">₺${order.tutar.toFixed(2)}</td>
                <td class="px-6 py-4">
                    <span class="status-badge status-${this.getStatusClass(order.durum)}">
                        ${this.getStatusText(order.durum)}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">${this.formatDate(order.tarih)}</td>
            </tr>
        `).join('');

        tableBody.innerHTML = rows;
    }

    // Durum sınıfını getir
    getStatusClass(status) {
        const statusMap = {
            'preparing': 'preparing',
            'ready': 'ready',
            'completed': 'completed',
            'cancelled': 'cancelled'
        };
        return statusMap[status] || 'preparing';
    }

    // Durum metnini getir
    getStatusText(status) {
        const statusTexts = {
            'preparing': 'Hazırlanıyor',
            'ready': 'Hazır',
            'completed': 'Tamamlandı',
            'cancelled': 'İptal Edildi'
        };
        return statusTexts[status] || 'Bilinmiyor';
    }

    // Tarihi formatla
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    }

    // Popüler kategorileri güncelle
    updatePopularCategories(restaurants) {
        // Bu fonksiyon restoran verilerine göre kategorileri güncelleyecek
        // Şimdilik statik veri kullanıyoruz
    }

    // Navigation işlemi
    handleNavigation(e) {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        
        // Aktif sınıfı güncelle
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('bg-green-600', 'text-white');
        });
        e.currentTarget.classList.add('bg-green-600', 'text-white');

        // Sayfa içeriğini yükle
        this.loadPageContent(href);
    }

    // Sayfa içeriğini yükle
    async loadPageContent(page) {
        try {
            this.showLoading(`${this.getPageTitle(page)} yükleniyor...`);
            
            // Sayfa içeriğini getir ve göster
            await this.renderPage(page);
            
            this.hideLoading();
        } catch (error) {
            console.error('Sayfa yükleme hatası:', error);
            this.showToast('Sayfa yüklenirken hata oluştu', 'error');
            this.hideLoading();
        }
    }

    // Sayfa başlığını getir
    getPageTitle(page) {
        const titles = {
            '#dashboard': 'Ana Sayfa',
            '#restoranlar': 'Restoranlar',
            '#kullanicilar': 'Kullanıcılar',
            '#siparisler': 'Siparişler',
            '#paketler': 'Paketler',
            '#raporlar': 'Raporlar',
            '#ayarlar': 'Ayarlar'
        };
        return titles[page] || 'Sayfa';
    }

    // Sayfa render et
    async renderPage(page) {
        const main = document.querySelector('main');
        const header = document.querySelector('header h2');
        
        header.textContent = this.getPageTitle(page);
        
        switch(page) {
            case '#restoranlar':
                main.innerHTML = await this.renderRestaurantsPage();
                break;
            case '#kullanicilar':
                main.innerHTML = await this.renderUsersPage();
                break;
            case '#siparisler':
                main.innerHTML = await this.renderOrdersPage();
                break;
            // Diğer sayfalar...
            default:
                // Dashboard içeriğini göster
                break;
        }
    }

    // Restoran sayfası
    async renderRestaurantsPage() {
        return `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Restoran Yönetimi</h3>
                    <button class="btn btn-primary">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        Yeni Restoran Ekle
                    </button>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="mb-4 flex space-x-4">
                        <input type="text" placeholder="Restoran ara..." class="form-input flex-1">
                        <select class="form-input w-48">
                            <option>Tüm Kategoriler</option>
                            <option>Et & Kebap</option>
                            <option>Vegan</option>
                            <option>Kahve & Pasta</option>
                        </select>
                        <button class="btn btn-secondary">Filtrele</button>
                    </div>
                    
                    <div class="text-center py-8">
                        <p class="text-gray-500">Restoran listesi yükleniyor...</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Kullanıcı sayfası
    async renderUsersPage() {
        return `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Kullanıcı Yönetimi</h3>
                    <button class="btn btn-primary">
                        <i data-lucide="user-plus" class="w-4 h-4 mr-2"></i>
                        Kullanıcı Dışa Aktar
                    </button>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="text-center py-8">
                        <p class="text-gray-500">Kullanıcı listesi yükleniyor...</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Sipariş sayfası
    async renderOrdersPage() {
        return `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold">Sipariş Yönetimi</h3>
                    <div class="flex space-x-2">
                        <button class="btn btn-secondary">Excel'e Aktar</button>
                        <button class="btn btn-primary">Yenile</button>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="text-center py-8">
                        <p class="text-gray-500">Sipariş listesi yükleniyor...</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Gerçek zamanlı güncellemeler
    initRealTimeUpdates() {
        // Her 30 saniyede bir verileri güncelle
        setInterval(() => {
            this.loadDashboardData();
        }, 30000);

        // WebSocket bağlantısı (opsiyonel)
        this.connectWebSocket();
    }

    // WebSocket bağlantısı
    connectWebSocket() {
        if (this.socket) return;

        try {
            this.socket = new WebSocket('ws://localhost:5000');
            
            this.socket.onopen = () => {
                console.log('WebSocket bağlantısı kuruldu');
            };

            this.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };

            this.socket.onclose = () => {
                console.log('WebSocket bağlantısı kapatıldı');
                // 5 saniye sonra yeniden bağlan
                setTimeout(() => this.connectWebSocket(), 5000);
            };
        } catch (error) {
            console.error('WebSocket bağlantı hatası:', error);
        }
    }

    // Gerçek zamanlı güncelleme işle
    handleRealTimeUpdate(data) {
        switch(data.type) {
            case 'new_order':
                this.showToast(`Yeni sipariş alındı: #${data.orderId}`, 'info');
                this.loadDashboardData();
                break;
            case 'order_completed':
                this.showToast(`Sipariş tamamlandı: #${data.orderId}`, 'success');
                break;
            case 'new_restaurant':
                this.showToast(`Yeni restoran eklendi: ${data.restaurantName}`, 'info');
                break;
        }
    }

    // Çıkış işlemi
    logout() {
        if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
            localStorage.removeItem('kaptaze_admin_token');
            this.showToast('Başarıyla çıkış yaptınız', 'success');
            setTimeout(() => {
                this.redirectToLogin();
            }, 1000);
        }
    }

    // Bildirimleri göster
    showNotifications() {
        this.showToast('Yeni bildirimleriniz yok', 'info');
    }

    // Auth headers
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${localStorage.getItem('kaptaze_admin_token')}`,
            'Content-Type': 'application/json'
        };
    }

    // Loading göster
    showLoading(message = 'Yükleniyor...') {
        const loadingHtml = `
            <div id="loading-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                    <div class="loading-spinner"></div>
                    <span class="text-gray-700">${message}</span>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingHtml);
    }

    // Loading gizle
    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Toast bildirim göster
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Responsive sidebar
    setupResponsiveSidebar() {
        if (window.innerWidth <= 1024) {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.querySelector('.ml-64');
            
            if (sidebar && mainContent) {
                sidebar.classList.add('-translate-x-full');
                mainContent.classList.remove('ml-64');
                
                // Hamburger menu ekleme
                this.addHamburgerMenu();
            }
        }
    }

    // Hamburger menu ekle
    addHamburgerMenu() {
        const header = document.querySelector('header .flex');
        if (header) {
            const hamburger = document.createElement('button');
            hamburger.className = 'lg:hidden p-2 text-gray-600 hover:text-gray-800';
            hamburger.innerHTML = '<i data-lucide="menu" class="w-6 h-6"></i>';
            
            hamburger.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.toggle('-translate-x-full');
            });
            
            header.prepend(hamburger);
            lucide.createIcons();
        }
    }
}

// Admin panel başlat
document.addEventListener('DOMContentLoaded', () => {
    window.kapTazeAdmin = new KapTazeAdmin();
});