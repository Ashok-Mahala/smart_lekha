@echo off
echo 🚀 Setting up MongoDB locally...

echo 📦 Checking if MongoDB is installed...
where mongod >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ MongoDB is not installed. Please install MongoDB first.
    echo 📥 Download MongoDB from: https://www.mongodb.com/try/download/community
    exit /b 1
)

echo 📂 Creating data directory...
if not exist "data\db" mkdir "data\db"

echo 🏃 Starting MongoDB service...
start /B mongod --dbpath=data\db

echo ⏳ Waiting for MongoDB to start...
timeout /t 5

echo ✅ MongoDB is now running locally!
echo 🌐 Connection string: mongodb://localhost:27017/seatflow 