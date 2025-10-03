#!/usr/bin/env python3
"""
App Runner entry point for the Neo Networker backend application.
This file exists to maintain compatibility with the existing App Runner configuration
which expects 'python app.py' as the start command.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the Flask app
from api.app import app

if __name__ == '__main__':
    print("🚀 APP VERSION: 15.8 - FIX DATABASE COLUMN MISSING ERROR")
    print("🔍 Starting Flask app with temporary user_preferences fix")
    port = int(os.environ.get('PORT', 8080))
    app.run(debug=False, host='0.0.0.0', port=port)
