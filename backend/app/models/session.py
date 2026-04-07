from app import db
from datetime import datetime


class TryOnSession(db.Model):
    """Track virtual try-on sessions at the outlet"""
    __tablename__ = 'try_on_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id'), nullable=False, index=True)
    
    # Session metadata
    kiosk_id = db.Column(db.String(50))  # Identifier for physical kiosk/device
    
    # Timestamps
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime)
    
    # Computed fields
    duration_seconds = db.Column(db.Integer)
    status = db.Column(db.String(20), default='active')  # active, completed, abandoned
    products_tried_count = db.Column(db.Integer, default=0)
    
    # Relationship to events
    events = db.relationship('TryOnEvent', backref='session', lazy='dynamic', cascade='all, delete-orphan')
    
    def end_session(self, status='completed'):
        """End the session and calculate duration"""
        self.ended_at = datetime.utcnow()
        self.status = status
        if self.started_at and self.ended_at:
            self.duration_seconds = int((self.ended_at - self.started_at).total_seconds())
    
    def to_dict(self):
        return {
            'id': self.id,
            'outlet_id': self.outlet_id,
            'kiosk_id': self.kiosk_id,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'ended_at': self.ended_at.isoformat() if self.ended_at else None,
            'duration_seconds': self.duration_seconds,
            'status': self.status,
            'products_tried_count': self.products_tried_count,
            'events': [e.to_dict() for e in self.events.all()] if self.events else []
        }


class TryOnEvent(db.Model):
    """Track individual product try-ons within a session"""
    __tablename__ = 'try_on_events'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('try_on_sessions.id'), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    
    # Product info snapshot (in case product is deleted later)
    product_name = db.Column(db.String(100))
    product_category = db.Column(db.String(50))
    product_type = db.Column(db.String(20))  # upper, lower
    
    # Timestamps
    tried_at = db.Column(db.DateTime, default=datetime.utcnow)
    duration_seconds = db.Column(db.Integer)  # How long they viewed this product
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'product_id': self.product_id,
            'product_name': self.product_name,
            'product_category': self.product_category,
            'product_type': self.product_type,
            'tried_at': self.tried_at.isoformat() if self.tried_at else None,
            'duration_seconds': self.duration_seconds
        }
