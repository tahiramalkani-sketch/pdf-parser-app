const { startServer } = require('./src/app');

startServer().catch(err => {
    console.error('Failed to start application:', err);
    process.exit(1);
});

const PORT = process.env.PORT || 4000;

// Check if quiet mode is enabled
const QUIET_MODE = process.env.QUIET_MODE === 'true' || process.argv.includes('--quiet');

// Enhanced logging helper
const logger = {
    info: (message, data = '') => !QUIET_MODE && console.log(`ℹ️  ${message}`, data ? data : ''),
    success: (message, data = '') => console.log(`✅ ${message}`, data ? data : ''),
    warn: (message, data = '') => console.warn(`⚠️  ${message}`, data ? data : ''),
    error: (message, data = '') => console.error(`❌ ${message}`, data ? data : '')
};

// Server lifecycle is handled by src/app.startServer()
