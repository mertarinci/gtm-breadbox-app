const express = require('express');
const router = express.Router();
const vesselController = require('../controllers/vesselController');

/**
 * @route   POST /api/vessels/fetch
 * @desc    Fetch vessel positions from MarineTraffic API and store in database
 * @access  Public
 */
router.post('/fetch', vesselController.fetchAndStorePositions);

/**
 * @route   GET /api/vessels/fetch-export
 * @desc    Fetch export vessels from MarineTraffic API and store in database (GET endpoint for browser access)
 * @access  Public
 */
router.get('/fetch-export', vesselController.fetchAndStoreExportVessels);

/**
 * @route   GET /api/vessels/positions
 * @desc    Get all vessel positions (history) with optional filters
 * @access  Public
 * @query   limit, offset, mmsi, startDate, endDate
 */
router.get('/positions', vesselController.getAllPositions);

/**
 * @route   GET /api/vessels/latest
 * @desc    Get latest position for each vessel
 * @access  Public
 * @query   limit
 */
router.get('/latest', vesselController.getLatestPositions);

/**
 * @route   GET /api/vessels/mmsi/:mmsi
 * @desc    Get all positions for a specific vessel by MMSI
 * @access  Public
 * @query   limit
 */
router.get('/mmsi/:mmsi', vesselController.getPositionsByMMSI);

/**
 * @route   GET /api/vessels/geojson
 * @desc    Get vessel positions as GeoJSON format
 * @access  Public
 * @query   limit, offset, mmsi, startDate, endDate
 */
router.get('/geojson', vesselController.getPositionsAsGeoJSON);

/**
 * @route   GET /api/vessels
 * @desc    Get all vessels (current state with name)
 * @access  Public
 */
router.get('/', vesselController.getAllVessels);

/**
 * @route   PUT /api/vessels/:mmsi
 * @desc    Update a vessel by MMSI
 * @access  Public
 */
router.put('/:mmsi', vesselController.updateVessel);

/**
 * @route   GET /api/vessels/:id
 * @desc    Get a single vessel position by ID
 * @access  Public
 * @note    This route must be last to avoid conflicts with other routes
 */
router.get('/:id', vesselController.getPositionById);

module.exports = router;
