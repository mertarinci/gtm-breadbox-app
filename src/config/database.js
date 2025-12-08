const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// Initialize database schema
const initializeDatabase = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS vessels (
        mmsi VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) DEFAULT 'Vessel',
        image TEXT,
        isActive BOOLEAN DEFAULT true,
        lat DECIMAL(10, 8),
        lon DECIMAL(11, 8),
        speed INTEGER,
        heading INTEGER,
        course INTEGER,
        status INTEGER,
        last_seen TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_vessels_last_seen ON vessels(last_seen);
      
      ALTER TABLE vessels ADD COLUMN IF NOT EXISTS image TEXT;
      ALTER TABLE vessels ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true;

      CREATE TABLE IF NOT EXISTS vessel_positions (
        id SERIAL PRIMARY KEY,
        mmsi VARCHAR(50) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lon DECIMAL(11, 8) NOT NULL,
        speed INTEGER,
        heading INTEGER,
        course INTEGER,
        status INTEGER,
        timestamp TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mmsi, timestamp)
      );

      CREATE INDEX IF NOT EXISTS idx_vessel_positions_mmsi ON vessel_positions(mmsi);
      CREATE INDEX IF NOT EXISTS idx_vessel_positions_timestamp ON vessel_positions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_vessel_positions_created_at ON vessel_positions(created_at);
    `);
        console.log('✅ Database schema initialized');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        throw error;
    }
};

module.exports = {
    pool,
    initializeDatabase,
};
