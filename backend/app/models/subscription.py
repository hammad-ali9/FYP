from app import db
from datetime import datetime, timedelta


# Plan limits
PLAN_LIMITS = {
    'trial': 10,
    'starter': 50,
    'professional': 200,
    'enterprise': None  # Unlimited
}

PLAN_PRICES = {
    'starter': 99.00,
    'professional': 129.00,
    'enterprise': 299.00
}


class Subscription(db.Model):
    """Track outlet subscription plans"""
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id'), nullable=False, index=True)
    
    # Plan details
    plan_name = db.Column(db.String(50), default='trial')
    plan_price = db.Column(db.Float, default=0.00)
    billing_cycle = db.Column(db.String(20), default='monthly')
    
    # Status: trial, pending_payment, active, cancelled, expired
    status = db.Column(db.String(20), default='trial')
    
    # Trial tracking
    trial_ends_at = db.Column(db.DateTime)
    
    # Subscription period tracking
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    current_period_start = db.Column(db.DateTime)
    current_period_end = db.Column(db.DateTime)
    cancelled_at = db.Column(db.DateTime)
    
    # Default payment method
    default_payment_method_id = db.Column(db.Integer)
    
    # Relationships
    invoices = db.relationship('Invoice', backref='subscription', lazy='dynamic', cascade='all, delete-orphan')
    payment_methods = db.relationship('PaymentMethod', backref='subscription', lazy='dynamic', cascade='all, delete-orphan')
    
    def is_trial_active(self):
        if self.status != 'trial':
            return False
        if self.trial_ends_at and datetime.utcnow() > self.trial_ends_at:
            return False
        return True
    
    def is_subscription_active(self):
        """Check if paid subscription is active"""
        if self.status != 'active':
            return False
        if self.current_period_end and datetime.utcnow() > self.current_period_end:
            return False
        return True
    
    def get_days_remaining(self):
        if self.status == 'trial' and self.trial_ends_at:
            delta = self.trial_ends_at - datetime.utcnow()
            return max(0, delta.days)
        elif self.status == 'active' and self.current_period_end:
            delta = self.current_period_end - datetime.utcnow()
            return max(0, delta.days)
        return 0
    
    def get_product_limit(self):
        return PLAN_LIMITS.get(self.plan_name, 10)
    
    def to_dict(self):
        default_payment = None
        if self.default_payment_method_id:
            pm = PaymentMethod.query.get(self.default_payment_method_id)
            if pm:
                default_payment = pm.to_dict()
        
        return {
            'id': self.id,
            'outlet_id': self.outlet_id,
            'plan_name': self.plan_name,
            'plan_price': self.plan_price,
            'billing_cycle': self.billing_cycle,
            'status': self.status,
            'is_trial': self.status == 'trial',
            'is_active': self.status == 'active' and self.is_subscription_active(),
            'trial_ends_at': self.trial_ends_at.isoformat() if self.trial_ends_at else None,
            'trial_days_remaining': self.get_days_remaining() if self.status == 'trial' else 0,
            'subscription_days_remaining': self.get_days_remaining() if self.status == 'active' else 0,
            'product_limit': self.get_product_limit(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'cancelled_at': self.cancelled_at.isoformat() if self.cancelled_at else None,
            'payment_method': default_payment
        }
    
    @staticmethod
    def create_trial(outlet_id):
        subscription = Subscription(
            outlet_id=outlet_id,
            plan_name='trial',
            plan_price=0,
            status='trial',
            trial_ends_at=datetime.utcnow() + timedelta(days=7)
        )
        db.session.add(subscription)
        db.session.commit()
        return subscription


class PaymentMethod(db.Model):
    """Store multiple payment methods per subscription"""
    __tablename__ = 'payment_methods'
    
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=False, index=True)
    
    card_brand = db.Column(db.String(20))
    card_last4 = db.Column(db.String(4))
    card_expiry = db.Column(db.String(10))
    card_holder_name = db.Column(db.String(100))
    
    is_default = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'brand': self.card_brand,
            'last4': self.card_last4,
            'expiry': self.card_expiry,
            'holder_name': self.card_holder_name,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Invoice(db.Model):
    """Track billing history / invoices - only created after successful payment"""
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=False, index=True)
    outlet_id = db.Column(db.Integer, db.ForeignKey('outlets.id'), nullable=False, index=True)
    
    invoice_number = db.Column(db.String(50))
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='USD')
    status = db.Column(db.String(20), default='paid')  # paid, pending, failed, refunded
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    paid_at = db.Column(db.DateTime)
    
    description = db.Column(db.String(200))
    voucher_code = db.Column(db.String(50))  # If voucher was used
    discount_amount = db.Column(db.Float, default=0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None,
            'description': self.description,
            'voucher_code': self.voucher_code,
            'discount_amount': self.discount_amount
        }


class Voucher(db.Model):
    """Voucher/coupon codes for discounts"""
    __tablename__ = 'vouchers'
    
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Discount type
    discount_type = db.Column(db.String(20), default='percentage')  # percentage, fixed, free
    discount_value = db.Column(db.Float, default=0)  # For percentage (100 = 100% off), for fixed ($amount off)
    
    # Applicable plans (null = all plans)
    applicable_plans = db.Column(db.String(200))  # comma-separated: "starter,professional,enterprise"
    
    # Validity
    is_active = db.Column(db.Boolean, default=True)
    valid_from = db.Column(db.DateTime, default=datetime.utcnow)
    valid_until = db.Column(db.DateTime)
    
    # Usage limits
    max_uses = db.Column(db.Integer)  # null = unlimited
    times_used = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def is_valid(self, plan_name=None):
        """Check if voucher is valid"""
        if not self.is_active:
            return False, "Voucher is not active"
        
        now = datetime.utcnow()
        if self.valid_from and now < self.valid_from:
            return False, "Voucher is not yet valid"
        
        if self.valid_until and now > self.valid_until:
            return False, "Voucher has expired"
        
        if self.max_uses and self.times_used >= self.max_uses:
            return False, "Voucher usage limit reached"
        
        if plan_name and self.applicable_plans:
            allowed_plans = [p.strip() for p in self.applicable_plans.split(',')]
            if plan_name not in allowed_plans:
                return False, f"Voucher not valid for {plan_name} plan"
        
        return True, "Valid"
    
    def calculate_discount(self, original_amount):
        """Calculate discount amount"""
        if self.discount_type == 'free':
            return original_amount
        elif self.discount_type == 'percentage':
            return original_amount * (self.discount_value / 100)
        elif self.discount_type == 'fixed':
            return min(self.discount_value, original_amount)
        return 0
    
    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'discount_type': self.discount_type,
            'discount_value': self.discount_value,
            'applicable_plans': self.applicable_plans.split(',') if self.applicable_plans else None,
            'is_active': self.is_active,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'max_uses': self.max_uses,
            'times_used': self.times_used
        }
