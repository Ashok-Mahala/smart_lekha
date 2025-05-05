Write-Host "Starting MongoDB..." -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator!" -ForegroundColor Red
    Write-Host "Right-click on PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "`nPress any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Check if MongoDB is already running
$mongodProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongodProcess) {
    Write-Host "MongoDB is already running!" -ForegroundColor Yellow
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

try {
    # Check if configuration exists
    if (-not (Test-Path "mongod.cfg")) {
        Write-Host "MongoDB configuration not found!" -ForegroundColor Red
        Write-Host "Please run .\setup-mongodb.ps1 first" -ForegroundColor Yellow
        Write-Host "`nPress any key to continue..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit
    }

    # Start MongoDB
    Start-Process mongod -ArgumentList "--config mongod.cfg" -NoNewWindow
    Write-Host "MongoDB started successfully!" -ForegroundColor Green
    Write-Host "You can now start the SeatFlow backend server." -ForegroundColor Yellow
} catch {
    Write-Host "Error starting MongoDB: $_" -ForegroundColor Red
    Write-Host "Please check if MongoDB is installed and try again" -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 