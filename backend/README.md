# SeatFlow Backend

This is the backend server for the SeatFlow application, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/seatflow
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

3. Start MongoDB server

## Development

To run the server in development mode:
```bash
npm run dev
```

## Production

To build and run the server in production mode:
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/login` - Login and get JWT token
- POST `/api/auth/verify` - Verify JWT token

### Students
- GET `/api/students` - Get all students
- GET `/api/students/:id` - Get student by ID
- POST `/api/students` - Create new student
- PUT `/api/students/:id` - Update student
- DELETE `/api/students/:id` - Delete student

### Seats
- GET `/api/seats` - Get all seats
- GET `/api/seats/:id` - Get seat by ID
- POST `/api/seats` - Create new seat
- PUT `/api/seats/:id` - Update seat
- POST `/api/seats/:id/book` - Book a seat
- POST `/api/seats/:id/release` - Release a seat

### Payments
- GET `/api/payments` - Get all payments
- GET `/api/payments/:id` - Get payment by ID
- POST `/api/payments` - Create new payment
- PUT `/api/payments/:id/status` - Update payment status
- GET `/api/payments/student/:studentId` - Get payments by student
- GET `/api/payments/summary/monthly` - Get monthly payment summary

## Authentication

All endpoints except `/api/auth/login` and `/api/auth/verify` require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

# SeatFlow Backend Setup Guide

## Prerequisites

1. Node.js (v14 or higher)
2. MongoDB (v4.4 or higher)
3. npm (v6 or higher)

## Local Setup

1. Install MongoDB:
   - Download and install MongoDB Community Edition from [MongoDB's official website](https://www.mongodb.com/try/download/community)
   - Follow the installation instructions for your operating system
   - Start MongoDB service

2. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd backend
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the following variables in `.env`:
     ```
     MONGODB_URI=mongodb://localhost:27017/seatflow
     JWT_SECRET=your-secret-key
     JWT_EXPIRATION=1d
     CORS_ORIGIN=http://localhost:3000
     ```

4. Initialize the database:
   ```bash
   npm run init-db
   ```

5. Seed the database (optional):
   ```bash
   npm run db:seed
   ```

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The server will be running at `http://localhost:3000`

## Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Database Management

- To reset the database:
  ```bash
  npm run db:reset
  ```

- To initialize a fresh database:
  ```bash
  npm run init-db
  ```

## Testing

Run tests:
```bash
npm test
```

## Linting

Check code style:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

## API Documentation

The API is fully documented using Swagger/OpenAPI 3.0. To access the documentation:

1. Start the server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:5000/api-docs
   ```

3. You can test endpoints directly from the Swagger UI:
   - Expand an endpoint to see details
   - Fill in parameters and request body
   - Click "Execute" to test

The documentation files are located in the `src/docs/` directory and are organized by resource type:

- `student.yaml` - Student endpoints
- `seat.yaml` - Seat endpoints
- `shifts.yaml` - Shift endpoints
- `files.yaml` - File upload endpoints
- `attendance.yaml` - Attendance endpoints
- `payment.yaml` - Payment endpoints
- `booking.yaml` - Booking endpoints
- `operation.yaml` - Operation endpoints
- `user.yaml` - User endpoints
- `common.yaml` - Common schemas and parameters
- `errors.yaml` - Error response schemas

### Authentication in Swagger UI

For protected endpoints, click the "Authorize" button at the top of the page and enter your JWT token:

```
Bearer your-jwt-token
```

### Adding New Documentation

When adding new API endpoints, document them in the appropriate YAML file following the OpenAPI 3.0 specification.

For more information, see the [Swagger Documentation Guide](../docs/SWAGGER_GUIDE.md). 