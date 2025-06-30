#!/bin/bash

# Wisteria Web - Production Startup Script
# This script starts the services in production mode without requiring systemd

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Wisteria Web Application (Production Mode)..."
echo "======================================================="
echo "Working directory: $(pwd)"

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down production services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
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

# Generate a secure secret key if not set
if [ ! -f "backend/production.env" ]; then
    echo "❌ Error: production.env file not found in backend directory"
    echo "Please customize backend/production.env with your settings"
    exit 1
fi

# Start backend with gunicorn
echo "🔧 Starting Flask backend with gunicorn..."
(
    cd "$SCRIPT_DIR/backend"
    source venv/bin/activate
    # source production.env
    
    # Generate secure secret key if still default
    if [ "$SECRET_KEY" = "change-this-to-a-secure-random-key-in-production" ]; then
        echo "⚠️  Warning: Using default SECRET_KEY. Please update production.env with a secure key."
        export SECRET_KEY="$(openssl rand -hex 32 2>/dev/null || python -c 'import secrets; print(secrets.token_hex(32))')"
    fi
    
    echo "Backend starting from: $(pwd)"
    echo "Python path: $(which python)"
    echo "Gunicorn path: $(which gunicorn)"
    
    # Start gunicorn with eventlet worker for WebSocket support
    gunicorn -k eventlet -w 1 -b 0.0.0.0:12005 wsgi:app --access-logfile - --error-logfile -
) &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Error: Backend failed to start"
    exit 1
fi

echo "✅ Backend started successfully (PID: $BACKEND_PID)"

# Build frontend if build directory doesn't exist
if [ ! -d "frontend/build" ]; then
    echo "🏗️  Building React frontend..."
    (
        cd "$SCRIPT_DIR/frontend"
        npm ci
        npm run build
    )
fi

# Start frontend with serve (production static server)
echo "🎨 Starting React frontend with serve..."
(
    cd "$SCRIPT_DIR/frontend"
    
    # Install serve if not available
    if ! command -v npx serve >/dev/null 2>&1; then
        npm install -g serve 2>/dev/null || npm install serve
    fi
    
    echo "Frontend starting from: $(pwd)"
    # Serve the built React app
    npx serve -s build -l 12001 | cat
) &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Error: Frontend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend started successfully (PID: $FRONTEND_PID)"

echo "======================================================="
echo "✅ Production services started successfully!"
echo "🌐 Backend API: http://localhost:12005"
echo "🎯 Frontend UI: http://localhost:12001"
echo "📖 API Health: http://localhost:12005/api/health"
echo ""
echo "🔧 Running in PRODUCTION mode with:"
echo "   - Gunicorn WSGI server (with eventlet for WebSocket support)"
echo "   - Built React static files"
echo "   - Production environment variables"
echo ""
echo "Press Ctrl+C to stop all services"
echo "======================================================="

# Wait for background processes
wait 