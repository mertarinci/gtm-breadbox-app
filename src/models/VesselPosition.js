const { pool } = require('../config/database');

class VesselPosition {
    static async create(data) {
        const {
            mmsi,
            lat,
            lon,
            speed,
            heading,
            course,
            status,
            timestamp,
        } = data;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert the position
            const insertQuery = `
                INSERT INTO vessel_positions (
                    mmsi, lat, lon, speed, heading, course, status, timestamp
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (mmsi, timestamp) 
                DO UPDATE SET
                    lat = EXCLUDED.lat,
                    lon = EXCLUDED.lon,
                    speed = EXCLUDED.speed,
                    heading = EXCLUDED.heading,
                    course = EXCLUDED.course,
                    status = EXCLUDED.status,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING *
            `;
            const values = [mmsi, lat, lon, speed, heading, course, status, timestamp];
            const insertResult = await client.query(insertQuery, values);

            // Keep only last 10 positions per vessel (delete oldest ones if more than 10)
            await client.query(
                `
                DELETE FROM vessel_positions
                WHERE id IN (
                    SELECT id FROM (
                        SELECT id, ROW_NUMBER() OVER (ORDER BY timestamp DESC) as rn
                        FROM vessel_positions
                        WHERE mmsi = $1
                    ) t
                    WHERE rn > 10
                )
                `,
                [mmsi]
            );

            await client.query('COMMIT');
            return insertResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async createMany(positions) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const queries = positions.map((pos) => {
                const {
                    mmsi,
                    lat,
                    lon,
                    speed,
                    heading,
                    course,
                    status,
                    timestamp,
                } = pos;

                return client.query(
                    `
          INSERT INTO vessel_positions (
            mmsi, lat, lon, speed, heading, course, status, timestamp
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (mmsi, timestamp) 
          DO UPDATE SET
            lat = EXCLUDED.lat,
            lon = EXCLUDED.lon,
            speed = EXCLUDED.speed,
            heading = EXCLUDED.heading,
            course = EXCLUDED.course,
            status = EXCLUDED.status,
            updated_at = CURRENT_TIMESTAMP
        `,
                    [mmsi, lat, lon, speed, heading, course, status, timestamp]
                );
            });

            await Promise.all(queries);

            // Keep only last 10 positions per vessel (delete oldest ones if more than 10)
            const uniqueMMSIs = [...new Set(positions.map(p => p.mmsi))];
            for (const mmsi of uniqueMMSIs) {
                await client.query(
                    `
                    DELETE FROM vessel_positions
                    WHERE id IN (
                        SELECT id FROM (
                            SELECT id, ROW_NUMBER() OVER (ORDER BY timestamp DESC) as rn
                            FROM vessel_positions
                            WHERE mmsi = $1
                        ) t
                        WHERE rn > 10
                    )
                    `,
                    [mmsi]
                );
            }

            await client.query('COMMIT');

            return positions.length;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async findAll(options = {}) {
        const {
            limit = 100,
            offset = 0,
            mmsi,
            startDate,
            endDate,
        } = options;

        let query = 'SELECT * FROM vessel_positions WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (mmsi) {
            paramCount++;
            query += ` AND mmsi = $${paramCount}`;
            values.push(mmsi);
        }

        if (startDate) {
            paramCount++;
            query += ` AND timestamp >= $${paramCount}`;
            values.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND timestamp <= $${paramCount}`;
            values.push(endDate);
        }

        query += ` ORDER BY timestamp DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        values.push(limit, offset);

        const result = await pool.query(query, values);
        return result.rows;
    }

    static async findById(id) {
        const query = 'SELECT * FROM vessel_positions WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async findByMMSI(mmsi, limit = 100) {
        const query = `
      SELECT * FROM vessel_positions 
      WHERE mmsi = $1 
      ORDER BY timestamp DESC 
      LIMIT $2
    `;
        const result = await pool.query(query, [mmsi, limit]);
        return result.rows;
    }

    static async getLatestPositions(limit = 50) {
        const query = `
            SELECT DISTINCT ON (mmsi) *
            FROM vessel_positions
            ORDER BY mmsi, timestamp DESC
            LIMIT $1
        `;
        const result = await pool.query(query, [limit]);
        return result.rows;
    }

    static async count(options = {}) {
        const { mmsi, startDate, endDate } = options;

        let query = 'SELECT COUNT(*) FROM vessel_positions WHERE 1=1';
        const values = [];
        let paramCount = 0;

        if (mmsi) {
            paramCount++;
            query += ` AND mmsi = $${paramCount}`;
            values.push(mmsi);
        }

        if (startDate) {
            paramCount++;
            query += ` AND timestamp >= $${paramCount}`;
            values.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND timestamp <= $${paramCount}`;
            values.push(endDate);
        }

        const result = await pool.query(query, values);
        return parseInt(result.rows[0].count, 10);
    }
}

module.exports = VesselPosition;
