#!/usr/bin/env python3
"""
Test runner script for the Neo Networker backend.
This script runs all tests and provides detailed output.
"""

import unittest
import sys
import os
from test_app import TestNeoNetworkerAPI

def run_all_tests():
    """Run all tests with detailed output"""
    print("🚀 Starting Neo Networker Backend Test Suite")
    print("=" * 60)
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestNeoNetworkerAPI)
    
    # Run tests with detailed output
    runner = unittest.TextTestRunner(
        verbosity=2,
        descriptions=True,
        failfast=False
    )
    
    print(f"📊 Running {suite.countTestCases()} test cases...")
    print("-" * 60)
    
    result = runner.run(suite)
    
    # Print detailed results
    print("\n" + "=" * 60)
    print("📋 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    total_tests = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    skipped = len(result.skipped) if hasattr(result, 'skipped') else 0
    passed = total_tests - failures - errors - skipped
    
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failures}")
    print(f"💥 Errors: {errors}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"📊 Total: {total_tests}")
    
    # Show failures
    if failures > 0:
        print("\n❌ FAILURES:")
        print("-" * 40)
        for i, (test, traceback) in enumerate(result.failures, 1):
            print(f"{i}. {test}")
            print(f"   {traceback.split('AssertionError:')[-1].strip()}")
            print()
    
    # Show errors
    if errors > 0:
        print("\n💥 ERRORS:")
        print("-" * 40)
        for i, (test, traceback) in enumerate(result.errors, 1):
            print(f"{i}. {test}")
            print(f"   {traceback.split('Exception:')[-1].strip()}")
            print()
    
    # Overall result
    if result.wasSuccessful():
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Backend is working correctly and ready for use.")
        return True
    else:
        print(f"\n⚠️  {failures + errors} test(s) failed.")
        print("❌ Please fix the issues before deploying.")
        return False

def run_specific_test(test_name):
    """Run a specific test"""
    print(f"🎯 Running specific test: {test_name}")
    print("-" * 40)
    
    suite = unittest.TestSuite()
    loader = unittest.TestLoader()
    
    try:
        test = loader.loadTestsFromName(f"test_app.TestNeoNetworkerAPI.{test_name}")
        suite.addTest(test)
        
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        return result.wasSuccessful()
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return False

def main():
    """Main function"""
    if len(sys.argv) > 1:
        # Run specific test
        test_name = sys.argv[1]
        success = run_specific_test(test_name)
    else:
        # Run all tests
        success = run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
