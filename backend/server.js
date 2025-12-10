const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const supabase = require('./config/supabaseClient');
const { logAction } = require('./utils/logger');

// Import routes
const roomsRoutes = require('./routes/rooms');
const bookingsRoutes = require('./routes/bookings');
const housekeepingRoutes = require('./routes/housekeeping');
const inventoryRoutes = require('./routes/inventory');
const foodRoutes = require('./routes/food');
const accountsRoutes = require('./routes/accounts');
const reportsRoutes = require('./routes/reports');
const billsRoutes = require('./routes/bills');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? 'your-production-url' : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173', // Vite default
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:5173'
    ],
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    const action = `${req.method} ${req.path}`;
    logAction(action, 'admin', supabase);
    next();
});

// Routes
app.use('/api/rooms', roomsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/housekeeping', housekeepingRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Front Office Management System API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Front Office Management System Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});

module.exports = app;
