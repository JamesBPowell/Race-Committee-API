# start-dev.ps1
# Starts the backend API and frontend Next.js server in separate interactive terminal windows
# with automatic database migration updates.

$ErrorActionPreference = "Stop"

Clear-Host
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "        RACEKREWE DEVELOPMENT START       " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Verify system prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Gray
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Error "Microsoft .NET SDK is not installed or not in PATH. Please install .NET Core SDK."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js."
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed or not in PATH. Please install npm."
}

# 2. Check/Install EF Core CLI Tool
Write-Host "Checking for Entity Framework Core CLI (dotnet-ef)..." -ForegroundColor Gray
$efCheck = $null
try {
    # Run a simple ef command and suppress errors
    $efCheck = & dotnet ef --version 2>$null
} catch {
    # Capture exception
}

if ($LASTEXITCODE -ne 0 -or -not $efCheck) {
    Write-Host "dotnet-ef is not installed globally. Attempting global installation..." -ForegroundColor Yellow
    try {
        & dotnet tool install --global dotnet-ef
        Write-Host "Successfully installed dotnet-ef globally." -ForegroundColor Green
    } catch {
        Write-Warning "Could not install dotnet-ef globally. If migrations fail, please install it manually with: dotnet tool install --global dotnet-ef"
    }
}

# 3. Run Database Migrations
Write-Host "Checking and applying database migrations..." -ForegroundColor Cyan
try {
    & dotnet ef database update --project api --startup-project api
    Write-Host "Database is up to date." -ForegroundColor Green
} catch {
    Write-Error "Failed to apply database migrations. Please check your local connection string and database."
}

# 4. Check UI Dependencies
if (-not (Test-Path "ui/node_modules")) {
    Write-Host "ui/node_modules not found. Installing UI dependencies..." -ForegroundColor Yellow
    & npm install --prefix ui
}

# 5. Launch Backend in new window
Write-Host "Launching Backend API (HTTP: http://localhost:5236)..." -ForegroundColor Cyan
$apiProcess = Start-Process powershell -WorkingDirectory "$PSScriptRoot/api" -ArgumentList "-NoExit", "-Command", "try { `$Host.UI.RawUI.WindowTitle = 'RaceKrewe Backend API' } catch {}; dotnet run --launch-profile http" -PassThru

# 6. Launch Frontend in new window
Write-Host "Launching Frontend UI (HTTP: http://localhost:3000)..." -ForegroundColor Cyan
$uiProcess = Start-Process powershell -WorkingDirectory "$PSScriptRoot/ui" -ArgumentList "-NoExit", "-Command", "try { `$Host.UI.RawUI.WindowTitle = 'RaceKrewe Frontend UI' } catch {}; npm run dev" -PassThru

# 7. Save PIDs for graceful termination
$pids = @{
    apiPid = $apiProcess.Id
    uiPid = $uiProcess.Id
}
$pids | ConvertTo-Json | Out-File -FilePath .dev-pids.json -Encoding utf8

Write-Host "=========================================" -ForegroundColor Green
Write-Host "  RaceKrewe is running!" -ForegroundColor Green
Write-Host "  - UI:  http://localhost:3000" -ForegroundColor Green
Write-Host "  - API: http://localhost:5236" -ForegroundColor Green
Write-Host "  - Docs: http://localhost:5236/openapi/v1.json" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Console windows have been launched." -ForegroundColor Gray
Write-Host "  To stop the servers, run: .\stop-dev.ps1" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Green
