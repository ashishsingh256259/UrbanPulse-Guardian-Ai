const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/urbanpulse');
        console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
        
        // Ensure indexes (Mongoose normally does this automatically on model creation, but we can do it explicitly or rely on models)
    } catch (error) {
        console.error(`❌ MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
