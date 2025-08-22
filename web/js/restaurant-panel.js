/**
 * KapTaze Restaurant Panel - Professional Management System
 * Mobile-first responsive design with database integration
 */

class RestaurantPanel {
    constructor() {
        this.currentUser = null;
        this.restaurantProfile = null;
        this.packages = [];
        this.editMode = false;
        
        this.init();
    }

    async init() {
        console.log('🏪 Restaurant Panel initializing...');
        
        // Check authentication
        if (!this.checkAuth()) {
            return;
        }

        // Load user data and profile
        await this.loadUserData();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        this.loadDashboardData();
        this.loadPackages();
        
        // Setup real-time data updates
        this.setupDataSync();
        
        console.log('✅ Restaurant Panel ready');
    }

    checkAuth() {
        const token = localStorage.getItem('restaurantToken');
        const user = localStorage.getItem('restaurantUser');
        
        if (!token || !user) {
            console.warn('⚠️ Not authenticated, redirecting to login');
            window.location.href = '/restaurant-login.html';
            return false;
        }
        
        try {
            this.currentUser = JSON.parse(user);
            return true;
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            this.logout();
            return false;
        }
    }

    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            // Get restaurant profile from database
            this.restaurantProfile = window.KapTazeDB.getRestaurantProfile(this.currentUser.id);
            
            if (!this.restaurantProfile) {
                console.warn('⚠️ Restaurant profile not found');
                return;
            }
            
