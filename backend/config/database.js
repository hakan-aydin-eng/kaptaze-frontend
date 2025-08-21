// KapTaze Database Configuration
const mongoose = require('mongoose');

// MongoDB connection configuration
const DatabaseConfig = {
    // Default connection settings (Atlas)
    default: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://<db_username>:<db_password>@kaptaze-cluster.ra9padd.mongodb.net/kaptazeappv5?retryWrites=true&w=majority&appName=kaptaze-cluster',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000, // Increased for Atlas
            socketTimeoutMS: 45000,
            bufferMaxEntries: 0,
            bufferCommands: false,
            retryWrites: true,
            w: 'majority'
        }
    },
    
    // Development environment (Atlas)
    development: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://<db_username>:<db_password>@kaptaze-cluster.ra9padd.mongodb.net/kaptaze_dev?retryWrites=true&w=majority&appName=kaptaze-cluster',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 10000, // Increased for Atlas
            retryWrites: true,
            w: 'majority'
        }
    },
    
    // Production environment (Atlas)
    production: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://<db_username>:<db_password>@kaptaze-cluster.ra9padd.mongodb.net/kaptazeappv5?retryWrites=true&w=majority&appName=kaptaze-cluster',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 20,
            serverSelectionTimeoutMS: 10000, // Increased for Atlas
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority'
        }
    },
    
    // Test environment (Atlas)
    test: {
        uri: process.env.MONGODB_TEST_URI || 'mongodb+srv://<db_username>:<db_password>@kaptaze-cluster.ra9padd.mongodb.net/kaptaze_test?retryWrites=true&w=majority&appName=kaptaze-cluster',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 10000, // Increased for Atlas
            retryWrites: true,
            w: 'majority'
        }
    }
};

// Connection management class
class DatabaseManager {
    constructor() {
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 seconds
    }

    // Connect to MongoDB
    async connect(environment = process.env.NODE_ENV || 'development') {
        try {
            const config = DatabaseConfig[environment] || DatabaseConfig.default;
            
            console.log(`🔄 MongoDB bağlantısı kuruluyor... (${environment})`);
            console.log(`📡 URI: ${config.uri.replace(/\/\/.*@/, '//***:***@')}`);
            
            // Connection event listeners
            mongoose.connection.on('connected', () => {
                this.isConnected = true;
                this.connectionAttempts = 0;
                console.log('✅ MongoDB bağlantısı başarıyla kuruldu!');
                console.log(`📊 Database: ${mongoose.connection.name}`);
                console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
            });

            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB bağlantı hatası:', err.message);
                this.isConnected = false;
            });

            mongoose.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB bağlantısı kesildi');
                this.isConnected = false;
                
