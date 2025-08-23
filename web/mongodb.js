// mongodb.js
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectDB() {
    try {
        await client.connect();
        console.log('MongoDB connected ✅');
        return client.db('kaptaze-cluster'); // 
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
}

module.exports = connectDB;

