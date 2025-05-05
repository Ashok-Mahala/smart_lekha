Write-Host "Stopping MongoDB..." -ForegroundColor Green

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
    # Check if MongoDB is running
    $mongodProcess = Get-Process mongod -ErrorAction SilentlyContinue
    if (-not $mongodProcess) {
        Write-Host "MongoDB is not running!" -ForegroundColor Yellow
        Write-Host "`nPress any key to continue..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit
    }

    # Stop MongoDB process
    Stop-Process -Name mongod -Force
    Write-Host "MongoDB stopped successfully!" -ForegroundColor Green

    # Check if MongoDB service exists and is running
    $service = Get-Service MongoDB -ErrorAction SilentlyContinue
    if ($service -and $service.Status -eq 'Running') {
        Write-Host "Stopping MongoDB service..." -ForegroundColor Yellow
        Stop-Service MongoDB
        Write-Host "MongoDB service stopped successfully!" -ForegroundColor Green
    }
} catch {
    Write-Host "Error stopping MongoDB: $_" -ForegroundColor Red
    Write-Host "Please check if MongoDB is installed and try again" -ForegroundColor Yellow
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 