#!/bin/bash
# Simple script to add google_sync column to events table
# Usage: ./add_google_sync_column.sh "your_database_url_here"

set -e

# Check if DATABASE_URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide DATABASE_URL as first argument"
    echo "Usage: $0 'postgresql://user:password@host:port/database'"
    exit 1
fi

DATABASE_URL="$1"

echo "🔧 Adding google_sync column to events table..."
echo "📊 Database: $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"  # Hide password

# Parse DATABASE_URL
export PGPASSWORD=$(echo $DATABASE_URL | sed 's/.*:\([^@]*\)@.*/\1/')
export PGHOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
export PGPORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
export PGDATABASE=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')
export PGUSER=$(echo $DATABASE_URL | sed 's/.*\/\/\([^:]*\):.*/\1/')

echo "🔍 Testing database connection..."
if ! psql -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    exit 1
fi
echo "✅ Database connection successful"

echo "🔧 Checking if google_sync column exists..."
if psql -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'google_sync';" | grep -q google_sync; then
    echo "✅ google_sync column already exists"
else
    echo "🔧 Adding google_sync column..."
    psql -c "ALTER TABLE events ADD COLUMN google_sync BOOLEAN DEFAULT TRUE;"
    echo "✅ google_sync column added successfully"
fi

echo "🔍 Verifying column was added..."
if psql -t -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'google_sync';" | grep -q google_sync; then
    echo "✅ Verification successful: google_sync column exists"
else
    echo "❌ Error: google_sync column not found after migration"
    exit 1
fi

echo "🎉 Migration completed successfully!"
echo "📋 Next steps:"
echo "   1. The google_sync column has been added to the events table"
echo "   2. You can now re-enable the Google Calendar sync toggle functionality"
echo "   3. All existing events will have google_sync = TRUE by default"
