from app import db
from datetime import datetime, timedelta
import secrets


class PasswordResetToken(db.Model):
    """Token for password reset requests"""
    __tablename__ = 'password_reset_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id'), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    outlet = db.relationship('Outlet', backref='reset_tokens')
    
    @staticmethod
    def generate_token(outlet_id, expires_hours=1):
        """Generate a new password reset token"""
        token = secrets.token_urlsafe(32)
        reset_token = PasswordResetToken(
            outlet_id=outlet_id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=expires_hours)
        )
        db.session.add(reset_token)
        db.session.commit()
        return token
    
    @staticmethod
    def verify_token(token):
        """Verify a password reset token and return the outlet if valid"""
        reset_token = PasswordResetToken.query.filter_by(token=token, used=False).first()
        
        if not reset_token:
            return None
        
        if reset_token.expires_at < datetime.utcnow():
            return None
        
        return reset_token
    
    def mark_used(self):
        """Mark token as used"""
        self.used = True
        db.session.commit()
