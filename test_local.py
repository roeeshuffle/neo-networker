#!/usr/bin/env python3
"""
Local Testing Script for Neo-Networker
Tests all critical functionality before deployment
"""

import os
import sys
import subprocess
import json
from datetime import datetime

def print_status(message, status="INFO"):
    """Print colored status messages"""
    colors = {
        "INFO": "\033[94m",      # Blue
        "SUCCESS": "\033[92m",   # Green
        "WARNING": "\033[93m",   # Yellow
        "ERROR": "\033[91m",     # Red
        "CRITICAL": "\033[95m"   # Magenta
    }
    reset = "\033[0m"
    print(f"{colors.get(status, '')}{status}: {message}{reset}")

def run_command(command, description):
    """Run a command and return success status"""
    print_status(f"Running: {description}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print_status(f"✅ {description} - SUCCESS", "SUCCESS")
            return True
        else:
            print_status(f"❌ {description} - FAILED", "ERROR")
            print_status(f"Error: {result.stderr}", "ERROR")
            return False
    except Exception as e:
        print_status(f"❌ {description} - EXCEPTION: {e}", "ERROR")
        return False

def test_backend_imports():
    """Test backend imports and basic functionality"""
    print_status("🔍 Testing Backend Imports and Database Operations", "INFO")
    
    # Set up environment
    os.environ['TESTING'] = 'true'
    os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
    os.environ['JWT_SECRET_KEY'] = 'test-secret-key'
    
    # Store original directory
    original_dir = os.getcwd()
    
    try:
        # Change to backend directory
        os.chdir('backend')
        
        # Test imports
        from dal.database import db
        from dal.models import User, Task, Event, Person
        from api.app import app
        from werkzeug.security import generate_password_hash
        print_status("✅ All backend imports successful", "SUCCESS")
        
        # Test database operations
        with app.app_context():
            # Create all tables
            db.create_all()
            print_status("✅ Database tables created successfully", "SUCCESS")
            
            # Test User creation
            user = User(
                full_name='Test User',
                email='test@example.com',
                password_hash=generate_password_hash('password123')
            )
            db.session.add(user)
            db.session.commit()
            print_status("✅ User created successfully", "SUCCESS")
            
            # Test User query
            found_user = User.query.filter_by(email='test@example.com').first()
            if found_user:
                print_status("✅ User query successful", "SUCCESS")
            else:
                print_status("❌ User query failed", "ERROR")
                return False
                
            # Test Task creation
            task = Task(
                title='Test Task',
                description='Test Description',
                status='todo',
                owner_id=user.id
            )
            db.session.add(task)
            db.session.commit()
            print_status("✅ Task created successfully", "SUCCESS")
            
            # Test Event creation
            event = Event(
                title='Test Event',
                start_datetime=datetime.now(),
                user_id=user.id
            )
            db.session.add(event)
            db.session.commit()
            print_status("✅ Event created successfully", "SUCCESS")
            
        return True
        
    except Exception as e:
        print_status(f"❌ Backend test failed: {e}", "ERROR")
        import traceback
        traceback.print_exc()
        return False
    finally:
        os.chdir(original_dir)

def test_api_endpoints():
    """Test critical API endpoints"""
    print_status("🔍 Testing API Endpoints", "INFO")
    
    # Store original directory
    original_dir = os.getcwd()
    
    try:
        os.chdir('backend')
        
        from api.app import app
        from dal.database import db
        from dal.models import User
        from werkzeug.security import generate_password_hash
        
        with app.app_context():
            # Create test database
            db.create_all()
            
            # Create test user
            user = User(
                full_name='Test User',
                email='test@example.com',
                password_hash=generate_password_hash('password123'),
                is_approved=True  # Approve user for testing
            )
            db.session.add(user)
            db.session.commit()
            
            # Test client
            client = app.test_client()
            
            # Test health endpoint
            response = client.get('/api/health')
            if response.status_code == 200:
                print_status("✅ Health endpoint working", "SUCCESS")
            else:
                print_status(f"❌ Health endpoint failed: {response.status_code}", "ERROR")
                return False
            
            # Test login endpoint
            login_data = {
                'email': 'test@example.com',
                'password': 'password123'
            }
            response = client.post('/api/auth/login', json=login_data)
            if response.status_code == 200:
                data = response.get_json()
                if 'token' in data:
                    print_status("✅ Login endpoint working", "SUCCESS")
                else:
                    print_status("❌ Login endpoint missing token", "ERROR")
                    return False
            else:
                print_status(f"❌ Login endpoint failed: {response.status_code}", "ERROR")
                return False
            
            return True
            
    except Exception as e:
        print_status(f"❌ API test failed: {e}", "ERROR")
        return False
    finally:
        os.chdir(original_dir)

def test_frontend_build():
    """Test frontend build process"""
    print_status("🔍 Testing Frontend Build", "INFO")
    
    # Test npm build
    if not run_command("cd frontend && npm run build", "Frontend build"):
        return False
    
    # Check if dist directory exists
    if os.path.exists('frontend/dist'):
        print_status("✅ Frontend build successful", "SUCCESS")
        return True
    else:
        print_status("❌ Frontend dist directory not found", "ERROR")
        return False

def test_database_schema_compatibility():
    """Test database schema compatibility"""
    print_status("🔍 Testing Database Schema Compatibility", "INFO")
    
    # Store original directory
    original_dir = os.getcwd()
    
    try:
        os.chdir('backend')
        
        from dal.database import db
        from dal.models import User
        from api.app import app
        
        with app.app_context():
            # Create tables
            db.create_all()
            
            # Test User model without user_preferences (current state)
            user = User(
                full_name='Test User',
                email='test@example.com',
                password_hash='test_hash'
            )
            db.session.add(user)
            db.session.commit()
            
            # Test to_dict method
            user_dict = user.to_dict()
            if 'user_preferences' not in user_dict:
                print_status("✅ User model handles missing user_preferences gracefully", "SUCCESS")
            else:
                print_status("⚠️ User model still references user_preferences", "WARNING")
            
            return True
            
    except Exception as e:
        print_status(f"❌ Database schema test failed: {e}", "ERROR")
        return False
    finally:
        os.chdir(original_dir)

def main():
    """Run all tests"""
    print_status("🚀 Starting Local Testing Suite", "INFO")
    print_status(f"Timestamp: {datetime.now()}", "INFO")
    print("=" * 60)
    
    tests = [
        ("Backend Imports & Database Operations", test_backend_imports),
        ("API Endpoints", test_api_endpoints),
        ("Frontend Build", test_frontend_build),
        ("Database Schema Compatibility", test_database_schema_compatibility)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print_status(f"Running: {test_name}", "INFO")
        print("-" * 40)
        
        success = test_func()
        results.append((test_name, success))
        
        if success:
            print_status(f"✅ {test_name} - PASSED", "SUCCESS")
        else:
            print_status(f"❌ {test_name} - FAILED", "ERROR")
        
        print("-" * 40)
        print()
    
    # Summary
    print("=" * 60)
    print_status("📊 TEST SUMMARY", "INFO")
    print("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print_status(f"{status} - {test_name}", "SUCCESS" if success else "ERROR")
    
    print("-" * 60)
    print_status(f"Results: {passed}/{total} tests passed", "SUCCESS" if passed == total else "WARNING")
    
    if passed == total:
        print_status("🎉 ALL TESTS PASSED - Ready for deployment!", "SUCCESS")
        return 0
    else:
        print_status("⚠️ Some tests failed - Fix issues before deploying", "WARNING")
        return 1

if __name__ == "__main__":
    sys.exit(main())
