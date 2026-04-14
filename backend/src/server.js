const app = require('./app');
const db = require('./config/database');
const logger = require('./utils/logger');
const InvitationService = require('./services/invitationService');

const PORT = process.env.PORT || 3000;

// Test DB Connection and Start Server
const startServer = async () => {
  try {
    // Try a simple query to ensure DB is reachable
    await db.query('SELECT NOW()');
    logger.info('Database connected successfully');

    // Start Background Workers
    InvitationService.startWorker();

    app.listen(PORT, () => {
      logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
