# 🚀 DEPLOYMENT QUICK REFERENCE

## ⚡ Quick Commands

### Build & Test Locally
```bash
# Build everything
./build.sh

# Test backend
cd backend && python main.py

# Test frontend  
cd frontend && npm run dev

# Test with Docker
docker-compose -f docker/docker-compose.yml up
```

### Deploy to Production
```bash
# Deploy to AWS App Runner
./deploy.sh

# Or manually
aws apprunner start-deployment --service-arn YOUR_SERVICE_ARN
```

## 🔧 Key Configuration Changes

### 1. **Entry Point Changed**
- **Old**: `python app.py`
- **New**: `python backend/main.py`

### 2. **Requirements Path Changed**
- **Old**: `requirements.txt`
- **New**: `backend/requirements.txt`

### 3. **Docker Context Changed**
- **Old**: `COPY . .`
- **New**: `COPY backend/ .`

## 📁 File Structure Changes

| Component | Old Location | New Location |
|-----------|--------------|--------------|
| Backend Entry | `app.py` | `backend/main.py` |
| Requirements | `requirements.txt` | `backend/requirements.txt` |
| Models | `models/` | `backend/dal/models/` |
| Routes | `routes/` | `backend/api/routes/` |
| Frontend | `src/` | `frontend/src/` |
| Tests | `test_*.py` | `tests/integration/` |

## 🐳 Docker Commands

### Build Images
```bash
# Backend
docker build -f docker/Dockerfile.backend -t neo-backend .

# Frontend
docker build -f docker/Dockerfile.frontend -t neo-frontend .

# Both with compose
docker-compose -f docker/docker-compose.yml build
```

### Run Containers
```bash
# Run all services
docker-compose -f docker/docker-compose.yml up

# Run backend only
docker run -p 5002:5002 neo-backend

# Run frontend only
docker run -p 3000:3000 neo-frontend
```

## 🔍 Testing Commands

### API Testing
```bash
# Test all APIs
python tests/integration/test_with_real_auth.py

# Test specific endpoints
curl http://localhost:5002/api/health
curl http://localhost:5002/api/tasks
curl http://localhost:5002/api/events
```

### Health Checks
```bash
# Backend health
curl http://localhost:5002/api/health

# Frontend health
curl http://localhost:3000
```

## 🚨 Troubleshooting

### Common Issues

1. **Import Errors**
   - Check if all imports use new paths
   - Verify `backend/main.py` exists

2. **Docker Build Fails**
   - Check Dockerfile paths
   - Verify `backend/requirements.txt` exists

3. **Deployment Fails**
   - Check AWS credentials
   - Verify App Runner service ARN
   - Check deployment logs

### Debug Commands
```bash
# Check backend structure
ls -la backend/

# Check imports
cd backend && python -c "from api.app import app; print('OK')"

# Check Docker build
docker build -f docker/Dockerfile.backend -t test-build .

# Check AWS connection
aws sts get-caller-identity
```

## 📋 Pre-Deployment Checklist

- [ ] Run `./build.sh` successfully
- [ ] Test locally with `python backend/main.py`
- [ ] Test Docker build
- [ ] Verify AWS credentials
- [ ] Check App Runner service ARN
- [ ] Run integration tests
- [ ] Check all API endpoints

## 🎯 Post-Deployment Verification

- [ ] Health check returns 200
- [ ] Tasks API works
- [ ] Events API works
- [ ] Authentication works
- [ ] Frontend loads correctly
- [ ] All features functional

## 📞 Support

If you encounter issues:
1. Check the logs: `aws logs describe-log-groups`
2. Run tests: `python tests/integration/test_with_real_auth.py`
3. Verify structure: `./verify_restructure.py`
4. Check this guide: `DEPLOYMENT_UPDATE_GUIDE.md`
