from app import create_app, socketio

# Create the Flask app instance for gunicorn
app = create_app()

# Gunicorn will handle the server, so we don't call socketio.run() here
# The app and socketio instances are available for gunicorn to use

if __name__ == '__main__':
    # This won't be called when using gunicorn, but useful for testing
    print("WSGI entry point - use gunicorn to run in production")
    print("Example: gunicorn -k eventlet -w 1 -b 0.0.0.0:12005 wsgi:app") 