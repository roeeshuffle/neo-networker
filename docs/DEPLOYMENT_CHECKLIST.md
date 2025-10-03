# 🚨 DEPLOYMENT ERROR-SOLUTION CHECKLIST

## ⚠️ CRITICAL: Review this checklist before EVERY deployment!

### 1. **Database Schema Issues**
- **❌ Error**: `column tasks.title does not exist` (500 Internal Server Error)
- **❌ Error**: `column profiles.user_preferences does not exist` (500 Internal Server Error)
- **✅ Solution**: Ensure Task model is backward compatible with `getattr()` fallbacks
- **✅ Solution**: Always add new columns to production database BEFORE deploying code
- **🔍 Check**: Verify `to_dict()` method handles missing columns gracefully
- **🔍 Check**: Run database migration scripts before code deployment
- **📝 Files**: `backend/models/task.py`, `backend/routes/tasks.py`, `backend/dal/models/user.py`

### 2. **API Authentication Issues**
- **❌ Error**: `401 Unauthorized` on events API
- **✅ Solution**: All routes must use `@jwt_required()` and `get_jwt_identity()`
- **🔍 Check**: Verify events routes use JWT auth, not custom headers
- **📝 Files**: `backend/routes/events.py`

### 3. **API Parameter Format Issues**
- **❌ Error**: `start_date=[object Object]` instead of date strings
- **✅ Solution**: API client must format query parameters correctly
- **🔍 Check**: Verify `getEvents()` receives string parameters, not Date objects
- **📝 Files**: `src/integrations/api/client.ts`, `src/pages/Dashboard.tsx`

### 4. **Frontend Import/Export Issues**
- **❌ Error**: `"TasksTab" is not exported` (build failure)
- **✅ Solution**: Match default exports with default imports
- **🔍 Check**: Verify `export default Component` matches `import Component`
- **📝 Files**: All component files and their imports

### 5. **JSX Syntax Issues**
- **❌ Error**: `Unterminated regular expression` (build failure)
- **✅ Solution**: Check for extra closing tags, malformed JSX
- **🔍 Check**: Validate JSX syntax, especially closing tags
- **📝 Files**: All `.tsx` files

### 6. **Database Migration Issues**
- **❌ Error**: `column already exists` during migration
- **✅ Solution**: Check existing schema before applying migrations
- **🔍 Check**: Verify migration scripts handle existing columns
- **📝 Files**: `backend/alembic/versions/*.py`

### 7. **SQLAlchemy Relationship Conflicts**
- **❌ Error**: `property of that name exists on mapper` (backref conflicts)
- **✅ Solution**: Remove duplicate relationship definitions
- **🔍 Check**: Ensure only one side defines the relationship
- **📝 Files**: `backend/models/*.py`

### 8. **Excessive Logging Issues**
- **❌ Error**: Spam logs with repeated auth messages
- **✅ Solution**: Remove or reduce verbose logging statements
- **🔍 Check**: Verify no excessive `print()` statements in production code
- **📝 Files**: `backend/routes/auth.py`

### 9. **Mock Data Issues**
- **❌ Error**: "use mock data, api not available" in production
- **✅ Solution**: Remove all mock data fallbacks from production code
- **🔍 Check**: Verify no `import.meta.env.DEV` conditions for mock data
- **📝 Files**: All frontend components

### 10. **API Client Configuration Issues**
- **❌ Error**: API calls to `localhost` instead of production URL
- **✅ Solution**: Ensure `API_BASE_URL` points to production
- **🔍 Check**: Verify environment variable configuration
- **📝 Files**: `src/integrations/api/client.ts`

### 11. **🚨 CRITICAL: Directory Structure Issues**
- **❌ Error**: Duplicate nested directories (e.g., `backend/backend/`)
- **✅ Solution**: Verify clean directory structure before deployment
- **🔍 Check**: Run `find . -type d -name "*backend*"` to detect duplicates
- **📝 Files**: Entire project structure
- **⚠️ Impact**: Causes App Runner to use wrong files, breaking deployments

---

## 🔄 PRE-DEPLOYMENT CHECKLIST

### 🚨 CRITICAL STRUCTURE VALIDATION:
- [ ] **Run**: `find . -type d -name "*backend*"` - should only show `./backend`
- [ ] **Run**: `ls -la backend/` - verify no nested `backend/backend/` directory
- [ ] **Run**: `find . -name "*.py" | grep backend/backend` - should return empty
- [ ] **Verify**: App Runner `SourceDirectory` is set to `backend` (not nested)

### Backend Checks:
- [ ] All routes use proper JWT authentication
- [ ] Database models handle missing columns gracefully
- [ ] No excessive logging statements
- [ ] Migration scripts are safe for existing data
- [ ] No SQLAlchemy relationship conflicts
- [ ] **🚨 Directory structure is clean (no duplicate nested directories)**

### Frontend Checks:
- [ ] All imports/exports match (default vs named)
- [ ] JSX syntax is valid (no extra closing tags)
- [ ] No mock data fallbacks in production
- [ ] API client points to production URL
- [ ] Date parameters are properly formatted as strings

### Database Checks:
- [ ] **🚨 CRITICAL: New columns added to production database BEFORE code deployment**
- [ ] Migration scripts handle existing columns
- [ ] Models are backward compatible
- [ ] No duplicate relationship definitions
- [ ] **🚨 CRITICAL: Test database operations locally with SQLite before deploying**

### Testing Checks:
- [ ] **🚨 CRITICAL: Run local database tests with SQLite**
- [ ] Build completes without errors
- [ ] No console errors in browser
- [ ] API endpoints return expected status codes
- [ ] Authentication works properly
- [ ] **🚨 CRITICAL: Test User model operations locally**

---

## 🚀 DEPLOYMENT STEPS

1. **🚨 CRITICAL: Validate directory structure** ✅
   - Run: `find . -type d -name "*backend*"`
   - Run: `ls -la backend/`
   - Verify no nested directories exist
2. **Review this checklist** ✅
3. **Run local build test**: `npm run build`
4. **Check for linting errors**: `npm run lint` (if available)
5. **Commit changes**: `git add . && git commit -m "message"`
6. **Push to trigger deployment**: `git push origin main`
7. **Wait for deployment**: ~30 seconds
8. **Test production**: Check browser console for errors
9. **Monitor logs**: `aws logs tail /aws/apprunner/...`

---

## 📋 COMMON MISTAKES TO AVOID

- ❌ **🚨 CRITICAL: Deploying with duplicate nested directories**
- ❌ Deploying without checking database schema compatibility
- ❌ Using localhost URLs in production
- ❌ Leaving mock data fallbacks in production code
- ❌ Mismatched import/export statements
- ❌ Extra closing tags in JSX
- ❌ Duplicate SQLAlchemy relationships
- ❌ Excessive logging in production
- ❌ Missing JWT authentication on new routes
- ❌ Passing Date objects instead of strings to APIs
- ❌ Not handling missing database columns gracefully

---

## 🎯 SUCCESS CRITERIA

- ✅ Build completes without errors
- ✅ No 500 Internal Server Errors
- ✅ No 401 Unauthorized errors
- ✅ No console errors in browser
- ✅ All CRUD operations work
- ✅ Authentication works properly
- ✅ Clean logs without spam
- ✅ API parameters formatted correctly

---

**Remember: Always check this list before deploying! 🚨**
