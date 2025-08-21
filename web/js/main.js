// KapTaze Main Portal JavaScript

// Single domain configuration - All under kaptaze.netlify.app
const SINGLE_DOMAIN = {
    customer: 'https://kaptaze.netlify.app/mobile',
    restaurant: 'https://kaptaze.netlify.app/restaurant-login.html', 
    admin: 'https://kaptaze.netlify.app/admin-login.html',
    api: 'https://kaptaze.netlify.app/api'
};

// Free hosting domain configuration - Netlify + Render  
const FREE_DOMAINS = {
    customer: 'https://kaptaze.netlify.app/mobile',
    restaurant: 'https://kaptaze.netlify.app/restaurant-login.html', 
    admin: 'https://kaptaze.netlify.app/admin-login.html',
    api: 'https://kaptaze.netlify.app/api'
};

// Paid domain configuration  
const PAID_DOMAINS = {
    customer: 'https://app.kaptazeapp.com.tr',
    restaurant: 'https://restoran.kaptazeapp.com.tr', 
    admin: 'https://admin.kaptazeapp.com.tr',
    api: 'https://api.kaptazeapp.com.tr'
};

// Auto-detect environment and set domains
let DOMAINS = SINGLE_DOMAIN; // Use single domain to fix localStorage issues

// Production domain override from environment
if (typeof window.KAPTAZE_DOMAIN !== 'undefined') {
    const baseDomain = window.KAPTAZE_DOMAIN;
    
    // If custom domain is set, use paid structure
    if (baseDomain.includes('kaptazeapp.com') || baseDomain.includes('kaptaze.com')) {
        DOMAINS = PAID_DOMAINS;
    } else {
        // Use free hosting subdomains
        DOMAINS = FREE_DOMAINS;
    }
}

// Development domains (localhost)
const DEV_DOMAINS = {
    customer: 'http://localhost:3000',
    restaurant: 'http://localhost:3002',
    admin: 'http://localhost:3001',
    api: 'http://localhost:3001'
};

// Determine if we're in development
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const currentDomains = isDevelopment ? DEV_DOMAINS : DOMAINS;

// Navigation toggle for mobile
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
                // Close mobile menu
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            }
        });
    });
    
    // Add navbar background on scroll
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.platform-card, .feature-item, .impact-item');
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// Platform navigation functions - NO NEW TABS
function openPanel(panelType) {
    const loadingOverlay = showLoadingOverlay(`${getPanelDisplayName(panelType)} açılıyor...`);
    
    let targetUrl;
    
    // All navigation stays in same tab - web/ folder structure
    if (panelType === 'customer') {
        targetUrl = '/customer-registration.html';
    } else if (panelType === 'restaurant') {
        targetUrl = '/restaurant-login.html';
    } else if (panelType === 'admin') {
        targetUrl = '/admin-panel.html';
    } else {
        targetUrl = `/${panelType}.html`;
    }
    
    // Single-page navigation - same tab
    setTimeout(() => {
        hideLoadingOverlay(loadingOverlay);
        window.location.href = targetUrl;
    }, 800);
}

// Get display name for panel type
function getPanelDisplayName(panelType) {
    const displayNames = {
        customer: 'Müşteri Paneli',
        restaurant: 'Restoran Paneli',
        admin: 'Admin Paneli'
    };
    return displayNames[panelType] || panelType;
}

// Check if domain is accessible
async function checkDomainHealth(url) {
    try {
        // For development, assume localhost services are running
        if (isDevelopment) {
            return true;
        }
        
        // For production, we can't do CORS requests to check health
        // So we'll assume the services are running
        // In a real scenario, you'd have a health check endpoint
        return true;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

// Show loading overlay
function showLoadingOverlay(message) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-message">${message}</div>
        </div>
    `;
    
    // Add styles
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    const loadingContent = overlay.querySelector('.loading-content');
    loadingContent.style.cssText = `
        text-align: center;
        color: white;
    `;
    
    const spinner = overlay.querySelector('.loading-spinner');
    spinner.style.cssText = `
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid #16a34a;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    `;
    
    const message_el = overlay.querySelector('.loading-message');
    message_el.style.cssText = `
        font-size: 1.1rem;
        font-weight: 500;
    `;
    
    // Add spin animation
    if (!document.querySelector('#loading-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-styles';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(overlay);
    return overlay;
}

// Hide loading overlay
function hideLoadingOverlay(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            overlay.parentNode.removeChild(overlay);
        }, 300);
    }
}

