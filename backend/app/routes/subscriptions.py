from flask import Blueprint, request, jsonify
from app import db
from app.models.subscription import Subscription, Invoice, PaymentMethod, Voucher, PLAN_LIMITS, PLAN_PRICES
from datetime import datetime, timedelta

subscriptions_bp = Blueprint('subscriptions', __name__)


# Available plans
PLANS = {
    'starter': {'name': 'Starter', 'price': 99.00, 'items': 50},
    'professional': {'name': 'Professional', 'price': 129.00, 'items': 200},
    'enterprise': {'name': 'Enterprise', 'price': 299.00, 'items': None}
}


@subscriptions_bp.route('', methods=['GET'])
def get_subscription():
    """Get subscription for an outlet"""
    outlet_id = request.args.get('outlet_id', type=int)
    
    if not outlet_id:
        return jsonify({'success': False, 'error': 'outlet_id is required'}), 400
    
    subscription = Subscription.query.filter_by(outlet_id=outlet_id).first()
    
    if not subscription:
        subscription = Subscription.create_trial(outlet_id)
    
    # Check if trial/subscription expired
    now = datetime.utcnow()
    if subscription.status == 'trial' and subscription.trial_ends_at and now > subscription.trial_ends_at:
        subscription.status = 'expired'
        db.session.commit()
    elif subscription.status == 'active' and subscription.current_period_end and now > subscription.current_period_end:
        subscription.status = 'expired'
        db.session.commit()
    
    payment_methods = PaymentMethod.query.filter_by(subscription_id=subscription.id).all()
    
    result = subscription.to_dict()
    result['payment_methods'] = [pm.to_dict() for pm in payment_methods]
    
    return jsonify({'success': True, 'data': result})


@subscriptions_bp.route('/select-plan', methods=['POST'])
def select_plan():
    """User selects a plan (before payment)"""
    data = request.get_json()
    
    if not data or 'outlet_id' not in data or 'plan' not in data:
        return jsonify({'success': False, 'error': 'outlet_id and plan required'}), 400
    
    plan_key = data['plan']
    if plan_key not in PLANS:
        return jsonify({'success': False, 'error': 'Invalid plan'}), 400
    
    subscription = Subscription.query.filter_by(outlet_id=data['outlet_id']).first()
    
    if not subscription:
        subscription = Subscription.create_trial(data['outlet_id'])
    
    # Mark as pending payment - don't activate yet
    subscription.plan_name = plan_key
    subscription.plan_price = PLANS[plan_key]['price']
    subscription.status = 'pending_payment'
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'data': subscription.to_dict(),
        'message': f'{PLANS[plan_key]["name"]} plan selected. Please add payment method and complete payment.'
    })


@subscriptions_bp.route('/validate-voucher', methods=['POST'])
def validate_voucher():
    """Validate a voucher code"""
    data = request.get_json()
    
    if not data or 'code' not in data:
        return jsonify({'success': False, 'error': 'Voucher code required'}), 400
    
    voucher = Voucher.query.filter_by(code=data['code'].upper()).first()
    
    if not voucher:
        return jsonify({'success': False, 'error': 'Invalid voucher code'}), 404
    
    plan_name = data.get('plan')
    is_valid, message = voucher.is_valid(plan_name)
    
    if not is_valid:
        return jsonify({'success': False, 'error': message}), 400
    
    # Calculate discount for the plan
    plan_price = PLANS.get(plan_name, {}).get('price', 0) if plan_name else 0
    discount = voucher.calculate_discount(plan_price)
    final_price = max(0, plan_price - discount)
    
    return jsonify({
        'success': True,
        'data': {
            'voucher': voucher.to_dict(),
            'original_price': plan_price,
            'discount': discount,
            'final_price': final_price,
            'is_free': final_price == 0
        }
    })


