#!/usr/bin/env python3
"""
Deployment Test Script
Run this after every deployment to verify everything works
"""

import requests
import json
import time
from datetime import datetime

class DeploymentTester:
    def __init__(self):
        self.base_url = "https://dkdrn34xpx.us-east-1.awsapprunner.com/api"
        self.frontend_url = "https://d1q2w3e4r5t6y7u8i9o0p.cloudfront.net"  # Update with your actual CloudFront URL
        self.results = []
        
    def log(self, test_name, success, message="", details=None):
        """Log test result"""
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
        
        self.results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
        
        if details and not success:
            print(f"   Details: {details}")
    
    def test_backend_health(self):
        """Test if backend is running"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                self.log("Backend Health", True, f"Status: {response.status_code}")
                return True
            else:
                self.log("Backend Health", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log("Backend Health", False, f"Exception: {str(e)}")
            return False
    
    def test_database_schema(self):
        """Test if database schema is correct"""
        try:
            # Test tasks API - this will fail if schema is wrong
            response = requests.get(f"{self.base_url}/tasks", timeout=10)
            
            if response.status_code == 500:
                try:
                    error_data = response.json()
                    if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                        self.log("Database Schema", False, "Missing columns detected", error_data)
                        return False
                except:
                    pass
            
            # Test events API
            response = requests.get(f"{self.base_url}/events", timeout=10)
            
            if response.status_code == 500:
                try:
                    error_data = response.json()
                    if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                        self.log("Database Schema", False, "Missing columns in events table", error_data)
                        return False
                except:
                    pass
            
            self.log("Database Schema", True, "Schema appears correct")
            return True
            
        except Exception as e:
            self.log("Database Schema", False, f"Exception: {str(e)}")
            return False
    
    def test_api_endpoints(self):
        """Test all API endpoints"""
        endpoints = [
            ("/people", "People API"),
            ("/tasks", "Tasks API"),
            ("/events", "Events API"),
            ("/companies", "Companies API"),
            ("/admin/users", "Admin API"),
        ]
        
        all_success = True
        
        for endpoint, name in endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                success = response.status_code in [200, 401, 403]  # 401/403 are OK without auth
                
                if response.status_code == 500:
                    success = False
                    try:
                        error_data = response.json()
                        if 'column' in str(error_data).lower() and 'does not exist' in str(error_data).lower():
                            self.log(name, False, "Database schema error", error_data)
                        else:
                            self.log(name, False, f"Server error: {error_data}")
                    except:
                        self.log(name, False, f"Server error: {response.text[:100]}")
                else:
                    self.log(name, success, f"Status: {response.status_code}")
                
                if not success:
                    all_success = False
                    
            except Exception as e:
                self.log(name, False, f"Exception: {str(e)}")
                all_success = False
        
        return all_success
    
    def test_frontend(self):
        """Test if frontend is accessible"""
        try:
            response = requests.get(self.frontend_url, timeout=10)
            success = response.status_code == 200
            
            if success:
                # Check if it's the actual app (not just a placeholder)
                content = response.text.lower()
                if 'neo-networker' in content or 'react' in content or 'vite' in content:
                    self.log("Frontend", True, "App is accessible and built correctly")
                else:
                    self.log("Frontend", False, "App accessible but content seems wrong")
            else:
                self.log("Frontend", False, f"Status: {response.status_code}")
                
            return success
            
        except Exception as e:
            self.log("Frontend", False, f"Exception: {str(e)}")
            return False
    
    def test_database_fix_endpoints(self):
        """Test if database fix endpoints are available"""
        try:
            # Test safe migration endpoint
            response = requests.post(f"{self.base_url}/safe-migration", timeout=10)
            success = response.status_code in [200, 404, 405]  # 404 = not deployed, 405 = method not allowed for GET
            
            if response.status_code == 200:
                self.log("Safe Migration Endpoint", True, "Available and working")
            elif response.status_code == 404:
                self.log("Safe Migration Endpoint", False, "Not deployed yet")
            else:
                self.log("Safe Migration Endpoint", True, f"Status: {response.status_code}")
            
            return True
            
        except Exception as e:
            self.log("Database Fix Endpoints", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all deployment tests"""
        print("🚀 DEPLOYMENT TEST SUITE")
        print("=" * 50)
        print(f"Testing at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 50)
        
        # Wait a moment for deployment to settle
        print("⏳ Waiting for deployment to settle...")
        time.sleep(5)
        
        # Run tests
        backend_ok = self.test_backend_health()
        
        if backend_ok:
            schema_ok = self.test_database_schema()
            apis_ok = self.test_api_endpoints()
            self.test_database_fix_endpoints()
        else:
            print("❌ Backend is down, skipping other tests")
            schema_ok = False
            apis_ok = False
        
        frontend_ok = self.test_frontend()
        
        # Generate report
        self.generate_report(backend_ok, schema_ok, apis_ok, frontend_ok)
    
    def generate_report(self, backend_ok, schema_ok, apis_ok, frontend_ok):
        """Generate deployment report"""
        print("\n" + "=" * 50)
        print("📊 DEPLOYMENT REPORT")
        print("=" * 50)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for result in self.results if result['success'])
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Overall status
        if backend_ok and schema_ok and apis_ok and frontend_ok:
            print("\n🎉 DEPLOYMENT SUCCESSFUL!")
            print("All systems are operational.")
        else:
            print("\n🚨 DEPLOYMENT ISSUES DETECTED:")
            
            if not backend_ok:
                print("  - Backend is not responding")
            if not schema_ok:
                print("  - Database schema issues detected")
            if not apis_ok:
                print("  - API endpoints have issues")
            if not frontend_ok:
                print("  - Frontend is not accessible")
            
            print("\n💡 RECOMMENDED ACTIONS:")
            if not schema_ok:
                print("  1. Run the database fix script:")
                print("     python fix_database.py")
            if not backend_ok:
                print("  2. Check AWS App Runner logs")
                print("  3. Verify deployment status")
            if not frontend_ok:
                print("  4. Check CloudFront/S3 configuration")
                print("  5. Verify frontend build process")
        
        # Save detailed report
        report_file = f"deployment_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_file}")

def main():
    """Main function"""
    tester = DeploymentTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()
