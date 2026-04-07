import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///virtualfit.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['HF_TOKEN'] = os.getenv('HF_TOKEN', '')
    app.config['GROQ_API_KEY'] = os.getenv('GROQ_API_KEY', '')
    
    # File upload config
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'uploads')
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # CORS - allow frontend
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    from app.routes.products import products_bp
    from app.routes.outlets import outlets_bp
    from app.routes.auth import auth_bp
    from app.routes.subscriptions import subscriptions_bp
    from app.routes.sessions import sessions_bp
    from app.routes.gestures import gestures_bp
    from app.routes.tryon import tryon_bp
    
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(outlets_bp, url_prefix='/api/outlets')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(subscriptions_bp, url_prefix='/api/subscriptions')
    app.register_blueprint(sessions_bp, url_prefix='/api/sessions')
    app.register_blueprint(gestures_bp, url_prefix='/api/gestures')
    app.register_blueprint(tryon_bp, url_prefix='/api/tryon')


    
    # Health check route
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'VirtualFit API is running'}
    
    return app
