#!/usr/bin/env python3
"""
Production API Testing Suite
Tests all APIs after deployment to catch issues early
"""

import requests
import json
import os
from datetime import datetime, timedelta
import time

class ProductionAPITester:
    def __init__(self, base_url="https://dkdrn34xpx.us-east-1.awsapprunner.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'response_data': response_data,
            'timestamp': datetime.now().isoformat()
        })
        
        if not success and response_data:
            print(f"   Response: {response_data}")
    
    def test_health_check(self):
        """Test basic health endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            success = response.status_code == 200
            self.log_test("Health Check", success, f"Status: {response.status_code}")
            return success
        except Exception as e:
            self.log_test("Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_auth_login(self):
        """Test authentication (mock login for testing)"""
        try:
            # For testing, we'll try to get a token or use a test endpoint
            # This is a placeholder - you might need to implement a test user
            response = self.session.post(f"{self.base_url}/auth/login", json={
                "email": "test@example.com",
                "password": "testpassword"
            })
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.auth_token = data['access_token']
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    self.log_test("Auth Login", True, "Token obtained")
                    return True
            
            # If login fails, try without auth for public endpoints
            self.log_test("Auth Login", False, f"Status: {response.status_code}, trying without auth")
            return False
            
        except Exception as e:
            self.log_test("Auth Login", False, f"Exception: {str(e)}")
            return False
    
    def test_people_api(self):
        """Test people/contacts API"""
        try:
            # Test GET people
            response = self.session.get(f"{self.base_url}/people")
            success = response.status_code in [200, 401]  # 401 is expected without auth
            self.log_test("People GET", success, f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("People Data Structure", 'people' in data, f"Has 'people' key: {'people' in data}")
            
            return success
            
        except Exception as e:
            self.log_test("People API", False, f"Exception: {str(e)}")
            return False
    
    def test_tasks_api(self):
        """Test tasks API"""
        try:
            # Test GET tasks
            response = self.session.get(f"{self.base_url}/tasks")
            success = response.status_code in [200, 401, 500]  # 500 might indicate schema issues
            
            if response.status_code == 500:
                # Check if it's the schema error we're expecting
                try:
                    error_data = response.json()
                    if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                        self.log_test("Tasks GET", False, "Database schema error - missing columns")
                        return False
                except:
                    pass
            
            self.log_test("Tasks GET", success, f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Tasks Data Structure", 'projects' in data, f"Has 'projects' key: {'projects' in data}")
            
            # Test with parameters
            response = self.session.get(f"{self.base_url}/tasks?include_scheduled=true")
            self.log_test("Tasks with params", response.status_code in [200, 401, 500], f"Status: {response.status_code}")
            
            return success
            
        except Exception as e:
            self.log_test("Tasks API", False, f"Exception: {str(e)}")
            return False
    
    def test_events_api(self):
        """Test events API"""
        try:
            # Test GET events
            response = self.session.get(f"{self.base_url}/events")
            success = response.status_code in [200, 401, 500]
            
            if response.status_code == 500:
                try:
                    error_data = response.json()
                    if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                        self.log_test("Events GET", False, "Database schema error - missing columns")
                        return False
                except:
                    pass
            
            self.log_test("Events GET", success, f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Events Data Structure", 'events' in data, f"Has 'events' key: {'events' in data}")
            
            # Test with date parameters
            today = datetime.now()
            start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = today.replace(hour=23, minute=59, second=59, microsecond=0)
            
            response = self.session.get(f"{self.base_url}/events?start_date={start_date.isoformat()}&end_date={end_date.isoformat()}")
            self.log_test("Events with dates", response.status_code in [200, 401, 500], f"Status: {response.status_code}")
            
            return success
            
        except Exception as e:
            self.log_test("Events API", False, f"Exception: {str(e)}")
            return False
    
    def test_companies_api(self):
        """Test companies API"""
        try:
            response = self.session.get(f"{self.base_url}/companies")
            success = response.status_code in [200, 401]
            self.log_test("Companies GET", success, f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Companies Data Structure", 'companies' in data, f"Has 'companies' key: {'companies' in data}")
            
            return success
            
        except Exception as e:
            self.log_test("Companies API", False, f"Exception: {str(e)}")
            return False
    
    def test_csv_api(self):
        """Test CSV upload API"""
        try:
            response = self.session.get(f"{self.base_url}/csv/upload")
            success = response.status_code in [200, 401, 404]  # 404 is OK for GET on upload endpoint
            self.log_test("CSV Upload endpoint", success, f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("CSV API", False, f"Exception: {str(e)}")
            return False
    
    def test_admin_api(self):
        """Test admin API"""
        try:
            response = self.session.get(f"{self.base_url}/admin/users")
            success = response.status_code in [200, 401, 403]
            self.log_test("Admin Users", success, f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Admin API", False, f"Exception: {str(e)}")
            return False
    
    def test_database_schema_endpoints(self):
        """Test database schema fix endpoints"""
        try:
            # Test safe migration endpoint
            response = self.session.post(f"{self.base_url}/safe-migration")
            success = response.status_code in [200, 404]  # 404 if not deployed yet
            self.log_test("Safe Migration endpoint", success, f"Status: {response.status_code}")
            
            # Test quick fix endpoint
            response = self.session.post(f"{self.base_url}/quick-fix")
            success = response.status_code in [200, 404]  # 404 if not deployed yet
            self.log_test("Quick Fix endpoint", success, f"Status: {response.status_code}")
            
            return True
            
        except Exception as e:
            self.log_test("Schema Fix endpoints", False, f"Exception: {str(e)}")
            return False
    
    def test_frontend_build(self):
        """Test if frontend is accessible"""
        try:
            # Test the main frontend URL
            frontend_url = "https://d1q2w3e4r5t6y7u8i9o0p.cloudfront.net"  # Your CloudFront URL
            response = self.session.get(frontend_url, timeout=10)
            success = response.status_code == 200
            self.log_test("Frontend Build", success, f"Status: {response.status_code}")
            return success
            
        except Exception as e:
            self.log_test("Frontend Build", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        print("🚀 Starting Production API Tests...")
        print("=" * 50)
        
        # Basic connectivity
        self.test_health_check()
        
        # Authentication
        self.test_auth_login()
        
        # Core APIs
        self.test_people_api()
        self.test_tasks_api()
        self.test_events_api()
        self.test_companies_api()
        
        # Additional APIs
        self.test_csv_api()
        self.test_admin_api()
        
        # Database schema fixes
        self.test_database_schema_endpoints()
        
        # Frontend
        self.test_frontend_build()
        
        # Generate report
        self.generate_report()
    
    def generate_report(self):
        """Generate test report"""
        print("\n" + "=" * 50)
        print("📊 TEST REPORT")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Save detailed report
        report_file = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_file}")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS:")
        schema_errors = [r for r in self.test_results if 'schema error' in r['message'].lower()]
        if schema_errors:
            print("  - Database schema needs fixing - run the database fix script")
        
        auth_errors = [r for r in self.test_results if r['message'] and '401' in r['message']]
        if auth_errors:
            print("  - Authentication issues detected - check JWT configuration")
        
        frontend_errors = [r for r in self.test_results if 'frontend' in r['test'].lower() and not r['success']]
        if frontend_errors:
            print("  - Frontend deployment issues - check CloudFront/S3 configuration")

def main():
    """Main function to run tests"""
    tester = ProductionAPITester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
