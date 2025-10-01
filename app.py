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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(debug=True, host='0.0.0.0', port=port)
