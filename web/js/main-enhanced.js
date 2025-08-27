// Enhanced main.js with backend integration
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 KapTaze Frontend Loaded');
    
    // Initialize backend service
    if (window.backendService) {
        console.log('✅ Backend service available');
        loadDashboardData();
    }
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }

    // Registration form handling
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', handleRegistration);
    }

    // Load real-time statistics
    updateStatistics();
    
    // Refresh statistics every 30 seconds
    setInterval(updateStatistics, 30000);
});

async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        // Load packages for homepage display
        const packages = await window.backendService.getPackages();
        displayPackages(packages.slice(0, 6)); // Show first 6 packages
        
        // Load restaurants
        const restaurants = await window.backendService.getRestaurants();
        console.log(`🍽️ Loaded ${restaurants.length} restaurants`);
        
        // Update statistics with real data
        await updateStatistics();
        
    } catch (error) {
        console.log('⚠️ Using demo data - Backend not available:', error.message);
        loadDemoData();
    }
}

function displayPackages(packages) {
    const packagesContainer = document.querySelector('.packages-grid');
    if (!packagesContainer || !packages.length) return;
    
    packagesContainer.innerHTML = packages.map(pkg => `
        <div class="package-card" data-package-id="${pkg._id}">
            <div class="package-image">
                <img src="${pkg.image || './assets/default-food.jpg'}" alt="${pkg.name}">
                <div class="discount-badge">%${Math.round((1 - pkg.discountedPrice / pkg.originalPrice) * 100)}</div>
            </div>
            <div class="package-content">
                <h3>${pkg.name}</h3>
                <p class="restaurant-name">${pkg.restaurantName}</p>
                <div class="package-price">
                    <span class="original-price">₺${pkg.originalPrice}</span>
                    <span class="discounted-price">₺${pkg.discountedPrice}</span>
                </div>
                <div class="package-meta">
                    <span><i class="fas fa-clock"></i> ${pkg.pickupTime}</span>
                    <span><i class="fas fa-box"></i> ${pkg.quantity} adet</span>
                </div>
                <button class="reserve-btn" onclick="reservePackage('${pkg._id}')">
                    Rezerve Et
                </button>
            </div>
        </div>
    `).join('');
}

async function reservePackage(packageId) {
    try {
        // Check if user is logged in
        if (!window.backendService.isAuthenticated()) {
            // Redirect to login
            window.location.href = './customer-registration-v2.html';
            return;
        }
        
        const orderData = {
            packageId: packageId,
            customerId: window.backendService.getCurrentUser().id,
            status: 'pending'
        };
        
        const order = await window.backendService.createOrder(orderData);
        
        alert('Paket başarıyla rezerve edildi! Sipariş numaranız: ' + order.orderNumber);
        
        // Redirect to order tracking
        window.location.href = `./order-tracking.html?orderId=${order._id}`;
        
    } catch (error) {
        console.error('Reservation error:', error);
        alert('Rezervasyon sırasında bir hata oluştu: ' + error.message);
    }
}

async function updateStatistics() {
    try {
        const stats = await window.backendService.getAdminStats();
        
        // Update statistics display
        const savedPackagesEl = document.querySelector('.stat-number[data-stat="packages"]');
        const co2SavingEl = document.querySelector('.stat-number[data-stat="co2"]');
        const partnersEl = document.querySelector('.stat-number[data-stat="partners"]');
        
        if (savedPackagesEl) {
            animateNumber(savedPackagesEl, stats.totalPackagesSaved || 2847);
        }
        
        if (co2SavingEl) {
            co2SavingEl.textContent = (stats.co2Saved || 1.2) + 'T';
        }
        
        if (partnersEl) {
            animateNumber(partnersEl, stats.partnerRestaurants || 156);
        }
        
    } catch (error) {
        console.log('Using default statistics:', error.message);
        // Use default values if backend is not available
    }
}

function animateNumber(element, targetNumber) {
    const duration = 2000;
    const startNumber = 0;
    const startTime = Date.now();
    
    function updateNumber() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentNumber = Math.floor(startNumber + (targetNumber - startNumber) * progress);
        
        element.textContent = currentNumber.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    updateNumber();
}

function loadDemoData() {
    // Demo packages for display when backend is not available
    const demoPackages = [
        {
            _id: 'demo1',
            name: 'Karma Menü',
            restaurantName: 'Seraser Restaurant',
            originalPrice: 45,
            discountedPrice: 18,
            image: './assets/food1.jpg',
            pickupTime: '18:00-20:00',
            quantity: 5
        },
        {
            _id: 'demo2', 
            name: 'Pizza Çeşitleri',
            restaurantName: 'Milano Pizzeria',
            originalPrice: 35,
            discountedPrice: 15,
            image: './assets/food2.jpg',
            pickupTime: '19:00-21:00',
            quantity: 3
        }
    ];
    
    displayPackages(demoPackages);
}

async function handleRegistration(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        phone: formData.get('phone'),
        userType: 'customer'
    };
    
    try {
        const result = await window.backendService.register(userData);
        
        // Save user data
        window.backendService.saveUserData(result.user, result.token);
        
        alert('Kayıt başarılı! Ana sayfaya yönlendiriliyorsunuz.');
        window.location.href = './index.html';
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Kayıt sırasında bir hata oluştu: ' + error.message);
    }
}

// Global functions for button clicks
window.reservePackage = reservePackage;
