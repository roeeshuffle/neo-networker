#!/usr/bin/env python3
"""
Comprehensive API Endpoint Test Script
Tests all endpoints with mock data and proper authentication
"""

import requests
import json
import sys
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5002/api"
TEST_EMAIL = "roee2912@gmail.com"
TEST_PASSWORD = "password123"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user_id = None
        self.test_person_id = None
        self.test_company_id = None
        self.test_task_id = None
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")
        
    def test_endpoint(self, method, endpoint, data=None, expected_status=200, description=""):
        """Test a single endpoint"""
        url = f"{BASE_URL}{endpoint}"
        headers = {}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        if data:
            headers['Content-Type'] = 'application/json'
            
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, headers=headers, json=data)
            elif method == 'PUT':
                response = self.session.put(url, headers=headers, json=data)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                self.log(f"Unknown method: {method}", "ERROR")
                return False
                
            status_ok = response.status_code == expected_status
            status_icon = "✅" if status_ok else "❌"
            
            self.log(f"{status_icon} {method} {endpoint} - Status: {response.status_code} (Expected: {expected_status}) - {description}")
            
            if not status_ok:
                try:
                    error_data = response.json()
                    self.log(f"   Error: {error_data}", "ERROR")
                except:
                    self.log(f"   Error: {response.text}", "ERROR")
                    
            return status_ok
            
        except Exception as e:
            self.log(f"❌ {method} {endpoint} - Exception: {e}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all endpoint tests"""
        self.log("🚀 Starting Comprehensive API Endpoint Tests")
        self.log("=" * 60)
        
        # Test 1: Health Check
        self.log("\n📋 Test 1: Health Check")
        self.test_endpoint('GET', '/health', expected_status=200, description="Backend health check")
        
        # Test 2: Authentication
        self.log("\n📋 Test 2: Authentication")
        if not self.test_authentication():
            self.log("❌ Authentication failed - stopping tests", "ERROR")
            return False
            
        # Test 3: User Management
        self.log("\n📋 Test 3: User Management")
        self.test_user_endpoints()
        
        # Test 4: People Management
        self.log("\n📋 Test 4: People Management")
        self.test_people_endpoints()
        
        # Test 5: Company Management
        self.log("\n📋 Test 5: Company Management")
        self.test_company_endpoints()
        
        # Test 6: Task Management
        self.log("\n📋 Test 6: Task Management")
        self.test_task_endpoints()
        
        # Test 7: CSV Processing
        self.log("\n📋 Test 7: CSV Processing")
        self.test_csv_endpoints()
        
        self.log("\n🎉 All tests completed!")
        
    def test_authentication(self):
        """Test authentication endpoints"""
        # Test login
        login_data = {"email": TEST_EMAIL}
        response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access_token')
            self.user_id = data.get('user', {}).get('id')
            self.log(f"✅ Login successful - User ID: {self.user_id}")
            return True
        else:
            self.log(f"❌ Login failed - Status: {response.status_code}", "ERROR")
            return False
    
    def test_user_endpoints(self):
        """Test user-related endpoints"""
        # Get current user
        self.test_endpoint('GET', '/auth/me', expected_status=200, description="Get current user info")
        
    def test_people_endpoints(self):
        """Test people management endpoints"""
        # Get all people
        self.test_endpoint('GET', '/people', expected_status=200, description="Get all people")
        
        # Create a test person
        person_data = {
            "full_name": "Test Person API",
            "company": "Test Company API",
            "email": "test@api.com",
            "agenda": "Test agenda from API",
            "status": "Active"
        }
        
        if self.test_endpoint('POST', '/people', data=person_data, expected_status=201, description="Create test person"):
            # If creation was successful, try to get the person ID from the response
            # We'll need to make another request to get the person ID
            response = self.session.get(f"{BASE_URL}/people", headers={'Authorization': f'Bearer {self.token}'})
            if response.status_code == 200:
                people = response.json()
                test_person = next((p for p in people if p['full_name'] == 'Test Person API'), None)
                if test_person:
                    self.test_person_id = test_person['id']
                    self.log(f"✅ Found test person ID: {self.test_person_id}")
        
        # Update the test person
        if self.test_person_id:
            update_data = {
                "agenda": "Updated agenda from API test",
                "status": "Updated"
            }
            self.test_endpoint('PUT', f'/people/{self.test_person_id}', data=update_data, expected_status=200, description="Update test person")
        
        # Delete the test person
        if self.test_person_id:
            self.test_endpoint('DELETE', f'/people/{self.test_person_id}', expected_status=200, description="Delete test person")
            
    def test_company_endpoints(self):
        """Test company management endpoints"""
        # Get all companies
        self.test_endpoint('GET', '/companies', expected_status=200, description="Get all companies")
        
        # Create a test company
        company_data = {
            "record": "Test Company API",
            "website": "https://testapi.com",
            "industry": "Technology",
            "description": "Test company from API"
        }
        
        if self.test_endpoint('POST', '/companies', data=company_data, expected_status=201, description="Create test company"):
            # Get the company ID
            response = self.session.get(f"{BASE_URL}/companies", headers={'Authorization': f'Bearer {self.token}'})
            if response.status_code == 200:
                companies = response.json()
                test_company = next((c for c in companies if c['record'] == 'Test Company API'), None)
                if test_company:
                    self.test_company_id = test_company['id']
                    self.log(f"✅ Found test company ID: {self.test_company_id}")
        
        # Update the test company
        if self.test_company_id:
            update_data = {
                "description": "Updated description from API test"
            }
            self.test_endpoint('PUT', f'/companies/{self.test_company_id}', data=update_data, expected_status=200, description="Update test company")
        
        # Delete the test company
        if self.test_company_id:
            self.test_endpoint('DELETE', f'/companies/{self.test_company_id}', expected_status=200, description="Delete test company")
            
    def test_task_endpoints(self):
        """Test task management endpoints"""
        # Get all tasks
        self.test_endpoint('GET', '/tasks', expected_status=200, description="Get all tasks")
        
        # Create a test task
        task_data = {
            "text": "Test task from API",
            "priority": "high",
            "status": "todo",
            "label": "test",
            "notes": "Test notes from API",
            "due_date": (datetime.now() + timedelta(days=1)).isoformat()
        }
        
        if self.test_endpoint('POST', '/tasks', data=task_data, expected_status=201, description="Create test task"):
            # Get the task ID
            response = self.session.get(f"{BASE_URL}/tasks", headers={'Authorization': f'Bearer {self.token}'})
            if response.status_code == 200:
                tasks = response.json()
                test_task = next((t for t in tasks if t['text'] == 'Test task from API'), None)
                if test_task:
                    self.test_task_id = test_task['id']
                    self.log(f"✅ Found test task ID: {self.test_task_id}")
        
        # Update the test task
        if self.test_task_id:
            update_data = {
                "status": "in_progress",
                "notes": "Updated notes from API test"
            }
            self.test_endpoint('PUT', f'/tasks/{self.test_task_id}', data=update_data, expected_status=200, description="Update test task")
        
        # Delete the test task
        if self.test_task_id:
            self.test_endpoint('DELETE', f'/tasks/{self.test_task_id}', expected_status=200, description="Delete test task")
            
    def test_csv_endpoints(self):
        """Test CSV processing endpoints"""
        # Test people CSV processing
        csv_data = """Full Name,Company,Email,Status
Test CSV Person,Test CSV Company,testcsv@example.com,Active
Another CSV Person,Another Company,another@example.com,Inactive"""
        
        csv_payload = {
            "csvData": csv_data,
            "customMapping": {}
        }
        
        self.test_endpoint('POST', '/csv-processor', data=csv_payload, expected_status=200, description="Process people CSV")
        
        # Test company CSV processing
        company_csv_data = """Record,Website,Industry
Test CSV Company,https://testcsv.com,Technology
Another CSV Company,https://another.com,Finance"""
        
        company_csv_payload = {
            "csvData": company_csv_data,
            "customMapping": {}
        }
        
        self.test_endpoint('POST', '/company-csv-processor', data=company_csv_payload, expected_status=200, description="Process company CSV")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
