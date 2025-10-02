#!/usr/bin/env python3
"""
Quick test to verify Telegram fixes
"""
import sys
sys.path.append('backend')

def test_telegram_imports():
    """Test that Telegram module imports without errors"""
    try:
        from backend.api.routes import telegram
        print("✅ Telegram module imports successfully")
        return True
    except Exception as e:
        print(f"❌ Telegram module import failed: {e}")
        return False

def test_telegram_syntax():
    """Test that Telegram module has no syntax errors"""
    try:
        import py_compile
        py_compile.compile('backend/api/routes/telegram.py', doraise=True)
        print("✅ Telegram module has no syntax errors")
        return True
    except Exception as e:
        print(f"❌ Telegram module has syntax errors: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing Telegram fixes...")
    
    tests = [test_telegram_imports, test_telegram_syntax]
    passed = 0
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"📊 Results: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All Telegram tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed!")
        sys.exit(1)
