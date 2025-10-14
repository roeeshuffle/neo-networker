from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import sys
import logging
from dotenv import load_dotenv
from dal.database import db

# Add parent directory to Python path for scripts
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('telegram_bot.log')
    ]
)

# Reduce Werkzeug (Flask's built-in server) logging to reduce noise
werkzeug_logger = logging.getLogger('werkzeug')
werkzeug_logger.setLevel(logging.ERROR)  # Only show errors, not INFO requests

# Load environment variables
load_dotenv()

# Check if we're in testing mode before configuring database
TESTING = os.getenv('TESTING', 'false').lower() == 'true'

# Initialize Flask app
app = Flask(__name__)

# Set testing flag
app.config['TESTING'] = TESTING

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Database configuration - use environment variable or default
database_url = os.getenv('DATABASE_URL')
if not database_url:
    if TESTING:
        # Use SQLite for testing
        database_url = 'sqlite:///:memory:'
        print(f"🧪 TESTING: Using SQLite in-memory database")
    else:
        # Try to use a default production database URL
        database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/neo_networker')
        print(f"⚠️  WARNING: DATABASE_URL not set, using default: {database_url}")

# Only set database URL if not in testing mode
if not TESTING:
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'change-this-secret-key-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# Configure CORS to allow localhost for development
CORS(app, origins=[
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://d2fq8k5py78ii.cloudfront.net',  # Production frontend
    'https://dkdrn34xpx.us-east-1.awsapprunner.com'  # Production backend
], supports_credentials=True, 
    allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Test database connection
try:
    with app.app_context():
        db.engine.connect()
        print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("⚠️  Application will start but database operations may fail")


# Import models after db initialization
from dal.models import User, Person, Task, Event, Notification

# Import routes
from api.routes import auth_bp, people_bp, tasks_bp, csv_bp, telegram_bp
from api.routes.events import events_bp
from api.routes.telegram_auth import telegram_auth_bp
from api.routes.whatsapp import whatsapp_bp
from api.routes.google_auth import google_auth_bp
from api.routes.admin import admin_bp
from api.routes.user_preferences import user_preferences_bp
from api.routes.custom_fields import custom_fields_bp
from api.routes.csv_simple import csv_simple_bp
from api.routes.csv_simple_mapping import csv_simple_mapping_bp
from api.routes.user_group import user_group_bp
from api.routes.notifications import notifications_bp
from api.routes.plan import plan_bp
from api.routes.email import email_bp
# Removed db_migration import - migration completed
# Removed temporary fix routes - no longer needed

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(people_bp, url_prefix='/api')
# app.register_blueprint(companies_bp, url_prefix='/api')  # Removed - Company model deleted
app.register_blueprint(tasks_bp, url_prefix='/api')
app.register_blueprint(events_bp, url_prefix='/api')
app.register_blueprint(csv_bp, url_prefix='/api')
app.register_blueprint(telegram_bp, url_prefix='/api')
app.register_blueprint(telegram_auth_bp, url_prefix='/api')
app.register_blueprint(whatsapp_bp, url_prefix='/api')
app.register_blueprint(google_auth_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(user_preferences_bp, url_prefix='/api')
app.register_blueprint(custom_fields_bp, url_prefix='/api')
app.register_blueprint(csv_simple_bp, url_prefix='/api')
app.register_blueprint(csv_simple_mapping_bp, url_prefix='/api')
app.register_blueprint(user_group_bp, url_prefix='/api')
app.register_blueprint(notifications_bp, url_prefix='/api')
app.register_blueprint(plan_bp, url_prefix='/api')
app.register_blueprint(email_bp, url_prefix='/api')
# app.register_blueprint(migration_bp, url_prefix='/api')  # Disabled - using direct endpoint instead
# Removed temporary fix blueprint registrations - no longer needed

@app.route('/api/health')
def health_check():
    print("🔍 HEALTH DEBUG: Health check called")
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.route('/api/health-fix', methods=['GET'])
def health_check_with_fix():
    """Health check that also fixes database issues"""
    try:
        # Try to fix database issues
        db.session.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255);")
        db.session.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);")
        db.session.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(255);")
        db.session.execute("DROP TABLE IF EXISTS telegram_users CASCADE;")
        db.session.execute("DROP TABLE IF EXISTS companies CASCADE;")
        db.session.execute("DROP TABLE IF EXISTS shared_data CASCADE;")
        db.session.commit()
        
        return jsonify({
            'status': 'healthy', 
            'timestamp': datetime.utcnow().isoformat(),
            'database_fixed': True
        })
    except Exception as e:
        return jsonify({
            'status': 'healthy', 
            'timestamp': datetime.utcnow().isoformat(),
            'database_fix_error': str(e)
        })

@app.route('/api/migration-test', methods=['GET'])
def migration_test():
    """Test endpoint to verify migration is working"""
    return jsonify({'message': 'Migration endpoint is working', 'status': 'ok'})