            // Update UI with restaurant data
            this.updateRestaurantInfo();
            this.updateProfileDisplay();
            
        } catch (error) {
            console.error('❌ Error loading user data:', error);
        }
    }

    updateRestaurantInfo() {
        if (!this.restaurantProfile) return;
        
        // Update header
        const nameEl = document.getElementById('restaurant-name');
        if (nameEl) {
            nameEl.textContent = this.restaurantProfile.businessName || 'Restoran Paneli';
        }
        
        // Update status
        const statusEl = document.getElementById('restaurant-status');
        if (statusEl) {
            statusEl.textContent = this.restaurantProfile.status === 'active' ? 'Aktif' : 'Pasif';
            statusEl.className = `restaurant-status ${this.restaurantProfile.status}`;
        }
    }

    updateProfileDisplay() {
        if (!this.restaurantProfile) return;
        
        const profile = this.restaurantProfile;
        
        // Basic info
        this.updateElement('profile-restaurant-name', profile.businessName);
        this.updateElement('profile-restaurant-category', profile.businessType);
        this.updateElement('profile-description', profile.description || 'Henüz açıklama eklenmemiş.');
        this.updateElement('profile-email', this.currentUser.email);
        this.updateElement('profile-phone', this.currentUser.phone);
        this.updateElement('profile-address', profile.address);
        
        // Website
        const websiteEl = document.getElementById('profile-website');
        if (websiteEl && profile.website) {
            websiteEl.href = profile.website;
            websiteEl.style.display = 'block';
        } else if (websiteEl) {
            websiteEl.style.display = 'none';
        }
        
        // Main image
        const avatarEl = document.getElementById('restaurant-avatar');
        if (avatarEl && profile.mainImage) {
            avatarEl.src = profile.mainImage;
        }
        
        // Specialties
        this.updateSpecialties(profile.specialties);
        
        // Working hours
        this.updateWorkingHours(profile.businessHours);
    }

    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value || 'Belirtilmemiş';
        }
    }

    updateSpecialties(specialties) {
        const container = document.getElementById('profile-specialties');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (specialties && specialties.length > 0) {
            specialties.forEach(specialty => {
                const tag = document.createElement('span');
                tag.className = 'specialty-tag';
                tag.textContent = specialty;
                container.appendChild(tag);
            });
        } else {
            container.innerHTML = '<span style="color: #666;">Henüz uzmanlik alanı eklenmemiş</span>';
        }
    }

    updateWorkingHours(businessHours) {
        const container = document.getElementById('working-hours');
        if (!container || !businessHours) return;
        
        container.innerHTML = '';
        
        if (businessHours.weekday && businessHours.weekend) {
            container.innerHTML = `
                <div class="day">Hafta İçi: ${businessHours.weekday.open} - ${businessHours.weekday.close}</div>
                <div class="day">Hafta Sonu: ${businessHours.weekend.open} - ${businessHours.weekend.close}</div>
            `;
        } else {
            container.innerHTML = '<div class="day">Çalışma saatleri belirtilmemiş</div>';
        }
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSubmit(e));
        }
        
        // Database change notifications
        window.addEventListener('kaptaze_data_updated', () => {
            this.loadUserData();
            this.loadPackages();
            this.updateStatistics();
        });
        
        // Mobile responsive handlers
        this.setupMobileHandlers();
    }

    setupMobileHandlers() {
        // Touch-friendly interactions
        document.addEventListener('touchstart', function() {}, { passive: true });
        
        // Responsive image handling
        if ('serviceWorker' in navigator) {
            // Enable offline capabilities for mobile
            this.enableOfflineMode();
        }
    }

    async handleProfileSubmit(e) {
        e.preventDefault();
        
        if (!this.restaurantProfile) {
            console.error('❌ No restaurant profile found');
            return;
        }
        
        try {
            // Collect form data
            const formData = new FormData(e.target);
            const updates = {
                description: document.getElementById('editDescription').value,
                website: document.getElementById('editWebsite').value,
                specialties: document.getElementById('editSpecialties').value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0),
                businessHours: {
                    weekday: {
                        open: document.getElementById('weekdayOpen').value,
                        close: document.getElementById('weekdayClose').value
                    },
                    weekend: {
                        open: document.getElementById('weekendOpen').value,
                        close: document.getElementById('weekendClose').value
                    }
                }
            };
            
            // Handle main image upload
            const mainImageInput = document.getElementById('mainImageInput');
            if (mainImageInput.files.length > 0) {
                const imageData = await this.processImage(mainImageInput.files[0]);
                updates.mainImage = imageData;
            }
            
            // Update database
            const updatedProfile = window.KapTazeDB.updateRestaurantProfile(
                this.restaurantProfile.id, 
                updates
            );
            
            if (updatedProfile) {
                this.restaurantProfile = updatedProfile;
                this.updateProfileDisplay();
                this.showSuccessMessage('Profil başarıyla güncellendi!');
                this.toggleProfileEdit(); // Exit edit mode
            } else {
                this.showErrorMessage('Profil güncellenirken hata oluştu.');
            }
            
        } catch (error) {
            console.error('❌ Profile update error:', error);
            this.showErrorMessage('Profil güncellenirken hata oluştu.');
        }
    }

    async processImage(file) {
        return new Promise((resolve, reject) => {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                reject(new Error('Dosya boyutu 5MB\'dan büyük olamaz'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    loadDashboardData() {
        if (!this.restaurantProfile) return;
        
        // Load packages for statistics
        const packages = window.KapTazeDB.getRestaurantPackages(this.restaurantProfile.id);
        
        // Update statistics
        document.getElementById('active-packages').textContent = packages.length;
        
        // Load orders (placeholder for now)
        document.getElementById('total-orders').textContent = '0';
        document.getElementById('total-earnings').textContent = '₺0';
    }

    loadPackages() {
        if (!this.restaurantProfile) return;
        
        const packages = window.KapTazeDB.getRestaurantPackages(this.restaurantProfile.id);
        this.packages = packages;
        
        this.renderPackages();
    }

    renderPackages() {
        const container = document.getElementById('packages-grid');
        if (!container) return;
        
        if (this.packages.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box" style="font-size: 3em; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>Henüz paket eklenmemiş</h3>
                    <p>İlk paketinizi eklemek için "Yeni Paket Ekle" butonuna tıklayın.</p>
                    <button class="btn-primary" onclick="showAddPackageModal()">
                        <i class="fas fa-plus"></i> İlk Paketi Ekle
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.packages.map(pkg => this.renderPackageCard(pkg)).join('');
    }

    renderPackageCard(pkg) {
        const discountPercent = Math.round((1 - pkg.discountedPrice / pkg.originalPrice) * 100);
        
        return `
            <div class="package-card" data-package-id="${pkg.id}">
                <div class="package-header">
                    <div>
                        <h4 class="package-title">${pkg.name}</h4>
                        <p class="package-description">${pkg.description}</p>
                    </div>
                    <div class="package-price-info">
                        <div class="original-price">₺${pkg.originalPrice}</div>
                        <div class="discounted-price">₺${pkg.discountedPrice}</div>
                        <div class="discount-badge">${discountPercent}% İndirim</div>
                    </div>
                </div>
                
                <div class="package-details">
                    <div class="detail-item">
                        <i class="fas fa-cubes"></i>
                        <span>Stok: ${pkg.quantity} adet</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-clock"></i>
                        <span>${pkg.availableUntil ? new Date(pkg.availableUntil).toLocaleDateString() : 'Süresiz'}</span>
                    </div>
                </div>
                
                <div class="package-actions">
                    <button class="btn-sm btn-warning" onclick="editPackage('${pkg.id}')">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn-sm btn-danger" onclick="deletePackage('${pkg.id}')">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </div>
        `;
    }

    setupDataSync() {
        // Real-time data synchronization
        setInterval(() => {
            this.updateStatistics();
        }, 30000); // Update every 30 seconds
    }

    updateStatistics() {
        if (!this.restaurantProfile) return;
        
        const stats = window.KapTazeDB.getStatistics();
        
        // Update dashboard stats
        document.getElementById('active-packages').textContent = 
            window.KapTazeDB.getRestaurantPackages(this.restaurantProfile.id).length;
    }

    // Profile Management
    toggleProfileEdit() {
        const displayMode = document.getElementById('profileDisplay');
        const editMode = document.getElementById('profileEdit');
        const buttonText = document.getElementById('editButtonText');
        
        this.editMode = !this.editMode;
        
        if (this.editMode) {
            // Switch to edit mode
            displayMode.style.display = 'none';
            editMode.style.display = 'block';
            buttonText.textContent = 'İptal';
            
            // Populate edit form with current data
            this.populateEditForm();
        } else {
            // Switch to display mode
            displayMode.style.display = 'block';
            editMode.style.display = 'none';
            buttonText.textContent = 'Profili Düzenle';
        }
    }

    populateEditForm() {
        if (!this.restaurantProfile) return;
        
        const profile = this.restaurantProfile;
        
        document.getElementById('editDescription').value = profile.description || '';
        document.getElementById('editWebsite').value = profile.website || '';
        document.getElementById('editSpecialties').value = 
            profile.specialties ? profile.specialties.join(', ') : '';
        
        if (profile.businessHours) {
            document.getElementById('weekdayOpen').value = profile.businessHours.weekday?.open || '';
            document.getElementById('weekdayClose').value = profile.businessHours.weekday?.close || '';
            document.getElementById('weekendOpen').value = profile.businessHours.weekend?.open || '';
            document.getElementById('weekendClose').value = profile.businessHours.weekend?.close || '';
        }
        
        // Show current main image
        if (profile.mainImage) {
            const preview = document.getElementById('mainImagePreview');
            const placeholder = document.getElementById('imageUploadPlaceholder');
            
            preview.src = profile.mainImage;
            preview.style.display = 'block';
            placeholder.style.display = 'none';
        }
    }

    // Image handling
    previewMainImage(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            const preview = document.getElementById('mainImagePreview');
            const placeholder = document.getElementById('imageUploadPlaceholder');
            
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                placeholder.style.display = 'none';
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    }

    changeAvatar() {
        document.getElementById('mainImageInput').click();
    }

    // Utility methods
    showSuccessMessage(message) {
        // Implementation for success messages
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        // Implementation for error messages
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    enableOfflineMode() {
        // Service worker for offline functionality
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('📱 Service Worker registered for offline mode');
        }).catch(function(error) {
            console.log('Service Worker registration failed:', error);
        });
    }

    logout() {
        if (confirm('Çıkış yapmak istediğiniz emin misiniz?')) {
            localStorage.removeItem('restaurantToken');
            localStorage.removeItem('restaurantUser');
            window.location.href = '/restaurant-login.html';
        }
    }
}

// Global functions for HTML event handlers
window.toggleProfileEdit = function() {
    window.restaurantPanel.toggleProfileEdit();
};

window.previewMainImage = function(input) {
    window.restaurantPanel.previewMainImage(input);
};

window.changeAvatar = function() {
    window.restaurantPanel.changeAvatar();
};

window.showAddPackageModal = function() {
    // Package modal implementation
    console.log('🔧 Package modal - To be implemented');
};

window.editPackage = function(packageId) {
    console.log('✏️ Edit package:', packageId);
};

window.deletePackage = function(packageId) {
    if (confirm('Bu paketi silmek istediğinize emin misiniz?')) {
        // Delete package implementation
        console.log('🗑️ Delete package:', packageId);
    }
};

window.logout = function() {
    window.restaurantPanel.logout();
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.restaurantPanel = new RestaurantPanel();
});

console.log('🏪 Restaurant Panel JS loaded');