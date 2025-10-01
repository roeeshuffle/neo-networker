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

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Database configuration - use environment variable or default
database_url = os.getenv('DATABASE_URL')
if not database_url:
    # Try to use a default production database URL
    database_url = 'postgresql://postgres:123456@localhost:5432/neo_networker'
    print(f"⚠️  WARNING: DATABASE_URL not set, using default: {database_url}")

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app)

# Test database connection
try:
    with app.app_context():
        db.engine.connect()
        print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    print("⚠️  Application will start but database operations may fail")


# Import models after db initialization
from dal.models import User, Person, Task, Event

# Import routes
from api.routes import auth_bp, people_bp, tasks_bp, csv_bp, telegram_bp
from api.routes.events import events_bp
from api.routes.telegram_auth import telegram_auth_bp
from api.routes.whatsapp import whatsapp_bp
from api.routes.google_auth import google_auth_bp
from api.routes.admin import admin_bp
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
# Removed temporary fix blueprint registrations - no longer needed

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

# Removed Google OAuth endpoint - Google OAuth fields removed from User model

@app.before_request
def log_request_info():
    # Only log important requests, skip repetitive auth checks and user management
    skip_patterns = ['/api/auth/me', '/api/health', '/api/auth/users']
    if not any(pattern in request.url for pattern in skip_patterns):
        app.logger.info(f'{request.method} {request.url} from {request.remote_addr}')

@app.after_request
def log_response_info(response):
    # Only log important responses, skip repetitive auth checks and user management
    skip_patterns = ['/api/auth/me', '/api/health', '/api/auth/users']
    if not any(pattern in request.url for pattern in skip_patterns):
        app.logger.info(f'Response: {response.status_code}')
    return response

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
