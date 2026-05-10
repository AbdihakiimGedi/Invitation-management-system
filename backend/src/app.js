require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const rateLimit = require('./middleware/rateLimitMiddleware');
const { sanitizeRequest, securityHeaders } = require('./middleware/securityMiddleware');

const app = express();

const allowedOrigins = String(process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(sanitizeRequest);
app.use(rateLimit({ windowMs: 60_000, max: 300, keyPrefix: 'api' }));

// Healthcheck route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Digital Invitation System Backend is running.' });
});

// App Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
