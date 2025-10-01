#!/bin/bash

echo "🚀 Neo Networker Database Fix Script"
echo "====================================="

# Database connection details
DB_HOST="neo-networker-db.cqjqjqjqjqjq.us-east-1.rds.amazonaws.com"
DB_USER="postgres"
DB_NAME="neo_networker"
DB_PASSWORD="NeoNetworker2024!"

echo "📋 Connecting to database..."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Create SQL file
cat > /tmp/fix_database.sql << 'EOF'
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(255);

-- Drop problematic tables
DROP TABLE IF EXISTS telegram_users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS shared_data CASCADE;

-- Verify the fix
SELECT 'Database fix completed successfully!' as status;

-- Show final table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'people', 'tasks', 'events')
ORDER BY table_name, ordinal_position;
EOF

echo "🔧 Running database fix..."
echo ""

# Run the SQL commands
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /tmp/fix_database.sql

echo ""
echo "✅ Database fix completed!"
echo "🧹 Cleaning up temporary files..."
rm -f /tmp/fix_database.sql

echo "🎉 Done! Your database should now be fixed."
echo "Test your API: curl -s https://dkdrn34xpx.us-east-1.awsapprunner.com/api/health"
