const app = require('./app');
const db = require('./config/database');
const logger = require('./utils/logger');
const InvitationService = require('./services/invitationService');
const { runMigrations } = require('./scripts/autoMigrate');

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Test DB Connection and Start Server
const startServer = async () => {
  try {
    // Test DB Connection
    await db.query('SELECT NOW()');
    logger.info('Database connected successfully');

    // Run schema migrations (idempotent — safe on every startup)
    await runMigrations();

    // Start Background Workers
    InvitationService.startWorker();

    app.listen(PORT, HOST, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on ${HOST}:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
