// KAPTAZEAPPV5 Web Application
// Türkçe kullanıcı arayüzü ile

class KapTazeWebApp {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.currentUser = null;
        this.currentLocation = 'Antalya';
        this.activeFilter = 'all';
        this.restaurants = [];
        this.promotedRestaurants = [];
        this.displayedCount = 6;
        this.isLoading = false;
        
        this.init();
    }

    // Uygulamayı başlat
    init() {
        this.setupEventListeners();
        this.checkUserAuth();
        this.requestLocationPermission();
        this.loadInitialData();
        this.startRealTimeUpdates();
        
        console.log('🚀 KAPTAZEAPPV5 Web App başlatıldı');
    }

    // Event listeners'ları ayarla
    setupEventListeners() {
        // Navigation buttons
        document.getElementById('login-btn')?.addEventListener('click', () => this.showLoginModal());
        document.getElementById('register-btn')?.addEventListener('click', () => this.showRegisterModal());
        document.getElementById('explore-btn')?.addEventListener('click', () => this.scrollToRestaurants());
        document.getElementById('location-btn')?.addEventListener('click', () => this.requestLocationPermission());
        document.getElementById('map-view-btn')?.addEventListener('click', () => this.showMapView());
        document.getElementById('load-more-btn')?.addEventListener('click', () => this.loadMoreRestaurants());

        // Category filters
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleFilterChange(e));
        });

        // Sort dropdown
        document.getElementById('sort-select')?.addEventListener('change', (e) => this.handleSortChange(e));

        // Mobile menu
        document.getElementById('mobile-menu-btn')?.addEventListener('click', () => this.toggleMobileMenu());

        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => this.handleSmoothScroll(e));
        });

        // Infinite scroll
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Resize handler for responsive design
        window.addEventListener('resize', () => this.handleResize());
    }

    // Kullanıcı kimlik doğrulamasını kontrol et
    checkUserAuth() {
        const token = localStorage.getItem('kaptaze_token');
        if (token) {
            this.validateToken(token).then(isValid => {
                if (isValid) {
                    this.updateUIForLoggedInUser();
                } else {
                    localStorage.removeItem('kaptaze_token');
                }
            });
        }
    }

    // Token doğrula
    async validateToken(token) {
        try {
            const response = await fetch(`${this.apiUrl}/kullanici/profil`, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.kullanici;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token doğrulama hatası:', error);
            return false;
        }
    }

    // Giriş yapmış kullanıcı için UI'ı güncelle
    updateUIForLoggedInUser() {
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn && this.currentUser) {
            loginBtn.textContent = `Merhaba, ${this.currentUser.ad}`;
            loginBtn.onclick = () => this.showUserMenu();
        }
    }

    // Konum izni iste
    async requestLocationPermission() {
        if (!navigator.geolocation) {
            this.showToast('Tarayıcınız konum servisleri desteklemiyor', 'warning');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                });
            });

            const { latitude, longitude } = position.coords;
            const locationName = await this.getLocationName(latitude, longitude);
            
            this.currentLocation = locationName;
            this.updateLocationDisplay();
            this.loadRestaurantsNearby(latitude, longitude);
            
        } catch (error) {
            console.error('Konum alma hatası:', error);
            this.showToast('Konum alınamadı, varsayılan konum kullanılıyor', 'info');
        }
    }

    // Konum adını al (reverse geocoding)
    async getLocationName(lat, lng) {
        try {
            // Bu örnekte basit bir yaklaşım kullanıyoruz
            // Gerçek uygulamada Google Maps API veya benzeri servis kullanılabilir
            return 'Antalya, Muratpaşa'; // Örnek konum
        } catch (error) {
            return 'Antalya';
        }
    }

    // Konum görünümünü güncelle
    updateLocationDisplay() {
        const locationElement = document.getElementById('user-location');
        if (locationElement) {
            locationElement.textContent = this.currentLocation;
        }
    }

    // İlk verileri yükle
    async loadInitialData() {
        try {
            this.showLoading('Restoranlar yükleniyor...');
            
            await Promise.all([
                this.loadPromotedRestaurants(),
                this.loadRestaurants(),
                this.loadStats()
            ]);
            
            this.hideLoading();
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            this.showToast('Veriler yüklenirken hata oluştu', 'error');
            this.hideLoading();
        }
    }

    // Önerilen restoranları yükle
    async loadPromotedRestaurants() {
        try {
            const response = await fetch(`${this.apiUrl}/restoran/onerilen`);
            if (response.ok) {
                const data = await response.json();
                this.promotedRestaurants = data.restoranlar || [];
                this.renderPromotedRestaurants();
            }
        } catch (error) {
            console.error('Önerilen restoranlar yükleme hatası:', error);
        }
    }

    // Restoranları yükle
    async loadRestaurants() {
        try {
            const params = new URLSearchParams({
                kategori: this.activeFilter,
                sayfa: 1,
                limit: this.displayedCount
            });

            const response = await fetch(`${this.apiUrl}/restoran/liste?${params}`);
            if (response.ok) {
                const data = await response.json();
                this.restaurants = data.restoranlar || [];
                this.renderRestaurants();
            }
        } catch (error) {
            console.error('Restoran yükleme hatası:', error);
        }
    }

    // Yakındaki restoranları yükle
    async loadRestaurantsNearby(lat, lng) {
        try {
            const params = new URLSearchParams({
                enlem: lat,
                boylam: lng,
                mesafe: 10,
                kategori: this.activeFilter
            });

            const response = await fetch(`${this.apiUrl}/restoran/liste?${params}`);
            if (response.ok) {
                const data = await response.json();
                this.restaurants = data.restoranlar || [];
                this.renderRestaurants();
            }
        } catch (error) {
            console.error('Yakın restoran yükleme hatası:', error);
        }
    }

    // İstatistikleri yükle
    async loadStats() {
        try {
            // Gerçek API'den alınacak, şimdilik animasyon için mock data
            this.animateStats();
        } catch (error) {
            console.error('İstatistik yükleme hatası:', error);
        }
    }

    // İstatistikleri animasyonla göster
    animateStats() {
        const stats = [
            { id: 'saved-packages', target: 1247 },
            { id: 'partner-restaurants', target: 89 },
            { id: 'total-savings', target: 45680, prefix: '₺' },
            { id: 'co2-saved', target: 2.4, suffix: ' ton' }
        ];

        stats.forEach(stat => {
            this.animateCounter(stat.id, stat.target, stat.prefix, stat.suffix);
        });
    }

    // Sayaç animasyonu
    animateCounter(elementId, target, prefix = '', suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }

            const value = Math.floor(current);
            element.textContent = `${prefix}${value.toLocaleString('tr-TR')}${suffix}`;
        }, 16);
    }

    // Önerilen restoranları render et
    renderPromotedRestaurants() {
        const container = document.getElementById('promoted-restaurants');
        if (!container) return;

        const html = this.promotedRestaurants.map(restaurant => this.createPromotedRestaurantCard(restaurant)).join('');
        container.innerHTML = html;
    }

    // Önerilen restoran kartı oluştur
    createPromotedRestaurantCard(restaurant) {
        const emoji = this.getCategoryEmoji(restaurant.kategori);
        const statusBadge = restaurant.durum === 'last_package' ? 
            '<div class="absolute top-2 left-2 bg-pink-100 border border-pink-300 rounded-lg px-2 py-1 text-xs font-medium text-pink-700">SON PAKET</div>' : '';

        return `
            <div class="card-hover bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer flex-shrink-0 w-60" onclick="kapTazeApp.showRestaurantDetail('${restaurant.id}')">
                <div class="relative h-32 bg-gradient-to-r from-blue-200 to-purple-200 flex items-center justify-center">
                    <span class="text-3xl">${emoji}</span>
                    <div class="absolute top-2 right-2 bg-orange-500 text-white rounded-lg px-2 py-1 text-xs font-bold">ÖNERİLEN</div>
                    <div class="absolute top-2 right-16 bg-white rounded-lg px-2 py-1 text-xs font-medium text-gray-700">${restaurant.paketSayisi || 0} PAKET</div>
                    ${statusBadge}
                    <div class="absolute bottom-2 right-2 bg-white rounded-lg px-2 py-1 shadow-md">
                        <span class="text-gray-400 line-through text-xs">${restaurant.orijinalFiyat?.toFixed(2)}₺</span>
                        <span class="text-sm font-bold text-gray-800 ml-1">${restaurant.satisFiyati?.toFixed(2)}₺</span>
                    </div>
                </div>
                <div class="p-3">
                    <h3 class="font-bold text-sm text-gray-800 mb-1 truncate">${restaurant.ad}</h3>
                    <p class="text-gray-500 text-xs mb-2 truncate">${restaurant.kategori}</p>
                    <div class="flex items-center justify-between text-xs">
                        <div class="flex items-center">
                            <i data-lucide="star" class="w-3 h-3 text-yellow-400 fill-current mr-1"></i>
                            <span class="font-medium">${restaurant.puan}</span>
                        </div>
                        <div class="flex items-center text-gray-500">
                            <i data-lucide="map-pin" class="w-3 h-3 mr-1"></i>
                            <span>${restaurant.mesafe}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Restoranları render et
    renderRestaurants() {
        const container = document.getElementById('restaurants-grid');
        if (!container) return;

        const html = this.restaurants.map(restaurant => this.createRestaurantCard(restaurant)).join('');
        container.innerHTML = html;

        // Lucide icons'ları yeniden başlat
        lucide.createIcons();
    }

    // Restoran kartı oluştur
    createRestaurantCard(restaurant) {
        const emoji = this.getCategoryEmoji(restaurant.kategori);
        const statusBadge = restaurant.durum === 'last_package' ? 
            '<div class="absolute top-12 left-3 bg-pink-100 border border-pink-300 rounded-lg px-2 py-1 text-xs font-medium text-pink-700">SON PAKET</div>' : '';

        return `
            <div class="restaurant-card card-hover rounded-2xl shadow-lg overflow-hidden cursor-pointer" onclick="kapTazeApp.showRestaurantDetail('${restaurant.id}')">
                <div class="relative h-48 bg-gradient-to-r from-orange-200 to-red-200 flex items-center justify-center">
                    <span class="text-4xl">${emoji}</span>
                    <div class="absolute top-3 left-3 bg-white rounded-lg px-2 py-1 text-sm font-medium text-gray-700">
                        ${restaurant.aktifPaketSayisi || 0} PAKET
                    </div>
                    <button class="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-gray-50">
                        <i data-lucide="heart" class="w-5 h-5 text-gray-400"></i>
                    </button>
                    ${statusBadge}
                    <div class="absolute bottom-3 right-3 bg-white rounded-lg px-3 py-1 shadow-md">
                        <span class="text-gray-400 line-through text-sm">${restaurant.orijinalFiyat?.toFixed(2)}₺</span>
                        <span class="text-lg font-bold text-gray-800 ml-2">${restaurant.satisFiyati?.toFixed(2)}₺</span>
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-lg text-gray-800 mb-1">${restaurant.ad}</h3>
                    <p class="text-gray-500 text-sm mb-3">${restaurant.kategori}</p>
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center">
                            <i data-lucide="star" class="w-4 h-4 text-yellow-400 fill-current mr-1"></i>
                            <span class="font-medium">${restaurant.puan}</span>
                        </div>
                        <div class="flex items-center text-gray-500">
                            <i data-lucide="map-pin" class="w-4 h-4 mr-1"></i>
                            <span>${restaurant.mesafe}</span>
                        </div>
                        <div class="flex items-center text-gray-500">
                            <i data-lucide="clock" class="w-4 h-4 mr-1"></i>
                            <span>${restaurant.calismaSaatleri?.baslangic}-${restaurant.calismaSaatleri?.bitis}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Kategori emojisini al
    getCategoryEmoji(category) {
        const emojiMap = {
            'Kahve & Pasta': '☕',
            'Fırın & Ekmek': '🍞',
            'Vegan Yemekler': '🥗',
            'Geleneksel Türk': '🍖',
            'Et & Kebap': '🥙',
            'Deniz Ürünleri': '🐟',
            'Börek & Kahvaltı': '🥧',
            'Pide & Lahmacun': '🍕',
            'Japon Mutfağı': '🍣',
            'İtalyan Mutfağı': '🍝',
            'Fast Food': '🍔',
            'Tatlı & Dondurma': '🍨'
        };
        return emojiMap[category] || '🍽️';
    }

    // Filtre değişikliğini işle
    handleFilterChange(e) {
        e.preventDefault();
        
        // Aktif sınıfı güncelle
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.classList.add('bg-gray-100', 'text-gray-600');
            tab.classList.remove('text-white');
        });
        
        e.target.closest('.filter-tab').classList.add('active');
        e.target.closest('.filter-tab').classList.remove('bg-gray-100', 'text-gray-600');
        e.target.closest('.filter-tab').classList.add('text-white');

        this.activeFilter = e.target.closest('.filter-tab').dataset.category;
        this.loadRestaurants();
    }

    // Sıralama değişikliğini işle
    handleSortChange(e) {
        const sortBy = e.target.value;
        this.sortRestaurants(sortBy);
    }

    // Restoranları sırala
    sortRestaurants(sortBy) {
        switch(sortBy) {
            case 'distance':
                this.restaurants.sort((a, b) => parseFloat(a.mesafe) - parseFloat(b.mesafe));
                break;
            case 'price':
                this.restaurants.sort((a, b) => a.satisFiyati - b.satisFiyati);
                break;
            case 'rating':
                this.restaurants.sort((a, b) => b.puan - a.puan);
                break;
        }
        this.renderRestaurants();
    }

    // Daha fazla restoran yükle
    async loadMoreRestaurants() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.displayedCount += 6;
        
        document.getElementById('loading-indicator')?.classList.remove('hidden');
        
        await this.loadRestaurants();
        
        document.getElementById('loading-indicator')?.classList.add('hidden');
        this.isLoading = false;
    }

    // Restoran detayını göster
    showRestaurantDetail(restaurantId) {
        // Modal veya yeni sayfa açılacak
        this.showToast(`Restoran detayı yükleniyor... ID: ${restaurantId}`, 'info');
        // Gerçek uygulamada restoran detay sayfasına yönlendirilecek
    }

    // Harita görünümünü göster
    showMapView() {
        this.showToast('Harita görünümü yakında eklenecek!', 'info');
    }

    // Restoranlar bölümüne kaydır
    scrollToRestaurants() {
        document.getElementById('restaurants')?.scrollIntoView({ 
            behavior: 'smooth' 
        });
    }

    // Smooth scroll işleyici
    handleSmoothScroll(e) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Scroll işleyici (infinite scroll)
    handleScroll() {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
            if (!this.isLoading && this.restaurants.length >= this.displayedCount) {
                this.loadMoreRestaurants();
            }
        }
    }

    // Resize işleyici
    handleResize() {
        // Responsive davranışlar burada ayarlanabilir
    }

    // Mobil menüyü aç/kapat
    toggleMobileMenu() {
        this.showToast('Mobil menü yakında eklenecek!', 'info');
    }

    // Gerçek zamanlı güncellemeler
    startRealTimeUpdates() {
        // Her 5 dakikada bir istatistikleri güncelle
        setInterval(() => {
            this.loadStats();
        }, 300000);
    }

    // Loading göster
    showLoading(message) {
        // Loading overlay oluştur
        const overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-6 flex items-center space-x-3">
                <div class="loading-spinner"></div>
                <span class="text-gray-700">${message}</span>
            </div>
        `;
        document.body.appendChild(overlay);
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
        toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 max-w-sm ${
            type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' :
            type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
        }`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Otomatik kaldırma
        setTimeout(() => {
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Giriş modalını göster
    showLoginModal() {
        this.showToast('Giriş modalı yakında eklenecek!', 'info');
    }

    // Kayıt modalını göster
    showRegisterModal() {
        this.showToast('Kayıt modalı yakında eklenecek!', 'info');
    }

    // Kullanıcı menüsünü göster
    showUserMenu() {
        this.showToast('Kullanıcı menüsü yakında eklenecek!', 'info');
    }
}

// Uygulamayı başlat
let kapTazeApp;
document.addEventListener('DOMContentLoaded', () => {
    kapTazeApp = new KapTazeWebApp();
});