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
        await this.loadDashboardData();
        await this.loadPackages();
        
        // Setup real-time data updates
        this.setupDataSync();
        
        console.log('✅ Restaurant Panel ready');
    }

    checkAuth() {
        // Check MongoDB authentication only
        if (!window.KapTazeMongoDB) {
            console.error('❌ Unified MongoDB service not loaded!');
            window.location.href = '/restaurant-login.html';
            return false;
        }
        
        this.currentUser = window.KapTazeMongoDB.getCurrentUser();
        console.log('🔍 Restaurant auth check - MongoDB only:', {
            hasUser: !!this.currentUser,
            role: this.currentUser ? this.currentUser.role : 'none'
        });
        
        if (!this.currentUser || this.currentUser.role !== 'restaurant') {
            console.warn('⚠️ Not authenticated, redirecting to login');
            window.location.href = '/restaurant-login.html';
            return false;
        }
        
        console.log('✅ Restaurant authenticated via MongoDB:', this.currentUser.username);
        return true;
    }

    async loadUserData() {
        if (!this.currentUser) return;
        
        try {
            // Get restaurant profile from MongoDB
            this.restaurantProfile = await window.KapTazeMongoDB.getRestaurantByUserId(this.currentUser.id);
            
            if (this.restaurantProfile) {
                console.log('✅ Restaurant profile loaded from MongoDB:', this.restaurantProfile.businessName);
            } else {
                console.warn('⚠️ Restaurant profile not found in MongoDB');
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
        
        // Package form submission
        const packageForm = document.getElementById('addPackageForm');
        if (packageForm) {
            packageForm.addEventListener('submit', (e) => this.handlePackageSubmit(e));
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

    async loadDashboardData() {
        if (!this.restaurantProfile) return;
        
        // Load packages for statistics
        // Use Render API instead of local DB
        const packages = await this.getRestaurantPackages(this.restaurantProfile.id);
        
        // Update statistics
        document.getElementById('active-packages').textContent = packages.length;
        
        // Load orders (placeholder for now)
        document.getElementById('total-orders').textContent = '0';
        document.getElementById('total-earnings').textContent = '₺0';
    }

    async loadPackages() {
        if (!this.currentUser) {
            console.error('❌ No current user - cannot load packages');
            return;
        }
        
        // Use the current user ID as restaurant ID for package filtering
        console.log('📦 Loading packages for restaurant:', this.currentUser.id);
        const packages = await this.getRestaurantPackages(this.currentUser.id);
        this.packages = packages;
        
        console.log('📊 Loaded packages:', packages.length, 'for user:', this.currentUser.username);
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
        const isLowStock = pkg.quantity <= 3;
        const isExpiringSoon = pkg.availableUntil ? 
            (new Date(pkg.availableUntil) - new Date()) < (24 * 60 * 60 * 1000) : false;
        
        return `
            <div class="package-card ${isLowStock ? 'low-stock' : ''}" data-package-id="${pkg.id}">
                <div class="package-header">
                    <div class="package-info">
                        <h4 class="package-title">${pkg.name}</h4>
                        <span class="package-category">${this.getCategoryDisplayName(pkg.category)}</span>
                        <p class="package-description">${pkg.description}</p>
                        ${pkg.tags && pkg.tags.length > 0 ? `
                            <div class="package-tags">
                                ${pkg.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="package-price-info">
                        <div class="original-price">₺${pkg.originalPrice.toFixed(2)}</div>
                        <div class="discounted-price">₺${pkg.discountedPrice.toFixed(2)}</div>
                        <div class="discount-badge">${discountPercent}% İndirim</div>
                        <div class="savings">₺${(pkg.originalPrice - pkg.discountedPrice).toFixed(2)} tasarruf</div>
                    </div>
                </div>
                
                <div class="package-details">
                    <div class="detail-item ${isLowStock ? 'warning' : ''}">
                        <i class="fas fa-cubes"></i>
                        <span>Stok: ${pkg.quantity} adet</span>
                        ${isLowStock ? '<i class="fas fa-exclamation-triangle warning-icon"></i>' : ''}
                    </div>
                    <div class="detail-item ${isExpiringSoon ? 'warning' : ''}">
                        <i class="fas fa-clock"></i>
                        <span>${pkg.availableUntil ? 
                            new Date(pkg.availableUntil).toLocaleString('tr-TR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : 'Süresiz'}</span>
                        ${isExpiringSoon ? '<i class="fas fa-exclamation-triangle warning-icon"></i>' : ''}
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar-plus"></i>
                        <span>Eklendi: ${new Date(pkg.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                
                ${pkg.specialInstructions ? `
                    <div class="special-instructions">
                        <i class="fas fa-info-circle"></i>
                        <span>${pkg.specialInstructions}</span>
                    </div>
                ` : ''}
                
                <div class="package-status">
                    <span class="status-badge ${pkg.status}">${this.getStatusDisplayName(pkg.status)}</span>
                    ${isLowStock ? '<span class="warning-badge">Az Stok</span>' : ''}
                    ${isExpiringSoon ? '<span class="urgent-badge">Yakında Sona Eriyor</span>' : ''}
                </div>
                
                <div class="package-actions">
                    <button class="btn-sm btn-secondary" onclick="editPackage('${pkg.id}')" title="Paketi Düzenle">
                        <i class="fas fa-edit"></i> Düzenle
                    </button>
                    <button class="btn-sm btn-warning" onclick="duplicatePackage('${pkg.id}')" title="Paketi Kopyala">
                        <i class="fas fa-copy"></i> Kopyala
                    </button>
                    <button class="btn-sm btn-danger" onclick="deletePackage('${pkg.id}')" title="Paketi Sil">
                        <i class="fas fa-trash"></i> Sil
                    </button>
                </div>
            </div>
        `;
    }

    getCategoryDisplayName(category) {
        const categories = {
            'ana-yemek': 'Ana Yemek',
            'aperatif': 'Aperatif',
            'tatli': 'Tatlı',
            'icecek': 'İçecek',
            'menu': 'Menü',
            'kahvalti': 'Kahvaltı',
            'atistirmalik': 'Atıştırmalık'
        };
        return categories[category] || category;
    }

    getStatusDisplayName(status) {
        const statuses = {
            'active': 'Aktif',
            'inactive': 'Pasif',
            'deleted': 'Silindi',
            'expired': 'Süresi Dolmuş'
        };
        return statuses[status] || status;
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

    // API Methods for Render Integration
    async getRestaurantPackages(restaurantId) {
        try {
            const response = await window.KapTazeAPIService.request(`/restaurant/packages?restaurantId=${restaurantId}`);
            return response.data || [];
        } catch (error) {
            console.error('❌ Failed to load packages:', error);
            return [];
        }
    }

    async addPackageAPI(restaurantId, packageData) {
        try {
            const response = await window.KapTazeAPIService.request('/restaurant/packages', {
                method: 'POST',
                body: { restaurantId, ...packageData }
            });
            return response.data;
        } catch (error) {
            console.error('❌ Failed to add package:', error);
            throw error;
        }
    }

    // Package Management Methods
    async addPackage(packageData) {
        if (!this.currentUser) {
            console.error('❌ No current user - cannot add package');
            return false;
        }
        
        try {
            // SECURITY FIX: Use current user ID as restaurant ID
            console.log('📦 Adding package for restaurant:', this.currentUser.id, 'by user:', this.currentUser.username);
            const newPackage = await this.addPackageAPI(this.currentUser.id, packageData);
            
            if (newPackage) {
                this.packages.push(newPackage);
                this.renderPackages();
                this.updateStatistics();
                
                // RENDER API: No sync needed - all data goes to MongoDB Atlas
                
                this.showSuccessMessage('Paket başarıyla eklendi!');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Package add error:', error);
            this.showErrorMessage('Paket eklenirken hata oluştu.');
            return false;
        }
    }

    updatePackage(packageId, updates) {
        try {
            const updatedPackage = window.KapTazeDB.updatePackage(packageId, updates);
            
            if (updatedPackage) {
                // Update local packages array
                const index = this.packages.findIndex(pkg => pkg.id === packageId);
                if (index !== -1) {
                    this.packages[index] = updatedPackage;
                }
                
                this.renderPackages();
                this.showSuccessMessage('Paket başarıyla güncellendi!');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Package update error:', error);
            this.showErrorMessage('Paket güncellenirken hata oluştu.');
            return false;
        }
    }

    deletePackageById(packageId) {
        try {
            const success = window.KapTazeDB.updatePackage(packageId, { status: 'deleted' });
            
            if (success) {
                // Remove from local array
                this.packages = this.packages.filter(pkg => pkg.id !== packageId);
                this.renderPackages();
                this.updateStatistics();
                this.showSuccessMessage('Paket başarıyla silindi!');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ Package delete error:', error);
            this.showErrorMessage('Paket silinirken hata oluştu.');
            return false;
        }
    }

    duplicatePackage(packageId) {
        try {
            const originalPackage = this.packages.find(pkg => pkg.id === packageId);
            if (!originalPackage) {
                this.showErrorMessage('Kopyalanacak paket bulunamadı.');
                return false;
            }
            
            const duplicateData = {
                ...originalPackage,
                name: `${originalPackage.name} (Kopya)`,
                quantity: 1, // Reset quantity for safety
            };
            
            // Remove fields that shouldn't be copied
            delete duplicateData.id;
            delete duplicateData.createdAt;
            delete duplicateData.updatedAt;
            
            const success = this.addPackage(duplicateData);
            if (success) {
                this.showSuccessMessage('Paket başarıyla kopyalandı!');
            }
            
            return success;
        } catch (error) {
            console.error('❌ Package duplicate error:', error);
            this.showErrorMessage('Paket kopyalanırken hata oluştu.');
            return false;
        }
    }

    // Modal Management
    showAddPackageModal(packageId = null) {
        const modal = document.getElementById('addPackageModal');
        const modalTitle = document.getElementById('modalTitle');
        const submitButtonText = document.getElementById('submitButtonText');
        
        if (packageId) {
            // Edit mode
            modalTitle.textContent = 'Paketi Düzenle';
            submitButtonText.textContent = 'Paketi Güncelle';
            this.populatePackageForm(packageId);
            modal.dataset.editingPackageId = packageId;
        } else {
            // Add mode
            modalTitle.textContent = 'Yeni Paket Ekle';
            submitButtonText.textContent = 'Paket Ekle';
            this.clearPackageForm();
            delete modal.dataset.editingPackageId;
        }
        
        modal.style.display = 'flex';
        
        // Set default datetime to 1 hour from now
        const defaultDate = new Date();
        defaultDate.setHours(defaultDate.getHours() + 1);
        document.getElementById('availableUntil').value = defaultDate.toISOString().slice(0, 16);
    }

    hideAddPackageModal() {
        const modal = document.getElementById('addPackageModal');
        modal.style.display = 'none';
        this.clearPackageForm();
    }

    populatePackageForm(packageId) {
        const packageData = this.packages.find(pkg => pkg.id === packageId);
        if (!packageData) return;
        
        document.getElementById('packageName').value = packageData.name || '';
        document.getElementById('packageCategory').value = packageData.category || '';
        document.getElementById('packageDescription').value = packageData.description || '';
        document.getElementById('originalPrice').value = packageData.originalPrice || '';
        document.getElementById('discountedPrice').value = packageData.discountedPrice || '';
        document.getElementById('quantity').value = packageData.quantity || '';
        document.getElementById('packageTags').value = packageData.tags ? packageData.tags.join(', ') : '';
        document.getElementById('specialInstructions').value = packageData.specialInstructions || '';
        
        if (packageData.availableUntil) {
            const date = new Date(packageData.availableUntil);
            document.getElementById('availableUntil').value = date.toISOString().slice(0, 16);
        }
        
        // Update discount calculation
        this.calculateDiscount();
    }

    clearPackageForm() {
        document.getElementById('packageName').value = '';
        document.getElementById('packageCategory').value = '';
        document.getElementById('packageDescription').value = '';
        document.getElementById('originalPrice').value = '';
        document.getElementById('discountedPrice').value = '';
        document.getElementById('quantity').value = '';
        document.getElementById('packageTags').value = '';
        document.getElementById('specialInstructions').value = '';
        document.getElementById('availableUntil').value = '';
        
        // Reset discount indicator
        document.getElementById('discountBadge').textContent = '0% İndirim';
        document.getElementById('savingsAmount').textContent = '₺0 tasarruf';
        document.getElementById('stockWarning').style.display = 'none';
    }

    handlePackageSubmit(e) {
        e.preventDefault();
        
        if (!this.restaurantProfile) {
            this.showErrorMessage('Restaurant profili bulunamadı.');
            return;
        }
        
        // Collect form data
        const formData = {
            name: document.getElementById('packageName').value,
            category: document.getElementById('packageCategory').value,
            description: document.getElementById('packageDescription').value,
            originalPrice: parseFloat(document.getElementById('originalPrice').value),
            discountedPrice: parseFloat(document.getElementById('discountedPrice').value),
            quantity: parseInt(document.getElementById('quantity').value),
            availableUntil: document.getElementById('availableUntil').value || null,
            tags: document.getElementById('packageTags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0),
            specialInstructions: document.getElementById('specialInstructions').value
        };
        
        // Validation
        if (formData.originalPrice <= formData.discountedPrice) {
            this.showErrorMessage('İndirimli fiyat orijinal fiyattan düşük olmalıdır.');
            return;
        }
        
        if (formData.quantity < 1) {
            this.showErrorMessage('Stok adedi 1\'den az olamaz.');
            return;
        }
        
        const modal = document.getElementById('addPackageModal');
        const editingPackageId = modal.dataset.editingPackageId;
        
        let success = false;
        
        if (editingPackageId) {
            // Update existing package
            success = this.updatePackage(editingPackageId, formData);
        } else {
            // Add new package
            success = this.addPackage(formData);
        }
        
        if (success) {
            this.hideAddPackageModal();
        }
    }

    // Utility functions for package management
    calculateDiscount() {
        const originalPrice = parseFloat(document.getElementById('originalPrice').value) || 0;
        const discountedPrice = parseFloat(document.getElementById('discountedPrice').value) || 0;
        
        if (originalPrice > 0 && discountedPrice > 0 && originalPrice > discountedPrice) {
            const discountPercent = Math.round((1 - discountedPrice / originalPrice) * 100);
            const savings = originalPrice - discountedPrice;
            
            document.getElementById('discountBadge').textContent = `%${discountPercent} İndirim`;
            document.getElementById('savingsAmount').textContent = `₺${savings.toFixed(2)} tasarruf`;
        } else {
            document.getElementById('discountBadge').textContent = '0% İndirim';
            document.getElementById('savingsAmount').textContent = '₺0 tasarruf';
        }
    }

    updateStockWarning() {
        const quantity = parseInt(document.getElementById('quantity').value) || 0;
        const warning = document.getElementById('stockWarning');
        
        if (quantity > 0 && quantity <= 3) {
            warning.style.display = 'block';
        } else {
            warning.style.display = 'none';
        }
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
            localStorage.removeItem('restaurantProfile');
            console.log('🚪 Restaurant logged out from restaurant-panel.js');
            window.location.href = '/restaurant-login.html';
        }
    }
}

// Navigation function for section switching
window.showSection = function(sectionId, event) {
    // Prevent default link behavior to stop page jump
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Add active class to corresponding nav item
    const activeNavItem = document.querySelector(`a[href="#${sectionId}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }
    
    // Update URL hash without causing page jump
    history.replaceState(null, null, `#${sectionId}`);
    
    // Update page title
    const sectionTitles = {
        'dashboard': 'Dashboard',
        'profile': 'Profil',
        'packages': 'Paketler',
        'orders': 'Siparişler',
        'analytics': 'Analizler',
        'settings': 'Ayarlar'
    };
    
    const pageTitle = sectionTitles[sectionId] || 'Restoran Paneli';
    document.title = `KapTaze - ${pageTitle}`;
    
    // Load section-specific data
    if (window.restaurantPanel) {
        switch(sectionId) {
            case 'packages':
                window.restaurantPanel.loadPackages();
                break;
            case 'dashboard':
                window.restaurantPanel.loadDashboardData();
                break;
        }
    }
    
    return false; // Prevent default link behavior
};

// Sidebar toggle function
window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && mainContent) {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar-collapsed');
    }
};

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

window.showAddPackageModal = function(packageId = null) {
    window.restaurantPanel.showAddPackageModal(packageId);
};

window.hideAddPackageModal = function() {
    window.restaurantPanel.hideAddPackageModal();
};

window.calculateDiscount = function() {
    window.restaurantPanel.calculateDiscount();
};

window.updateStockWarning = function() {
    window.restaurantPanel.updateStockWarning();
};

window.editPackage = function(packageId) {
    window.restaurantPanel.showAddPackageModal(packageId);
};

window.deletePackage = function(packageId) {
    if (confirm('Bu paketi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
        window.restaurantPanel.deletePackageById(packageId);
    }
};

window.duplicatePackage = function(packageId) {
    window.restaurantPanel.duplicatePackage(packageId);
};

window.logout = function() {
    window.restaurantPanel.logout();
};

// Additional missing global functions for restaurant panel
window.toggleNotifications = function() {
    const notificationsPanel = document.getElementById('notificationsPanel');
    if (notificationsPanel) {
        notificationsPanel.classList.toggle('active');
    }
};

window.updateAnalytics = function() {
    if (window.restaurantPanel) {
        window.restaurantPanel.updateStatistics();
        window.restaurantPanel.showSuccessMessage('Analizler güncellendi!');
    }
};

window.hidePackageImageModal = function() {
    const modal = document.getElementById('packageImageModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.savePackageImage = function() {
    // Placeholder for package image save functionality
    window.restaurantPanel.showSuccessMessage('Görsel kaydedildi!');
    window.hidePackageImageModal();
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.restaurantPanel = new RestaurantPanel();
});

console.log('🏪 Restaurant Panel JS loaded - v2025.08.22.36 - SYNC FIX: Packages to admin panel!');