const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import routes
const vesselRoutes = require('./routes/vesselRoutes');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requireAuth, login } = require('./middleware/auth');

const app = express();

// Security middleware
const isDevelopment = process.env.NODE_ENV !== 'production';
if (!isDevelopment) {
    app.use(helmet());
}

// Cookie parser middleware
app.use(cookieParser());

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

app.use(express.static(path.join(__dirname, 'public')));

app.post('/edit-vessels/login', login);
app.get('/edit-vessels/login', requireAuth);
app.get('/edit-vessels', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'edit-vessels.html'));
});

app.use('/api/vessels', vesselRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'GTM Breadbox API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            vessels: '/api/vessels',
            fetchPositions: '/api/vessels/fetch',
            fetchExport: '/api/vessels/fetch-export',
            latestPositions: '/api/vessels/latest',

        },
    });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