@subscriptions_bp.route('/pay', methods=['POST'])
def process_payment():
    """Process payment and activate subscription"""
    data = request.get_json()
    
    required = ['subscription_id', 'payment_method_id']
    for field in required:
        if field not in data:
            return jsonify({'success': False, 'error': f'{field} is required'}), 400
    
    subscription = Subscription.query.get(data['subscription_id'])
    if not subscription:
        return jsonify({'success': False, 'error': 'Subscription not found'}), 404
    
    payment_method = PaymentMethod.query.get(data['payment_method_id'])
    if not payment_method or payment_method.subscription_id != subscription.id:
        return jsonify({'success': False, 'error': 'Invalid payment method'}), 400
    
    plan = PLANS.get(subscription.plan_name)
    if not plan:
        return jsonify({'success': False, 'error': 'Invalid plan'}), 400
    
    # Calculate amount after voucher
    amount = plan['price']
    voucher_code = data.get('voucher_code')
    discount_amount = 0
    voucher = None
    
    if voucher_code:
        voucher = Voucher.query.filter_by(code=voucher_code.upper()).first()
        if voucher:
            is_valid, msg = voucher.is_valid(subscription.plan_name)
            if is_valid:
                discount_amount = voucher.calculate_discount(amount)
                amount = max(0, amount - discount_amount)
                voucher.times_used += 1
    
    # Simulate payment processing (in production, use Stripe/PayPal)
    # For demo: payment always succeeds
    payment_success = True
    
    if payment_success:
        # Activate subscription
        now = datetime.utcnow()
        subscription.status = 'active'
        subscription.current_period_start = now
        
        # Set expiry based on billing cycle
        if subscription.billing_cycle == 'yearly':
            subscription.current_period_end = now + timedelta(days=365)
        else:
            subscription.current_period_end = now + timedelta(days=30)
        
        subscription.trial_ends_at = None  # Clear trial
        subscription.default_payment_method_id = payment_method.id
        
        # Create invoice (only after successful payment)
        invoice_count = Invoice.query.filter_by(subscription_id=subscription.id).count()
        invoice = Invoice(
            subscription_id=subscription.id,
            outlet_id=subscription.outlet_id,
            invoice_number=f'INV-{subscription.id:05d}-{invoice_count + 1:03d}',
            amount=amount,
            status='paid',
            paid_at=now,
            description=f'{plan["name"]} Plan - Monthly Subscription',
            voucher_code=voucher_code.upper() if voucher_code else None,
            discount_amount=discount_amount
        )
        
        db.session.add(invoice)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'subscription': subscription.to_dict(),
                'invoice': invoice.to_dict()
            },
            'message': 'Payment successful! Your subscription is now active.'
        })
    else:
        return jsonify({'success': False, 'error': 'Payment failed. Please try again.'}), 400


@subscriptions_bp.route('/<int:subscription_id>', methods=['PUT'])
def update_subscription(subscription_id):
    """Update subscription"""
    subscription = Subscription.query.get_or_404(subscription_id)
    data = request.get_json()
    
    if 'status' in data:
        subscription.status = data['status']
        if data['status'] == 'cancelled':
            subscription.cancelled_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'success': True, 'data': subscription.to_dict()})


# Payment Methods CRUD
@subscriptions_bp.route('/<int:subscription_id>/cards', methods=['GET'])
def get_cards(subscription_id):
    cards = PaymentMethod.query.filter_by(subscription_id=subscription_id).all()
    return jsonify({'success': True, 'data': [c.to_dict() for c in cards]})


@subscriptions_bp.route('/<int:subscription_id>/cards', methods=['POST'])
def add_card(subscription_id):
    subscription = Subscription.query.get_or_404(subscription_id)
    data = request.get_json()
    
    if not data or 'card_last4' not in data:
        return jsonify({'success': False, 'error': 'Card details required'}), 400
    
    existing_cards = PaymentMethod.query.filter_by(subscription_id=subscription_id).count()
    is_first = existing_cards == 0
    
    card = PaymentMethod(
        subscription_id=subscription_id,
        card_brand=data.get('card_brand', 'visa'),
        card_last4=data.get('card_last4'),
        card_expiry=data.get('card_expiry'),
        card_holder_name=data.get('card_holder_name'),
        is_default=is_first or data.get('is_default', False)
    )
    
    db.session.add(card)
    
    if card.is_default:
        PaymentMethod.query.filter(
            PaymentMethod.subscription_id == subscription_id,
            PaymentMethod.id != card.id
        ).update({'is_default': False})
    
    db.session.commit()
    db.session.refresh(card)
    
    if card.is_default:
        subscription.default_payment_method_id = card.id
        db.session.commit()
    
    return jsonify({'success': True, 'data': card.to_dict()}), 201


