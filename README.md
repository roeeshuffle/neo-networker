# 🚀 Neo Networker - Professional CRM System

A modern, full-stack CRM application with task management, event scheduling, and contact management capabilities.

## 🏗️ Architecture Overview

This project follows a **clean, layered architecture** with clear separation of concerns:

```
neo-networker/
├── 📁 backend/                    # Backend API Layer
│   ├── 📁 dal/                   # Data Access Layer
│   │   ├── models/               # SQLAlchemy Models
│   │   ├── migrations/           # Database Migrations
│   │   └── database.py           # Database Connection
│   ├── 📁 bl/                    # Business Logic Layer
│   │   ├── services/             # Business Services
│   │   └── utils/                # Business Utilities
│   ├── 📁 dsl/                   # Domain Service Layer
│   │   ├── auth/                 # Authentication Services
│   │   ├── tasks/                # Task Domain Services
│   │   ├── events/               # Event Domain Services
│   │   └── contacts/             # Contact Domain Services
│   ├── 📁 api/                   # API Layer
│   │   ├── routes/               # Flask Routes
│   │   ├── middleware/           # Middleware
│   │   └── app.py                # Flask App
│   ├── 📁 config/                # Configuration
│   ├── 📁 utils/                 # General Utilities
│   └── main.py                   # Entry Point
├── 📁 frontend/                  # Frontend Layer
│   ├── src/                      # React Source Code
│   ├── public/                   # Static Assets
│   └── dist/                     # Build Output
├── 📁 tests/                     # Test Layer
│   ├── unit/                     # Unit Tests
│   ├── integration/              # Integration Tests
│   └── e2e/                      # End-to-End Tests
├── 📁 docker/                    # Docker Configuration
├── 📁 docs/                      # Documentation
└── 📁 scripts/                   # Utility Scripts
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 13+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Docker Setup
```bash
docker-compose -f docker/docker-compose.new.yml up
```

## 🎯 Features

### ✅ **Tasks Management**
- Create, update, delete tasks
- Project-based organization
- Scheduled tasks with future activation
- Quick "done" button
- Status filtering (todo, in_progress, completed)

### ✅ **Events & Calendar**
- Create meetings and events
- Daily, weekly, monthly calendar views
- Event types (meeting/event)
- Location and participant management
- Repeat patterns and alerts

### ✅ **Contact Management**
- Full contact CRUD operations
- CSV import/export
- Duplicate detection and management
- Contact sharing capabilities

### ✅ **Dashboard**
- Today's events count
- Today's tasks count
- Total open tasks
- Real-time statistics

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event

### Contacts
- `GET /api/people` - Get all contacts
- `POST /api/people` - Create contact
- `PUT /api/people/{id}` - Update contact
- `DELETE /api/people/{id}` - Delete contact

## 🧪 Testing

### Run Integration Tests
```bash
python tests/integration/test_with_real_auth.py
```

### Expected Results
- ✅ Tasks GET: 200
- ✅ Events GET: 200
- ✅ Tasks POST: 201
- ✅ Events POST: 201

## 🐳 Docker

### Backend Container
```bash
docker build -f docker/Dockerfile.backend.new -t neo-backend .
```

### Frontend Container
```bash
docker build -f docker/Dockerfile.frontend -t neo-frontend .
```

### Full Stack
```bash
docker-compose -f docker/docker-compose.new.yml up
```

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT_SUCCESS_CHECKLIST.md)
- [Error Prevention](docs/QUICK_ERROR_PREVENTION.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Testing Guide](docs/TESTING_GUIDE.md)

## 🔒 Security

- JWT-based authentication
- Password hashing with Werkzeug
- CORS protection
- Input validation and sanitization

## 🚀 Deployment

### AWS App Runner
The application is configured for AWS App Runner deployment with:
- Automatic scaling
- Load balancing
- SSL termination
- Environment variable management

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET_KEY=your-secret-key
FLASK_ENV=production
```

## 🎉 Status

**✅ ALL SYSTEMS OPERATIONAL**
- Backend API: ✅ Working
- Frontend UI: ✅ Working
- Database: ✅ Connected
- Authentication: ✅ Secure
- Tasks & Events: ✅ Fully Functional

## 🤝 Contributing

1. Follow the layered architecture
2. Write tests for new features
3. Update documentation
4. Run integration tests before deployment

## 📄 License

This project is proprietary software. All rights reserved.
