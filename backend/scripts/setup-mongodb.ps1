Write-Host "Setting up MongoDB..." -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator!" -ForegroundColor Red
    Write-Host "Right-click on PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "`nPress any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

try {
    # Create data directory
    $dataDir = "C:\data\db"
    if (-not (Test-Path $dataDir)) {
        Write-Host "Creating data directory at $dataDir..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
    }

    # Create log directory
    $logDir = "C:\data\log"
    if (-not (Test-Path $logDir)) {
        Write-Host "Creating log directory at $logDir..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }

    # Create MongoDB configuration
    $config = @"
systemLog:
    destination: file
    path: C:\data\log\mongod.log
    logAppend: true
storage:
    dbPath: C:\data\db
net:
    bindIp: 127.0.0.1
    port: 27017
"@

    # Write configuration to file
    $config | Out-File -FilePath "mongod.cfg" -Encoding utf8
    Write-Host "MongoDB configuration created successfully!" -ForegroundColor Green

    # Create Windows service (optional)
    $createService = Read-Host "Do you want to create a Windows service for MongoDB? (y/n)"
    if ($createService -eq 'y') {
        Write-Host "Creating MongoDB service..." -ForegroundColor Yellow
        & "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --config "mongod.cfg" --install
        Write-Host "MongoDB service created successfully!" -ForegroundColor Green
        Write-Host "You can start the service using: net start MongoDB" -ForegroundColor Yellow
    }

    Write-Host "`nMongoDB setup completed successfully!" -ForegroundColor Green
    Write-Host "You can now start MongoDB using .\start-mongodb.ps1" -ForegroundColor Yellow
} catch {
    Write-Host "Error during setup: $_" -ForegroundColor Red
    Write-Host "Please check if MongoDB is installed and try again" -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 