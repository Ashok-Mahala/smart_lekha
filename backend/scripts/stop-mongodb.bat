@echo off
echo Stopping MongoDB...

REM Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo MongoDB is not running!
    pause
    exit /b
)

REM Stop MongoDB
taskkill /F /IM mongod.exe

echo MongoDB stopped successfully!
echo.
pause 