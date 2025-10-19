#!/bin/bash

# Script to copy data from TEST database to LOCAL development database
# This will replace all data in the local database

set -e  # Exit on any error

echo "🔄 COPYING DATA FROM TEST TO LOCAL DATABASE"
echo ""

# Database URLs
TEST_DB_URL="postgresql://postgres:TestPassword123!@neo-networker-db-test.c0d2k4qwgenr.us-east-1.rds.amazonaws.com:5432/postgres"
LOCAL_DB_URL="postgresql://postgres:localpassword@localhost:5432/neo_networker_local"

echo "📊 DATABASE CONFIGURATION:"
echo "   Source (TEST): neo-networker-db-test.c0d2k4qwgenr.us-east-1.rds.amazonaws.com"
echo "   Target (LOCAL): localhost:5432/neo_networker_local"
echo ""

# Check if local database is accessible
echo "🔍 Checking local database connection..."
if ! psql "$LOCAL_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to local database!"
    echo "   Make sure Docker containers are running: docker-compose -f docker-compose.local.yml up -d"
    exit 1
fi
echo "✅ Local database connection successful"

# Check if test database is accessible
echo "🔍 Checking test database connection..."
if ! psql "$TEST_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to test database!"
    echo "   Check your network connection and database credentials"
    exit 1
fi
echo "✅ Test database connection successful"

# Create backup directory
BACKUP_DIR="db_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo ""
echo "📦 STEP 1: Exporting data from TEST database..."
echo "   Backup directory: $BACKUP_DIR"

# Export schema and data
echo "   Exporting schema..."
pg_dump "$TEST_DB_URL" --schema-only --no-owner --no-privileges > "$BACKUP_DIR/schema.sql"

echo "   Exporting data..."
pg_dump "$TEST_DB_URL" --data-only --no-owner --no-privileges > "$BACKUP_DIR/data.sql"

echo "✅ Export completed successfully"

echo ""
echo "🗑️  STEP 2: Clearing local database..."

# Drop all tables in local database (be careful!)
psql "$LOCAL_DB_URL" -c "
DO \$\$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
"

echo "✅ Local database cleared"

echo ""
echo "📥 STEP 3: Importing schema to local database..."
psql "$LOCAL_DB_URL" < "$BACKUP_DIR/schema.sql"

echo "✅ Schema imported successfully"

echo ""
echo "📥 STEP 4: Importing data to local database..."
psql "$LOCAL_DB_URL" < "$BACKUP_DIR/data.sql"

echo "✅ Data imported successfully"

echo ""
echo "🔍 STEP 5: Verifying data transfer..."

# Count records in each table
echo "   Table record counts:"
psql "$LOCAL_DB_URL" -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
"

echo ""
echo "🎉 DATA COPY COMPLETED SUCCESSFULLY!"
echo ""
echo "📊 SUMMARY:"
echo "   ✅ Exported data from TEST database"
echo "   ✅ Cleared local database"
echo "   ✅ Imported schema to local database"
echo "   ✅ Imported data to local database"
echo "   ✅ Verified data transfer"
echo ""
echo "📁 Backup files saved in: $BACKUP_DIR"
echo "   - schema.sql (database structure)"
echo "   - data.sql (all data)"
echo ""
echo "🌐 Your local webapp now has the same data as the test environment!"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:5002"

