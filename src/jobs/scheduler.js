const cron = require('node-cron');
const marineTrafficService = require('../services/marineTrafficService');
const VesselPosition = require('../models/VesselPosition');
const Vessel = require('../models/Vessel');

function startSchedulers() {
    // Every 2 hours at minute 0
    cron.schedule('0 */2 * * *', async () => {
        console.log('⏱️  Cron: Fetching exportvessels snapshot...');
        try {
            const data = await marineTrafficService.fetchExportVessels();
            if (!Array.isArray(data) || data.length === 0) {
                console.log('ℹ️  No data returned from exportvessels');
                return;
            }

            const normalized = data.map((item) => marineTrafficService.normalizeData(item));

            // Insert history
            await VesselPosition.createMany(normalized);

            // Upsert current state per MMSI (name is not updated, only set on initial insert)
            await Promise.all(
                normalized.map((d) =>
                    Vessel.upsertByMMSI({
                        mmsi: d.mmsi,
                        lat: d.lat,
                        lon: d.lon,
                        speed: d.speed,
                        heading: d.heading,
                        course: d.course,
                        status: d.status,
                        timestamp: d.timestamp,
                    })
                )
            );

            console.log(`✅ Cron: Updated ${normalized.length} vessels`);
        } catch (err) {
            console.error('❌ Cron job failed:', err.message);
        }
    });
}

module.exports = { startSchedulers };


