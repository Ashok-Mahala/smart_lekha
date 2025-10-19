# Seatflow SB2 Environment Configuration Guide

This guide explains how to configure and manage environment variables for the Seatflow SB2 Admin application across different environments.

## Overview

The application supports different environments:
- **Development**: Local development environment
- **Production**: Live deployment environment
- **Test**: Testing environment

Each environment uses its own set of environment variables defined in specific `.env` files.

## Environment Files

### Backend Environment Files

| File                 | Purpose                                   | When Used                          |
|----------------------|-------------------------------------------|-----------------------------------|
| `.env`               | Default fallback configuration            | When no environment-specific file exists |
| `.env.development`   | Development environment configuration     | During local development (`npm run dev`) |
| `.env.production`    | Production environment configuration      | In production deployments (`npm run start:prod`) |
| `.env.test`          | Test environment configuration            | During testing (`npm run test`)   |

### Frontend Environment Files

| File                 | Purpose                                   | When Used                          |
|----------------------|-------------------------------------------|-----------------------------------|
| `.env`               | Default fallback configuration            | When no environment-specific file exists |
| `.env.development`   | Development environment configuration     | During local development (`npm run dev`) |
| `.env.production`    | Production environment configuration      | In production builds (`npm run build:prod`) |
| `.env.test`          | Test environment configuration            | During testing (`npm run build:test`) |

## Required Environment Variables

### Backend Required Variables

```
# Required
MONGODB_USERNAME        = ashok
MONGODB_PASSWORD        = Ram%405045%40
MONGODB_DATABASE        = smart_lekha
MONGODB_HOST            = 127.0.0.1
MONGODB_PORT            = 27017
JWT_SECRET=your_jwt_secret_key

# Optional with defaults
PORT=5000
NODE_ENV=development
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
```

### Frontend Required Variables

```
# Required
VITE_API_URL=http://92.168.1.6:5000/smlekha

# Optional with defaults
VITE_WS_URL=ws://92.168.1.6:5000
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_REPORTS=true
```

## Setting Up Local Development

1. Create environment files by copying the examples:

```bash
# Backend
cp backend/.env.example backend/.env.development

# Frontend
cp frontend/.env.example frontend/.env.development
```

2. Edit the created files with your local settings.

3. Start the application in development mode:

```bash
npm run start:dev
```

## Building for Production

1. Create production environment files:

```bash
# Backend
cp backend/.env.example backend/.env.production

# Frontend
cp frontend/.env.example frontend/.env.production
```

2. Edit the production files with your production settings.

3. Build and start the application:

```bash
# Build frontend for production
npm run build:prod

# Start both backend and frontend for production
npm run start:prod
```

## Environment Variable Access

### In Backend Code

Access environment variables through the centralized config object:

```javascript
const { config } = require('./config');

// Use config properties
const port = config.port;
const mongoUri = config.mongoUri;
```

### In Frontend Code

Use the centralized environment helper:

```javascript
import { ENV } from '@/config/env';

// Access environment variables
const apiUrl = ENV.API_URL;
const isPaymentsEnabled = ENV.FEATURES.PAYMENTS;

// Check current environment
if (ENV.isDevelopment()) {
  // Development-only code
}
```

## Adding New Environment Variables

1. Add the variable to the appropriate `.env.example` file (frontend or backend)
2. Add the variable to each environment-specific file
3. For backend, update the `config.js` file to include the new variable
4. For frontend, update the `env.js` file to include the new variable

## Security Considerations

- Never commit sensitive environment variables to version control
- Use different secrets for each environment
- In production, set environment variables through your hosting platform instead of files
- Validate required environment variables on application startup

## Deployment

### Vercel (Frontend)

Configure environment variables in the Vercel project settings:

1. Go to your project on Vercel
2. Navigate to Settings > Environment Variables
3. Add all required frontend variables

### Backend Deployment

For backend deployment, configure environment variables according to your hosting platform:

- **Node.js hosting**: Set environment variables in the hosting platform dashboard
- **Docker**: Use environment variables or docker secrets
- **Kubernetes**: Use ConfigMaps and Secrets

## Troubleshooting

If the application isn't picking up your environment variables:

1. Check that you're using the correct `.env` file for your environment
2. Restart the application to make sure changes are applied
3. Verify that the variable is properly referenced in the code
4. Check for typos in variable names
5. Ensure variable names in the code match those in the `.env` files 