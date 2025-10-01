#!/usr/bin/env python3
"""
Basic tests that don't require database connection
"""

import unittest
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'backend'))

class TestBasicFunctionality(unittest.TestCase):
    """Basic tests that don't require database"""
    
    def test_imports(self):
        """Test that all modules can be imported"""
        try:
            from api.app import app
            self.assertIsNotNone(app)
        except ImportError as e:
            self.fail(f"Failed to import Flask app: {e}")
    
    def test_app_creation(self):
        """Test that Flask app can be created"""
        try:
            from api.app import app
            self.assertTrue(hasattr(app, 'route'))
            self.assertTrue(hasattr(app, 'run'))
        except Exception as e:
            self.fail(f"Failed to create Flask app: {e}")
    
    def test_health_endpoint_exists(self):
        """Test that health endpoint is defined"""
        try:
            from api.app import app
            # Check if health endpoint is registered
            rules = [rule.rule for rule in app.url_map.iter_rules()]
            self.assertIn('/api/health', rules)
        except Exception as e:
            self.fail(f"Health endpoint not found: {e}")

if __name__ == '__main__':
    unittest.main()
