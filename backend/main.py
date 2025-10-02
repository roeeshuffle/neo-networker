#!/usr/bin/env python3
"""
Main entry point for the Neo Networker backend application.
This is the new entry point after restructuring.
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import and run the Flask app
from api.app import app

if __name__ == '__main__':
    print("🚀 APP VERSION: 14.0 - DEBUG TELEGRAM FUNCTION PARSING")
    print("🔍 Starting Flask app with enhanced Telegram debugging")
    port = int(os.environ.get('PORT', 5002))
    app.run(debug=True, host='0.0.0.0', port=port)
