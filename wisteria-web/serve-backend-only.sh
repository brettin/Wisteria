#!/bin/bash

# Wisteria Web - Backend Only Production Server
# This script serves only the Flask backend using gunicorn
# Useful when you want to run frontend and backend separately

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔧 Starting Wisteria Web Backend (Production Mode)..."
echo "===================================================="
echo "Working directory: $(pwd)"

# Function to cleanup
cleanup() {
    echo "🛑 Shutting down backend server..."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if virtual environment exists
if [ ! -f "backend/venv/bin/activate" ]; then
    echo "❌ Error: Virtual environment not found at backend/venv/bin/activate"
    echo "Please run: cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Install gunicorn and eventlet if not already installed
echo "🔧 Checking production dependencies..."
(
    cd "$SCRIPT_DIR/backend"
    source venv/bin/activate
    pip show gunicorn >/dev/null 2>&1 || pip install gunicorn
    pip show eventlet >/dev/null 2>&1 || pip install eventlet
)

# Check for production environment file
if [ ! -f "backend/production.env" ]; then
    echo "❌ Error: production.env file not found in backend directory"
    echo "Please customize backend/production.env with your settings"
    exit 1
fi

# Start backend with gunicorn
echo "🚀 Starting Flask backend with gunicorn..."
cd "$SCRIPT_DIR/backend"
source venv/bin/activate
source production.env

# Generate secure secret key if still default
if [ "$SECRET_KEY" = "change-this-to-a-secure-random-key-in-production" ]; then
    echo "⚠️  Warning: Using default SECRET_KEY. Please update production.env with a secure key."
    export SECRET_KEY="$(openssl rand -hex 32 2>/dev/null || python -c 'import secrets; print(secrets.token_hex(32))')"
fi

echo "Backend starting from: $(pwd)"
echo "Python path: $(which python)"
echo "Gunicorn path: $(which gunicorn)"
echo ""
echo "Backend API will be available at: http://localhost:12005"
echo "API Health check: http://localhost:12005/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "===================================================="

# Start gunicorn with eventlet worker for WebSocket support
exec gunicorn -k eventlet -w 1 -b 0.0.0.0:12005 wsgi:app --access-logfile - --error-logfile - 