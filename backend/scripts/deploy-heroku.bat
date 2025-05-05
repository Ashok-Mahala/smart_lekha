@echo off
echo 🚀 Starting Heroku deployment process...

echo 📦 Building the application...
npm run build

echo 🔐 Logging in to Heroku...
heroku login

echo 📝 Creating Heroku app...
heroku create seatflow-backend

echo 🔧 Setting up environment variables...
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret-key
heroku config:set CORS_ORIGIN=https://your-frontend-domain.com

echo 📤 Deploying to Heroku...
git add .
git commit -m "Deploy to Heroku"
git push heroku main

echo ⏳ Waiting for deployment to complete...
timeout /t 10

echo 📝 Running database migrations...
heroku run npm run migrate

echo ✅ Heroku deployment completed successfully!
echo 🌐 Your app is now live at: https://seatflow-backend.herokuapp.com 