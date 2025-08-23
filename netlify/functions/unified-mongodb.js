/**
 * KapTaze Unified MongoDB Function
 * SINGLE SOURCE OF TRUTH - MongoDB Atlas Only
 * Handles ALL data operations for ALL panels
 * Version: 2025.08.23.01
 */

const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kaptaze-admin:kaptaze1121@kaptaze-cluster.ra9padd.mongodb.net/kaptaze';

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedDb = client.db('kaptaze');
    
    console.log('✅ Connected to MongoDB Atlas - Unified Database');
    return cachedDb;
}

// Generate session token
function generateSessionToken() {
    return `SES_${Date.now()}_${Math.random().toString(36).substr(2, 20)}`;
}

// Generate user ID
function generateUserId() {
    return `USR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate application ID
function generateApplicationId() {
    return `APP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const db = await connectToDatabase();
        const { action, data, sessionId } = JSON.parse(event.body);
        
        console.log(`📡 Unified MongoDB Action: ${action}`);

        switch (action) {
            // USER AUTHENTICATION
            case 'authenticate':
                return await authenticateUser(db, data, headers);
                
            // CUSTOMER APPLICATIONS
            case 'addApplication':
                return await addApplication(db, data, headers);
            case 'getApplications':
                return await getApplications(db, headers);
            case 'approveApplication':
                return await approveApplication(db, data, headers);
                
            // RESTAURANT MANAGEMENT
            case 'getRestaurants':
                return await getRestaurants(db, headers);
            case 'getRestaurantByUserId':
                return await getRestaurantByUserId(db, data, headers);
                
            // PACKAGE MANAGEMENT
            case 'getPackages':
                return await getPackages(db, data, headers);
            case 'addPackage':
                return await addPackage(db, data, headers);
            case 'updatePackage':
                return await updatePackage(db, data, headers);
            case 'deletePackage':
                return await deletePackage(db, data, headers);
                
            // ORDERS
            case 'getOrders':
                return await getOrders(db, data, headers);
                
            // STATISTICS
            case 'getStatistics':
                return await getStatistics(db, headers);
                
            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        success: false,
                        error: `Unknown action: ${action}`
                    })
                };
        }

    } catch (error) {
        console.error('❌ Unified MongoDB Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

// USER AUTHENTICATION
async function authenticateUser(db, data, headers) {
    const { username, password, role } = data;
    
    try {
        // Look in appropriate collection based on role
        let user = null;
        
        if (role === 'admin' || !role) {
            // Check admin credentials (hardcoded for security)
            if (username === 'admin' && password === 'kaptaze2024') {
                user = {
                    id: 'admin',
                    username: 'admin',
                    role: 'admin',
                    businessName: 'KapTaze Admin',
                    status: 'active'
                };
            }
        }
        
        if (!user && (role === 'restaurant' || !role)) {
            // Check restaurant users
            const restaurantUsers = db.collection('restaurantUsers');
            user = await restaurantUsers.findOne({
                username: username,
                password: password,
                status: 'active'
            });
            
            if (user) {
                user.role = 'restaurant';
            }
        }
        
        if (!user && (role === 'customer' || !role)) {
            // Check customer users
            const customerUsers = db.collection('customerUsers');
            user = await customerUsers.findOne({
                username: username,
                password: password,
                status: 'active'
            });
            
            if (user) {
                user.role = 'customer';
            }
        }
        
        if (!user) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid credentials'
                })
            };
        }
        
        // Generate session
        const sessionToken = generateSessionToken();
        const sessionId = generateSessionToken();
        
        // For restaurant users, get restaurant profile
        let restaurant = null;
        if (user.role === 'restaurant') {
            const restaurantProfiles = db.collection('restaurantProfiles');
            restaurant = await restaurantProfiles.findOne({ userId: user.id });
        }
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: {
                    user: user,
                    restaurant: restaurant,
                    token: sessionToken,
                    sessionId: sessionId
                }
            })
        };
        
    } catch (error) {
        console.error('❌ Authentication error:', error);
        throw error;
    }
}

// CUSTOMER APPLICATIONS
async function addApplication(db, data, headers) {
    try {
        const applications = db.collection('applications');
        
        const application = {
            id: generateApplicationId(),
            ...data,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await applications.insertOne(application);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: application
            })
        };
    } catch (error) {
        console.error('❌ Add application error:', error);
        throw error;
    }
}

async function getApplications(db, headers) {
    try {
        const applications = db.collection('applications');
        const apps = await applications.find({}).sort({ createdAt: -1 }).toArray();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: apps
            })
        };
    } catch (error) {
        console.error('❌ Get applications error:', error);
        throw error;
    }
}

