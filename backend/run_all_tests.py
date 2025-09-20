#!/usr/bin/env python3
"""
Comprehensive test runner for the Neo Networker backend.
Runs all tests including database, API, and integration tests.
"""

import os
import sys
import subprocess
import time
from datetime import datetime

def print_header(title):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"🚀 {title}")
    print("=" * 60)

def print_section(title):
    """Print a formatted section header"""
    print(f"\n📋 {title}")
    print("-" * 40)

def run_command(command, description):
    """Run a command and return success status"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} completed successfully")
            if result.stdout:
                print(f"   Output: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ {description} failed")
            if result.stderr:
                print(f"   Error: {result.stderr.strip()}")
            return False
    except Exception as e:
        print(f"❌ {description} failed with exception: {e}")
        return False

def check_docker_running():
    """Check if Docker is running"""
    print_section("Checking Docker Status")
    
    try:
        result = subprocess.run(['docker', 'ps'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ Docker is running")
            return True
        else:
            print("❌ Docker is not running")
            print("💡 Please start Docker Desktop")
            return False
    except FileNotFoundError:
        print("❌ Docker not found")
        print("💡 Please install Docker Desktop")
        return False

def start_database():
    """Start the database using Docker Compose"""
    print_section("Starting Database")
    
    # Check if containers are already running
    result = subprocess.run(['docker-compose', 'ps', '-q'], capture_output=True, text=True)
    if result.stdout.strip():
        print("✅ Database containers already running")
        return True
    
    # Start containers
    success = run_command('docker-compose up -d', 'Starting database containers')
    
    if success:
        print("⏳ Waiting for database to be ready...")
        time.sleep(5)  # Wait for database to initialize
        
        # Test connection
        success = run_command('python3 test_database.py', 'Testing database connection')
    
    return success

def install_dependencies():
    """Install Python dependencies"""
    print_section("Installing Dependencies")
    
    # Install main dependencies
    success1 = run_command('pip install -r requirements.txt', 'Installing main dependencies')
    
    # Install test dependencies
    success2 = run_command('pip install -r requirements-test.txt', 'Installing test dependencies')
    
    return success1 and success2

def setup_database():
    """Set up the database schema"""
    print_section("Setting Up Database Schema")
    
    success = run_command('python3 setup_database.py', 'Creating database schema and admin users')
    return success

def run_api_tests():
    """Run API tests"""
    print_section("Running API Tests")
    
    success = run_command('python3 test_runner.py', 'Running comprehensive API tests')
    return success

def run_database_tests():
    """Run database tests"""
    print_section("Running Database Tests")
    
    success = run_command('python3 test_database.py', 'Running database connectivity tests')
    return success

def run_pytest():
    """Run pytest tests"""
    print_section("Running Pytest Tests")
    
    success = run_command('pytest test_app.py -v', 'Running pytest test suite')
    return success

def test_flask_app():
    """Test if Flask app can start"""
    print_section("Testing Flask Application")
    
    # Try to start the app in the background
    try:
        process = subprocess.Popen(['python3', 'app.py'], 
                                 stdout=subprocess.PIPE, 
                                 stderr=subprocess.PIPE)
        
        # Wait a moment for the app to start
        time.sleep(3)
        
        # Check if process is still running
        if process.poll() is None:
            print("✅ Flask app started successfully")
            
            # Test health endpoint
            import requests
            try:
                response = requests.get('http://localhost:5002/api/health', timeout=5)
                if response.status_code == 200:
                    print("✅ Health endpoint responding")
                    success = True
                else:
                    print(f"❌ Health endpoint returned status {response.status_code}")
                    success = False
            except Exception as e:
                print(f"❌ Health endpoint test failed: {e}")
                success = False
            
            # Kill the process
            process.terminate()
            process.wait()
            
            return success
        else:
            print("❌ Flask app failed to start")
            stdout, stderr = process.communicate()
            if stderr:
                print(f"   Error: {stderr.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ Flask app test failed: {e}")
        return False

def main():
    """Main test runner function"""
    start_time = datetime.now()
    
    print_header("Neo Networker Backend - Comprehensive Test Suite")
    print(f"🕐 Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test results
    results = {}
    
    # 1. Check Docker
    results['docker'] = check_docker_running()
    if not results['docker']:
        print("\n❌ Docker is required but not running. Please start Docker Desktop and try again.")
        return False
    
    # 2. Install dependencies
    results['dependencies'] = install_dependencies()
    if not results['dependencies']:
        print("\n❌ Failed to install dependencies. Please check your Python environment.")
        return False
    
    # 3. Start database
    results['database_start'] = start_database()
    if not results['database_start']:
        print("\n❌ Failed to start database. Please check Docker and try again.")
        return False
    
    # 4. Setup database schema
    results['database_setup'] = setup_database()
    if not results['database_setup']:
        print("\n❌ Failed to setup database schema.")
        return False
    
    # 5. Run database tests
    results['database_tests'] = run_database_tests()
    
    # 6. Test Flask app
    results['flask_app'] = test_flask_app()
    
    # 7. Run API tests
    results['api_tests'] = run_api_tests()
    
    # 8. Run pytest
    results['pytest'] = run_pytest()
    
    # Print final results
    end_time = datetime.now()
    duration = end_time - start_time
    
    print_header("Test Results Summary")
    
    total_tests = len(results)
    passed_tests = sum(1 for result in results.values() if result)
    
    print(f"📊 Total test suites: {total_tests}")
    print(f"✅ Passed: {passed_tests}")
    print(f"❌ Failed: {total_tests - passed_tests}")
    print(f"⏱️  Duration: {duration.total_seconds():.2f} seconds")
    
    print("\n📋 Detailed Results:")
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name.replace('_', ' ').title()}")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Backend is fully functional and ready for use.")
        print("\n🚀 You can now:")
        print("   1. Start the Flask app: python3 app.py")
        print("   2. Test the API at: http://localhost:5001")
        print("   3. Use the frontend with the new backend")
        return True
    else:
        print(f"\n⚠️  {total_tests - passed_tests} test suite(s) failed.")
        print("❌ Please fix the issues before using the backend.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
