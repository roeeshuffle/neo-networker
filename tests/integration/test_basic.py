#!/usr/bin/env python3
"""
Basic tests that don't require database connection
"""

import unittest
import sys
import os

class TestBasicFunctionality(unittest.TestCase):
    """Basic tests that don't require database"""
    
    def test_python_version(self):
        """Test that we're using Python 3.10+"""
        self.assertGreaterEqual(sys.version_info.major, 3)
        self.assertGreaterEqual(sys.version_info.minor, 10)
    
    def test_imports_basic(self):
        """Test basic Python imports"""
        try:
            import json
            import datetime
            import os
            self.assertTrue(True)  # If we get here, imports work
        except ImportError as e:
            self.fail(f"Failed to import basic modules: {e}")
    
    def test_file_structure(self):
        """Test that required files exist"""
        backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'backend')
        self.assertTrue(os.path.exists(backend_path), "Backend directory should exist")
        
        api_path = os.path.join(backend_path, 'api')
        self.assertTrue(os.path.exists(api_path), "API directory should exist")
        
        app_file = os.path.join(api_path, 'app.py')
        self.assertTrue(os.path.exists(app_file), "app.py should exist")

if __name__ == '__main__':
    unittest.main()
