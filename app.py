#!/usr/bin/env python3
"""
Main entry point for the Neo Networker backend application.
This file serves as the App Runner entry point and redirects to the actual backend.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

# Import and run the Flask app
from api.app import app

if __name__ == '__main__':
          print("🚀 APP VERSION: 18.1 - FIXED PERSON MODEL")
    print("🔍 Starting Flask app with dynamic contact management system")
    port = int(os.environ.get('PORT', 5002))
    app.run(debug=True, host='0.0.0.0', port=port)
