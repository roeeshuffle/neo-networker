#!/usr/bin/env python3
"""
Debug JWT token to see what's in it
"""

import jwt
import requests

# Test JWT token from the logs
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1ODM5MjI0NCwianRpIjoiZTM5N2ZiY2QtYTEyMC00MDcxLTg4ZTctZTJiNTIxMzA0YWJjIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjQ5ZTc0Yzg4LWQ1YTItNDUyNy04ZDJlLTA5YTljMWM3YmMwOCIsIm5iZiI6MTc1ODM5MjI0NCwiZXhwIjoxNzU4NDc4NjQ0fQ.1BZpzrBgWqbYb8yHlPHTwzV7WBKqd6SPouVh80dtHU0"

# Decode without verification to see the payload
try:
    decoded = jwt.decode(token, options={"verify_signature": False})
    print("JWT Payload:")
    print(decoded)
    print(f"Subject (user_id): {decoded.get('sub')}")
except Exception as e:
    print(f"Error decoding JWT: {e}")

# Test if the user exists in the database
import os
import sys
sys.path.append('/Users/roeefeingold/neo-networker/backend')

from database import db
from models import User
from app import app

with app.app_context():
    user_id = "49e74c88-d5a2-4527-8d2e-09a9c1c7bc08"
    user = User.query.get(user_id)
    if user:
        print(f"\nUser found in database:")
        print(f"  ID: {user.id}")
        print(f"  Email: {user.email}")
        print(f"  Approved: {user.is_approved}")
        print(f"  Telegram ID: {user.telegram_id}")
    else:
        print(f"\nUser not found in database with ID: {user_id}")
