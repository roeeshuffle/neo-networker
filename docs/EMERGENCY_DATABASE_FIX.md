# 🚨 EMERGENCY DATABASE SCHEMA FIX

## Current Issue
The application is showing these errors:
- `column tasks.title does not exist`
- `column events.event_type does not exist`
- `500 Internal Server Error` on tasks and events API calls

## Root Cause
The database schema is not updated with the new columns required by the updated Task and Event models. The migration process is stuck or failed.

## 🚀 IMMEDIATE SOLUTION

### Option 1: Run the Python Fix Script (Recommended)

1. **Set up environment** (if not already done):
   ```bash
   cd /Users/roeefeingold/neo-networker/backend
   source venv/bin/activate
   ```

2. **Set the DATABASE_URL environment variable**:
   ```bash
   export DATABASE_URL="your_database_url_here"
   ```

3. **Run the fix script**:
   ```bash
   cd /Users/roeefeingold/neo-networker
   python fix_database.py
   ```

### Option 2: Run SQL Script Directly

1. **Connect to your PostgreSQL database** using your preferred tool (psql, pgAdmin, etc.)

2. **Run the SQL script**:
   ```bash
   psql -d your_database -f DATABASE_FIX_SCRIPT.sql
   ```

### Option 3: Manual Database Fix

If you have access to your database, run these commands:

```sql
-- Add missing columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing data
UPDATE tasks SET title = COALESCE(text, 'Untitled Task') WHERE title IS NULL;
UPDATE tasks SET project = 'personal' WHERE project IS NULL;

-- Make required columns NOT NULL
ALTER TABLE tasks ALTER COLUMN title SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN project SET NOT NULL;

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    location VARCHAR(255),
    event_type VARCHAR(50) DEFAULT 'event',
    participants JSON,
    alert_minutes INTEGER DEFAULT 15,
    repeat_pattern VARCHAR(50),
    repeat_interval INTEGER DEFAULT 1,
    repeat_days JSON,
    repeat_end_date TIMESTAMP,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES profiles(id)
);

-- Create index
CREATE INDEX IF NOT EXISTS ix_events_id ON events (id);

-- Add event_type column if missing
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'event';
```

## 🔍 Verification

After running the fix, verify it worked by:

1. **Check the application** - refresh your browser and see if the errors are gone
2. **Check the database** - verify the columns exist:
   ```sql
   SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks';
   SELECT column_name FROM information_schema.columns WHERE table_name = 'events';
   ```

## 🚨 Why This Happened

According to the deployment checklist, this error occurs when:
- Database migrations are not properly applied
- The production database schema is out of sync with the code
- Migration scripts fail due to existing columns

## ✅ Prevention

To prevent this in the future:
1. Always check the deployment checklist before deploying
2. Test migrations on a copy of production data first
3. Use backward-compatible code when possible
4. Monitor deployment logs for migration errors

## 📞 Support

If you need help:
1. Check the `DEPLOYMENT_CHECKLIST.md` file
2. Review the `QUICK_ERROR_REFERENCE.md` file
3. Look at the backend logs for specific error messages

---

**🚨 IMPORTANT**: After fixing the database, the application should work immediately. If you still see errors, there might be additional issues that need to be addressed.
