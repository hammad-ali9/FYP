from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from app import db
from app.models.outlet import Outlet
import secrets

outlets_bp = Blueprint('outlets', __name__)


@outlets_bp.route('', methods=['GET'])
def get_outlets():
    """Get all outlets"""
    outlets = Outlet.query.filter_by(is_active=True).all()
    return jsonify({
        'success': True,
        'data': [o.to_dict() for o in outlets],
        'count': len(outlets)
    })


@outlets_bp.route('/<int:outlet_id>', methods=['GET'])
def get_outlet(outlet_id):
    """Get a single outlet"""
    outlet = Outlet.query.get_or_404(outlet_id)
    return jsonify({
        'success': True,
        'data': outlet.to_dict()
    })


@outlets_bp.route('', methods=['POST'])
def create_outlet():
    """Register a new outlet"""
    data = request.get_json()
    
    required = ['name', 'email', 'password']
    for field in required:
        if field not in data:
            return jsonify({
                'success': False,
                'error': f'Missing required field: {field}'
            }), 400
    
    # Check if email already exists
    if Outlet.query.filter_by(email=data['email']).first():
        return jsonify({
            'success': False,
            'error': 'Email already registered'
        }), 400
    
    outlet = Outlet(
        name=data['name'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        location=data.get('location'),
        api_key=secrets.token_hex(32)
    )
    
    db.session.add(outlet)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': outlet.to_dict(),
        'api_key': outlet.api_key,
        'message': 'Outlet registered successfully'
    }), 201


@outlets_bp.route('/<int:outlet_id>', methods=['PUT'])
def update_outlet(outlet_id):
    """Update outlet info"""
    outlet = Outlet.query.get_or_404(outlet_id)
    data = request.get_json()
    
    if 'name' in data:
        outlet.name = data['name']
    if 'location' in data:
        outlet.location = data['location']
    if 'is_active' in data:
        outlet.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': outlet.to_dict(),
        'message': 'Outlet updated successfully'
    })


@outlets_bp.route('/<int:outlet_id>', methods=['DELETE'])
def delete_outlet(outlet_id):
    """Delete/deactivate an outlet"""
    outlet = Outlet.query.get_or_404(outlet_id)
    outlet.is_active = False  # Soft delete
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Outlet deactivated successfully'
    })
