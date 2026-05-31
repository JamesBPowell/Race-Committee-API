#!/usr/bin/env bash

# start-dev.sh
# Starts the backend API and frontend Next.js server in separate terminal windows (macOS/Linux)
# with automatic database migration updates.

set -e

# Detect OS
OS_TYPE=$(uname)

echo "========================================="
echo "        RACEKREWE DEVELOPMENT START       "
echo "========================================="

# 1. Verify system prerequisites
echo "Checking prerequisites..."
command -v dotnet >/dev/null 2>&1 || { echo >&2 "Microsoft .NET SDK is not installed or not in PATH."; exit 1; }
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js is not installed or not in PATH."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo >&2 "npm is not installed or not in PATH."; exit 1; }

# 2. Check/Install EF Core CLI Tool
echo "Checking for Entity Framework Core CLI (dotnet-ef)..."
if ! command -v dotnet-ef >/dev/null 2>&1; then
    echo "dotnet-ef is not installed globally. Attempting installation..."
    dotnet tool install --global dotnet-ef || echo "Warning: could not install dotnet-ef globally."
fi

# 3. Run Database Migrations
echo "Checking and applying database migrations..."
dotnet ef database update --project api --startup-project api || { echo "Failed to apply database migrations."; exit 1; }

# 4. Check UI Dependencies
if [ ! -d "ui/node_modules" ]; then
    echo "ui/node_modules not found. Installing UI dependencies..."
    npm install --prefix ui
fi

# 5. Launch Backend and Frontend in separate windows depending on OS
echo "Launching servers..."

API_PID=""
UI_PID=""

if [ "$OS_TYPE" = "Darwin" ]; then
    # macOS - launch using AppleScript to open new Terminal windows
    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/api && dotnet run --launch-profile http"' > /dev/null
    sleep 2
    API_PID=$(pgrep -f "dotnet run --launch-profile http" | head -n 1 || pgrep -f "api.dll" | head -n 1 || echo "")

    osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"'/ui && npm run dev"' > /dev/null
    sleep 2
    UI_PID=$(pgrep -f "next-dev" | head -n 1 || pgrep -f "next dev" | head -n 1 || echo "")
else
    # Linux (try common terminal emulators, or fallback to background with logs)
    if command -v gnome-terminal >/dev/null 2>&1; then
        gnome-terminal --title="RaceKrewe Backend API" -- bash -c "cd api && dotnet run --launch-profile http; exec bash" &
        gnome-terminal --title="RaceKrewe Frontend UI" -- bash -c "cd ui && npm run dev; exec bash" &
        sleep 2
        API_PID=$(pgrep -f "dotnet run --launch-profile http" | head -n 1 || echo "")
        UI_PID=$(pgrep -f "next-dev" | head -n 1 || pgrep -f "next dev" | head -n 1 || echo "")
    elif command -v x-terminal-emulator >/dev/null 2>&1; then
        x-terminal-emulator -e "bash -c 'cd api && dotnet run --launch-profile http; exec bash'" &
        x-terminal-emulator -e "bash -c 'cd ui && npm run dev; exec bash'" &
        sleep 2
        API_PID=$(pgrep -f "dotnet run --launch-profile http" | head -n 1 || echo "")
        UI_PID=$(pgrep -f "next-dev" | head -n 1 || pgrep -f "next dev" | head -n 1 || echo "")
    else
        # Fallback to running in background with output to logs if no terminal emulator is found
        echo "No graphical terminal emulator found. Running in background and redirecting logs..."
        cd api && dotnet run --launch-profile http > ../.api.log 2>&1 &
        API_PID=$!
        cd ../ui && npm run dev > ../.ui.log 2>&1 &
        UI_PID=$!
        cd ..
        echo "Logs are being redirected to .api.log and .ui.log"
    fi
fi

# 6. Save PIDs
if [ -n "$API_PID" ] || [ -n "$UI_PID" ]; then
    cat <<EOF > .dev-pids.json
{
  "apiPid": ${API_PID:-null},
  "uiPid": ${UI_PID:-null}
}
EOF
fi

echo "========================================="
echo "  RaceKrewe is running!"
echo "  - UI:  http://localhost:3000"
echo "  - API: http://localhost:5236"
echo "  - Docs: http://localhost:5236/openapi/v1.json"
echo "========================================="
echo "  To stop the servers, run: ./stop-dev.sh"
echo "========================================="
