from app import create_app, socketio
import os

app = create_app()

if __name__ == '__main__':
    print("Starting Wisteria Web API...")
    print("API will be available at: http://localhost:12005")
    print("WebSocket support enabled for real-time updates")
    port = int(os.getenv('BACKEND_PORT', 12005))
    socketio.run(app, host='0.0.0.0', port=port, debug=True, allow_unsafe_werkzeug=True) 