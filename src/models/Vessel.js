const { pool } = require('../config/database');

class Vessel {
    static async upsertByMMSI(data) {
        const { mmsi, lat, lon, speed, heading, course, status, timestamp } = data;
        // Name is not provided from API, only set on initial seed
        // For INSERT, database DEFAULT 'Vessel' will be used if vessel doesn't exist
        // For UPDATE, name field is not touched (preserves manual changes)
        const query = `
            INSERT INTO vessels (mmsi, lat, lon, speed, heading, course, status, last_seen)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (mmsi)
            DO UPDATE SET
              lat = EXCLUDED.lat,
              lon = EXCLUDED.lon,
              speed = EXCLUDED.speed,
              heading = EXCLUDED.heading,
              course = EXCLUDED.course,
              status = EXCLUDED.status,
              last_seen = EXCLUDED.last_seen,
              updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const values = [mmsi, lat, lon, speed, heading, course, status, timestamp];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findAll() {
        const query = 'SELECT * FROM vessels ORDER BY mmsi';
        const result = await pool.query(query);
        return result.rows;
    }

    static async findByMMSI(mmsi) {
        const query = 'SELECT * FROM vessels WHERE mmsi = $1';
        const result = await pool.query(query, [mmsi]);
        return result.rows[0];
    }
}

module.exports = Vessel;