@subscriptions_bp.route('/<int:subscription_id>/cards/<int:card_id>', methods=['DELETE'])
def delete_card(subscription_id, card_id):
    card = PaymentMethod.query.filter_by(id=card_id, subscription_id=subscription_id).first_or_404()
    was_default = card.is_default
    
    db.session.delete(card)
    db.session.commit()
    
    if was_default:
        next_card = PaymentMethod.query.filter_by(subscription_id=subscription_id).first()
        if next_card:
            next_card.is_default = True
            subscription = Subscription.query.get(subscription_id)
            subscription.default_payment_method_id = next_card.id
            db.session.commit()
    
    return jsonify({'success': True, 'message': 'Card removed'})


@subscriptions_bp.route('/<int:subscription_id>/cards/<int:card_id>/default', methods=['PUT'])
def set_default_card(subscription_id, card_id):
    card = PaymentMethod.query.filter_by(id=card_id, subscription_id=subscription_id).first_or_404()
    
    PaymentMethod.query.filter(PaymentMethod.subscription_id == subscription_id).update({'is_default': False})
    card.is_default = True
    
    subscription = Subscription.query.get(subscription_id)
    subscription.default_payment_method_id = card_id
    
    db.session.commit()
    
    return jsonify({'success': True, 'data': card.to_dict()})


@subscriptions_bp.route('/invoices', methods=['GET'])
def get_invoices():
    outlet_id = request.args.get('outlet_id', type=int)
    limit = request.args.get('limit', 10, type=int)
    
    if not outlet_id:
        return jsonify({'success': False, 'error': 'outlet_id is required'}), 400
    
    invoices = Invoice.query.filter_by(outlet_id=outlet_id).order_by(Invoice.created_at.desc()).limit(limit).all()
    
    return jsonify({'success': True, 'data': [i.to_dict() for i in invoices], 'count': len(invoices)})


@subscriptions_bp.route('/plans', methods=['GET'])
def get_plans():
    return jsonify({
        'success': True,
        'data': [
            {
                'id': key,
                'name': plan['name'],
                'price': plan['price'],
                'max_items': plan['items'],
                'features': get_plan_features(key)
            }
            for key, plan in PLANS.items()
        ]
    })


@subscriptions_bp.route('/check-limit', methods=['GET'])
def check_product_limit():
    outlet_id = request.args.get('outlet_id', type=int)
    
    if not outlet_id:
        return jsonify({'success': False, 'error': 'outlet_id is required'}), 400
    
    subscription = Subscription.query.filter_by(outlet_id=outlet_id).first()
    
    if not subscription:
        subscription = Subscription.create_trial(outlet_id)
    
    from app.models.product import Product
    current_count = Product.query.filter_by(outlet_id=outlet_id).count()
    
    limit = subscription.get_product_limit()
    
    return jsonify({
        'success': True,
        'data': {
            'current_count': current_count,
            'limit': limit,
            'can_add': limit is None or current_count < limit,
            'remaining': None if limit is None else max(0, limit - current_count),
            'plan': subscription.plan_name
        }
    })


# Voucher management
@subscriptions_bp.route('/vouchers', methods=['POST'])
def create_voucher():
    """Create a new voucher (admin only in production)"""
    data = request.get_json()
    
    if not data or 'code' not in data:
        return jsonify({'success': False, 'error': 'Voucher code required'}), 400
    
    existing = Voucher.query.filter_by(code=data['code'].upper()).first()
    if existing:
        return jsonify({'success': False, 'error': 'Voucher code already exists'}), 400
    
    voucher = Voucher(
        code=data['code'].upper(),
        discount_type=data.get('discount_type', 'percentage'),
        discount_value=data.get('discount_value', 100),
        applicable_plans=data.get('applicable_plans'),
        is_active=data.get('is_active', True),
        valid_until=datetime.fromisoformat(data['valid_until']) if data.get('valid_until') else None,
        max_uses=data.get('max_uses')
    )
    
    db.session.add(voucher)
    db.session.commit()
    
    return jsonify({'success': True, 'data': voucher.to_dict()}), 201


def get_plan_features(plan_key):
    features = {
        'starter': ['Up to 50 products', 'Basic Analytics', 'Email Support', '1 Device'],
        'professional': ['Up to 200 products', 'Advanced Analytics', 'Priority Support', 'Custom Branding', '3 Devices'],
        'enterprise': ['Unlimited products', 'Full Analytics Suite', 'Dedicated Account Manager', 'White-label Solution', 'Unlimited Devices', 'API Access']
    }
    return features.get(plan_key, [])
