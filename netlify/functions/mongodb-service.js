// MongoDB Atlas Service for KapTaze
// Persistent database solution replacing in-memory storage

const { MongoClient } = require('mongodb');

// MongoDB connection configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kaptaze-admin:kaptaze1121@kaptaze-cluster.ra9padd.mongodb.net/kaptaze?retryWrites=true&w=majority&appName=kaptaze-cluster';
const DB_NAME = 'kaptaze';

// Global connection instance for connection reuse
let cachedClient = null;
let cachedDb = null;

// Connect to MongoDB Atlas
async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        const client = new MongoClient(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        await client.connect();
        const db = client.db(DB_NAME);

        cachedClient = client;
        cachedDb = db;

        console.log('✅ MongoDB Atlas connected successfully');
        return { client, db };
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

// Database operations
class KapTazeDB {
    constructor() {
        this.collections = {
            applications: 'applications',
            restaurantUsers: 'restaurantUsers',
            restaurantProfiles: 'restaurantProfiles',
            customerUsers: 'customerUsers',
            packages: 'packages',
            orders: 'orders',
            metadata: 'metadata'
        };
    }

    async getCollection(collectionName) {
        const { db } = await connectToDatabase();
        return db.collection(collectionName);
    }

    // Get all data
    async getAllData() {
        try {
            const results = {};
            
            for (const [key, collectionName] of Object.entries(this.collections)) {
                const collection = await this.getCollection(collectionName);
                results[key] = await collection.find({}).toArray();
            }

            console.log('📊 Retrieved all data from MongoDB:', {
                applications: results.applications?.length || 0,
                restaurantUsers: results.restaurantUsers?.length || 0,
                restaurantProfiles: results.restaurantProfiles?.length || 0,
                packages: results.packages?.length || 0
            });

            return results;
        } catch (error) {
            console.error('❌ Error getting all data:', error);
            throw error;
        }
    }

    // Add application
    async addApplication(applicationData) {
        try {
            const collection = await this.getCollection(this.collections.applications);
            
            const application = {
                id: `APP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...applicationData,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await collection.insertOne(application);
            console.log('✅ Application added to MongoDB:', application.id);
            
            return application;
        } catch (error) {
            console.error('❌ Error adding application:', error);
            throw error;
        }
    }

    // Approve application
    async approveApplication(applicationId, credentials) {
        try {
            console.log('🔄 Starting MongoDB approval process...', applicationId);

            // Get application
            const applicationsCollection = await this.getCollection(this.collections.applications);
            const application = await applicationsCollection.findOne({ id: applicationId });

            if (!application) {
                throw new Error('Application not found');
            }

            // Update application status
            await applicationsCollection.updateOne(
                { id: applicationId },
                {
                    $set: {
                        status: 'approved',
                        approvedAt: new Date().toISOString(),
                        approvedBy: 'admin',
                        updatedAt: new Date().toISOString()
                    }
                }
            );

            // Create restaurant user
            const restaurantUser = {
                id: `RU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                applicationId: applicationId,
                username: credentials.username,
                password: credentials.password,
                email: application.email,
                phone: application.phone,
                firstName: application.firstName,
                lastName: application.lastName,
                role: 'restaurant',
                status: 'active',
                permissions: ['manage_profile', 'manage_packages', 'view_orders'],
                createdAt: new Date().toISOString(),
                lastLogin: null
            };

            const usersCollection = await this.getCollection(this.collections.restaurantUsers);
            await usersCollection.insertOne(restaurantUser);

            // Create restaurant profile
            const restaurantProfile = {
                id: `RP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: restaurantUser.id,
                applicationId: applicationId,
                businessName: application.businessName,
                businessType: application.businessType || 'restaurant',
                address: application.businessAddress,
                city: application.city,
                district: application.district,
                coordinates: application.businessLatitude && application.businessLongitude ? {
                    lat: application.businessLatitude,
                    lng: application.businessLongitude
                } : null,
                contactInfo: {
                    email: application.email,
                    phone: application.phone || '',
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

            const profilesCollection = await this.getCollection(this.collections.restaurantProfiles);
            await profilesCollection.insertOne(restaurantProfile);

            console.log('✅ MongoDB approval completed:', {
                applicationId,
                userId: restaurantUser.id,
                profileId: restaurantProfile.id
            });

            return {
                success: true,
                application: application,
                user: restaurantUser,
                profile: restaurantProfile
            };

        } catch (error) {
            console.error('❌ MongoDB approval failed:', error);
            throw error;
        }
    }

    // Add package
    async addPackage(packageData) {
        try {
            const collection = await this.getCollection(this.collections.packages);
            
            const package = {
                id: `PKG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...packageData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            await collection.insertOne(package);
            console.log('✅ Package added to MongoDB:', package.id);
            
            return package;
        } catch (error) {
            console.error('❌ Error adding package:', error);
            throw error;
        }
    }
}

module.exports = { KapTazeDB, connectToDatabase };