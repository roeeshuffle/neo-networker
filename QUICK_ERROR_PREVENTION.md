# 🚨 QUICK ERROR PREVENTION GUIDE

## **CRITICAL RULES TO PREVENT ERRORS**

### **Rule 1: Always Test Before Deploying**
```bash
# Run this script before EVERY deployment
python test_with_real_auth.py
```
**✅ SUCCESS**: All endpoints return 200/201  
**❌ FAILURE**: Any endpoint returns 500

### **Rule 2: Database Schema Fix**
```bash
# Run this if you see 500 errors
curl -X POST https://dkdrn34xpx.us-east-1.awsapprunner.com/api/comprehensive-fix
```

### **Rule 3: Task Model Requirements**
```python
# backend/models/task.py - ALWAYS include this:
text = db.Column(db.Text, nullable=False, default='')  # Prevents NOT NULL errors
```

### **Rule 4: Task Creation Requirements**
```python
# backend/routes/tasks.py - ALWAYS include this:
task = Task(
    # ... other fields ...
    text=data['title']  # Prevents constraint violations
)
```

---

## **COMMON ERRORS & FIXES**

### **Error: `null value in column "text" violates not-null constraint`**
**Fix**: Ensure Task model has `text` field with `default=''` and Task creation sets `text=data['title']`

### **Error: `column events.event_type does not exist`**
**Fix**: Run comprehensive fix endpoint

### **Error: `column tasks.title does not exist`**
**Fix**: Run comprehensive fix endpoint

### **Error: Any 500 error on authenticated requests**
**Fix**: Run comprehensive fix endpoint

---

## **DEPLOYMENT CHECKLIST**

- [ ] **Test with real auth**: `python test_with_real_auth.py`
- [ ] **Run database fix**: `curl -X POST https://dkdrn34xpx.us-east-1.awsapprunner.com/api/comprehensive-fix`
- [ ] **Test again**: `python test_with_real_auth.py`
- [ ] **Deploy**: `git add . && git commit -m "message" && git push origin main`
- [ ] **Wait**: 60 seconds for deployment
- [ ] **Final test**: `python test_with_real_auth.py`

**🎯 SUCCESS**: All endpoints return 200/201  
**🚨 FAILURE**: Any endpoint returns 500
