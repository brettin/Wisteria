#!/bin/bash

# Get the absolute path of the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Wisteria Web Application..."
echo "======================================"
echo "Working directory: $(pwd)"

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down services..."
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

# Start backend
echo "🔧 Starting Flask backend..."
echo "Backend directory: $(pwd)/backend"

# Check if virtual environment exists
if [ ! -f "backend/venv/bin/activate" ]; then
    echo "❌ Error: Virtual environment not found at backend/venv/bin/activate"
    echo "Please run: cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Start backend in background with proper environment
(
    cd "$SCRIPT_DIR/backend"
    source venv/bin/activate
    echo "Backend starting from: $(pwd)"
    echo "Python path: $(which python)"
    echo "Python version: $(python --version)"
    echo "Checking run.py content:"
    tail -2 run.py
    python run.py
) &
BACKEND_PID=$!

# Wait a moment for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ Error: Backend failed to start"
    exit 1
fi

echo "✅ Backend started successfully (PID: $BACKEND_PID)"

# Start frontend
echo "🎨 Starting React frontend..."
echo "Frontend directory: $(pwd)/frontend"

# Check if package.json exists
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: package.json not found in frontend directory"
    exit 1
fi

# Start frontend in background with proper environment
(
    cd "$SCRIPT_DIR/frontend"
    echo "Frontend starting from: $(pwd)"
    CI=true PORT=12001 npm start | cat
) &
FRONTEND_PID=$!

# Wait a moment for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "❌ Error: Frontend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend started successfully (PID: $FRONTEND_PID)"

echo "======================================"
echo "✅ Services started successfully!"
echo "🌐 Backend API: http://localhost:12005"
echo "🎯 Frontend UI: http://localhost:12001"
echo "📖 API Documentation: http://localhost:12005/api/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo "======================================"

# Wait for background processes
wait 