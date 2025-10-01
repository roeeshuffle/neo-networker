# 🚀 DEPLOYMENT UPDATE GUIDE

## Overview
This guide shows you exactly how to update your deployment configurations and CI/CD pipelines to work with the new restructured project architecture.

## 🎯 What Needs to Be Updated

### 1. **AWS App Runner Configuration**
- Update `apprunner.yaml` to use new entry point
- Update Dockerfile paths and commands

### 2. **Docker Configuration**
- Update Dockerfile to use new structure
- Update docker-compose files

### 3. **CI/CD Pipeline Updates**
- Update build scripts
- Update deployment paths
- Update environment variables

## 📋 Step-by-Step Updates

### Step 1: Update AWS App Runner Configuration

**Current `apprunner.yaml`:**
```yaml
run:
  command: python app.py
```

**Updated `apprunner.yaml`:**
```yaml
run:
  command: python backend/main.py
```

### Step 2: Update Dockerfile

**Current Dockerfile:**
```dockerfile
COPY requirements.txt .
COPY . .
CMD ["python", "app.py"]
```

**Updated Dockerfile:**
```dockerfile
COPY backend/requirements.txt .
COPY backend/ .
CMD ["python", "main.py"]
```

### Step 3: Update Build Scripts

**Current build command:**
```bash
pip install -r requirements.txt
python app.py
```

**Updated build command:**
```bash
pip install -r backend/requirements.txt
python backend/main.py
```

## 🔧 Specific File Updates

### 1. Update `docker/apprunner.yaml`
```yaml
version: 1.0
runtime: python3
build:
  commands:
    pre_build:
      - echo "Pre-build step - no action needed"
    build:
      - echo "Installing dependencies..."
      - pip install -r backend/requirements.txt
run:
  runtime-version: 3.10.0
  command: python backend/main.py  # ← UPDATED
  network:
    port: 5002
    env: PORT
  env:
    - name: ENVIRONMENT
      value: production
    - name: PORT
      value: "5002"
```

### 2. Update `docker/Dockerfile.backend`
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from new location
COPY backend/requirements.txt .  # ← UPDATED

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY backend/ .  # ← UPDATED

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5002/api/health || exit 1

# Run the application with new entry point
CMD ["python", "main.py"]  # ← UPDATED
```

### 3. Update `docker/docker-compose.yml`
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    ports:
      - "5002:5002"
    environment:
      - FLASK_ENV=development
      - DATABASE_URL=postgresql://user:password@db:5432/neo_networker
    depends_on:
      - db
    volumes:
      - ../backend:/app  # ← UPDATED

  frontend:
    build:
      context: ../frontend  # ← UPDATED
      dockerfile: ../docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    volumes:
      - ../frontend:/app  # ← UPDATED
      - /app/node_modules

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=neo_networker
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔄 CI/CD Pipeline Updates

### GitHub Actions Example
```yaml
name: Deploy to AWS App Runner

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to AWS App Runner
      run: |
        # Update build context to backend directory
        aws apprunner start-deployment \
          --service-arn ${{ secrets.APP_RUNNER_SERVICE_ARN }} \
          --source-configuration '{
            "ImageRepository": {
              "ImageIdentifier": "your-image",
              "ImageConfiguration": {
                "Port": "5002",
                "RuntimeEnvironmentVariables": {
                  "ENVIRONMENT": "production"
                }
              }
            }
          }'
```

### Build Script Updates
```bash
#!/bin/bash
# build.sh

echo "Building Neo Networker..."

# Build backend
echo "Building backend..."
cd backend
pip install -r requirements.txt
python -m pytest tests/  # Run tests
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Build complete!"
```

## 🚀 Deployment Commands

### Local Development
```bash
# Backend
cd backend
python main.py

# Frontend
cd frontend
npm run dev

# Docker
docker-compose -f docker/docker-compose.yml up
```

### Production Deployment
```bash
# Build and push Docker image
docker build -f docker/Dockerfile.backend -t neo-backend .
docker push your-registry/neo-backend

# Deploy to AWS App Runner
aws apprunner start-deployment --service-arn YOUR_SERVICE_ARN
```

## ✅ Verification Steps

### 1. Test Local Build
```bash
cd backend
python main.py
# Should start on port 5002
```

### 2. Test Docker Build
```bash
docker build -f docker/Dockerfile.backend -t neo-backend .
docker run -p 5002:5002 neo-backend
```

### 3. Test API Endpoints
```bash
curl http://localhost:5002/api/health
curl http://localhost:5002/api/tasks
```

## 🎯 Key Changes Summary

| Component | Old Path | New Path |
|-----------|----------|----------|
| Entry Point | `app.py` | `backend/main.py` |
| Requirements | `requirements.txt` | `backend/requirements.txt` |
| Models | `models/` | `backend/dal/models/` |
| Routes | `routes/` | `backend/api/routes/` |
| Frontend | `src/` | `frontend/src/` |
| Tests | `test_*.py` | `tests/integration/` |

## 🚨 Important Notes

1. **Backup Current Deployment**: Before making changes, backup your current working deployment
2. **Test Locally First**: Always test the new configuration locally before deploying
3. **Gradual Rollout**: Consider deploying to a staging environment first
4. **Monitor Logs**: Watch deployment logs carefully for any issues
5. **Rollback Plan**: Have a rollback plan ready in case of issues

## 🎉 Benefits After Update

- ✅ Clean, professional architecture
- ✅ Better separation of concerns
- ✅ Easier maintenance and development
- ✅ Scalable structure for future growth
- ✅ Industry-standard project organization
