from flask import Blueprint, request, jsonify
from app import db
from app.models.session import TryOnSession, TryOnEvent
from app.models.product import Product
from sqlalchemy import func
from datetime import datetime, timedelta

sessions_bp = Blueprint('sessions', __name__)


@sessions_bp.route('', methods=['GET'])
def get_sessions():
    """Get all sessions for an outlet, with optional filters"""
    outlet_id = request.args.get('outlet_id', type=int)
    status = request.args.get('status')
    limit = request.args.get('limit', 50, type=int)
    
    query = TryOnSession.query
    
    if outlet_id:
        query = query.filter_by(outlet_id=outlet_id)
    if status:
        query = query.filter_by(status=status)
    
    sessions = query.order_by(TryOnSession.started_at.desc()).limit(limit).all()
    
    return jsonify({
        'success': True,
        'data': [s.to_dict() for s in sessions],
        'count': len(sessions)
    })


@sessions_bp.route('/<int:session_id>', methods=['GET'])
def get_session(session_id):
    """Get a single session with its events"""
    session = TryOnSession.query.get_or_404(session_id)
    return jsonify({
        'success': True,
        'data': session.to_dict()
    })


@sessions_bp.route('', methods=['POST'])
def create_session():
    """Start a new try-on session"""
    data = request.get_json()
    
    if not data or 'outlet_id' not in data:
        return jsonify({
            'success': False,
            'error': 'outlet_id is required'
        }), 400
    
    session = TryOnSession(
        outlet_id=data['outlet_id'],
        kiosk_id=data.get('kiosk_id', 'web')
    )
    
    db.session.add(session)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': session.to_dict(),
        'message': 'Session started'
    }), 201


@sessions_bp.route('/<int:session_id>', methods=['PUT'])
def update_session(session_id):
    """End or update a session"""
    session = TryOnSession.query.get_or_404(session_id)
    data = request.get_json()
    
    if data.get('status') in ['completed', 'abandoned']:
        session.end_session(data['status'])
    
    if 'kiosk_id' in data:
        session.kiosk_id = data['kiosk_id']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': session.to_dict(),
        'message': 'Session updated'
    })


@sessions_bp.route('/<int:session_id>/events', methods=['POST'])
def add_event(session_id):
    """Add a try-on event to a session (product was tried)"""
    session = TryOnSession.query.get_or_404(session_id)
    data = request.get_json()
    
    if not data or 'product_id' not in data:
        return jsonify({
            'success': False,
            'error': 'product_id is required'
        }), 400
    
    # Get product info
    product = Product.query.get(data['product_id'])
    
    event = TryOnEvent(
        session_id=session_id,
        product_id=data['product_id'],
        product_name=product.name if product else data.get('product_name', 'Unknown'),
        product_category=product.category if product else data.get('product_category', 'Unknown'),
        product_type=product.clothing_type if product else data.get('product_type', 'unknown'),
        duration_seconds=data.get('duration_seconds')
    )
    
    db.session.add(event)
    
    # Update session product count
    session.products_tried_count = (session.products_tried_count or 0) + 1
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': event.to_dict(),
        'message': 'Event recorded'
    }), 201


@sessions_bp.route('/analytics', methods=['GET'])
def get_analytics():
    """Get session analytics for an outlet"""
    outlet_id = request.args.get('outlet_id', type=int)
    days = request.args.get('days', 7, type=int)
    
    if not outlet_id:
        return jsonify({
            'success': False,
            'error': 'outlet_id is required'
        }), 400
    
    since = datetime.utcnow() - timedelta(days=days)
    
    # Total sessions
    total_sessions = TryOnSession.query.filter(
        TryOnSession.outlet_id == outlet_id,
        TryOnSession.started_at >= since
    ).count()
    
    # Completed sessions
    completed_sessions = TryOnSession.query.filter(
        TryOnSession.outlet_id == outlet_id,
        TryOnSession.started_at >= since,
        TryOnSession.status == 'completed'
    ).count()
    
    # Average duration
    avg_duration = db.session.query(func.avg(TryOnSession.duration_seconds)).filter(
        TryOnSession.outlet_id == outlet_id,
        TryOnSession.started_at >= since,
        TryOnSession.duration_seconds.isnot(None)
    ).scalar() or 0
    
    # Category breakdown - most tried categories
    category_stats = db.session.query(
        TryOnEvent.product_category,
        func.count(TryOnEvent.id).label('count')
    ).join(TryOnSession).filter(
        TryOnSession.outlet_id == outlet_id,
        TryOnSession.started_at >= since
    ).group_by(TryOnEvent.product_category).order_by(func.count(TryOnEvent.id).desc()).all()
    
    # Top tried products
    top_products = db.session.query(
        TryOnEvent.product_id,
        TryOnEvent.product_name,
        TryOnEvent.product_category,
        func.count(TryOnEvent.id).label('try_count')
    ).join(TryOnSession).filter(
        TryOnSession.outlet_id == outlet_id,
        TryOnSession.started_at >= since
    ).group_by(
        TryOnEvent.product_id,
        TryOnEvent.product_name,
        TryOnEvent.product_category
    ).order_by(func.count(TryOnEvent.id).desc()).limit(10).all()
    
    # Total products tried
    total_products_tried = TryOnEvent.query.join(TryOnSession).filter(
        TryOnSession.outlet_id == outlet_id,
        TryOnSession.started_at >= since
    ).count()
    
    return jsonify({
        'success': True,
        'data': {
            'period_days': days,
            'total_sessions': total_sessions,
            'completed_sessions': completed_sessions,
            'abandoned_sessions': total_sessions - completed_sessions,
            'completion_rate': round((completed_sessions / total_sessions * 100) if total_sessions > 0 else 0, 1),
            'avg_duration_seconds': int(avg_duration),
            'total_products_tried': total_products_tried,
            'avg_products_per_session': round(total_products_tried / total_sessions, 1) if total_sessions > 0 else 0,
            'category_breakdown': [
                {'category': cat, 'count': count} for cat, count in category_stats
            ],
            'top_products': [
                {
                    'product_id': pid,
                    'product_name': name,
                    'category': cat,
                    'try_count': count
                } for pid, name, cat, count in top_products
            ]
        }
    })
