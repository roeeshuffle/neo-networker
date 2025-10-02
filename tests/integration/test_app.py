#!/usr/bin/env python3
"""
Comprehensive test suite for the Neo Networker backend API.
Tests all endpoints and functionality to ensure everything works correctly.
"""

import unittest
import json
import os
import sys
from datetime import datetime, timedelta, timezone

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'backend'))

# Set testing environment before importing app
os.environ['TESTING'] = 'true'

from api.app import app
from dal.database import db
from dal.models import User, Person, Task, Event
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash

class TestNeoNetworkerAPI(unittest.TestCase):
    """Test cases for the Neo Networker API"""
    
    def setUp(self):
        """Set up test database and client"""
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        app.config['JWT_SECRET_KEY'] = 'test-secret-key'
        
        self.app = app
        self.client = app.test_client()
        
        with app.app_context():
            db.create_all()
            
            # Create test admin user
            self.admin_user = User(
                id='admin-123',
                email='admin@test.com',
                full_name='Admin User',
                is_approved=True,
                approved_at=datetime.now(timezone.utc)
            )
            self.admin_user.approved_by = self.admin_user.id
            self.admin_user.password_hash = generate_password_hash('admin123')
            db.session.add(self.admin_user)
            
            # Create test regular user
            self.regular_user = User(
                id='user-123',
                email='user@test.com',
                full_name='Regular User',
                is_approved=True,
                approved_at=datetime.now(timezone.utc)
            )
            self.regular_user.approved_by = self.admin_user.id
            self.regular_user.password_hash = generate_password_hash('user123')
            db.session.add(self.regular_user)
            
            db.session.commit()
            
            # Create JWT tokens
            self.admin_token = create_access_token(identity=self.admin_user.id)
            self.user_token = create_access_token(identity=self.regular_user.id)
    
    def tearDown(self):
        """Clean up after tests"""
        with app.app_context():
            db.session.remove()
            db.drop_all()
    
    def get_headers(self, token):
        """Get headers with JWT token"""
        return {'Authorization': f'Bearer {token}'}
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy')
        self.assertIn('timestamp', data)
    
    def test_user_registration(self):
        """Test user registration"""
        user_data = {
            'email': 'newuser@test.com',
            'full_name': 'New User',
            'password': 'password123'
        }
        
        response = self.client.post('/api/auth/register', 
                                  data=json.dumps(user_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertIn('requires_approval', data)
        self.assertTrue(data['requires_approval'])
        self.assertIn('pending admin approval', data['message'])
    
    def test_user_login(self):
        """Test user login"""
        login_data = {'email': 'admin@test.com', 'password': 'admin123'}
        
        response = self.client.post('/api/auth/login',
                                  data=json.dumps(login_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('access_token', data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], 'admin@test.com')
    
    def test_get_current_user(self):
        """Test get current user endpoint"""
        response = self.client.get('/api/auth/me',
                                 headers=self.get_headers(self.admin_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['email'], 'admin@test.com')
    
    def test_get_all_users(self):
        """Test get all users endpoint"""
        response = self.client.get('/api/users',
                                 headers=self.get_headers(self.admin_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 2)  # At least admin and regular user
    
    def test_create_user(self):
        """Test create user endpoint"""
        user_data = {
            'email': 'newuser2@test.com',
            'full_name': 'New User 2',
            'is_approved': True
        }
        
        response = self.client.post('/api/users',
                                  data=json.dumps(user_data),
                                  content_type='application/json',
                                  headers=self.get_headers(self.admin_token))
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['email'], 'newuser2@test.com')
        self.assertEqual(data['is_approved'], True)
    
    def test_update_user(self):
        """Test update user endpoint"""
        update_data = {
            'full_name': 'Updated Admin User',
            'is_approved': True
        }
        
        response = self.client.put(f'/api/users/{self.admin_user.id}',
                                 data=json.dumps(update_data),
                                 content_type='application/json',
                                 headers=self.get_headers(self.admin_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['full_name'], 'Updated Admin User')
    
    def test_delete_user(self):
        """Test delete user endpoint"""
        user_id_to_delete = None
        with self.app.app_context():
            # Create a user to delete
            user_to_delete = User(
                id='delete-123',
                email='delete@test.com',
                full_name='User to Delete',
                is_approved=True
            )
            db.session.add(user_to_delete)
            db.session.commit()
            user_id_to_delete = user_to_delete.id
        
        response = self.client.delete(f'/api/users/{user_id_to_delete}',
                                    headers=self.get_headers(self.admin_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'User deleted successfully')
    
    def test_people_crud(self):
        """Test people CRUD operations"""
        # Create person
        person_data = {
            'full_name': 'John Doe',
            'company': 'Test Company',
            'email': 'john@test.com',
            'categories': 'Investor',
            'status': 'Active'
        }
        
        response = self.client.post('/api/people',
                                  data=json.dumps(person_data),
                                  content_type='application/json',
                                  headers=self.get_headers(self.user_token))
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        person_id = data['id']
        self.assertEqual(data['full_name'], 'John Doe')
        self.assertEqual(data['company'], 'Test Company')
        
        # Get people
        response = self.client.get('/api/people',
                                 headers=self.get_headers(self.user_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        
        # Update person
        update_data = {
            'full_name': 'John Updated',
            'status': 'Inactive'
        }
        
        response = self.client.put(f'/api/people/{person_id}',
                                 data=json.dumps(update_data),
                                 content_type='application/json',
                                 headers=self.get_headers(self.user_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['full_name'], 'John Updated')
        self.assertEqual(data['status'], 'Inactive')
        
        # Delete person
        response = self.client.delete(f'/api/people/{person_id}',
                                    headers=self.get_headers(self.user_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Person deleted successfully')
    
    # Companies CRUD test removed - Company model was deleted
    
    
    def test_tasks_crud(self):
        """Test tasks CRUD operations"""
        # Create task
        task_data = {
            'title': 'Complete project documentation',
            'project': 'work',
            'description': 'Document the project thoroughly',
            'priority': 'high',
            'status': 'todo'
        }
        
        response = self.client.post('/api/tasks',
                                  data=json.dumps(task_data),
                                  content_type='application/json',
                                  headers=self.get_headers(self.user_token))
        
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        task_id = data['task']['id']
        self.assertEqual(data['task']['title'], 'Complete project documentation')
        self.assertEqual(data['task']['priority'], 'high')
        
        # Get tasks
        response = self.client.get('/api/tasks',
                                 headers=self.get_headers(self.user_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('projects', data)
        self.assertIn('total_tasks', data)
        self.assertEqual(data['total_tasks'], 1)
        self.assertIn('work', data['projects'])
        self.assertEqual(len(data['projects']['work']), 1)
        
        # Update task
        update_data = {
            'title': 'Updated task description',
            'status': 'in_progress'
        }
        
        response = self.client.put(f'/api/tasks/{task_id}',
                                 data=json.dumps(update_data),
                                 content_type='application/json',
                                 headers=self.get_headers(self.user_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['title'], 'Updated task description')
        self.assertEqual(data['status'], 'in_progress')
        
        # Delete task
        response = self.client.delete(f'/api/tasks/{task_id}',
                                    headers=self.get_headers(self.user_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Task deleted successfully')
    
    def test_csv_processing(self):
        """Test CSV processing endpoints"""
        # Test people CSV processing
        csv_data = {
            'csvData': 'Full Name,Company,Email,Status\nJohn Doe,Test Corp,john@test.com,Active\nJane Smith,Another Corp,jane@test.com,Inactive',
            'customMapping': {}
        }
        
        response = self.client.post('/api/csv-processor',
                                  data=json.dumps(csv_data),
                                  content_type='application/json',
                                  headers=self.get_headers(self.user_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('message', data)
        self.assertIn('people', data)
        self.assertGreaterEqual(len(data['people']), 2)
    
    
    def test_telegram_auth(self):
        """Test telegram authentication"""
        auth_data = {
            'telegram_id': 123456789,
            'password': '121212',
            'telegram_username': 'testuser',
            'first_name': 'Test User'
        }
        
        response = self.client.post('/api/telegram/auth',
                                  data=json.dumps(auth_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['message'], 'Authentication successful')
        self.assertIn('user', data)
    
    def test_telegram_webhook(self):
        """Test telegram webhook"""
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
        
        response = self.client.post('/api/telegram/webhook',
                                  data=json.dumps(webhook_data),
                                  content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'ok')
    
    # Data sharing test removed - SharedData model was deleted
    
    
    def test_unauthorized_access(self):
        """Test unauthorized access protection"""
        # Test without token
        response = self.client.get('/api/users')
        self.assertEqual(response.status_code, 401)
        
        # Test with invalid token
        response = self.client.get('/api/users',
                                 headers={'Authorization': 'Bearer invalid-token'})
        self.assertEqual(response.status_code, 422)  # JWT decode error
    
    def test_user_approval(self):
        """Test user approval functionality"""
        unapproved_user_id = None
        with self.app.app_context():
            # Create unapproved user
            unapproved_user = User(
                id='unapproved-123',
                email='unapproved@test.com',
                full_name='Unapproved User',
                is_approved=False
            )
            db.session.add(unapproved_user)
            db.session.commit()
            unapproved_user_id = unapproved_user.id
        
        # Approve user
        response = self.client.post(f'/api/auth/approve/{unapproved_user_id}',
                                  headers=self.get_headers(self.admin_token))
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['is_approved'], True)
        self.assertIsNotNone(data['approved_at'])

def run_tests():
    """Run all tests"""
    print("🧪 Running Neo Networker Backend Tests...")
    print("=" * 50)
    
    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(TestNeoNetworkerAPI)
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"✅ Tests run: {result.testsRun}")
    print(f"❌ Failures: {len(result.failures)}")
    print(f"💥 Errors: {len(result.errors)}")
    
    if result.failures:
        print("\n❌ FAILURES:")
        for test, traceback in result.failures:
            print(f"  - {test}: {traceback}")
    
    if result.errors:
        print("\n💥 ERRORS:")
        for test, traceback in result.errors:
            print(f"  - {test}: {traceback}")
    
    if result.wasSuccessful():
        print("\n🎉 All tests passed! Backend is working correctly.")
        return True
    else:
        print("\n⚠️  Some tests failed. Please check the issues above.")
        return False

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
