"""
Script to create a test voucher for VirtualFit
Run this after starting the backend to create the TESTFREE voucher

Usage: 
cd backend
python create_test_voucher.py
"""

from app import create_app, db
from app.models.subscription import Voucher
from datetime import datetime, timedelta

app = create_app()

with app.app_context():
    # Check if voucher already exists
    existing = Voucher.query.filter_by(code='TESTFREE').first()
    
    if existing:
        print(f"Voucher 'TESTFREE' already exists (used {existing.times_used} times)")
    else:
        # Create the test voucher
        voucher = Voucher(
            code='TESTFREE',
            discount_type='free',  # 100% off
            discount_value=100,
            applicable_plans='starter,professional,enterprise',  # Works for all plans
            is_active=True,
            valid_until=datetime.utcnow() + timedelta(days=365),  # Valid for 1 year
            max_uses=None  # Unlimited uses for testing
        )
        
        db.session.add(voucher)
        db.session.commit()
        
        print("=" * 50)
        print("TEST VOUCHER CREATED SUCCESSFULLY!")
        print("=" * 50)
        print(f"Code: TESTFREE")
        print(f"Discount: 100% FREE")
        print(f"Valid for: All plans (Starter, Professional, Enterprise)")
        print(f"Expires: {voucher.valid_until}")
        print("=" * 50)
        print("\nUse this code during checkout to get any plan for free!")
