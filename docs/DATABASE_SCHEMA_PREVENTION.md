# 🛡️ Database Schema Error Prevention Guide

## 🚨 The Problem We Just Solved

**Error**: `column profiles.user_preferences does not exist` (500 Internal Server Error)
**Root Cause**: Backend code referenced a database column that didn't exist in production
**Impact**: Complete login failure, 500 errors on all authenticated endpoints

## ✅ Prevention Strategy

### 1. **Database-First Deployment**
- **ALWAYS** add new columns to production database BEFORE deploying code
- **NEVER** deploy code that references non-existent columns
- **USE** database migration scripts or direct SQL commands

### 2. **Local Testing Protocol**
```bash
# Run this before EVERY deployment
cd backend
source venv/bin/activate
DATABASE_URL='sqlite:///:memory:' python -c "
# Test all database operations locally
from dal.database import db
from dal.models import User, Task, Event, Person
from api.app import app
import os
os.environ['TESTING'] = 'true'
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['JWT_SECRET_KEY'] = 'test-secret-key'

with app.app_context():
    db.create_all()
    # Test User creation
    user = User(full_name='Test', email='test@test.com', password_hash='hash')
    db.session.add(user)
    db.session.commit()
    print('✅ Database operations successful')
"
```

### 3. **Model Compatibility Checks**
- **ALWAYS** test `to_dict()` method with missing columns
- **USE** `getattr()` fallbacks for optional fields
- **VALIDATE** all model operations work with SQLite

### 4. **Deployment Checklist Updates**
- ✅ **CRITICAL**: New columns added to production database BEFORE code deployment
- ✅ **CRITICAL**: Test database operations locally with SQLite before deploying
- ✅ **CRITICAL**: Run local database tests with SQLite
- ✅ **CRITICAL**: Test User model operations locally

## 🔧 Current Fix Applied

### Temporary Solution (Version 15.8):
1. **Disabled** `user_preferences` column in User model
2. **Disabled** user preferences API endpoints
3. **Added** localStorage fallback for frontend preferences
4. **Fixed** login 500 error immediately

### Next Steps:
1. **Add** `user_preferences` column to production database
2. **Re-enable** user preferences functionality
3. **Test** with production database

## 📋 Database Migration Commands

### Add user_preferences column:
```sql
ALTER TABLE profiles ADD COLUMN user_preferences JSONB;
```

### Verify column exists:
```sql
\d profiles
```

## 🚀 Testing Commands

### Local Backend Test:
```bash
cd backend
source venv/bin/activate
DATABASE_URL='sqlite:///:memory:' python -c "
# [Full test script from above]
"
```

### Frontend Build Test:
```bash
cd frontend
npm run build
```

### Production Database Test:
```bash
# Connect to RDS and verify schema
psql -h your-rds-endpoint -U postgres -d neo_networker -c "\d profiles"
```

## ⚠️ Warning Signs

Watch for these errors that indicate schema mismatches:
- `column X does not exist`
- `NOT NULL constraint failed`
- `relation X does not exist`
- `psycopg2.errors.UndefinedColumn`

## 🎯 Success Criteria

- ✅ All local tests pass with SQLite
- ✅ Frontend builds without errors
- ✅ Production database has all required columns
- ✅ No 500 errors on login
- ✅ All API endpoints return expected status codes

## 📚 Lessons Learned

1. **Database schema changes MUST happen before code deployment**
2. **Local testing with SQLite catches most schema issues**
3. **Temporary fixes can prevent production outages**
4. **Comprehensive testing prevents deployment failures**
5. **Always test with the same database type (SQLite locally, PostgreSQL in production)**

---

**Remember: When in doubt, test locally first! 🧪**
