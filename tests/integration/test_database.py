#!/usr/bin/env python3
"""
Database connectivity and setup tests for the Neo Networker backend.
Tests database connection, schema creation, and data operations.
"""

import unittest
import os
import sys
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_database_connection():
    """Test database connection"""
    print("🔌 Testing database connection...")
    
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/neo_networker')
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Test basic query
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        
        print(f"✅ Database connected successfully!")
        print(f"   PostgreSQL version: {version[0]}")
        
        # Test table existence
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        table_names = [table[0] for table in tables]
        
        expected_tables = ['profiles', 'people', 'companies', 'tasks', 'shared_data', 'telegram_users']
        
        print(f"📊 Found {len(tables)} tables:")
        for table in table_names:
            status = "✅" if table in expected_tables else "❓"
            print(f"   {status} {table}")
        
        # Check if all expected tables exist
        missing_tables = set(expected_tables) - set(table_names)
        if missing_tables:
            print(f"❌ Missing tables: {missing_tables}")
            return False
        else:
            print("✅ All expected tables exist!")
        
        # Test data in tables
        cursor.execute("SELECT COUNT(*) FROM profiles;")
        user_count = cursor.fetchone()[0]
        print(f"👥 Users in database: {user_count}")
        
        cursor.execute("SELECT COUNT(*) FROM people;")
        people_count = cursor.fetchone()[0]
        print(f"👤 People in database: {people_count}")
        
        cursor.execute("SELECT COUNT(*) FROM companies;")
        companies_count = cursor.fetchone()[0]
        print(f"🏢 Companies in database: {companies_count}")
        
        cursor.execute("SELECT COUNT(*) FROM tasks;")
        tasks_count = cursor.fetchone()[0]
        print(f"📋 Tasks in database: {tasks_count}")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_docker_containers():
    """Test if Docker containers are running"""
    print("🐳 Testing Docker containers...")
    
    try:
        import subprocess
        
        # Check if docker-compose is running
        result = subprocess.run(['docker-compose', 'ps'], 
                              capture_output=True, text=True, cwd=os.path.dirname(__file__))
        
        if result.returncode == 0:
            print("✅ Docker Compose is running")
            print("📊 Container status:")
            print(result.stdout)
            return True
        else:
            print("❌ Docker Compose not running")
            print("💡 Run: docker-compose up -d")
            return False
            
    except Exception as e:
        print(f"❌ Docker test failed: {e}")
        return False

def test_environment_variables():
    """Test environment variables"""
    print("🔧 Testing environment variables...")
    
    required_vars = ['DATABASE_URL']
    optional_vars = ['SECRET_KEY', 'JWT_SECRET_KEY', 'TELEGRAM_BOT_TOKEN', 'OPENAI_API_KEY']
    
    missing_required = []
    missing_optional = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
    
    for var in optional_vars:
        if not os.getenv(var):
            missing_optional.append(var)
    
    if missing_required:
        print(f"❌ Missing required environment variables: {missing_required}")
        return False
    
    if missing_optional:
        print(f"⚠️  Missing optional environment variables: {missing_optional}")
    
    print("✅ Environment variables configured correctly")
    return True

def run_database_tests():
    """Run all database tests"""
    print("🧪 Running Database Tests")
    print("=" * 50)
    
    tests = [
        ("Environment Variables", test_environment_variables),
        ("Docker Containers", test_docker_containers),
        ("Database Connection", test_database_connection)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🔍 {test_name}...")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📋 DATABASE TEST RESULTS")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All database tests passed!")
        return True
    else:
        print("⚠️  Some database tests failed.")
        return False

if __name__ == '__main__':
    success = run_database_tests()
    sys.exit(0 if success else 1)
