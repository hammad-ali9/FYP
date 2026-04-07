from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.outlet import Outlet
from app.models.password_reset import PasswordResetToken
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login outlet and return JWT token"""
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({
            'success': False,
            'error': 'Email and password required'
        }), 400
    
    # Normalize email for case-insensitive matching
    email = data['email'].lower().strip()
    outlet = Outlet.query.filter(Outlet.email.ilike(email)).first()
    
    if not outlet or not check_password_hash(outlet.password_hash, data['password']):
        return jsonify({
            'success': False,
            'error': 'Invalid email or password'
        }), 401
    
    if not outlet.is_active:
        return jsonify({
            'success': False,
            'error': 'Outlet account is deactivated'
        }), 401
    
    # Create JWT token
    access_token = create_access_token(
        identity=outlet.id,
        expires_delta=timedelta(days=7)
    )
    
    return jsonify({
        'success': True,
        'access_token': access_token,
        'outlet': outlet.to_dict(),
        'message': 'Login successful'
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_outlet():
    """Get currently logged in outlet"""
    outlet_id = get_jwt_identity()
    outlet = Outlet.query.get_or_404(outlet_id)
    
    return jsonify({
        'success': True,
        'data': outlet.to_dict()
    })


@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify if token is valid"""
    outlet_id = get_jwt_identity()
    outlet = Outlet.query.get(outlet_id)
    
    if not outlet:
        return jsonify({
            'success': False,
            'error': 'Invalid token'
        }), 401
    
    return jsonify({
        'success': True,
        'valid': True,
        'outlet_id': outlet_id
    })


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request a password reset link"""
    data = request.get_json()
    
    if not data or 'email' not in data:
        return jsonify({
            'success': False,
            'error': 'Email is required'
        }), 400
    
    email = data['email'].lower().strip()
    outlet = Outlet.query.filter(Outlet.email.ilike(email)).first()
    
    # Return error if email not found
    if not outlet:
        return jsonify({
            'success': False,
            'error': 'No account found with this email address'
        }), 404
    
    # Generate reset token
    token = PasswordResetToken.generate_token(outlet.id)
    
    # Build reset URL (frontend URL)
    reset_url = f"http://localhost:5173/reset-password?token={token}"
    
    # Log the reset link (in production, this would send an email)
    print(f"\n{'='*50}")
    print(f"PASSWORD RESET LINK FOR: {email}")
    print(f"Reset URL: {reset_url}")
    print(f"Token expires in 1 hour")
    print(f"{'='*50}\n")
    
    return jsonify({
        'success': True,
        'message': 'If an account exists with this email, you will receive a password reset link shortly.',
        # Include reset URL in response for development (remove in production)
        'dev_reset_url': reset_url
    })


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password using token"""
    data = request.get_json()
    
    if not data or 'token' not in data or 'password' not in data:
        return jsonify({
            'success': False,
            'error': 'Token and new password are required'
        }), 400
    
    token = data['token']
    new_password = data['password']
    
    if len(new_password) < 6:
        return jsonify({
            'success': False,
            'error': 'Password must be at least 6 characters'
        }), 400
    
    # Verify token
    reset_token = PasswordResetToken.verify_token(token)
    
    if not reset_token:
        return jsonify({
            'success': False,
            'error': 'Invalid or expired reset token'
        }), 400
    
    # Update password
    outlet = Outlet.query.get(reset_token.outlet_id)
    if not outlet:
        return jsonify({
            'success': False,
            'error': 'Account not found'
        }), 404
    
    from app import db
    outlet.password_hash = generate_password_hash(new_password)
    reset_token.mark_used()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Password has been reset successfully. You can now login with your new password.'
    })
