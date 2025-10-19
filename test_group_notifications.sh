#!/bin/bash

# Test script to verify group notifications are working
# This will test adding a user to a group and check if notifications are created

echo "🧪 TESTING GROUP NOTIFICATIONS"
echo ""

# Test user credentials
TEST_USER_EMAIL="roee2912@gmail.com"
TEST_USER_PASSWORD="123456"

# Create a second test user for group testing
TEST_USER_2_EMAIL="testuser2@example.com"
TEST_USER_2_PASSWORD="123456"

echo "📊 TEST SETUP:"
echo "   User 1: $TEST_USER_EMAIL"
echo "   User 2: $TEST_USER_2_EMAIL"
echo ""

# Step 1: Login as first user
echo "🔐 STEP 1: Logging in as first user..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_USER_EMAIL\", \"password\": \"$TEST_USER_PASSWORD\"}")

echo "Login response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get access token"
    exit 1
fi

echo "✅ Login successful, token obtained"
echo ""

# Step 2: Create second user
echo "👤 STEP 2: Creating second user..."
CREATE_USER_RESPONSE=$(curl -s -X POST http://localhost:5002/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_USER_2_EMAIL\", \"password\": \"$TEST_USER_2_PASSWORD\", \"full_name\": \"Test User 2\"}")

echo "Create user response: $CREATE_USER_RESPONSE"
echo ""

# Step 3: Add second user to first user's group
echo "👥 STEP 3: Adding second user to first user's group..."
ADD_USER_RESPONSE=$(curl -s -X POST http://localhost:5002/api/user-group/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"email\": \"$TEST_USER_2_EMAIL\", \"name\": \"Test User 2\"}")

echo "Add user response: $ADD_USER_RESPONSE"
echo ""

# Step 4: Check notifications for second user
echo "🔔 STEP 4: Checking notifications for second user..."

# Login as second user
LOGIN_RESPONSE_2=$(curl -s -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$TEST_USER_2_EMAIL\", \"password\": \"$TEST_USER_2_PASSWORD\"}")

TOKEN_2=$(echo $LOGIN_RESPONSE_2 | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN_2" ]; then
    echo "❌ Failed to get access token for second user"
    exit 1
fi

# Check notifications
NOTIFICATIONS_RESPONSE=$(curl -s -X GET http://localhost:5002/api/notifications \
  -H "Authorization: Bearer $TOKEN_2")

echo "Notifications response: $NOTIFICATIONS_RESPONSE"
echo ""

# Step 5: Check unread count
echo "📊 STEP 5: Checking unread notification count..."
UNREAD_COUNT_RESPONSE=$(curl -s -X GET http://localhost:5002/api/notifications/unread-count \
  -H "Authorization: Bearer $TOKEN_2")

echo "Unread count response: $UNREAD_COUNT_RESPONSE"
echo ""

echo "🎯 TEST COMPLETED!"
echo ""
echo "📋 RESULTS:"
echo "   ✅ User creation: Check response above"
echo "   ✅ Group addition: Check response above"
echo "   ✅ Notifications: Check response above"
echo "   ✅ Unread count: Check response above"
echo ""
echo "🔍 EXPECTED RESULTS:"
echo "   - Second user should have 1 notification"
echo "   - Unread count should be 1"
echo "   - Notification should be about group invitation"

