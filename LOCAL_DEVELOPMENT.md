# 🚀 Neo Networker - Local Development Environment

This guide helps you run the Neo Networker application locally using Docker for development and testing.

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed
- **Git** (to clone the repository)
- **Ports available**: 3000 (frontend), 5002 (backend), 5432 (PostgreSQL)

## 🏃‍♂️ Quick Start

### 1. Start the Application
```bash
./run-local.sh start
```

This will:
- ✅ Check Docker is running
- ✅ Create `.env.local` configuration
- ✅ Build and start all services
- ✅ Set up PostgreSQL database

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5002
- **PostgreSQL**: localhost:5432

### 3. View Logs
```bash
./run-local.sh logs
```

### 4. Stop the Application
```bash
./run-local.sh stop
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `./run-local.sh start` | Start the local development environment |
| `./run-local.sh stop` | Stop all services |
| `./run-local.sh restart` | Restart all services |
| `./run-local.sh logs` | Show application logs |
| `./run-local.sh status` | Show service status |
| `./run-local.sh reset-db` | Reset database (⚠️ deletes all data) |
| `./run-local.sh help` | Show help message |

## 🏗️ Architecture

### Services
- **PostgreSQL**: Local database on port 5432
- **Backend**: Flask API on port 5002
- **Frontend**: React development server on port 3000

### Configuration
- **Environment**: `env.local` → `.env.local`
- **Database**: `neo_networker_local` (local PostgreSQL)
- **API URL**: `http://localhost:5002` (for frontend)

## 🧪 Testing the Application

### 1. Create a Test User
```bash
# Access the backend container
docker exec -it neo_networker_backend_local bash

# Run Python to create a test user
python3 -c "
from dal.database import db
from dal.models.user import User
from werkzeug.security import generate_password_hash
import uuid

# Create test user
user = User(
    id=str(uuid.uuid4()),
    full_name='Test User',
    email='test@localhost',
    password_hash=generate_password_hash('123456'),
    is_approved=True
)

db.session.add(user)
db.session.commit()
print('Test user created: test@localhost / 123456')
"
```

### 2. Login to Frontend
- Go to http://localhost:3000
- Login with: `test@localhost` / `123456`

### 3. Test Custom Fields
- Go to Settings → Contact Management → Custom Fields
- Add a custom field (e.g., "Test Field")
- Verify it appears in the list

## 🔧 Development Workflow

### Making Changes
1. **Code changes** are automatically reflected (volume mounts)
2. **Backend changes**: Restart backend container
3. **Frontend changes**: Hot reload (no restart needed)
4. **Database changes**: May need to reset database

### Debugging
```bash
# View all logs
./run-local.sh logs

# View specific service logs
docker-compose -f docker-compose.local.yml logs -f backend
docker-compose -f docker-compose.local.yml logs -f frontend
docker-compose -f docker-compose.local.yml logs -f postgres

# Access containers
docker exec -it neo_networker_backend_local bash
docker exec -it neo_networker_frontend_local sh
docker exec -it neo_networker_postgres_local psql -U postgres -d neo_networker_local
```

## 🗄️ Database Management

### Reset Database
```bash
./run-local.sh reset-db
```

### Access Database Directly
```bash
# Using psql
docker exec -it neo_networker_postgres_local psql -U postgres -d neo_networker_local

# Using pgAdmin (if you have it installed)
# Connect to localhost:5432 with postgres/localpassword
```

### Database Schema
The application will automatically create tables when it starts. You can check the schema:
```sql
-- List all tables
\dt

-- Check users table
SELECT * FROM profiles;

-- Check custom fields
SELECT user_preferences FROM profiles WHERE email = 'test@localhost';
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5002
lsof -i :5432

# Kill the process or change ports in docker-compose.local.yml
```

#### 2. Docker Build Fails
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose -f docker-compose.local.yml build --no-cache
```

#### 3. Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose -f docker-compose.local.yml ps postgres

# Check PostgreSQL logs
docker-compose -f docker-compose.local.yml logs postgres
```

#### 4. Frontend Can't Connect to Backend
- Check `VITE_API_URL` in frontend environment
- Verify backend is running on port 5002
- Check CORS settings in backend

### Reset Everything
```bash
# Stop and remove everything
docker-compose -f docker-compose.local.yml down -v --remove-orphans

# Remove all images
docker rmi $(docker images -q)

# Start fresh
./run-local.sh start
```

## 📝 Environment Variables

The local environment uses these key variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres:localpassword@postgres:5432/neo_networker_local` | Database connection |
| `SECRET_KEY` | `local-development-secret-key` | Flask secret key |
| `JWT_SECRET_KEY` | `local-jwt-secret-key-for-development` | JWT signing key |
| `FRONTEND_URL` | `http://localhost:3000` | Frontend URL for CORS |
| `VITE_API_URL` | `http://localhost:5002` | Backend API URL |

## 🎯 Production vs Local

| Aspect | Production | Local |
|--------|------------|-------|
| Database | AWS RDS PostgreSQL | Local PostgreSQL |
| Backend | AWS App Runner | Local Docker |
| Frontend | AWS S3 + CloudFront | Local dev server |
| Environment | Production config | Development config |
| SSL | HTTPS | HTTP |
| Domain | Custom domain | localhost |

## 📚 Next Steps

1. **Test the application** with the local environment
2. **Make changes** and see them reflected immediately
3. **Debug issues** using the logs and database access
4. **Deploy to production** when ready

Happy coding! 🚀
