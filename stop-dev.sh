#!/usr/bin/env bash

# stop-dev.sh
# Stops the backend API and frontend Next.js server by reading PIDs from .dev-pids.json

echo "========================================="
echo "        RACEKREWE DEVELOPMENT STOP        "
echo "========================================="

PID_FILE=".dev-pids.json"

if [ -f "$PID_FILE" ]; then
    # Parse PIDs using grep/sed to avoid external tool dependencies like jq
    API_PID=$(grep -o '"apiPid":\s*[0-9]*' "$PID_FILE" | grep -o '[0-9]*' || echo "")
    UI_PID=$(grep -o '"uiPid":\s*[0-9]*' "$PID_FILE" | grep -o '[0-9]*' || echo "")

    if [ -n "$API_PID" ]; then
        echo "Stopping Backend API (PID: $API_PID)..."
        kill "$API_PID" 2>/dev/null || true
        echo "Backend API stopped."
    fi

    if [ -n "$UI_PID" ]; then
        echo "Stopping Frontend UI (PID: $UI_PID)..."
        kill "$UI_PID" 2>/dev/null || true
        echo "Frontend UI stopped."
    fi

    rm -f "$PID_FILE"
    echo "Dev processes stopped successfully."
else
    echo "No active dev processes tracked in .dev-pids.json."
    echo "Check if they are already stopped or close terminal windows manually."
fi

echo "========================================="
