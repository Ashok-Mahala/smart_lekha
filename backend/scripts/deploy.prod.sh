#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting production deployment process..."

# Load environment variables
echo "📝 Loading environment variables..."
source .env.production

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t seatflow-backend:prod .

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Start the containers
echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Run database migrations if needed
echo "📝 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec app npm run migrate

echo "✅ Production deployment completed successfully!"
echo "🌐 API is available at https://your-api-domain.com" 