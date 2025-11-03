const VesselPosition = require('../models/VesselPosition');
const Vessel = require('../models/Vessel');
const marineTrafficService = require('../services/marineTrafficService');

/**
 * Fetch vessel positions from API and store in database
 */
const fetchAndStorePositions = async (req, res) => {
    try {
        // Fetch positions from MarineTraffic API (or mock)
        const apiData = await marineTrafficService.fetchVesselPositions(req.query);

        if (!Array.isArray(apiData) || apiData.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No vessel positions found',
            });
        }

        // Normalize and store in database
        const normalizedData = apiData.map((item) =>
            marineTrafficService.normalizeData(item)
        );

        const saved = await VesselPosition.createMany(normalizedData);

        // Upsert current state into vessels table (name is not updated, only set on initial insert)
        await Promise.all(
            normalizedData.map((d) =>
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

        res.status(200).json({
            success: true,
            message: `Successfully stored ${saved} vessel positions`,
            data: {
                count: saved,
                positions: normalizedData.slice(0, 10), // Return first 10 as sample
            },
        });
    } catch (error) {
        console.error('Error in fetchAndStorePositions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching and storing vessel positions',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Get all vessels (current state) from database
 */
const getAllVessels = async (req, res) => {
    try {
        const vessels = await Vessel.findAll();

        res.status(200).json({
            success: true,
            data: {
                vessels,
                count: vessels.length,
            },
        });
    } catch (error) {
        console.error('Error in getAllVessels:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vessels',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Get all vessel positions (history) from database
 */
const getAllPositions = async (req, res) => {
    try {
        const {
            limit = 100,
            offset = 0,
            mmsi,
            startDate,
            endDate,
        } = req.query;

        const options = {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            mmsi,
            startDate,
            endDate,
        };

        const [positions, total] = await Promise.all([
            VesselPosition.findAll(options),
            VesselPosition.count(options),
        ]);

        res.status(200).json({
            success: true,
            data: {
                positions,
                pagination: {
                    total,
                    limit: options.limit,
                    offset: options.offset,
                    hasMore: options.offset + options.limit < total,
                },
            },
        });
    } catch (error) {
        console.error('Error in getAllPositions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vessel positions',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Get latest positions for all vessels
 */
const getLatestPositions = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit || 50, 10);
        const positions = await VesselPosition.getLatestPositions(limit);

        res.status(200).json({
            success: true,
            data: {
                positions,
                count: positions.length,
            },
        });
    } catch (error) {
        console.error('Error in getLatestPositions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching latest vessel positions',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Get positions by MMSI
 */
const getPositionsByMMSI = async (req, res) => {
    try {
        const { mmsi } = req.params;
        const limit = parseInt(req.query.limit || 100, 10);

        if (!mmsi) {
            return res.status(400).json({
                success: false,
                message: 'MMSI is required',
            });
        }

        const positions = await VesselPosition.findByMMSI(mmsi, limit);

        res.status(200).json({
            success: true,
            data: {
                positions,
                count: positions.length,
            },
        });
    } catch (error) {
        console.error('Error in getPositionsByMMSI:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vessel positions by MMSI',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

/**
 * Get single position by ID
 */
const getPositionById = async (req, res) => {
    try {
        const { id } = req.params;
        const position = await VesselPosition.findById(id);

        if (!position) {
            return res.status(404).json({
                success: false,
                message: 'Vessel position not found',
            });
        }

        res.status(200).json({
            success: true,
            data: position,
        });
    } catch (error) {
        console.error('Error in getPositionById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vessel position',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        });
    }
};

module.exports = {
    fetchAndStorePositions,
    getAllVessels,
    getAllPositions,
    getLatestPositions,
    getPositionsByMMSI,
    getPositionById,
};