@app.route('/api/quick-fix', methods=['POST'])
def quick_fix():
    """Quick fix for database structure issues"""
    try:
        logger.info("🚀 Starting quick database fix...")
        
        # Add missing columns to users table
        db.session.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255);")
        db.session.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);")
        db.session.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(255);")
        
        # Drop problematic tables
        db.session.execute("DROP TABLE IF EXISTS telegram_users CASCADE;")
        db.session.execute("DROP TABLE IF EXISTS companies CASCADE;")
        db.session.execute("DROP TABLE IF EXISTS shared_data CASCADE;")
        
        db.session.commit()
        
        logger.info("✅ Quick fix completed successfully")
        return jsonify({
            'message': 'Quick database fix completed successfully',
            'status': 'success'
        }), 200
        
    except Exception as e:
        logger.error(f"💥 Error in quick fix: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/fix-database', methods=['POST'])
def fix_database():
    """Run database migration to update production database structure"""
    try:
        logger.info("🚀 Starting production database migration...")
        
        # Execute migration SQL statements one by one
        migration_statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id VARCHAR(255);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp_phone_number VARCHAR(255);",
        ]
        
        # Execute each statement
        for statement in migration_statements:
            try:
                db.session.execute(statement)
                logger.info(f"✅ Executed: {statement}")
            except Exception as e:
                logger.warning(f"⚠️ Statement warning: {e}")
        
        # Rename columns if they exist
        try:
            db.session.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') 
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
                        ALTER TABLE users RENAME COLUMN name TO full_name;
                    END IF;
                END $$;
            """)
            logger.info("✅ Renamed 'name' to 'full_name' if needed")
        except Exception as e:
            logger.warning(f"⚠️ Rename warning: {e}")
        
        try:
            db.session.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') 
                       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
                        ALTER TABLE users RENAME COLUMN password TO password_hash;
                    END IF;
                END $$;
            """)
            logger.info("✅ Renamed 'password' to 'password_hash' if needed")
        except Exception as e:
            logger.warning(f"⚠️ Rename warning: {e}")
        
        # Migrate telegram_users data if table exists
        try:
            db.session.execute("""
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'telegram_users') THEN
                        UPDATE users 
                        SET telegram_id = tu.telegram_id,
                            telegram_username = tu.telegram_username
                        FROM telegram_users tu 
                        WHERE users.id = tu.user_id;
                    END IF;
                END $$;
            """)
            logger.info("✅ Migrated telegram_users data if table existed")
        except Exception as e:
            logger.warning(f"⚠️ Telegram migration warning: {e}")
        
        # Drop unnecessary tables
        drop_statements = [
            "DROP TABLE IF EXISTS telegram_users CASCADE;",
            "DROP TABLE IF EXISTS companies CASCADE;",
            "DROP TABLE IF EXISTS shared_data CASCADE;"
        ]
        
        for statement in drop_statements:
            try:
                db.session.execute(statement)
                logger.info(f"✅ Executed: {statement}")
            except Exception as e:
                logger.warning(f"⚠️ Drop warning: {e}")
        
        # Commit all changes
        db.session.commit()
        
        logger.info("✅ Database migration completed successfully")
        return jsonify({
            'message': 'Database migration completed successfully',
            'status': 'success'
        }), 200
        
    except Exception as e:
        logger.error(f"💥 Error in migration endpoint: {e}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Removed Google OAuth endpoint - Google OAuth fields removed from User model

# Removed excessive request/response logging to reduce log noise
# @app.before_request and @app.after_request decorators removed

@app.route('/api/users', methods=['GET'])
@jwt_required()
def get_users():
    """Get all users - for testing CRUD functionality"""
    try:
        users = User.query.all()
        return jsonify([{
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'is_approved': user.is_approved,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None
        } for user in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user - for testing CRUD functionality"""
    try:
        data = request.get_json()
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User already exists'}), 400
        
        user = User(
            email=data['email'],
            full_name=data.get('full_name', ''),
            is_approved=data.get('is_approved', False)
        )
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'is_approved': user.is_approved,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update a user - for testing CRUD functionality"""
    try:
        user = User.query.get_or_404(user_id)
        data = request.get_json()
        
        user.full_name = data.get('full_name', user.full_name)
        user.is_approved = data.get('is_approved', user.is_approved)
        user.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'is_approved': user.is_approved,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user - for testing CRUD functionality"""
    try:
        user = User.query.get_or_404(user_id)
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    # Production vs Development
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('PORT', 5002))
    
    if os.getenv('ENVIRONMENT') == 'production':
        # Production: Use Gunicorn
        app.run(debug=False, host='0.0.0.0', port=port)
    else:
        # Development
        app.run(debug=debug_mode, host='0.0.0.0', port=port)
