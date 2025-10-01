#!/usr/bin/env python3
"""
Legacy app.py file for backward compatibility.
This redirects to the new backend/main.py structure.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

# Import and run the Flask app from the new structure
from api.app import app

# Add a simple health check route
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'message': 'Neo Networker API is running'}, 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    print(f"🚀 Starting Neo Networker on port {port}")
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"🐍 Python path: {sys.path}")
    app.run(debug=True, host='0.0.0.0', port=port)
