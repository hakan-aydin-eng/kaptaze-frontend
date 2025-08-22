// KapTaze Shared Storage - Cross-device database solution
// Shared storage using Netlify Functions for multi-device data sync

let sharedData = {
    applications: [
        // Default mock data
        {
            id: 'APP_1734789123456',
            firstName: 'Ahmet',
            lastName: 'Kaya',
            email: 'ahmet@example.com',
            phone: '532 123 45 67',
            businessName: 'Ahmet\'in Lokantası',
            businessType: 'Geleneksel Türk',
            businessAddress: 'Muratpaşa, Antalya',
            city: 'Antalya',
            district: 'Muratpaşa',
            type: 'restaurant',
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ],
    restaurantUsers: [],
    restaurantProfiles: [],
    customerUsers: [],
    packages: [],
    orders: [],
    metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0.0',
        lastModified: new Date().toISOString()
    }
};

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const { action, data } = JSON.parse(event.body || '{}');
        console.log('📡 Shared Storage Request:', action, data ? 'with data' : 'no data');

        switch (action) {
            case 'get':
                // Return all shared data
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: sharedData
                    })
                };

            case 'addApplication':
                // Add new application
                if (!data) {
                    throw new Error('No application data provided');
                }

                const application = {
                    id: `APP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...data,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                sharedData.applications.push(application);
                sharedData.metadata.lastModified = new Date().toISOString();

                console.log('✅ Application added to shared storage:', application.id);

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        data: application,
                        message: 'Application saved to shared storage'
                    })
                };

            case 'approveApplication':
                try {
                    console.log('🔄 Starting application approval process...');
                    
                    // BULLETPROOF VALIDATION
                    if (!data || !data.applicationId || !data.credentials) {
                        console.error('❌ Invalid approval data:', data);
                        return {
                            statusCode: 400,
                            headers,
                            body: JSON.stringify({
                                success: false,
                                error: 'Missing required fields: applicationId and credentials',
                                received: data
                            })
                        };
                    }
                    
                    const { applicationId, credentials } = data;
                    
                    // Validate credentials
                    if (!credentials.username || !credentials.password) {
                        console.error('❌ Invalid credentials:', credentials);
                        return {
                            statusCode: 400,
                            headers,
                            body: JSON.stringify({
                                success: false,
                                error: 'Credentials must include username and password',
                                received: credentials
                            })
                        };
                    }
                    
                    console.log('📋 Approving application:', applicationId);
                    console.log('👤 With credentials:', { username: credentials.username, password: '***' });
                    
                    // Find application
                    const appIndex = sharedData.applications.findIndex(app => app.id === applicationId);
                    if (appIndex === -1) {
                        console.error('❌ Application not found:', applicationId);
                        console.log('📊 Available applications:', sharedData.applications.map(app => app.id));
                        
                        return {
                            statusCode: 404,
                            headers,
                            body: JSON.stringify({
                                success: false,
                                error: `Application not found: ${applicationId}`,
                                availableApplications: sharedData.applications.map(app => ({ id: app.id, status: app.status }))
                            })
                        };
                    }

                    const app = sharedData.applications[appIndex];
                    
                    // Check if already approved
                    if (app.status === 'approved') {
                        console.log('⚠️ Application already approved:', applicationId);
                        
                        // Find existing user and profile
                        const existingUser = sharedData.restaurantUsers.find(u => u.applicationId === applicationId);
                        const existingProfile = sharedData.restaurantProfiles.find(p => p.applicationId === applicationId);
                        
                        return {
                            statusCode: 200,
                            headers,
                            body: JSON.stringify({
                                success: true,
                                data: {
                                    application: app,
                                    user: existingUser,
                                    profile: existingProfile
                                },
                                message: 'Application already approved',
                                isExisting: true
                            })
                        };
                    }
                    
                    // Check for username conflicts
                    const existingUser = sharedData.restaurantUsers.find(u => u.username === credentials.username);
                    if (existingUser) {
                        console.error('❌ Username already exists:', credentials.username);
                        return {
                            statusCode: 409,
                            headers,
                            body: JSON.stringify({
                                success: false,
                                error: `Username already exists: ${credentials.username}`,
                                suggestion: `Try: ${credentials.username}_${Date.now().toString(36).substr(-3)}`
                            })
                        };
                    }
                    
                    // Update application status
                    app.status = 'approved';
                    app.approvedAt = new Date().toISOString();
                    app.approvedBy = 'admin';
                    
                    console.log('✅ Application status updated to approved');

                    // Create restaurant user with enhanced validation
                    const restaurantUser = {
                        id: `RU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        applicationId: applicationId,
                        username: credentials.username,
                        password: credentials.password,
                        email: app.email || 'noemail@kaptaze.com',
                        phone: app.phone || '',
                        role: 'restaurant',
                        status: 'active',
                        permissions: ['manage_profile', 'manage_packages', 'view_orders'],
                        createdAt: new Date().toISOString(),
                        lastLogin: null
                    };

                    sharedData.restaurantUsers.push(restaurantUser);
                    console.log('✅ Restaurant user created:', restaurantUser.id);

                    // Create restaurant profile with comprehensive data
                    const restaurantProfile = {
                        id: `RP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        userId: restaurantUser.id,
                        applicationId: applicationId,
                        businessName: app.businessName || 'Unnamed Restaurant',
                        businessType: app.businessType || app.businessCategory || 'Restaurant',
                        address: app.businessAddress || 'Address not provided',
                        city: app.city || 'Unknown City',
                        district: app.district || 'Unknown District',
                        coordinates: {
                            lat: app.businessLatitude || null,
                            lng: app.businessLongitude || null
                        },
                        contactInfo: {
                            email: app.email,
                            phone: app.phone,
                            website: ''
                        },
                        description: '',
                        mainImage: '',
                        gallery: [],
                        businessHours: {
                            monday: { open: '09:00', close: '22:00', closed: false },
                            tuesday: { open: '09:00', close: '22:00', closed: false },
                            wednesday: { open: '09:00', close: '22:00', closed: false },
                            thursday: { open: '09:00', close: '22:00', closed: false },
                            friday: { open: '09:00', close: '22:00', closed: false },
                            saturday: { open: '09:00', close: '22:00', closed: false },
                            sunday: { open: '09:00', close: '22:00', closed: false }
                        },
                        specialties: [],
                        rating: 0,
                        reviewCount: 0,
                        status: 'active',
                        isVisible: true,
                        isVerified: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };

                    sharedData.restaurantProfiles.push(restaurantProfile);
                    console.log('✅ Restaurant profile created:', restaurantProfile.id);
                    
                    // Update metadata
                    sharedData.metadata.lastModified = new Date().toISOString();
                    sharedData.metadata.totalApprovals = (sharedData.metadata.totalApprovals || 0) + 1;

                    console.log('🎉 Application approval completed successfully:', {
                        applicationId,
                        userId: restaurantUser.id,
                        profileId: restaurantProfile.id,
                        username: credentials.username
                    });

                    return {
                        statusCode: 200,
                        headers,
                        body: JSON.stringify({
                            success: true,
                            data: {
                                application: app,
                                user: restaurantUser,
                                profile: restaurantProfile
                            },
                            message: 'Application approved successfully',
                            timestamp: new Date().toISOString(),
                            stats: {
                                totalUsers: sharedData.restaurantUsers.length,
                                totalProfiles: sharedData.restaurantProfiles.length,
                                totalApprovals: sharedData.metadata.totalApprovals
                            }
                        })
                    };
                    
                } catch (approvalError) {
                    console.error('❌ CRITICAL: Application approval failed:', {
                        error: approvalError.message,
                        stack: approvalError.stack,
                        applicationId: data?.applicationId,
                        timestamp: new Date().toISOString()
                    });
                    
                    return {
                        statusCode: 500,
                        headers,
                        body: JSON.stringify({
                            success: false,
                            error: 'Application approval failed',
                            details: approvalError.message,
                            applicationId: data?.applicationId,
                            timestamp: new Date().toISOString(),
                            support: 'Please contact support if this error persists'
                        })
                    };
                }

            // Legacy support for old format
            case 'add':
                // Convert old format to new
                const legacyApp = {
                    id: `APP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ...data,
                    type: data.type || 'restaurant',
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                sharedData.applications.push(legacyApp);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ 
                        success: true, 
                        data: legacyApp,
                        total: sharedData.applications.length 
                    })
                };

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        console.error('❌ Shared Storage Error:', error.message);
        
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};