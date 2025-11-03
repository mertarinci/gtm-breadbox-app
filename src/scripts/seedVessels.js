require('dotenv').config();
const { pool, initializeDatabase } = require('../config/database');
const Vessel = require('../models/Vessel');
const VesselPosition = require('../models/VesselPosition');
const marineTrafficService = require('../services/marineTrafficService');

// Initial vessel data
const initialVessels = [
    {
        "MMSI": "577193000",
        "LAT": "21.209629",
        "LON": "-17.462400",
        "SPEED": "99",
        "HEADING": "181",
        "COURSE": "184",
        "STATUS": "0",
        "TIMESTAMP": "2025-11-03T15:40:31"
    },
    {
        "MMSI": "352005591",
        "LAT": "43.393684",
        "LON": "-8.238202",
        "SPEED": "0",
        "HEADING": "194",
        "COURSE": "24",
        "STATUS": "1",
        "TIMESTAMP": "2025-11-03T15:37:43"
    },
    {
        "MMSI": "271002569",
        "LAT": "28.017010",
        "LON": "-14.748518",
        "SPEED": "84",
        "HEADING": "100",
        "COURSE": "101",
        "STATUS": "0",
        "TIMESTAMP": "2025-11-03T15:40:31"
    },
    {
        "MMSI": "577138000",
        "LAT": "36.779732",
        "LON": "3.065223",
        "SPEED": "0",
        "HEADING": "18",
        "COURSE": "274",
        "STATUS": "5",
        "TIMESTAMP": "2025-11-03T15:37:44"
    },
    {
        "MMSI": "305748000",
        "LAT": "29.341734",
        "LON": "-14.981618",
        "SPEED": "77",
        "HEADING": "193",
        "COURSE": "196",
        "STATUS": "0",
        "TIMESTAMP": "2025-11-03T15:40:30"
    },
    {
        "MMSI": "314645000",
        "LAT": "53.969105",
        "LON": "14.248827",
        "SPEED": "0",
        "HEADING": "222",
        "COURSE": "153",
        "STATUS": "1",
        "TIMESTAMP": "2025-11-03T15:38:41"
    },
    {
        "MMSI": "577212000",
        "LAT": "5.306760",
        "LON": "-4.024919",
        "SPEED": "0",
        "HEADING": "47",
        "COURSE": "111",
        "STATUS": "5",
        "TIMESTAMP": "2025-11-03T15:38:08"
    },
    {
        "MMSI": "566090000",
        "LAT": "14.674448",
        "LON": "-17.422186",
        "SPEED": "0",
        "HEADING": "20",
        "COURSE": "353",
        "STATUS": "5",
        "TIMESTAMP": "2025-11-03T15:39:09"
    },
    {
        "MMSI": "246199000",
        "LAT": "13.907795",
        "LON": "-18.328714",
        "SPEED": "90",
        "HEADING": "174",
        "COURSE": "173",
        "STATUS": "0",
        "TIMESTAMP": "2025-11-03T15:40:28"
    },
    {
        "MMSI": "311000851",
        "LAT": "51.455860",
        "LON": "3.725388",
        "SPEED": "1",
        "HEADING": "239",
        "COURSE": "350",
        "STATUS": "5",
        "TIMESTAMP": "2025-11-03T15:39:01"
    },
    {
        "MMSI": "314728000",
        "LAT": "40.419159",
        "LON": "29.086246",
        "SPEED": "0",
        "HEADING": "125",
        "COURSE": "157",
        "STATUS": "5",
        "TIMESTAMP": "2025-11-03T15:37:31"
    }
];

const seedVessels = async () => {
    try {
        console.log('🌱 Starting vessel seed...');

        // Initialize database schema
        await initializeDatabase();

        // Normalize data
        const normalizedData = initialVessels.map((item) =>
            marineTrafficService.normalizeData(item)
        );

        console.log(`📦 Seeding ${normalizedData.length} vessels...`);

        // Insert into vessel_positions (history)
        await VesselPosition.createMany(normalizedData);
        console.log('✅ Vessel positions history created');

        // Upsert into vessels table (current state) with name set to "Vessel" for initial insert
        const upsertPromises = normalizedData.map((d) =>
            Vessel.upsertByMMSI({
                mmsi: d.mmsi,
                name: 'Vessel', // Set name only on initial insert
                lat: d.lat,
                lon: d.lon,
                speed: d.speed,
                heading: d.heading,
                course: d.course,
                status: d.status,
                timestamp: d.timestamp,
            })
        );

        await Promise.all(upsertPromises);
        console.log('✅ Vessels table updated with name = "Vessel" for initial insert');

        // Ensure all seeded vessels have name = "Vessel"
        await pool.query(`
            UPDATE vessels 
            SET name = 'Vessel' 
            WHERE mmsi = ANY($1::varchar[])
        `, [normalizedData.map(d => d.mmsi)]);
        console.log('✅ All vessel names set to "Vessel"');

        console.log(`\n🎉 Successfully seeded ${normalizedData.length} vessels!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding vessels:', error);
        process.exit(1);
    }
};

seedVessels();
