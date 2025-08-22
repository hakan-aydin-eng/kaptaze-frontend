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
                // Approve application and create restaurant credentials
                const { applicationId, credentials } = data;
                
                const appIndex = sharedData.applications.findIndex(app => app.id === applicationId);
                if (appIndex === -1) {
                    throw new Error('Application not found');
                }

                const app = sharedData.applications[appIndex];
                app.status = 'approved';
                app.approvedAt = new Date().toISOString();

                // Create restaurant user
                const restaurantUser = {
                    id: `RU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    applicationId: applicationId,
                    username: credentials.username,
                    password: credentials.password,
                    email: app.email,
                    phone: app.phone,
                    role: 'restaurant',
                    status: 'active',
                    createdAt: new Date().toISOString()
                };

                sharedData.restaurantUsers.push(restaurantUser);

                // Create restaurant profile
                const restaurantProfile = {
                    id: `RP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId: restaurantUser.id,
                    applicationId: applicationId,
                    businessName: app.businessName,
                    businessType: app.businessType,
                    address: app.businessAddress,
                    city: app.city,
                    district: app.district,
                    coordinates: {
                        lat: app.businessLatitude,
                        lng: app.businessLongitude
                    },
                    description: '',
                    website: '',
                    mainImage: '',
                    gallery: [],
                    businessHours: {},
                    specialties: [],
                    status: 'active',
                    isVisible: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                sharedData.restaurantProfiles.push(restaurantProfile);
                sharedData.metadata.lastModified = new Date().toISOString();

                console.log('✅ Application approved in shared storage:', applicationId);

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
                        message: 'Application approved successfully'
                    })
                };

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