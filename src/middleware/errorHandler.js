/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // PostgreSQL errors
    if (err.code && err.code.startsWith('23')) {
        return res.status(400).json({
            success: false,
            message: 'Database constraint violation',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Invalid data',
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: err.message,
        });
    }

    // Default error
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};

/**
 * 404 handler
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
