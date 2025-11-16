# SeatFlow SB2 Admin

## Project Overview
This is a React-based admin dashboard built with JavaScript, Vite, and shadcn-ui. The project consists of a frontend React application and a Node.js backend.

## Project Structure
```
seatflow-sb2-admin-js/
├── frontend/          # React frontend application
├── backend/           # Node.js backend server
└── package.json       # Root package.json for managing both frontend and backend
```

## Technologies Used
- Frontend:
  - Vite
  - JavaScript
  - React
  - shadcn-ui
  - Tailwind CSS
- Backend:
  - Node.js
  - Express
  - MongoDB

## Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd seatflow-sb2-admin-js
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the environment variables as needed

4. Start development servers:
```bash
# Start frontend development server
npm run dev

# Start backend development server (in a separate terminal)
npm run backend:dev
```

## Building for Production

1. Build the frontend:
```bash
npm run build
```

2. Build the backend:
```bash
npm run backend:build
```

## Environment Variables

### Frontend (.env)
- `VITE_API_URL`: Backend API URL
- `VITE_WS_URL`: WebSocket URL

### Backend (.env)
- See `.env.example` in the backend directory for required variables

## API Documentation

The API is fully documented using Swagger/OpenAPI 3.0. To access the API documentation:

1. Start the backend server
2. Navigate to `/smlekha-docs` in your browser (e.g., http://93.127.195.247:5000/smlekha-docs)

The documentation includes:

- All available endpoints
- Request parameters, body schemas, and response formats
- Authentication requirements
- Interactive testing via the Swagger UI

The documentation files are located in `backend/src/docs` and are organized by resource type.# SB2-Library-
