const SimplePdfDocument = require('../../models/SimplePdfDocument');

exports.getHealth = async (req, res) => {
  const isDBConnected = req.app.locals.isDBConnected || false;
  const PORT = req.app.locals.PORT || process.env.PORT || 4000;
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      port: PORT,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    },
    database: { connected: isDBConnected, status: 'disconnected' }
  };

  if (isDBConnected) {
    try {
      const mongoose = require('mongoose');
      const dbState = mongoose.connection.readyState;
      healthCheck.database.status = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : dbState === 3 ? 'disconnecting' : 'disconnected';
      if (dbState === 1) {
        const documentCount = await SimplePdfDocument.countDocuments();
        healthCheck.database.documentsCount = documentCount;
        healthCheck.database.lastCheck = new Date().toISOString();
      }
    } catch (error) {
      healthCheck.database.error = error.message;
      healthCheck.status = 'degraded';
    }
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : healthCheck.status === 'degraded' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
};