// Show error modal
function showErrorModal(title, message, panelType) {
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    modal.innerHTML = `
        <div class="error-modal-content">
            <div class="error-modal-header">
                <h3>${title}</h3>
                <button class="error-modal-close" onclick="closeErrorModal()">&times;</button>
            </div>
            <div class="error-modal-body">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <div class="error-actions">
                    <button class="btn-retry" onclick="retryConnection('${panelType}')">
                        <i class="fas fa-redo"></i> Tekrar Dene
                    </button>
                    <button class="btn-cancel" onclick="closeErrorModal()">
                        İptal
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        backdrop-filter: blur(5px);
    `;
    
    const content = modal.querySelector('.error-modal-content');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: modalSlideIn 0.3s ease;
    `;
    
    const header = modal.querySelector('.error-modal-header');
    header.style.cssText = `
        padding: 1.5rem 1.5rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 1rem;
        margin-bottom: 1rem;
    `;
    
    const closeBtn = modal.querySelector('.error-modal-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
    `;
    
    const body = modal.querySelector('.error-modal-body');
    body.style.cssText = `
        padding: 0 1.5rem 1.5rem;
        text-align: center;
    `;
    
    const errorIcon = modal.querySelector('.error-icon');
    errorIcon.style.cssText = `
        font-size: 3rem;
        margin-bottom: 1rem;
    `;
    
    const actions = modal.querySelector('.error-actions');
    actions.style.cssText = `
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
        justify-content: center;
    `;
    
    const retryBtn = modal.querySelector('.btn-retry');
    retryBtn.style.cssText = `
        background: #16a34a;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
    `;
    
    const cancelBtn = modal.querySelector('.btn-cancel');
    cancelBtn.style.cssText = `
        background: #6b7280;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    `;
    
    // Add animation styles
    if (!document.querySelector('#modal-styles')) {
        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            .error-modal-close:hover {
                background: #f3f4f6 !important;
                color: #374151 !important;
            }
            .btn-retry:hover {
                background: #15803d !important;
                transform: translateY(-1px) !important;
            }
            .btn-cancel:hover {
                background: #4b5563 !important;
                transform: translateY(-1px) !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(modal);
    window.currentErrorModal = modal;
}

// Close error modal
function closeErrorModal() {
    if (window.currentErrorModal) {
        window.currentErrorModal.style.opacity = '0';
        window.currentErrorModal.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (window.currentErrorModal && window.currentErrorModal.parentNode) {
                window.currentErrorModal.parentNode.removeChild(window.currentErrorModal);
            }
            window.currentErrorModal = null;
        }, 300);
    }
}

// Retry connection
function retryConnection(panelType) {
    closeErrorModal();
    openPanel(panelType);
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Contact form handling (if needed)
function handleContactForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
    
    // Show success message
    showSuccessMessage('Mesajınız başarıyla gönderildi!');
    
    // Reset form
    event.target.reset();
}

// Show success message
function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        top: 90px;
        right: 20px;
        background: #16a34a;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s;
        font-weight: 500;
    `;
    
    // Add animation styles
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Performance monitoring
function trackPageLoad() {
    window.addEventListener('load', function() {
        const loadTime = performance.now();
        console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
        
        // Track to analytics (if implemented)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_load_time', {
                value: Math.round(loadTime),
                event_category: 'Performance'
            });
        }
    });
}

// Initialize performance tracking
trackPageLoad();

// Analytics event tracking
function trackPlatformAccess(panelType) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'platform_access', {
            event_category: 'Navigation',
            event_label: panelType,
            value: 1
        });
    }
    
    console.log(`Platform access tracked: ${panelType}`);
}

// Service Worker registration (for PWA features) - Optional
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Check if sw.js exists before registering
        fetch('/sw.js', { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    return navigator.serviceWorker.register('/sw.js');
                } else {
                    console.log('⚠️ ServiceWorker file not found, skipping registration');
                    return null;
                }
            })
            .then(function(registration) {
                if (registration) {
                    console.log('✅ ServiceWorker registration successful');
                }
            })
            .catch(function(err) {
                console.log('⚠️ ServiceWorker registration failed:', err.message);
            });
    });
}

// Customer registration function - NO NEW TABS
function openCustomerRegistration() {
    const loadingOverlay = showLoadingOverlay('Müşteri kayıt sayfası açılıyor...');
    
    // Same tab navigation to customer registration
    setTimeout(() => {
        hideLoadingOverlay(loadingOverlay);
        window.location.href = '/customer-registration.html';
    }, 800);
}

// Export functions for global access
window.openPanel = openPanel;
window.openCustomerRegistration = openCustomerRegistration;
window.closeErrorModal = closeErrorModal;
window.retryConnection = retryConnection;
window.scrollToSection = scrollToSection;
window.handleContactForm = handleContactForm;

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 KapTaze Ana Portal yüklendi');
    console.log('✅ openCustomerRegistration fonksiyonu:', typeof openCustomerRegistration);
    
    // Bind customer registration buttons (both nav and hero)
    const customerBtns = [
        document.getElementById('customerRegistrationBtn'),
        document.getElementById('heroCustomerRegistrationBtn')
    ];
    
    customerBtns.forEach((btn, index) => {
        if (btn) {
            btn.addEventListener('click', function() {
                console.log(`🔘 Customer registration button ${index + 1} clicked`);
                console.log('🚀 Opening: https://kaptaze-customer.netlify.app');
                window.open('https://kaptaze-customer.netlify.app', '_blank');
            });
            console.log(`✅ Customer registration button ${index + 1} event listener added`);
        } else {
            console.error(`❌ Customer registration button ${index + 1} not found`);
        }
    });
    
    // Test if function is available globally
    if (typeof window.openCustomerRegistration === 'function') {
        console.log('✅ Global openCustomerRegistration function is available');
    } else {
        console.error('❌ Global openCustomerRegistration function is NOT available');
    }
});
