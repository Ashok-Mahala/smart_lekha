@echo off
echo 🚀 Initializing database...

echo 📦 Installing dependencies...
call npm install

echo 🔄 Building TypeScript...
call npm run build

echo 📝 Initializing database collections and indexes...
call npm run db:init

if %ERRORLEVEL% neq 0 (
    echo ❌ Database initialization failed!
    exit /b 1
)

echo 🌱 Seeding sample data...
call npm run db:seed

if %ERRORLEVEL% neq 0 (
    echo ❌ Database seeding failed!
    exit /b 1
)

echo ✅ Database initialization completed successfully!
echo 👤 Default users created:
echo    - Admin: admin@seatflow.com
echo    - Staff: staff@seatflow.com / staff123
echo    - Manager: manager@seatflow.com / manager123
echo 📝 Please change the default passwords after first login. 