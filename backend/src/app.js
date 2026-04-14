require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json()); 

// Healthcheck route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Digital Invitation System Backend is running.' });
});

// App Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
