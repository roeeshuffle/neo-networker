# 🚨 QUICK ERROR REFERENCE

## Most Common Errors & Immediate Fixes

### 1. **500 Internal Server Error on Tasks**
```bash
# Error: column tasks.title does not exist
# Fix: Make Task model backward compatible
```
**Quick Fix**: Check `backend/models/task.py` - ensure `getattr()` fallbacks exist

### 2. **401 Unauthorized on Events**
```bash
# Error: User not authenticated
# Fix: Add JWT authentication
```
**Quick Fix**: Add `@jwt_required()` to events routes in `backend/routes/events.py`

### 3. **Build Failure - Import/Export Mismatch**
```bash
# Error: "Component" is not exported
# Fix: Match default exports with default imports
```
**Quick Fix**: Change `import { Component }` to `import Component`

### 4. **Build Failure - JSX Syntax**
```bash
# Error: Unterminated regular expression
# Fix: Remove extra closing tags
```
**Quick Fix**: Check for extra `</div>` or malformed JSX

### 5. **API Parameter Issues**
```bash
# Error: start_date=[object Object]
# Fix: Pass strings, not Date objects
```
**Quick Fix**: Use `.toISOString()` on Date objects before API calls

### 6. **Database Migration Conflicts**
```bash
# Error: column already exists
# Fix: Check existing schema first
```
**Quick Fix**: Make migrations handle existing columns gracefully

### 7. **SQLAlchemy Backref Conflicts**
```bash
# Error: property of that name exists on mapper
# Fix: Remove duplicate relationships
```
**Quick Fix**: Keep relationship definition on only one side

### 8. **Excessive Logging**
```bash
# Error: Spam logs with repeated messages
# Fix: Remove verbose logging
```
**Quick Fix**: Remove `print()` statements from production code

### 9. **Mock Data in Production**
```bash
# Error: "use mock data, api not available"
# Fix: Remove mock data fallbacks
```
**Quick Fix**: Remove all `import.meta.env.DEV` conditions

### 10. **Wrong API URL**
```bash
# Error: API calls to localhost
# Fix: Use production URL
```
**Quick Fix**: Ensure `API_BASE_URL` points to AWS App Runner

---

## 🔍 Quick Debug Commands

```bash
# Check build
npm run build

# Check backend logs
aws logs tail /aws/apprunner/neo-networker-backend-final/3f3d591c486b4865b677fe0a518ac976/application --since 5m

# Test API endpoints
curl -X GET https://dkdrn34xpx.us-east-1.awsapprunner.com/api/health
curl -X GET https://dkdrn34xpx.us-east-1.awsapprunner.com/api/tasks

# Check database migration status
cd backend && alembic current
```

---

## ⚡ Emergency Fixes

### If Tasks API fails:
1. Check `backend/models/task.py` for `getattr()` fallbacks
2. Verify `backend/routes/tasks.py` handles missing columns
3. Ensure backward compatibility

### If Events API fails:
1. Check `backend/routes/events.py` for `@jwt_required()`
2. Verify JWT authentication is properly implemented
3. Ensure no custom header authentication

### If Frontend fails to build:
1. Check all imports/exports match
2. Look for JSX syntax errors
3. Verify no extra closing tags

### If API calls fail:
1. Check `src/integrations/api/client.ts` for correct URL
2. Verify parameters are strings, not objects
3. Ensure no mock data fallbacks

---

**🚨 Always check this reference before deploying!**
