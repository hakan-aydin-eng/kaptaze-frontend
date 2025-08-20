// MongoDB Atlas Connection Test
const { databaseManager } = require('./backend/config/database');

async function testMongoConnection() {
    console.log('🔄 MongoDB Atlas bağlantısı test ediliyor...\n');
    
    try {
        // Test connection
        const connected = await databaseManager.connect('development');
        
        if (connected) {
            console.log('\n✅ MongoDB Atlas bağlantısı başarılı!');
            
            // Get connection status
            const status = databaseManager.getStatus();
            console.log('\n📊 Bağlantı Detayları:');
            console.log('- Bağlantı Durumu:', status.isConnected ? '✅ Bağlı' : '❌ Bağlantısız');
            console.log('- Ready State:', status.readyState);
            console.log('- Host:', status.host);
            console.log('- Port:', status.port);
            console.log('- Database:', status.name);
            
            // Health check
            console.log('\n🏥 Sağlık Kontrolü...');
            const health = await databaseManager.healthCheck();
            console.log('- Sağlık Durumu:', health.status === 'healthy' ? '✅ Sağlıklı' : '⚠️ Problem var');
            console.log('- Mesaj:', health.message);
            
            // Get database stats
            console.log('\n📈 Veritabanı İstatistikleri...');
            const stats = await databaseManager.getStats();
            if (stats) {
                console.log('- Database:', stats.database);
                console.log('- Collections:', stats.collections);
                console.log('- Documents:', stats.documents);
                console.log('- Data Size:', stats.dataSize);
                console.log('- Storage Size:', stats.storageSize);
                console.log('- Indexes:', stats.indexes);
            }
            
            // Create indexes
            console.log('\n📊 Indexler oluşturuluyor...');
            const indexResult = await databaseManager.createIndexes();
            if (indexResult) {
                console.log('✅ Indexler başarıyla oluşturuldu!');
            } else {
                console.log('⚠️ Index oluşturmada sorun var');
            }
            
        } else {
            console.log('\n❌ MongoDB Atlas bağlantısı kurulamadı!');
        }
        
    } catch (error) {
        console.error('\n❌ Bağlantı hatası:', error.message);
        console.error('🔍 Kontrol edin:');
        console.error('- Connection string doğru mu?');
        console.error('- Kullanıcı adı ve şifre doğru mu?');
        console.error('- IP whitelist ayarlandı mı?');
        console.error('- İnternet bağlantınız var mı?');
    } finally {
        // Disconnect
        await databaseManager.disconnect();
        console.log('\n👋 Test tamamlandı, bağlantı kapatıldı.');
        process.exit(0);
    }
}

// Run test
testMongoConnection();