                // Auto-reconnect
                if (this.connectionAttempts < this.maxRetries) {
                    setTimeout(() => {
                        console.log(`🔄 Yeniden bağlanma denemesi... (${this.connectionAttempts + 1}/${this.maxRetries})`);
                        this.attemptReconnect(environment);
                    }, this.retryDelay);
                }
            });

            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB yeniden bağlandı!');
                this.isConnected = true;
                this.connectionAttempts = 0;
            });

            // Graceful shutdown
            process.on('SIGINT', async () => {
                console.log('🔄 Uygulama kapatılıyor...');
                await this.disconnect();
                process.exit(0);
            });

            await mongoose.connect(config.uri, config.options);
            return true;

        } catch (error) {
            console.error('❌ MongoDB bağlantısı kurulamadı:', error.message);
            this.connectionAttempts++;
            
            if (this.connectionAttempts < this.maxRetries) {
                console.log(`⏳ ${this.retryDelay / 1000} saniye sonra tekrar denenecek...`);
                setTimeout(() => {
                    this.attemptReconnect(environment);
                }, this.retryDelay);
            } else {
                console.error(`❌ ${this.maxRetries} deneme başarısız. Bağlantı kurulamadı.`);
                throw new Error('MongoDB connection failed after maximum retries');
            }
            return false;
        }
    }

    // Attempt to reconnect
    async attemptReconnect(environment) {
        this.connectionAttempts++;
        try {
            await this.connect(environment);
        } catch (error) {
            console.error(`❌ Yeniden bağlanma denemesi başarısız (${this.connectionAttempts}/${this.maxRetries})`);
        }
    }

    // Disconnect from MongoDB
    async disconnect() {
        try {
            if (this.isConnected) {
                await mongoose.connection.close();
                console.log('✅ MongoDB bağlantısı başarıyla kapatıldı');
            }
        } catch (error) {
            console.error('❌ MongoDB bağlantısı kapatılırken hata:', error.message);
        }
    }

    // Get connection status
    getStatus() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name,
            connectionAttempts: this.connectionAttempts
        };
    }

    // Health check
    async healthCheck() {
        try {
            if (!this.isConnected) {
                return { status: 'disconnected', message: 'Veritabanı bağlantısı yok' };
            }

            // Ping database
            const admin = mongoose.connection.db.admin();
            const result = await admin.ping();
            
            if (result.ok === 1) {
                return { 
                    status: 'healthy', 
                    message: 'Veritabanı sağlıklı',
                    details: this.getStatus()
                };
            } else {
                return { status: 'unhealthy', message: 'Veritabanı yanıt vermiyor' };
            }
        } catch (error) {
            return { 
                status: 'error', 
                message: 'Sağlık kontrolü başarısız', 
                error: error.message 
            };
        }
    }

    // Create indexes
    async createIndexes() {
        try {
            console.log('📊 Veritabanı indexleri oluşturuluyor...');
            
            // User indexes
            await mongoose.connection.collection('kullanicilars').createIndex({ eposta: 1 }, { unique: true });
            await mongoose.connection.collection('kullanicilars').createIndex({ telefon: 1 }, { sparse: true });
            
            // Restaurant indexes
            await mongoose.connection.collection('restoranlar').createIndex({ eposta: 1 }, { unique: true });
            await mongoose.connection.collection('restoranlar').createIndex({ konum: '2dsphere' });
            await mongoose.connection.collection('restoranlar').createIndex({ aktif: 1, onaylanmis: 1 });
            
            // Order indexes
            await mongoose.connection.collection('siparislers').createIndex({ kullaniciId: 1, olusturulma_tarihi: -1 });
            await mongoose.connection.collection('siparislers').createIndex({ restoranId: 1, durum: 1 });
            await mongoose.connection.collection('siparislers').createIndex({ durum: 1, olusturulma_tarihi: -1 });
            
            // Package indexes
            await mongoose.connection.collection('paketlers').createIndex({ restoranId: 1, aktif: 1 });
            await mongoose.connection.collection('paketlers').createIndex({ kategori: 1, aktif: 1 });
            await mongoose.connection.collection('paketlers').createIndex({ olusturulma_tarihi: -1 });
            
            // Notification indexes
            await mongoose.connection.collection('bildirims').createIndex({ kullaniciId: 1, okundu: 1 });
            await mongoose.connection.collection('bildirims').createIndex({ kullaniciId: 1, olusturulma_tarihi: -1 });
            
            // Payment indexes
            await mongoose.connection.collection('odemes').createIndex({ kullaniciId: 1, olusturulma_tarihi: -1 });
            await mongoose.connection.collection('odemes').createIndex({ siparisId: 1, durum: 1 });
            
            console.log('✅ Veritabanı indexleri başarıyla oluşturuldu!');
            return true;
        } catch (error) {
            console.error('❌ Index oluşturma hatası:', error.message);
            return false;
        }
    }

    // Database statistics
    async getStats() {
        try {
            if (!this.isConnected) {
                return null;
            }

            const stats = await mongoose.connection.db.stats();
            return {
                database: stats.db,
                collections: stats.collections,
                documents: stats.objects,
                dataSize: this.formatBytes(stats.dataSize),
                storageSize: this.formatBytes(stats.storageSize),
                indexes: stats.indexes,
                indexSize: this.formatBytes(stats.indexSize)
            };
        } catch (error) {
            console.error('Database stats error:', error);
            return null;
        }
    }

    // Format bytes to human readable format
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

// Export
module.exports = {
    DatabaseConfig,
    DatabaseManager,
    databaseManager,
    connect: (env) => databaseManager.connect(env),
    disconnect: () => databaseManager.disconnect(),
    healthCheck: () => databaseManager.healthCheck(),
    getStats: () => databaseManager.getStats(),
    isConnected: () => databaseManager.isConnected
};