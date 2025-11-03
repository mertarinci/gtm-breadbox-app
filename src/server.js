const app = require('./app');
const { initializeDatabase } = require('./config/database');
const { startSchedulers } = require('./jobs/scheduler');

const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
    try {
        // Initialize database schema
        await initializeDatabase();

        // Start server
        app.listen(PORT, () => {
            console.log(`
🚀 Server is running!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📡 API: http://localhost:${PORT}/api
💚 Health: http://localhost:${PORT}/health
      `);
        });

        // Start cron jobs
        startSchedulers();
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
