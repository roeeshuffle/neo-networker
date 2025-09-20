# Neo Networker Backend

A Flask-based backend API that replaces the Supabase backend for the Neo Networker application. This backend provides the same functionality as the original Supabase app but runs on PostgreSQL with Flask.

## Features

- **User Management**: Authentication, user profiles, and approval system
- **Contact Management**: CRUD operations for people/contacts
- **Company Management**: CRUD operations for companies
- **Task Management**: CRUD operations for tasks
- **Data Sharing**: Share contacts, companies, and tasks between users
- **CSV Processing**: Import contacts and companies from CSV files
- **Telegram Bot Integration**: Telegram bot functionality
- **Database Migrations**: Alembic for future migrations

## Project Structure

```
backend/
├── app.py              # Flask application entry point
├── requirements.txt    # Python dependencies
├── config.py           # Configuration settings
├── env.example         # Environment variables template
├── init_db.py          # Script to run existing Supabase migrations
├── docker-compose.yml  # PostgreSQL setup
├── models/             # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── user.py
│   ├── person.py
│   ├── company.py
│   ├── task.py
│   ├── shared_data.py
│   └── telegram_user.py
├── routes/             # API routes
│   ├── __init__.py
│   ├── auth.py
│   ├── people.py
│   ├── companies.py
│   ├── tasks.py
│   ├── csv.py
│   └── telegram.py
├── services/           # Business logic
│   ├── __init__.py
│   ├── auth_service.py
│   └── person_service.py
├── alembic/            # Database migrations
│   ├── env.py
│   └── versions/
└── migrations/         # Existing Supabase migrations (copied from parent)
```

## Setup Instructions

### 1. Environment Setup

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your configuration:
   ```bash
   DATABASE_URL=postgresql://postgres:password@localhost:5432/neo_networker
   SECRET_KEY=your-secret-key-here
   JWT_SECRET_KEY=jwt-secret-string
   ```

### 2. Database Setup

1. Start PostgreSQL with Docker:
   ```bash
   docker-compose up -d
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run existing Supabase migrations:
   ```bash
   python init_db.py
   ```

4. Set up Alembic for future migrations:
   ```bash
   alembic upgrade head
   ```

### 3. Run the Application

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/approve/<user_id>` - Approve a user (admin only)
- `GET /api/auth/users` - Get all users (admin only)

### People/Contacts
- `GET /api/people` - Get all people for current user
- `POST /api/people` - Create a new person
- `PUT /api/people/<person_id>` - Update a person
- `DELETE /api/people/<person_id>` - Delete a person
- `POST /api/people/<person_id>/share` - Share a person with another user

### Companies
- `GET /api/companies` - Get all companies for current user
- `POST /api/companies` - Create a new company
- `PUT /api/companies/<company_id>` - Update a company
- `DELETE /api/companies/<company_id>` - Delete a company
- `POST /api/companies/<company_id>/share` - Share a company with another user

### Tasks
- `GET /api/tasks` - Get all tasks for current user
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/<task_id>` - Update a task
- `DELETE /api/tasks/<task_id>` - Delete a task
- `POST /api/tasks/<task_id>/share` - Share a task with another user

### CSV Processing
- `POST /api/csv-processor` - Process CSV data for people
- `POST /api/company-csv-processor` - Process CSV data for companies

### Telegram Bot
- `POST /api/telegram/auth` - Authenticate telegram user
- `POST /api/telegram/webhook` - Handle telegram webhook
- `POST /api/telegram/setup-webhook` - Setup telegram webhook

### Test CRUD (Users)
- `GET /api/users` - Get all users
- `POST /api/users` - Create a user
- `PUT /api/users/<user_id>` - Update a user
- `DELETE /api/users/<user_id>` - Delete a user

## Database Schema

The database schema matches the original Supabase schema with the following main tables:

- **profiles** - User profiles with approval system
- **people** - Contact management
- **companies** - Company records
- **tasks** - Task management
- **shared_data** - Data sharing between users
- **telegram_users** - Telegram bot integration

## Migration Strategy

1. **Existing Data**: The `init_db.py` script runs all existing Supabase migrations to recreate the schema
2. **Future Changes**: Use Alembic for new migrations:
   ```bash
   alembic revision --autogenerate -m "Description of changes"
   alembic upgrade head
   ```

## AWS Deployment

To deploy to AWS with RDS:

1. Update `DATABASE_URL` in your environment to point to your RDS instance
2. Run migrations: `alembic upgrade head`
3. Deploy your Flask application to AWS (ECS, Lambda, EC2, etc.)

## Development

### Adding New Features

1. Create models in `models/`
2. Add routes in `routes/`
3. Implement business logic in `services/`
4. Create migrations with Alembic
5. Test with the provided CRUD endpoints

### Testing

The application includes test CRUD endpoints for users at `/api/users` that you can use to verify the setup is working correctly.

## Notes

- All routes require JWT authentication except for registration and login
- Admin users are automatically approved (guy@wershuffle.com, roee2912@gmail.com)
- The API maintains the same structure as the original Supabase app for frontend compatibility
- CORS is enabled for frontend integration
