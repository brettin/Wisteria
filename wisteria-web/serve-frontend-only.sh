#!/bin/bash

# Wisteria Web - Frontend Only Production Server
# This script serves only the React frontend using 'serve' package
# Useful when you want to run frontend and backend separately

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🎨 Starting Wisteria Web Frontend (Production Mode)..."
echo "===================================================="
echo "Working directory: $(pwd)"

# Function to cleanup
cleanup() {
    echo "🛑 Shutting down frontend server..."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    exit 1
fi

cd frontend

# Build frontend if build directory doesn't exist
if [ ! -d "build" ]; then
    echo "🏗️  Building React frontend..."
    npm ci
    npm run build
fi

# Check if build was successful
if [ ! -d "build" ]; then
    echo "❌ Error: Frontend build failed"
    exit 1
fi

# Install serve globally or locally if not available
if ! command -v serve >/dev/null 2>&1; then
    echo "📦 Installing 'serve' package..."
    npm install serve --save-dev
fi

echo "🚀 Starting production frontend server..."
echo "Frontend will be available at: http://localhost:12001"
echo "Backend should be running at: http://localhost:12005"
echo ""
echo "Press Ctrl+C to stop the server"
echo "===================================================="

# Start the production server
# Using serve with:
# -s: Single-page app mode (serves index.html for all routes)
# -l: Listen on port 12001
# --cors: Enable CORS for API calls
npx serve -s build -l 12001 --cors 