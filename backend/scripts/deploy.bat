@echo off
echo 🚀 Starting deployment process...

echo 📦 Building Docker image...
docker build -t seatflow-backend:latest .

echo 🛑 Stopping existing containers...
docker-compose down

echo 🚀 Starting containers...
docker-compose up -d

echo ⏳ Waiting for MongoDB to be ready...
timeout /t 10

echo 📝 Running database migrations...
docker-compose exec app npm run migrate

echo ✅ Deployment completed successfully!
echo 🌐 API is available at http://localhost:3000 