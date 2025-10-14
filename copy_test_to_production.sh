#!/bin/bash

# Database connection details
TEST_DB_HOST="neo-networker-db-test.c0d2k4qwgenr.us-east-1.rds.amazonaws.com"
PROD_DB_HOST="neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Get passwords from environment or prompt
if [ -z "$TEST_DB_PASSWORD" ]; then
    echo "Enter password for TEST database:"
    read -s TEST_DB_PASSWORD
fi

if [ -z "$PROD_DB_PASSWORD" ]; then
    echo "Enter password for PRODUCTION database:"
    read -s PROD_DB_PASSWORD
fi

echo "🔄 Starting database copy from test to production..."

# Export data from test database
echo "📤 Exporting data from test database..."
PGPASSWORD="$TEST_DB_PASSWORD" pg_dump \
    --host="$TEST_DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --file="test_database_backup.sql"

if [ $? -ne 0 ]; then
    echo "❌ Failed to export from test database"
    exit 1
fi

echo "✅ Test database exported successfully"

# Import data to production database
echo "📥 Importing data to production database..."
PGPASSWORD="$PROD_DB_PASSWORD" psql \
    --host="$PROD_DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --file="test_database_backup.sql" \
    --verbose

if [ $? -ne 0 ]; then
    echo "❌ Failed to import to production database"
    exit 1
fi

echo "✅ Production database updated successfully"

# Clean up
rm -f test_database_backup.sql

echo "🎉 Database copy completed successfully!"
echo "📊 Test data has been copied to production database"
