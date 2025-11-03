const axios = require('axios');
require('dotenv').config();

// Dummy data generator for development/testing
const generateDummyData = () => {
    const baseData = {
        MMSI: "577193000",
        LAT: "21.209629",
        LON: "-17.462400",
        SPEED: "99",
        HEADING: "181",
        COURSE: "184",
        STATUS: "0",
        TIMESTAMP: new Date().toISOString().split('.')[0],
    };

    // Generate multiple vessels with slight variations
    const vessels = [baseData];

    // Generate additional dummy vessels
    for (let i = 1; i < 5; i++) {
        vessels.push({
            MMSI: String(577193000 + i),
            LAT: (parseFloat(baseData.LAT) + (Math.random() - 0.5) * 10).toFixed(6),
            LON: (parseFloat(baseData.LON) + (Math.random() - 0.5) * 10).toFixed(6),
            SPEED: String(Math.floor(Math.random() * 100)),
            HEADING: String(Math.floor(Math.random() * 360)),
            COURSE: String(Math.floor(Math.random() * 360)),
            STATUS: String(Math.floor(Math.random() * 15)),
            TIMESTAMP: new Date().toISOString().split('.')[0],
        });
    }

    return vessels;
};

class MarineTrafficService {
    constructor() {
        this.apiKey = process.env.MARINETRAFFIC_API_KEY;
        this.baseUrl = 'https://services.marinetraffic.com/api';
        // Use full URL if provided, otherwise construct from API key
        this.exportVesselsUrl = process.env.MARINETRAFFIC_EXPORTVESSELS_URL ||
            (this.apiKey ? `${this.baseUrl}/exportvessels/${this.apiKey}?protocol=json` : null);
        this.useMock = process.env.USE_MOCK_DATA === 'true' || (!this.exportVesselsUrl && !this.apiKey);
    }

    /**
     * Fetch vessel positions from MarineTraffic API or return mock data
     * @param {Object} params - Query parameters (mmsi, timespan, etc.)
     * @returns {Promise<Array>} Array of vessel position data
     */
    async fetchVesselPositions(params = {}) {
        if (this.useMock) {
            console.log('📦 Using mock data for vessel positions');
            return this.getMockData();
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

            // Fallback to mock data on error
            console.log('📦 Falling back to mock data');
            return this.getMockData();
        }
    }

    /**
     * Fetch current vessels snapshot from exportvessels endpoint
     * Uses full URL from .env if provided, otherwise constructs from API key
     */
    async fetchExportVessels() {
        if (this.useMock || !this.exportVesselsUrl) {
            console.log('📦 Using mock export vessels data');
            return this.getMockData();
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
            console.log('📦 Falling back to mock data');
            return this.getMockData();
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
     * Get mock/dummy data
     */
    getMockData() {
        return generateDummyData();
    }

    /**
     * Normalize data format from API/mock to database format
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
