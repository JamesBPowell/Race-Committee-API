# stop-dev.ps1
# Gracefully stops the backend API and frontend Next.js server by killing the stored process IDs.

$ErrorActionPreference = "Stop"

Clear-Host
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "        RACEKREWE DEVELOPMENT STOP        " -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Yellow

$pidFile = ".dev-pids.json"

if (Test-Path $pidFile) {
    try {
        $pids = Get-Content -Raw -Path $pidFile | ConvertFrom-Json
        
        # Stop API
        if ($pids.apiPid) {
            Write-Host "Stopping Backend API (PID: $($pids.apiPid))..." -ForegroundColor Gray
            Stop-Process -Id $pids.apiPid -Force -ErrorAction SilentlyContinue
            Write-Host "Backend API stopped." -ForegroundColor Green
        }
        
        # Stop UI
        if ($pids.uiPid) {
            Write-Host "Stopping Frontend UI (PID: $($pids.uiPid))..." -ForegroundColor Gray
            Stop-Process -Id $pids.uiPid -Force -ErrorAction SilentlyContinue
            Write-Host "Frontend UI stopped." -ForegroundColor Green
        }

        # Remove the PID file
        Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
        Write-Host "Dev processes stopped successfully." -ForegroundColor Green
        
    } catch {
        Write-Warning "An error occurred while reading the PID file or stopping processes: $_"
    }
} else {
    Write-Host "No active dev processes tracked in .dev-pids.json." -ForegroundColor Yellow
    Write-Host "Check if they are already stopped or if you need to close the terminal windows manually." -ForegroundColor Gray
}

Write-Host "=========================================" -ForegroundColor Yellow
