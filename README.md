# GTM Breadbox App

Node.js Express application for fetching and managing vessel positions from MarineTraffic API.

## Features

- 🚢 Fetch vessel positions from MarineTraffic API
- 💾 Store positions in PostgreSQL (Neon)
- 🔍 Query vessel positions with filters (MMSI, date range, etc.)
- 📊 Get latest positions for all vessels
- 🏗️ Production-ready architecture

## Project Structure

```
gtm-breadbox-app/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── controllers/
│   │   └── vesselController.js  # Route handlers
│   ├── models/
│   │   └── VesselPosition.js    # Database models
│   ├── routes/
│   │   └── vesselRoutes.js      # API routes
│   ├── services/
│   │   └── marineTrafficService.js  # API service
│   ├── middleware/
│   │   └── errorHandler.js      # Error handling
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── .env.example                 # Environment variables template
├── package.json
└── README.md
```

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create `.env` file:**

   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file:**

   ```env
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   PORT=3000
   NODE_ENV=development
   USE_MOCK_DATA=true
   MARINETRAFFIC_API_KEY=your_api_key_here
   ```

4. **Start the server:**

   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Health Check

- `GET /health` - Check server status

### Vessel Positions

- `POST /api/vessels/fetch` - Fetch vessel positions from API and store in database

  - Query params: `timespan`, `mmsi`

- `GET /api/vessels` - Get all vessel positions

  - Query params: `limit`, `offset`, `mmsi`, `startDate`, `endDate`

- `GET /api/vessels/latest` - Get latest position for each vessel

  - Query params: `limit`

- `GET /api/vessels/mmsi/:mmsi` - Get all positions for a specific vessel

  - Query params: `limit`

- `GET /api/vessels/:id` - Get a single vessel position by ID

## Usage Examples

### Fetch and store positions:

```bash
curl -X POST http://localhost:3000/api/vessels/fetch
```

### Get all positions:

```bash
curl http://localhost:3000/api/vessels?limit=10
```

### Get latest positions:

```bash
curl http://localhost:3000/api/vessels/latest
```

### Get positions by MMSI:

```bash
curl http://localhost:3000/api/vessels/mmsi/577193000
```

## Database Schema

The `vessel_positions` table stores:

- `id` - Primary key
- `mmsi` - Maritime Mobile Service Identity
- `lat` - Latitude
- `lon` - Longitude
- `speed` - Speed in knots
- `heading` - Heading in degrees
- `course` - Course in degrees
- `status` - Navigation status
- `timestamp` - Position timestamp
- `created_at` - Record creation time
- `updated_at` - Record update time

## Testing

The project includes comprehensive unit and integration tests using Jest and Supertest.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Test Structure

```
tests/
├── unit/
│   ├── models/
│   │   ├── Vessel.test.js
│   │   └── VesselPosition.test.js
│   └── services/
│       └── marineTrafficService.test.js
├── integration/
│   ├── controllers/
│   │   └── vesselController.test.js
│   └── routes/
│       └── vesselRoutes.test.js
├── helpers/
│   └── testDb.js
└── setup/
    └── jest.setup.js
```

### Test Database

Tests use a separate test database. Create a `.env.test` file:

```env
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/test_database
USE_MOCK_DATA=true
```

## Technologies

- **Express.js** - Web framework
- **PostgreSQL** - Database (via Neon)
- **pg** - PostgreSQL client
- **Axios** - HTTP client
- **Helmet** - Security middleware
- **Morgan** - HTTP request logger
- **dotenv** - Environment variables
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library

## License

ISC
