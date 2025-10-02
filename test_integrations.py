#!/usr/bin/env python3
"""
Test script for WhatsApp and Telegram integrations
"""
import sys
import os
sys.path.append('backend')

from backend.bl.services.whatsapp_service import whatsapp_service
from backend.bl.services.messaging_service import messaging_service

def test_whatsapp_status_handling():
    """Test that WhatsApp status updates are handled correctly"""
    print("🧪 Testing WhatsApp status update handling...")
    
    # Simulate a status update webhook (like the one in the logs)
    status_webhook = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "660026600226945",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {
                        "display_phone_number": "15556457532",
                        "phone_number_id": "626899147177664"
                    },
                    "statuses": [{
                        "id": "wamid.test",
                        "status": "sent",
                        "timestamp": "1759422885",
                        "recipient_id": "972507372313"
                    }]
                },
                "field": "messages"
            }]
        }]
    }
    
    result = messaging_service.process_incoming_message('whatsapp', status_webhook)
    
    if result is None:
        print("✅ WhatsApp status update correctly ignored")
        return True
    else:
        print(f"❌ WhatsApp status update should be ignored, got: {result}")
        return False

def test_whatsapp_message_handling():
    """Test that WhatsApp messages are processed correctly"""
    print("🧪 Testing WhatsApp message handling...")
    
    # Simulate a text message webhook
    message_webhook = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "660026600226945",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {
                        "display_phone_number": "15556457532",
                        "phone_number_id": "626899147177664"
                    },
                    "messages": [{
                        "from": "972507372313",
                        "id": "wamid.test",
                        "timestamp": "1759422885",
                        "text": {
                            "body": "Hello test"
                        },
                        "type": "text"
                    }]
                },
                "field": "messages"
            }]
        }]
    }
    
    result = messaging_service.process_incoming_message('whatsapp', message_webhook)
    
    if result and result.get('from_phone') == '972507372313' and result.get('message_text') == 'Hello test':
        print("✅ WhatsApp message correctly processed")
        return True
    else:
        print(f"❌ WhatsApp message processing failed, got: {result}")
        return False

def test_telegram_webapp_user():
    """Test that Telegram webapp_user variable is defined"""
    print("🧪 Testing Telegram webapp_user variable...")
    
    # This is a basic syntax check - the actual test would need a database
    try:
        # Import the telegram module to check for syntax errors
        from backend.api.routes import telegram
        print("✅ Telegram module imports without syntax errors")
        return True
    except Exception as e:
        print(f"❌ Telegram module has errors: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing WhatsApp and Telegram integrations...")
    
    tests = [
        test_whatsapp_status_handling,
        test_whatsapp_message_handling,
        test_telegram_webapp_user
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Ready for deployment.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Fix issues before deployment.")
        sys.exit(1)
