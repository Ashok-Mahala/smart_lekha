#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t seatflow-backend:latest .

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Start the containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Run database migrations if needed
echo "📝 Running database migrations..."
docker-compose exec app npm run migrate

echo "✅ Deployment completed successfully!"
echo "🌐 API is available at http://localhost:3000" 