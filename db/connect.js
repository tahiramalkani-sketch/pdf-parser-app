// MongoDB connection configuration
require('dotenv').config();
const mongoose = require('mongoose');

// Get MongoDB URI from environment variables
const mongoURI = "mongodb+srv://pdfParsing:kul3DgRZbWWVjUh4@pdfparsing.o13pvv2.mongodb.net/pdfParsingDB?retryWrites=true&w=majority&appName=pdfparsing";



// Validate required environment variables
if (!mongoURI) {
    console.error('MONGODB_URI environment variable is required');
    process.exit(1);
}

// Connect to MongoDB
const connectDB = async () => {
    try {
        // MongoDB connection options
        const options = {
            serverSelectionTimeoutMS: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
            maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
            bufferCommands: false
        };

        const conn = await mongoose.connect(mongoURI, options);
        return conn;
    } catch (error) {
        throw error; // Throw error instead of process.exit to allow fallback
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    // Silent connection
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Database connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    // Silent disconnect
});

mongoose.connection.on('reconnected', () => {
    // Silent reconnect
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('Error during MongoDB disconnection:', error);
        process.exit(1);
    }
});

module.exports = connectDB;

