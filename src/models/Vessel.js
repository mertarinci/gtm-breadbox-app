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

    static async findByMMSIList(mmsiList) {
        if (!Array.isArray(mmsiList) || mmsiList.length === 0) {
            return [];
        }
        const query = 'SELECT * FROM vessels WHERE mmsi = ANY($1::text[]) ORDER BY mmsi';
        const result = await pool.query(query, [mmsiList]);
        return result.rows;
    }

    static async updateByMMSI(mmsi, data) {
        const { name, image, isActive } = data;
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (image !== undefined) {
            updates.push(`image = $${paramCount++}`);
            values.push(image);
        }
        if (isActive !== undefined) {
            updates.push(`isActive = $${paramCount++}`);
            values.push(isActive);
        }

        if (updates.length === 0) {
            return await this.findByMMSI(mmsi);
        }

        values.push(mmsi);
        const query = `
            UPDATE vessels 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE mmsi = $${paramCount}
            RETURNING *
        `;
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async setAllInactive() {
        const query = `
            UPDATE vessels 
            SET isActive = false, updated_at = CURRENT_TIMESTAMP
            WHERE isActive = true
            RETURNING mmsi
        `;
        const result = await pool.query(query);
        return result.rows.length;
    }

    static async setActiveByMMSIList(mmsiList) {
        if (!Array.isArray(mmsiList) || mmsiList.length === 0) {
            return 0;
        }
        const query = `
            UPDATE vessels 
            SET isActive = true, updated_at = CURRENT_TIMESTAMP
            WHERE mmsi = ANY($1::text[])
            RETURNING mmsi
        `;
        const result = await pool.query(query, [mmsiList]);
        return result.rows.length;
    }
}

module.exports = Vessel;


