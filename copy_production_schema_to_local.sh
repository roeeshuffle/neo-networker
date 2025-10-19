#!/bin/bash

# Script to copy production database schema to local development database
# This will make your local database identical to production

set -e  # Exit on any error

echo "🔄 COPYING PRODUCTION SCHEMA TO LOCAL DATABASE"
echo ""

# Production database configuration
PROD_DB_HOST="neo-networker-db-v2.c0d2k4qwgenr.us-east-1.rds.amazonaws.com"
PROD_DB_PORT="5432"
PROD_DB_NAME="postgres"
PROD_DB_USER="postgres"

# Local database configuration
LOCAL_DB_URL="postgresql://postgres:localpassword@localhost:5432/neo_networker_local"

# Get production password from user
echo "🔑 PRODUCTION DATABASE ACCESS"
echo "   Host: $PROD_DB_HOST"
echo "   Port: $PROD_DB_PORT"
echo "   Database: $PROD_DB_NAME"
echo "   User: $PROD_DB_USER"
echo ""
echo "Please enter the production database password:"
read -s PROD_DB_PASSWORD
echo ""

# Construct production database URL
PROD_DB_URL="postgresql://$PROD_DB_USER:$PROD_DB_PASSWORD@$PROD_DB_HOST:$PROD_DB_PORT/$PROD_DB_NAME"

echo "📊 DATABASE CONFIGURATION:"
echo "   Source (PROD): $PROD_DB_HOST"
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

# Check if production database is accessible
echo "🔍 Checking production database connection..."
if ! docker run --rm postgres:17 psql "$PROD_DB_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to production database!"
    echo "   Check your network connection and database credentials"
    exit 1
fi
echo "✅ Production database connection successful"

# Create backup directory
BACKUP_DIR="prod_schema_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo ""
echo "📦 STEP 1: Exporting schema from PRODUCTION database..."
echo "   Backup directory: $BACKUP_DIR"

# Export schema and data using PostgreSQL 17 Docker for compatibility
echo "   Exporting schema..."
docker run --rm postgres:17 pg_dump "$PROD_DB_URL" --schema-only --no-owner --no-privileges > "$BACKUP_DIR/schema.sql"

echo "   Exporting data..."
docker run --rm postgres:17 pg_dump "$PROD_DB_URL" --data-only --no-owner --no-privileges > "$BACKUP_DIR/data.sql"

echo "✅ Export completed successfully"

echo ""
echo "🗑️  STEP 2: Clearing local database..."

# Drop all tables in local database
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
echo "🔍 STEP 5: Verifying schema transfer..."

# Check what tables were created
echo "   Tables in local database:"
psql "$LOCAL_DB_URL" -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"

# Check column types for participants columns
echo ""
echo "   Participants column types:"
psql "$LOCAL_DB_URL" -c "
SELECT 
    table_name,
    column_name, 
    data_type, 
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'participants'
ORDER BY table_name;
"

# Check if we have any data
echo ""
echo "   Sample data counts:"
psql "$LOCAL_DB_URL" -c "
SELECT 
    'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 
    'tasks' as table_name, COUNT(*) as row_count FROM tasks
UNION ALL
SELECT 
    'events' as table_name, COUNT(*) as row_count FROM events
UNION ALL
SELECT 
    'people' as table_name, COUNT(*) as row_count FROM people;
"

echo ""
echo "🎉 PRODUCTION SCHEMA COPY COMPLETED!"
echo ""
echo "📊 SUMMARY:"
echo "   ✅ Exported schema from PRODUCTION database"
echo "   ✅ Cleared local database"
echo "   ✅ Imported schema to local database"
echo "   ✅ Imported data to local database"
echo "   ✅ Verified schema transfer"
echo ""
echo "📁 Backup files saved in: $BACKUP_DIR"
echo "   - schema.sql (database structure)"
echo "   - data.sql (all data)"
echo ""
echo "🌐 Your local webapp now has the same schema as production!"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:5002"
echo ""
echo "🔧 NEXT STEPS:"
echo "   1. Restart your backend container to clear any cached connections"
echo "   2. Test the API endpoints"
echo "   3. The JSONB operators should now work correctly"

