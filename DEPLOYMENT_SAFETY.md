# DEPLOYMENT SAFETY CHECKLIST

## ⚠️ CRITICAL: NEVER DEPLOY TO PRODUCTION WITHOUT EXPLICIT USER PERMISSION

### Before Any Production Deployment:
1. ✅ User has explicitly requested production deployment
2. ✅ All changes have been tested locally
3. ✅ User has confirmed they want to proceed
4. ✅ No automatic deployments without permission

### Local Development Only:
- Test all changes locally first
- Use `http://localhost:3000` for frontend
- Use `http://localhost:5002` for backend
- Never assume production deployment is needed

### If AWS CLI is needed:
- Only re-enable with explicit user permission
- Use `mv /opt/homebrew/bin/aws.disabled /opt/homebrew/bin/aws` to restore
- Always ask before running any AWS commands

### Emergency Rollback:
- If accidental deployment occurs, immediately stop the service
- Contact user for guidance on rollback procedures

---
**Remember: The user's data and production environment are their responsibility. Always ask first!**
