from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import os
import logging
from dotenv import load_dotenv
from database import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('telegram_bot.log')
    ]
)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
# Use local PostgreSQL database to access existing data
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:123456@localhost:5432/neo_networker')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app)


# Import models after db initialization
from models import User, Person, Company, Task, SharedData, TelegramUser

# Import routes
from routes import auth_bp, people_bp, companies_bp, tasks_bp, csv_bp, telegram_bp
from routes.telegram_auth import telegram_auth_bp
from routes.whatsapp import whatsapp_bp
from routes.admin import admin_bp
from routes.db_fix import db_fix_bp
from routes.db_fix_state_data import db_fix_bp as db_fix_state_data_bp
from routes.add_state_data import add_state_data_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(people_bp, url_prefix='/api')
app.register_blueprint(companies_bp, url_prefix='/api')
app.register_blueprint(tasks_bp, url_prefix='/api')
app.register_blueprint(csv_bp, url_prefix='/api')
app.register_blueprint(telegram_bp, url_prefix='/api')
app.register_blueprint(telegram_auth_bp, url_prefix='/api')
app.register_blueprint(whatsapp_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(db_fix_bp, url_prefix='/api')
app.register_blueprint(db_fix_state_data_bp, url_prefix='/api')
app.register_blueprint(add_state_data_bp, url_prefix='/api')

@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()})

@app.before_request
def log_request_info():
    print(f"🌐 REQUEST: {request.method} {request.url} from {request.remote_addr}")
    print(f"🌐 HEADERS: {dict(request.headers)}")
    if request.is_json and request.get_data():
        try:
            body = request.get_json()
            print(f"🌐 BODY: {body}")
        except Exception as e:
            print(f"🌐 BODY parsing error: {e}")
    app.logger.info(f'Request: {request.method} {request.url} from {request.remote_addr}')
    app.logger.info(f'Headers: {dict(request.headers)}')
    if request.is_json and request.get_data():
        try:
            app.logger.info(f'Body: {request.get_json()}')
        except Exception as e:
            app.logger.info(f'Body parsing error: {e}')

# Add debug print to see if the app is running
print("🚀 APP STARTED - Debug prints should work now!")

@app.after_request
def log_response_info(response):
    print(f"🌐 RESPONSE: {response.status_code}")
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
