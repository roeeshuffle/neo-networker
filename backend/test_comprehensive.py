#!/usr/bin/env python3
"""
Comprehensive test suite for Neo Networker
Tests all major functionality including auth, contacts, tasks, CSV, and Telegram
"""

import requests
import json
import time
import os
import sys
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:5002/api"
TIMEOUT = 10

class TestRunner:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.test_user = None
        self.test_people = []
        self.test_tasks = []
        self.test_companies = []
        self.results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def assert_test(self, condition, test_name, error_message=""):
        if condition:
            self.log(f"✅ {test_name}", "PASS")
            self.results['passed'] += 1
            return True
        else:
            self.log(f"❌ {test_name}: {error_message}", "FAIL")
            self.results['failed'] += 1
            self.results['errors'].append(f"{test_name}: {error_message}")
            return False

    def make_request(self, method, endpoint, data=None, headers=None, timeout=TIMEOUT):
        """Make HTTP request with error handling"""
        try:
            url = f"{self.base_url}{endpoint}"
            if headers is None:
                headers = {}
            
            if self.auth_token:
                headers['Authorization'] = f'Bearer {self.auth_token}'
            
            self.log(f"Making {method} request to {url}", "DEBUG")
            if data:
                self.log(f"Request data: {data}", "DEBUG")
                headers['Content-Type'] = 'application/json'
                response = requests.request(method, url, json=data, headers=headers, timeout=timeout)
            else:
                response = requests.request(method, url, headers=headers, timeout=timeout)
            
            self.log(f"Response status: {response.status_code}", "DEBUG")
            if response.status_code >= 400:
                self.log(f"Response error: {response.text}", "DEBUG")
            
            return response
        except requests.exceptions.Timeout:
            self.log(f"Request timeout for {method} {endpoint}", "ERROR")
            return None
        except requests.exceptions.RequestException as e:
            self.log(f"Request error for {method} {endpoint}: {e}", "ERROR")
            return None

    def test_health_check(self):
        """Test API health check"""
        self.log("Testing API health check...")
        response = self.make_request('GET', '/health')
        
        if response and response.status_code == 200:
            data = response.json()
            self.assert_test(
                data.get('status') == 'healthy',
                "Health Check",
                f"Expected 'healthy' status, got {data.get('status')}"
            )
        else:
            self.assert_test(False, "Health Check", "API not responding")

    def test_user_registration(self):
        """Test user registration"""
        self.log("Testing user registration...")
        
        # Generate unique email (use auto-approved email)
        timestamp = int(time.time())
        email = f"testuser{timestamp}@wershuffle.com"
        
        data = {
            'email': email,
            'password': 'testpassword123',
            'name': 'Test User'
        }
        
        response = self.make_request('POST', '/auth/register', data)
        
        if response and response.status_code == 201:
            response_data = response.json()
            user_data = response_data.get('user', {})
            self.test_user = user_data
            self.assert_test(
                user_data.get('email') == email,
                "User Registration",
                f"Expected email {email}, got {user_data.get('email')}"
            )
        else:
            self.assert_test(False, "User Registration", f"Registration failed: {response.text if response else 'No response'}")

    def test_user_login(self):
        """Test user login"""
        self.log("Testing user login...")
        
        if not self.test_user:
            self.log("Skipping login test - no test user", "WARN")
            return
        
        data = {
            'email': self.test_user['email'],
            'password': 'testpassword123'
        }
        
        response = self.make_request('POST', '/auth/login', data)
        
        if response and response.status_code == 200:
            login_data = response.json()
            self.auth_token = login_data.get('access_token')
            self.assert_test(
                self.auth_token is not None,
                "User Login",
                "No access token received"
            )
        else:
            self.assert_test(False, "User Login", f"Login failed: {response.text if response else 'No response'}")

    def test_contact_operations(self):
        """Test contact (person) CRUD operations"""
        self.log("Testing contact operations...")
        
        if not self.auth_token:
            self.log("Skipping contact tests - not authenticated", "WARN")
            return
        
        # Test create contact
        contact_data = {
            'full_name': 'John Doe',
            'email': 'john.doe@example.com',
            'company': 'Test Company',
            'status': 'Software Engineer',
            'categories': 'Technology, Programming',
            'linkedin_profile': 'https://linkedin.com/in/johndoe'
        }
        
        response = self.make_request('POST', '/people', contact_data)
        
        if response and response.status_code == 201:
            created_contact = response.json()
            self.test_people.append(created_contact)
            self.assert_test(
                created_contact.get('full_name') == 'John Doe',
                "Create Contact",
                f"Expected 'John Doe', got {created_contact.get('full_name')}"
            )
            
            # Test get contacts
            response = self.make_request('GET', '/people')
            if response and response.status_code == 200:
                contacts = response.json()
                self.assert_test(
                    len(contacts) > 0,
                    "Get Contacts",
                    f"Expected contacts, got {len(contacts)}"
                )
                
                # Test update contact
                contact_id = created_contact['id']
                update_data = {
                    'full_name': 'John Smith',
                    'email': 'john.smith@example.com'
                }
                
                response = self.make_request('PUT', f'/people/{contact_id}', update_data)
                if response and response.status_code == 200:
                    updated_contact = response.json()
                    self.assert_test(
                        updated_contact.get('full_name') == 'John Smith',
                        "Update Contact",
                        f"Expected 'John Smith', got {updated_contact.get('full_name')}"
                    )
                    
                    # Test delete contact
                    response = self.make_request('DELETE', f'/people/{contact_id}')
                    if response and response.status_code == 200:
                        self.assert_test(True, "Delete Contact", "")
                    else:
                        self.assert_test(False, "Delete Contact", f"Delete failed: {response.text if response else 'No response'}")
                else:
                    self.assert_test(False, "Update Contact", f"Update failed: {response.text if response else 'No response'}")
            else:
                self.assert_test(False, "Get Contacts", f"Get failed: {response.text if response else 'No response'}")
        else:
            self.assert_test(False, "Create Contact", f"Create failed: {response.text if response else 'No response'}")

    def test_task_operations(self):
        """Test task CRUD operations"""
        self.log("Testing task operations...")
        
        if not self.auth_token:
            self.log("Skipping task tests - not authenticated", "WARN")
            return
        
        # Test create task
        task_data = {
            'text': 'Test task for automation',
            'priority': 'high',
            'status': 'todo',
            'label': 'testing',
            'notes': 'This is a test task'
        }
        
        response = self.make_request('POST', '/tasks', task_data)
        
        if response and response.status_code == 201:
            created_task = response.json()
            self.test_tasks.append(created_task)
            self.assert_test(
                created_task.get('text') == 'Test task for automation',
                "Create Task",
                f"Expected 'Test task for automation', got {created_task.get('text')}"
            )
            
            # Test get tasks
            response = self.make_request('GET', '/tasks')
            if response and response.status_code == 200:
                tasks = response.json()
                self.assert_test(
                    len(tasks) > 0,
                    "Get Tasks",
                    f"Expected tasks, got {len(tasks)}"
                )
                
                # Test update task
                task_id = created_task['id']
                update_data = {
                    'text': 'Updated test task',
                    'status': 'in-progress'
                }
                
                response = self.make_request('PUT', f'/tasks/{task_id}', update_data)
                if response and response.status_code == 200:
                    updated_task = response.json()
                    self.assert_test(
                        updated_task.get('text') == 'Updated test task',
                        "Update Task",
                        f"Expected 'Updated test task', got {updated_task.get('text')}"
                    )
                    
                    # Test delete task
                    response = self.make_request('DELETE', f'/tasks/{task_id}')
                    if response and response.status_code == 200:
                        self.assert_test(True, "Delete Task", "")
                    else:
                        self.assert_test(False, "Delete Task", f"Delete failed: {response.text if response else 'No response'}")
                else:
                    self.assert_test(False, "Update Task", f"Update failed: {response.text if response else 'No response'}")
            else:
                self.assert_test(False, "Get Tasks", f"Get failed: {response.text if response else 'No response'}")
        else:
            self.assert_test(False, "Create Task", f"Create failed: {response.text if response else 'No response'}")

    def test_csv_upload(self):
        """Test CSV upload functionality"""
        self.log("Testing CSV upload...")
        
        if not self.auth_token:
            self.log("Skipping CSV tests - not authenticated", "WARN")
            return
        
        # Create test CSV data
        csv_data = "full_name,email,company,status\nJane Doe,jane.doe@example.com,Test Corp,Manager\nBob Smith,bob.smith@example.com,Another Corp,Developer"
        
        # Test CSV upload
        files = {'file': ('test_contacts.csv', csv_data, 'text/csv')}
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        
        try:
            response = requests.post(f"{self.base_url}/csv-processor", files=files, headers=headers, timeout=TIMEOUT)
            
            if response and response.status_code == 200:
                result = response.json()
                self.assert_test(
                    result.get('success') == True,
                    "CSV Upload",
                    f"Expected success=True, got {result.get('success')}"
                )
            else:
                self.assert_test(False, "CSV Upload", f"Upload failed: {response.text if response else 'No response'}")
        except Exception as e:
            self.assert_test(False, "CSV Upload", f"Upload error: {str(e)}")

    def test_telegram_auth(self):
        """Test Telegram authentication"""
        self.log("Testing Telegram authentication...")
        
        # Test telegram auth endpoint
        telegram_data = {
            'telegram_id': 123456789,
            'password': '121212',
            'telegram_username': 'testuser',
            'first_name': 'Test User'
        }
        
        response = self.make_request('POST', '/telegram/auth', telegram_data)
        
        if response and response.status_code == 200:
            auth_result = response.json()
            self.assert_test(
                auth_result.get('message') == 'Authentication successful',
                "Telegram Auth",
                f"Expected 'Authentication successful', got {auth_result.get('message')}"
            )
        else:
            self.assert_test(False, "Telegram Auth", f"Auth failed: {response.text if response else 'No response'}")

    def test_telegram_connection(self):
        """Test Telegram connection in webapp"""
        self.log("Testing Telegram connection...")
        
        if not self.auth_token:
            self.log("Skipping Telegram connection tests - not authenticated", "WARN")
            return
        
        # Test connect telegram
        connect_data = {
            'telegram_id': '123456789'
        }
        
        response = self.make_request('POST', '/telegram/connect', connect_data)
        
        if response and response.status_code == 200:
            connect_result = response.json()
            self.assert_test(
                connect_result.get('message') == 'Telegram account connected successfully',
                "Connect Telegram",
                f"Expected 'Telegram account connected successfully', got {connect_result.get('message')}"
            )
            
            # Test telegram status
            response = self.make_request('GET', '/telegram/status')
            if response and response.status_code == 200:
                status_result = response.json()
                self.assert_test(
                    status_result.get('connected') == True,
                    "Telegram Status",
                    f"Expected connected=True, got {status_result.get('connected')}"
                )
                
                # Test disconnect telegram
                response = self.make_request('POST', '/telegram/disconnect')
                if response and response.status_code == 200:
                    disconnect_result = response.json()
                    self.assert_test(
                        disconnect_result.get('message') == 'Telegram account disconnected successfully',
                        "Disconnect Telegram",
                        f"Expected 'Telegram account disconnected successfully', got {disconnect_result.get('message')}"
                    )
                else:
                    self.assert_test(False, "Disconnect Telegram", f"Disconnect failed: {response.text if response else 'No response'}")
            else:
                self.assert_test(False, "Telegram Status", f"Status check failed: {response.text if response else 'No response'}")
        else:
            self.assert_test(False, "Connect Telegram", f"Connect failed: {response.text if response else 'No response'}")

    def test_telegram_webhook(self):
        """Test Telegram webhook functionality"""
        self.log("Testing Telegram webhook...")
        
        # Test webhook with mock message
        webhook_data = {
            'message': {
                'chat': {'id': 123456789},
                'text': '/start',
                'from': {
                    'id': 123456789,
                    'username': 'testuser',
                    'first_name': 'Test User'
                }
            }
        }
        
        response = self.make_request('POST', '/telegram/webhook', webhook_data)
        
        if response and response.status_code == 200:
            webhook_result = response.json()
            self.assert_test(
                webhook_result.get('status') == 'ok',
                "Telegram Webhook",
                f"Expected status='ok', got {webhook_result.get('status')}"
            )
        else:
            self.assert_test(False, "Telegram Webhook", f"Webhook failed: {response.text if response else 'No response'}")

    def run_all_tests(self):
        """Run all tests"""
        self.log("Starting comprehensive test suite...")
        start_time = time.time()
        
        # Core functionality tests
        self.test_health_check()
        self.test_user_registration()
        self.test_user_login()
        
        # CRUD operation tests
        self.test_contact_operations()
        self.test_task_operations()
        
        # Feature tests
        self.test_csv_upload()
        
        # Telegram tests
        self.test_telegram_auth()
        self.test_telegram_connection()
        self.test_telegram_webhook()
        
        # Results
        end_time = time.time()
        duration = end_time - start_time
        
        self.log("=" * 50)
        self.log("TEST RESULTS SUMMARY")
        self.log("=" * 50)
        self.log(f"Total Tests: {self.results['passed'] + self.results['failed']}")
        self.log(f"Passed: {self.results['passed']}")
        self.log(f"Failed: {self.results['failed']}")
        self.log(f"Duration: {duration:.2f} seconds")
        
        if self.results['errors']:
            self.log("\nERRORS:")
            for error in self.results['errors']:
                self.log(f"  - {error}")
        
        success_rate = (self.results['passed'] / (self.results['passed'] + self.results['failed'])) * 100
        self.log(f"Success Rate: {success_rate:.1f}%")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    print("Neo Networker Comprehensive Test Suite")
    print("=" * 50)
    
    runner = TestRunner()
    success = runner.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
