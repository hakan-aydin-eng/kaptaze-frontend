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
        
        // Check authentication (admin pattern)
        if (!this.checkAuthentication()) {
            return;
        }

        // Load restaurant profile from API
        await this.loadRestaurantProfile();
        
        // Setup event listeners
        this.setupEventListeners();
        this.setupImageUpload();
        
        // Load initial data
        await this.loadDashboardData();
        await this.loadPackages();
        
        // Setup real-time data updates
        this.setupDataSync();
        
        console.log('✅ Restaurant Panel ready');
    }

    async checkAuthentication() {
        console.log('🔐 Restaurant Panel Auth Check v2025.08.29.5 - PURE API NO LOCALSTORAGE');
        
        try {
            // Wait for backend service to be available
            await this.waitForBackendService();
            
            // Check API session directly - NO localStorage at all
            if (!window.backendService) {
                console.log('❌ Backend service not loaded');
                window.location.href = '/restaurant';
                return false;
            }
            
            console.log('🔍 Checking API session...');
            const sessionCheck = await window.backendService.checkSession();
            
            if (!sessionCheck || !sessionCheck.user) {
                console.log('❌ No valid API session found, redirecting to login');
                window.location.href = '/restaurant';
                return false;
            }
            
            if (sessionCheck.user.role !== 'restaurant') {
                console.log('❌ User is not a restaurant, redirecting');
                window.location.href = '/restaurant';
                return false;
            }
            
            this.currentUser = sessionCheck.user;
            console.log('✅ Restaurant authenticated via API:', {
                username: this.currentUser.username,
                firstName: this.currentUser.firstName,
                role: this.currentUser.role
            });
            
            return true;
        } catch (error) {
            console.log('❌ API session check failed:', error);
            window.location.href = '/restaurant';
            return false;
        }
    }

    async waitForBackendService(maxWait = 10000) {
        console.log('⏳ Waiting for backend service to be available...');
        const start = Date.now();
        
        while (!window.backendService && (Date.now() - start) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (window.backendService) {
            console.log('✅ Backend service is now available');
        } else {
            console.log('❌ Backend service timeout after', maxWait, 'ms');
        }
    }

    async loadRestaurantProfile() {
        try {
            console.log('📋 Loading restaurant profile from API...');
            
            // Wait for backend service to be available
            await this.waitForBackendService();
            
            if (!window.backendService) {
                throw new Error('Backend service not available after waiting');
            }
            
            // TEMPORARY: Force load papi culo data for testing
            console.log('🧪 TEST MODE: Loading papi culo data directly...');
            
            const response = await window.backendService.getRestaurantProfile();
            
            if (response.success && response.data) {
                this.restaurantProfile = response.data;
                console.log('✅ Restaurant profile loaded:', this.restaurantProfile);
                this.updateRestaurantInfoDisplay();
            } else {
                console.warn('⚠️ No restaurant profile found - creating new profile in backend');
                await this.createAndSaveProfile();
            }
        } catch (error) {
            console.error('❌ Failed to load restaurant profile:', error);
            // If profile doesn't exist, create one
            if (error.message.includes('404') || error.message.includes('not found')) {
                await this.createAndSaveProfile();
            } else {
                // For other errors, use fallback
                this.createProfileFromUserData();
            }
        }
    }

    async createAndSaveProfile() {
        try {
            console.log('🏗️ Creating new restaurant profile in backend...');
            
            if (!this.currentUser) {
                console.error('❌ No current user data for profile creation');
                return;
            }
            
            // Wait for backend service to be available
            await this.waitForBackendService();
            
            if (!window.backendService) {
                console.error('❌ Backend service not available for profile creation');
                this.createProfileFromUserData();
                return;
            }

            const profileData = {
                businessName: this.currentUser.businessName || this.currentUser.firstName || 'Restaurant',
                businessType: this.currentUser.businessCategory || 'Restaurant', 
                description: 'Henüz açıklama eklenmemiş.',
                website: '',
                address: this.currentUser.address || '',
                phone: this.currentUser.phone || '',
                email: this.currentUser.email || '',
                specialties: [],
                businessHours: {
                    weekday: { open: '09:00', close: '22:00' },
                    weekend: { open: '10:00', close: '23:00' }
                },
                status: 'active'
            };

            console.log('📤 Creating profile with data:', profileData);
            
            try {
                const response = await window.backendService.createRestaurantProfile(profileData);
                console.log('📥 Profile creation response:', response);
                
                // Backend'e request gitti, response kontrolü
                if (!response) {
                    console.error('❌ No response from backend profile creation');
                    this.createProfileFromUserData();
                    return;
                }
                
                // Process the response
                if (response && response.success && response.data) {
                    this.restaurantProfile = response.data;
                    console.log('✅ Restaurant profile created and saved in backend:', this.restaurantProfile);
                    this.updateRestaurantInfoDisplay();
                } else if (response && response.data) {
                    // Sometimes success field might be missing but data exists
                    this.restaurantProfile = response.data;
                    console.log('✅ Restaurant profile created (no success field):', this.restaurantProfile);
                    this.updateRestaurantInfoDisplay();
                } else {
                    console.error('❌ Profile creation failed, response:', response);
                    console.warn('⚠️ Using local fallback profile');
                    this.createProfileFromUserData();
                }
                
            } catch (createError) {
                console.error('❌ Profile creation request failed:', createError);
                console.log('📤 Backend might not have POST /restaurant/me endpoint');
                
                // If POST fails, backend might not support profile creation yet
                console.warn('⚠️ Profile creation not supported by backend, using fallback');
                this.createProfileFromUserData();
            }

        } catch (error) {
            console.error('❌ Failed to create restaurant profile:', error);
            console.warn('⚠️ Falling back to local profile');
            this.createProfileFromUserData();
        }
    }

    createProfileFromUserData() {
        // Create profile from current user data if no restaurant profile exists
        if (this.currentUser) {
            this.restaurantProfile = {
                // Display fields (what updateProfileDisplay expects)
                businessName: this.currentUser.businessName || this.currentUser.firstName || 'Restaurant',
                businessType: this.currentUser.businessCategory || 'Restaurant',
                description: 'Henüz açıklama eklenmemiş.',
                website: '',
                address: this.currentUser.address || '',
                
                // Legacy fields (what might be expected elsewhere)
                name: this.currentUser.businessName || this.currentUser.firstName || 'Restaurant',
                owner: `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim(),
                email: this.currentUser.email,
                phone: this.currentUser.phone,
                category: this.currentUser.businessCategory || 'Restaurant',
                city: this.currentUser.city,
                district: this.currentUser.district,
                
                // Profile specific fields
                specialties: [],
                businessHours: {
                    weekday: { open: '09:00', close: '22:00' },
                    weekend: { open: '10:00', close: '23:00' }
                },
                status: 'active'
            };
            console.warn('⚠️ FALLBACK: Profile created locally from user data (NOT SAVED TO BACKEND):', this.restaurantProfile);
            this.updateRestaurantInfoDisplay();
        }
    }

    updateRestaurantInfoDisplay() {
        if (!this.restaurantProfile && !this.currentUser) return;

        // Use restaurant profile or current user data
        const data = this.restaurantProfile || this.currentUser;
        
        // Update restaurant image from backend
        const restaurantAvatar = document.getElementById('restaurant-avatar');
        const mainImagePreview = document.getElementById('mainImagePreview');
        const uploadPlaceholder = document.getElementById('imageUploadPlaceholder');
        
        if (data.imageUrl) {
            // Restaurant has a saved image in backend
            if (restaurantAvatar) {
                restaurantAvatar.src = data.imageUrl;
                restaurantAvatar.style.display = 'block';
            }
            if (mainImagePreview) {
                mainImagePreview.src = data.imageUrl;
                mainImagePreview.style.display = 'block';
            }
            if (uploadPlaceholder) {
                uploadPlaceholder.style.display = 'none';
            }
            console.log('✅ Loaded restaurant image from backend:', data.imageUrl);
        } else if (data.mainImage) {
            // Fallback to mainImage field if exists
            if (restaurantAvatar) {
                restaurantAvatar.src = data.mainImage;
                restaurantAvatar.style.display = 'block';
            }
            if (mainImagePreview) {
                mainImagePreview.src = data.mainImage;
                mainImagePreview.style.display = 'block';
            }
            if (uploadPlaceholder) {
                uploadPlaceholder.style.display = 'none';
            }
        }

        // Update header restaurant name with debug
        console.log('🏪 Dashboard data for restaurant name:', {
            name: data.name,
            businessName: data.businessName,
            username: data.username
        });
        
        const headerName = document.getElementById('restaurant-name');
        if (headerName) {
            const displayName = data.name || data.businessName || data.username || 'Restaurant';
            headerName.textContent = displayName;
            console.log('✅ Updated restaurant name in header:', displayName);
        } else {
            console.log('❌ #restaurant-name element not found');
        }

        // Update all profile section fields with real admin approval data
        if (this.restaurantProfile || this.currentUser) {
            const profileData = this.restaurantProfile || this.currentUser;
            
            // Restaurant name and category
            const profileName = document.getElementById('profile-restaurant-name');
            if (profileName) {
                profileName.textContent = profileData.businessName || profileData.name || 'Restaurant Adı';
            }

            const categoryEl = document.getElementById('profile-restaurant-category');
            if (categoryEl) {
                categoryEl.textContent = profileData.businessType || profileData.businessCategory || 'Restaurant';
            }

            // Contact information in profile - with null safety
            const profileEmail = document.getElementById('profile-email');
            if (profileEmail && this.currentUser && this.currentUser.email) {
                profileEmail.textContent = this.currentUser.email;
            }

            const profilePhone = document.getElementById('profile-phone');
            if (profilePhone && this.currentUser && this.currentUser.phone) {
                profilePhone.textContent = this.currentUser.phone;
            }

            // Business address - try restaurant profile first, then user data
            const profileAddress = document.getElementById('profile-address');
            if (profileAddress) {
                let addressText = 'Adres bilgisi';
                
                if (this.restaurantProfile && this.restaurantProfile.address) {
                    // Get address from restaurant profile (from approved application)
                    const addr = this.restaurantProfile.address;
                    const addressParts = [
                        addr.street,
                        addr.district,
                        addr.city
                    ].filter(part => part && part.trim());
                    
                    if (addressParts.length > 0) {
                        addressText = addressParts.join(', ');
                    }
                } else if (this.currentUser) {
                    // Fallback to user data
                    const addressParts = [
                        this.currentUser.businessAddress,
                        this.currentUser.district,
                        this.currentUser.city
                    ].filter(part => part && part.trim());
                    
                    if (addressParts.length > 0) {
                        addressText = addressParts.join(', ');
                    }
                }
                
                profileAddress.textContent = addressText;
            }

            // Add description from restaurantProfile or currentUser
            const profileDescription = document.getElementById('profile-description');
            if (profileDescription) {
                if (this.restaurantProfile && this.restaurantProfile.description) {
                    profileDescription.textContent = this.restaurantProfile.description;
                } else if (this.currentUser) {
                    const ownerName = `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
                    if (ownerName) {
                        profileDescription.textContent = `${this.currentUser.businessName || 'Restaurant'} - Sahibi: ${ownerName}`;
                    } else {
                        profileDescription.textContent = `${this.currentUser.businessName || 'Restaurant'} hakkında...`;
                    }
                } else {
                    profileDescription.textContent = 'Restaurant hakkında...';
                }
            }

            // Update specialties with business category
            const profileSpecialties = document.getElementById('profile-specialties');
            if (profileSpecialties && this.currentUser && this.currentUser.businessCategory) {
                profileSpecialties.innerHTML = `<span class="specialty-tag">${this.currentUser.businessCategory}</span>`;
            }

            // Update restaurant avatar and website - FIX RANDOM DISPLAY ISSUE
            const avatarEl = document.getElementById('restaurant-avatar');
            const websiteEl = document.getElementById('profile-website');
            
            console.log('🔍 Profile data sources:', {
                restaurantProfile: !!this.restaurantProfile,
                currentUser: !!this.currentUser,
                restaurantImageUrl: this.restaurantProfile?.imageUrl,
                restaurantMainImage: this.restaurantProfile?.mainImage,
                currentUserImageUrl: this.currentUser?.imageUrl,
                websiteData: this.restaurantProfile?.socialMedia?.website || this.currentUser?.website
            });
            
            // Priority: restaurantProfile.imageUrl > restaurantProfile.mainImage > currentUser.imageUrl
            let imageUrl = null;
            if (this.restaurantProfile?.imageUrl) {
                imageUrl = this.restaurantProfile.imageUrl;
            } else if (this.restaurantProfile?.mainImage) {
                imageUrl = this.restaurantProfile.mainImage;
            } else if (this.currentUser?.imageUrl) {
                imageUrl = this.currentUser.imageUrl;
            }
            
            if (avatarEl && imageUrl) {
                console.log('🖼️ Setting restaurant image:', imageUrl);
                avatarEl.src = imageUrl;
                avatarEl.style.display = 'block';
            }
            
            // Update website info - CONSISTENT DISPLAY
            if (websiteEl) {
                const websiteUrl = this.restaurantProfile?.socialMedia?.website || 
                                  this.currentUser?.website || 
                                  this.currentUser?.socialMedia?.website;
                if (websiteUrl) {
                    websiteEl.textContent = websiteUrl;
                    websiteEl.href = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
                    console.log('🌐 Updated website:', websiteUrl);
                } else {
                    websiteEl.textContent = 'Website bilgisi yok';
                    websiteEl.removeAttribute('href');
                }
            }

            console.log('📊 Restaurant profile updated with real admin approval data:', {
                businessName: profileData.businessName || profileData.name,
                description: this.restaurantProfile?.description || 'Default',
                hasImage: !!(this.restaurantProfile?.mainImage)
            });
        }

        console.log('📊 Restaurant info display updated');
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
        if (!this.restaurantProfile) {
            console.warn('⚠️ No restaurant profile for display update');
            return;
        }
        
        const profile = this.restaurantProfile;
        console.log('🔄 Updating profile display with:', profile);
        console.log('🌐 Website data:', {
            socialMedia: profile.socialMedia,
            website: profile.website,
            socialMediaWebsite: profile.socialMedia?.website
        });
        
        // Basic info
        this.updateElement('profile-restaurant-name', profile.businessName);
        this.updateElement('profile-restaurant-category', profile.businessType);
        this.updateElement('profile-description', profile.description || 'Henüz açıklama eklenmemiş.');
        this.updateElement('profile-email', this.currentUser.email);
        this.updateElement('profile-phone', this.currentUser.phone);
        this.updateElement('profile-address', profile.address);
        
        // Website in contact info section
        const websiteItem = document.getElementById('profile-website-item');
        const websiteLink = document.getElementById('profile-website-link');
        const websiteDisplay = document.getElementById('profile-website-display');
        const websiteUrl = (profile.socialMedia && profile.socialMedia.website) || profile.website;
        
        if (websiteUrl && websiteItem && websiteLink && websiteDisplay) {
            websiteLink.href = websiteUrl;
            websiteDisplay.textContent = websiteUrl.replace(/^https?:\/\//, ''); // Remove protocol for display
            websiteItem.style.display = 'block';
        } else if (websiteItem) {
            websiteItem.style.display = 'none';
        }
        
        // Also update the old website element if it exists (for backward compatibility)
        const oldWebsiteEl = document.getElementById('profile-website');
        if (oldWebsiteEl && websiteUrl) {
            oldWebsiteEl.href = websiteUrl;
            oldWebsiteEl.style.display = 'block';
        } else if (oldWebsiteEl) {
            oldWebsiteEl.style.display = 'none';
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
        
        console.log('📝 Profile submit triggered');
        console.log('🔍 Restaurant profile exists:', !!this.restaurantProfile);
        console.log('🔍 Current user exists:', !!this.currentUser);
        
        if (!this.restaurantProfile) {
            console.error('❌ No restaurant profile found - creating from user data');
            this.createProfileFromUserData();
            if (!this.restaurantProfile) {
                console.error('❌ Still no restaurant profile after creation');
                return;
            }
        }
        
        try {
            // Collect form data
            const formData = new FormData(e.target);
            
            // Normalize website URL - allow flexible input
            let websiteValue = document.getElementById('editWebsite').value.trim();
            if (websiteValue && !websiteValue.startsWith('http://') && !websiteValue.startsWith('https://')) {
                websiteValue = 'https://' + websiteValue;
            }
            
            const updates = {
                description: document.getElementById('editDescription').value,
                socialMedia: {
                    website: websiteValue
                },
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
            
            // Handle main image upload via Cloudinary
            const mainImageInput = document.getElementById('mainImageInput');
            if (mainImageInput.files.length > 0) {
                console.log('🔄 Starting image upload...');
                const imageUrl = await this.uploadImageToCloudinary(mainImageInput.files[0]);
                if (imageUrl) {
                    console.log('✅ Image uploaded successfully:', imageUrl);
                    updates.imageUrl = imageUrl;
                    updates.mainImage = imageUrl; // For display
                } else {
                    console.error('❌ Image upload failed');
                    this.showErrorMessage('Resim yüklenemedi. Tekrar deneyin.');
                    return;
                }
            }
            
            console.log('📤 Sending profile updates:', updates);
            
            // Update via API
            const updatedProfile = await this.updateRestaurantProfileAPI(updates);
            
            console.log('📥 Received updated profile:', updatedProfile);
            console.log('🔍 Profile fields:', Object.keys(updatedProfile || {}));
            console.log('🔍 Image fields in profile:', {
                mainImage: !!updatedProfile?.mainImage,
                image: !!updatedProfile?.image, 
                imageUrl: !!updatedProfile?.imageUrl,
                profileImage: !!updatedProfile?.profileImage,
                avatar: !!updatedProfile?.avatar
            });
            
            if (updatedProfile) {
                // Map different possible image field names to mainImage
                if (!updatedProfile.mainImage) {
                    const imageFields = ['imageUrl', 'profileImage', 'image', 'avatar'];
                    for (const field of imageFields) {
                        if (updatedProfile[field]) {
                            console.log(`🔄 Mapping ${field} to mainImage:`, updatedProfile[field].substring(0, 50) + '...');
                            updatedProfile.mainImage = updatedProfile[field];
                            break;
                        }
                    }
                }
                
                // Backend now saves images persistently with imageUrl field
                this.restaurantProfile = updatedProfile;
                console.log('✅ Profile loaded from backend. Image present:', !!this.restaurantProfile.mainImage);
                
                console.log('✅ Profile updated in memory with mainImage:', !!this.restaurantProfile.mainImage);
                this.updateProfileDisplay();
                this.updateRestaurantInfoDisplay(); // Also update main display
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

    async uploadImageToCloudinary(file) {
        try {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                this.showErrorMessage('Dosya boyutu 5MB\'dan büyük olamaz');
                return null;
            }

            console.log('🔄 Uploading image via Cloudinary...');
            
            // Create FormData for image upload
            const formData = new FormData();
            formData.append('image', file);
            
            // Upload to backend Cloudinary endpoint
            const response = await backendService.uploadRestaurantImage(formData);
            
            if (response.success && response.data.imageUrl) {
                console.log('✅ Cloudinary upload successful:', response.data.imageUrl);
                return response.data.imageUrl;
            } else {
                console.error('❌ Cloudinary upload failed:', response);
                return null;
            }
        } catch (error) {
            console.error('❌ Image upload error:', error);
            return null;
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
        // Safe field access with fallbacks
        const originalPrice = pkg.originalPrice || pkg.price || 0;
        const discountedPrice = pkg.discountedPrice || pkg.price || 0;
        const quantity = pkg.quantity || 0;
        
        const discountPercent = originalPrice > 0 ? 
            Math.round((1 - discountedPrice / originalPrice) * 100) : 0;
        const isLowStock = quantity <= 3;
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
                        <div class="original-price">₺${originalPrice.toFixed(2)}</div>
                        <div class="discounted-price">₺${discountedPrice.toFixed(2)}</div>
                        <div class="discount-badge">${discountPercent}% İndirim</div>
                        <div class="savings">₺${(originalPrice - discountedPrice).toFixed(2)} tasarruf</div>
                    </div>
                </div>
                
                <div class="package-details">
                    <div class="detail-item ${isLowStock ? 'warning' : ''}">
                        <i class="fas fa-cubes"></i>
                        <span>Stok: ${quantity} adet</span>
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

    async updateStatistics() {
        if (!this.restaurantProfile) return;
        
        const stats = await this.getStatisticsAPI();
        
        // Update dashboard stats
        document.getElementById('active-packages').textContent = this.packages.length;
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
        document.getElementById('editWebsite').value = 
            (profile.socialMedia && profile.socialMedia.website) || profile.website || '';
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

    // Restaurant Profile Image Upload
    setupImageUpload() {
        const imageInput = document.getElementById('restaurant-image-input');
        if (imageInput) {
            imageInput.addEventListener('change', (event) => this.handleImageUpload(event));
        }
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showErrorMessage('Lütfen bir resim dosyası seçin.');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showErrorMessage('Resim boyutu 5MB\'dan küçük olmalıdır.');
            return;
        }

        try {
            console.log('📸 Uploading restaurant image...', file.name);
            
            // Show loading state
            const avatar = document.getElementById('restaurant-avatar');
            const originalSrc = avatar.src;
            avatar.style.opacity = '0.5';

            // Create preview immediately
            const reader = new FileReader();
            reader.onload = (e) => {
                avatar.src = e.target.result;
                avatar.style.opacity = '1';
            };
            reader.readAsDataURL(file);

            // Upload to backend
            const formData = new FormData();
            formData.append('image', file);

            console.log('📤 Uploading image to backend...');
            
            // Try image-specific endpoint first, fallback to general update
            let response;
            try {
                response = await window.backendService.makeRequest('/restaurant/profile/image', {
                    method: 'POST',
                    body: formData,
                    headers: {} // Let browser set content-type for FormData
                });
            } catch (error) {
                if (error.message.includes('404')) {
                    console.log('📤 Image endpoint not found, using profile update...');
                    // Fallback: update profile with image data
                    response = await window.backendService.makeRequest('/restaurant/me', {
                        method: 'PUT',
                        body: formData,
                        headers: {} // Let browser set content-type for FormData
                    });
                } else {
                    throw error;
                }
            }

            console.log('📥 Upload response:', response);

            if (response.success) {
                const imageUrl = response.data?.imageUrl || response.data?.url || response.imageUrl;
                console.log('✅ Restaurant image uploaded successfully:', imageUrl);
                
                if (imageUrl) {
                    console.log('🔄 Setting avatar.src to:', imageUrl.substring(0, 50) + '...');
                    avatar.src = imageUrl;
                    
                    // Also update profile data
                    if (this.restaurantProfile) {
                        this.restaurantProfile.mainImage = imageUrl;
                        console.log('✅ Updated restaurantProfile.mainImage');
                    }
                    
                    // Force UI refresh
                    this.updateRestaurantInfoDisplay();
                    
                } else {
                    console.warn('⚠️ No imageUrl in response, keeping preview');
                    // Even if no URL, keep the base64 preview
                    if (this.restaurantProfile) {
                        // Use the base64 data from avatar (from FileReader)
                        console.log('🔄 Using base64 preview as mainImage');
                        this.restaurantProfile.mainImage = avatar.src;
                        this.updateRestaurantInfoDisplay();
                        console.log('✅ Base64 image saved to profile locally');
                    }
                }
                
                this.showSuccessMessage('Restaurant görseli başarıyla güncellendi!');
            } else {
                throw new Error(response.error || 'Upload failed');
            }

        } catch (error) {
            console.error('❌ Failed to upload restaurant image:', error);
            this.showErrorMessage('Görsel yüklenirken hata oluştu: ' + error.message);
            
            // Restore original image on error
            const avatar = document.getElementById('restaurant-avatar');
            avatar.src = originalSrc || 'https://via.placeholder.com/120x120?text=🏪';
            avatar.style.opacity = '1';
        }
    }

    // API Methods for Render Integration
    async getRestaurantPackages(restaurantId) {
        try {
            const response = await window.backendService.makeRequest('/restaurant/packages');
            return response.data || [];
        } catch (error) {
            console.error('❌ Failed to load packages:', error);
            return [];
        }
    }

    async addPackageAPI(restaurantId, packageData) {
        try {
            const response = await window.backendService.makeRequest('/restaurant/packages', {
                method: 'POST',
                body: packageData
            });
            return response.data;
        } catch (error) {
            console.error('❌ Failed to add package:', error);
            throw error;
        }
    }

    async updatePackageAPI(packageId, updates) {
        try {
            const response = await window.backendService.makeRequest(`/restaurant/packages/${packageId}`, {
                method: 'PATCH',
                body: updates
            });
            return response.data;
        } catch (error) {
            console.error('❌ Failed to update package:', error);
            throw error;
        }
    }

    async updateRestaurantProfileAPI(profileData) {
        try {
            console.log('🔄 Updating restaurant profile via API...');
            const response = await window.backendService.updateRestaurantProfile(profileData);
            
            if (response.success && response.data) {
                console.log('✅ Profile updated successfully:', response.data);
                return response.data;
            } else {
                console.error('❌ Profile update failed:', response.error);
                throw new Error(response.error || 'Profile update failed');
            }
        } catch (error) {
            console.error('❌ Failed to update profile:', error);
            throw error;
        }
    }

    async getStatisticsAPI() {
        try {
            const response = await window.backendService.makeRequest('/restaurant/stats');
            return response.data;
        } catch (error) {
            console.error('❌ Failed to get statistics:', error);
            return { basic: { totalOrders: 0, totalRevenue: 0, activeMenuItems: 0 } };
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

    async updatePackage(packageId, updates) {
        try {
            const updatedPackage = await this.updatePackageAPI(packageId, updates);
            
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

    async deletePackageById(packageId) {
        try {
            const success = await this.updatePackageAPI(packageId, { status: 'deleted' });
            
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
        
        // Collect form data and format for backend API
        const formData = {
            name: document.getElementById('packageName').value,
            category: document.getElementById('packageCategory').value,
            description: document.getElementById('packageDescription').value,
            price: parseFloat(document.getElementById('discountedPrice').value), // Use discounted price as main price
            
            // Additional frontend fields (stored but not validated by backend)
            originalPrice: parseFloat(document.getElementById('originalPrice').value),
            quantity: parseInt(document.getElementById('quantity').value),
            availableUntil: document.getElementById('availableUntil').value || null,
            tags: document.getElementById('packageTags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0),
            specialInstructions: document.getElementById('specialInstructions').value
        };
        
        // Validation
        if (!formData.name || formData.name.trim().length === 0) {
            this.showErrorMessage('Ürün adı zorunludur.');
            return;
        }

        if (!formData.price || formData.price <= 0) {
            this.showErrorMessage('Geçerli bir fiyat giriniz.');
            return;
        }

        if (formData.originalPrice <= formData.price) {
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

// 📊 GLOBAL DATA LOADING FUNCTIONS - ACTIVE BACKEND API INTEGRATION

// Dashboard data loader
window.loadDashboardData = async function() {
    console.log('📊 Loading dashboard data from API...');
    if (window.restaurantPanel && window.restaurantPanel.loadDashboardData) {
        await window.restaurantPanel.loadDashboardData();
    }
};

// Profile data loader - LIVE BACKEND DATA
window.loadProfileData = async function() {
    console.log('👤 Loading profile data from API...');
    if (window.restaurantPanel && window.restaurantPanel.restaurantProfile) {
        window.restaurantPanel.updateRestaurantProfile(window.restaurantPanel.restaurantProfile);
    }
};

// Orders data loader - MOBILE APP ORDERS
window.loadOrdersData = async function() {
    console.log('🛒 Loading orders data from API...');
    if (window.initializeRestaurantOrders) {
        await window.initializeRestaurantOrders();
    }
};

// Customers data loader
window.loadCustomersData = async function() {
    console.log('👥 Loading customers data from API...');
    // TODO: Implement customer analytics
};

// Analytics data loader 
window.loadAnalyticsData = async function() {
    console.log('📈 Loading analytics data from API...');
    // TODO: Implement analytics dashboard
};

// Packages data loader
window.loadPackagesData = async function() {
    console.log('📦 Loading packages data from API...');
    if (window.restaurantPanel && window.restaurantPanel.loadPackages) {
        await window.restaurantPanel.loadPackages();
    }
};

// Payments data loader
window.loadPaymentsData = async function() {
    console.log('💳 Loading payments data from API...');
    // TODO: Implement payment history
};

console.log('🏪 Restaurant Panel JS loaded - v2025.09.13 - FULL BACKEND API INTEGRATION!');