async function approveApplication(db, data, headers) {
    try {
        const { applicationId, credentials } = data;
        const applications = db.collection('applications');
        const restaurantUsers = db.collection('restaurantUsers');
        const restaurantProfiles = db.collection('restaurantProfiles');
        
        // Find application
        const application = await applications.findOne({ id: applicationId });
        if (!application) {
            throw new Error('Application not found');
        }
        
        // Create restaurant user
        const userId = generateUserId();
        const restaurantUser = {
            id: userId,
            username: credentials.username,
            password: credentials.password,
            role: 'restaurant',
            businessName: application.businessName,
            email: application.email,
            phone: application.phone,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        await restaurantUsers.insertOne(restaurantUser);
        
        // Create restaurant profile
        const restaurantProfile = {
            id: `PROF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId,
            applicationId: applicationId,
            businessName: application.businessName,
            category: application.category,
            address: application.address,
            email: application.email,
            phone: application.phone,
            description: application.description,
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        await restaurantProfiles.insertOne(restaurantProfile);
        
        // Update application status
        await applications.updateOne(
            { id: applicationId },
            { 
                $set: { 
                    status: 'approved',
                    approvedAt: new Date().toISOString(),
                    restaurantUserId: userId
                }
            }
        );
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: {
                    user: restaurantUser,
                    profile: restaurantProfile,
                    application: application
                }
            })
        };
        
    } catch (error) {
        console.error('❌ Approve application error:', error);
        throw error;
    }
}

// RESTAURANT MANAGEMENT
async function getRestaurants(db, headers) {
    try {
        const restaurantProfiles = db.collection('restaurantProfiles');
        const restaurantUsers = db.collection('restaurantUsers');
        const applications = db.collection('applications');
        
        const profiles = await restaurantProfiles.find({}).toArray();
        const users = await restaurantUsers.find({}).toArray();
        const apps = await applications.find({}).toArray();
        
        // Combine data
        const restaurants = profiles.map(profile => {
            const user = users.find(u => u.id === profile.userId);
            const application = apps.find(app => app.id === profile.applicationId);
            
            return {
                ...profile,
                user: user,
                application: application
            };
        });
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: restaurants
            })
        };
    } catch (error) {
        console.error('❌ Get restaurants error:', error);
        throw error;
    }
}

async function getRestaurantByUserId(db, data, headers) {
    try {
        const { userId } = data;
        const restaurantProfiles = db.collection('restaurantProfiles');
        const restaurantUsers = db.collection('restaurantUsers');
        const applications = db.collection('applications');
        
        const profile = await restaurantProfiles.findOne({ userId: userId });
        if (!profile) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: null
                })
            };
        }
        
        const user = await restaurantUsers.findOne({ id: userId });
        const application = await applications.findOne({ id: profile.applicationId });
        
        const restaurant = {
            ...profile,
            user: user,
            application: application
        };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: restaurant
            })
        };
    } catch (error) {
        console.error('❌ Get restaurant by user ID error:', error);
        throw error;
    }
}

// PACKAGE MANAGEMENT
async function getPackages(db, data, headers) {
    try {
        const { restaurantId } = data || {};
        const packages = db.collection('packages');
        
        let query = { status: 'active' };
        if (restaurantId) {
            query.restaurantId = restaurantId;
        }
        
        const pkgs = await packages.find(query).sort({ createdAt: -1 }).toArray();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: pkgs
            })
        };
    } catch (error) {
        console.error('❌ Get packages error:', error);
        throw error;
    }
}

async function addPackage(db, data, headers) {
    try {
        const packages = db.collection('packages');
        await packages.insertOne(data);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: data
            })
        };
    } catch (error) {
        console.error('❌ Add package error:', error);
        throw error;
    }
}

async function updatePackage(db, data, headers) {
    try {
        const { packageId, ...updateData } = data;
        const packages = db.collection('packages');
        
        await packages.updateOne(
            { id: packageId },
            { $set: updateData }
        );
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: updateData
            })
        };
    } catch (error) {
        console.error('❌ Update package error:', error);
        throw error;
    }
}

async function deletePackage(db, data, headers) {
    try {
        const { packageId } = data;
        const packages = db.collection('packages');
        
        await packages.updateOne(
            { id: packageId },
            { $set: { status: 'deleted', deletedAt: new Date().toISOString() } }
        );
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: { packageId }
            })
        };
    } catch (error) {
        console.error('❌ Delete package error:', error);
        throw error;
    }
}

// ORDERS
async function getOrders(db, data, headers) {
    try {
        const { restaurantId } = data || {};
        const orders = db.collection('orders');
        
        let query = {};
        if (restaurantId) {
            query.restaurantId = restaurantId;
        }
        
        const orderList = await orders.find(query).sort({ createdAt: -1 }).toArray();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: orderList
            })
        };
    } catch (error) {
        console.error('❌ Get orders error:', error);
        throw error;
    }
}

// STATISTICS
async function getStatistics(db, headers) {
    try {
        const applications = db.collection('applications');
        const restaurantProfiles = db.collection('restaurantProfiles');
        const restaurantUsers = db.collection('restaurantUsers');
        const customerUsers = db.collection('customerUsers');
        const packages = db.collection('packages');
        const orders = db.collection('orders');
        
        const [
            totalApplications,
            pendingApplications,
            approvedApplications,
            activeRestaurants,
            totalRestaurantUsers,
            totalCustomerUsers,
            totalPackages,
            activePackages,
            totalOrders
        ] = await Promise.all([
            applications.countDocuments(),
            applications.countDocuments({ status: 'pending' }),
            applications.countDocuments({ status: 'approved' }),
            restaurantProfiles.countDocuments({ status: 'active' }),
            restaurantUsers.countDocuments(),
            customerUsers.countDocuments(),
            packages.countDocuments(),
            packages.countDocuments({ status: 'active' }),
            orders.countDocuments()
        ]);
        
        const stats = {
            totalApplications,
            pendingApplications,
            approvedApplications,
            activeRestaurants,
            totalUsers: totalRestaurantUsers + totalCustomerUsers,
            totalPackages,
            activePackages,
            totalOrders
        };
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: stats
            })
        };
    } catch (error) {
        console.error('❌ Get statistics error:', error);
        throw error;
    }
}