const axios = require('axios');
require('dotenv').config();

class MarineTrafficService {
    constructor() {
        this.apiKey = process.env.MARINETRAFFIC_API_KEY;
        this.baseUrl = 'https://services.marinetraffic.com/api';
        // Use full URL if provided, otherwise construct from API key
        this.exportVesselsUrl = process.env.MARINETRAFFIC_EXPORTVESSELS_URL ||
            (this.apiKey ? `${this.baseUrl}/exportvessels/${this.apiKey}?protocol=json` : null);
    }

    /**
     * Fetch vessel positions from MarineTraffic API
     * @param {Object} params - Query parameters (mmsi, timespan, etc.)
     * @returns {Promise<Array>} Array of vessel position data
     * @throws {Error} If API key is missing or request fails
     */
    async fetchVesselPositions(params = {}) {
        if (!this.apiKey) {
            throw new Error('MARINETRAFFIC_API_KEY is required');
        }

        try {
            const response = await axios.get(`${this.baseUrl}/exportvesseltrack/v:3/${this.apiKey}`, {
                params: {
                    timespan: params.timespan || 60,
                    mmsi: params.mmsi || '',
                    protocol: 'json',
                },
                timeout: 10000,
            });

            // Transform API response to our format if needed
            if (Array.isArray(response.data)) {
                return response.data.map(this.transformApiResponse);
            }

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching from MarineTraffic API:', error.message);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Data:`, error.response.data);
            }
            throw error;
        }
    }

    /**
     * Fetch current vessels snapshot from exportvessels endpoint
     * Uses full URL from .env if provided, otherwise constructs from API key
     * @returns {Promise<Array>} Array of vessel data
     * @throws {Error} If URL is missing or request fails
     */
    async fetchExportVessels() {
        if (!this.exportVesselsUrl) {
            throw new Error('MARINETRAFFIC_EXPORTVESSELS_URL or MARINETRAFFIC_API_KEY is required');
        }

        try {
            console.log(`🌐 Fetching from: ${this.exportVesselsUrl.replace(/\/\/[^@]+@/, '//***@')}`); // Hide credentials in log
            const response = await axios.get(this.exportVesselsUrl, {
                timeout: 15000,
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (Array.isArray(response.data)) {
                console.log(`✅ Received ${response.data.length} vessels from API`);
                return response.data.map(this.transformApiResponse);
            }

            return response.data;
        } catch (error) {
            console.error('❌ Error fetching exportvessels:', error.message);
            if (error.response) {
                console.error(`   Status: ${error.response.status}`);
                console.error(`   Data:`, error.response.data);
            }
            throw error;
        }
    }

    /**
     * Transform API response to our standard format
     */
    transformApiResponse(item) {
        return {
            MMSI: item.MMSI || item.mmsi,
            LAT: item.LAT || item.lat,
            LON: item.LON || item.lon,
            SPEED: item.SPEED || item.speed,
            HEADING: item.HEADING || item.heading,
            COURSE: item.COURSE || item.course,
            STATUS: item.STATUS || item.status,
            TIMESTAMP: item.TIMESTAMP || item.timestamp,
        };
    }

    /**
     * Normalize data format from API to database format
     */
    normalizeData(apiData) {
        return {
            mmsi: String(apiData.MMSI || apiData.mmsi),
            lat: parseFloat(apiData.LAT || apiData.lat),
            lon: parseFloat(apiData.LON || apiData.lon),
            speed: apiData.SPEED || apiData.speed ? parseInt(apiData.SPEED || apiData.speed, 10) : null,
            heading: apiData.HEADING || apiData.heading ? parseInt(apiData.HEADING || apiData.heading, 10) : null,
            course: apiData.COURSE || apiData.course ? parseInt(apiData.COURSE || apiData.course, 10) : null,
            status: apiData.STATUS || apiData.status ? parseInt(apiData.STATUS || apiData.status, 10) : null,
            timestamp: apiData.TIMESTAMP || apiData.timestamp,
        };
    }
}

module.exports = new MarineTrafficService();
