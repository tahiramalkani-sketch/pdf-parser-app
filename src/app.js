const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const connectDB = require('../db/connect');
const PdfDocument = require('../models/PdfDocument');
const SimplePdfDocument = require('../models/SimplePdfDocument');
const UserFilledData = require('../models/UserFilledData');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve static from project root
const projectRoot = path.join(__dirname, '..');
app.use(express.static(projectRoot));

const uploadsDir = path.join(projectRoot, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

app.get('/', (req, res) => {
    try {
        const indexPath = path.join(projectRoot, 'index.html');
        res.sendFile(indexPath);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.get('/test', (req, res) => {
  res.json({ status: 'success', message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Mount routes
const uploadRoutes = require('./routes/upload.routes');
const documentsRoutes = require('./routes/documents.routes');
const schemaRoutes = require('./routes/schema.routes');
const userFilledRoutes = require('./routes/userFilled.routes');
const healthRoutes = require('./routes/health.routes');

app.use('/api', documentsRoutes);
app.use('/api', schemaRoutes);
app.use('/api', userFilledRoutes);
app.use('/api', healthRoutes);
app.use('/', uploadRoutes);

// track DB state and port on app locals
app.locals.isDBConnected = false;
app.locals.PORT = process.env.PORT || 4000;

// Keep rest of endpoints in original file location to avoid duplication in this migration.

// Error handler (same as original)
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    
    if (err instanceof multer.MulterError) {
        console.error(`${timestamp} - Multer Error:`, err.message);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                status: 'error', 
                error: 'File too large. Maximum size is 10MB.',
                timestamp: timestamp
            });
        }
        
        return res.status(400).json({ 
            status: 'error', 
            error: 'File upload error',
            details: err.message,
            timestamp: timestamp
        });
    }
    
    console.error(`${timestamp} - Server Error:`, err.message);
    res.status(500).json({ 
        status: 'error', 
        error: 'Internal server error',
        timestamp: timestamp
    });
});

// Logger & config
const QUIET_MODE = process.env.QUIET_MODE === 'true' || process.argv.includes('--quiet');
const logger = {
    info: (message, data = '') => !QUIET_MODE && console.log(`ℹ️  ${message}`, data ? data : ''),
    success: (message, data = '') => console.log(`✅ ${message}`, data ? data : ''),
    warn: (message, data = '') => console.warn(`⚠️  ${message}`, data ? data : ''),
    error: (message, data = '') => console.error(`❌ ${message}`, data ? data : '')
};

// Expose app and a startServer function
async function startServer() {
    logger.info('Connecting to MongoDB...');
    try {
        await connectDB();
        app.locals.isDBConnected = true;
        const port = app.locals.PORT || process.env.PORT || 4000;
        const server = app.listen(port, '0.0.0.0', (err) => {
            if (err) {
                logger.error('Failed to start server:', err);
                process.exit(1);
            }
            logger.success(`Server running on http://localhost:${port}`);
            if (!QUIET_MODE) {
                logger.success('MongoDB connected');
                logger.info('Available endpoints:');
                logger.info('  POST /upload - Upload and parse PDF');
                logger.info('  GET /api/documents - List all documents');
                logger.info('  POST /api/documents/:id/schema - Save form schema');
                logger.info('  GET /api/documents/:id/schema - Get form schema');
            }
        });
        return server;
    } catch (error) {
        app.locals.isDBConnected = false;
        logger.warn('MongoDB unavailable, running with limited features');
        const port = app.locals.PORT || process.env.PORT || 4000;
        const server = app.listen(port, '0.0.0.0', (err) => {
            if (err) {
                logger.error('Failed to start server:', err);
                process.exit(1);
            }
            logger.success(`Server running on http://localhost:${port}`);
            if (!QUIET_MODE) {
                logger.info('File-based storage only');
            }
        });
        return server;
    }
}

// Enhanced process error handling (moved here so lifecycle is centralized)
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err.message);
    logger.error('Stack trace:', err.stack);
    
    if (app.locals.isDBConnected) {
        const mongoose = require('mongoose');
        mongoose.connection.close().then(() => {
            logger.info('MongoDB connection closed due to uncaught exception');
            process.exit(1);
        }).catch(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise);
    logger.error('Reason:', reason);
    
    if (app.locals.isDBConnected) {
        const mongoose = require('mongoose');
        mongoose.connection.close().then(() => {
            logger.info('MongoDB connection closed due to unhandled rejection');
            process.exit(1);
        }).catch(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});

// Graceful shutdown on SIGTERM and SIGINT
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
    if (!QUIET_MODE) logger.info('Shutting down...');
    
    if (app.locals.isDBConnected) {
        const mongoose = require('mongoose');
        mongoose.connection.close().then(() => {
            if (!QUIET_MODE) logger.info('Server stopped');
            process.exit(0);
        }).catch((error) => {
            logger.error('Shutdown error:', error.message);
            process.exit(1);
        });
    } else {
        if (!QUIET_MODE) logger.info('Server stopped');
        process.exit(0);
    }
}

module.exports = { app, startServer };
