const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Tender Routes
const tenderRoutes = require('./routes/tenders');
app.use('/api/tenders', tenderRoutes);

// Bid Routes
const bidRoutes = require('./routes/bids');
app.use('/api/bids', bidRoutes);

// Admin Routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Payment Routes
const paymentRoutes = require('./routes/payments');
app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;