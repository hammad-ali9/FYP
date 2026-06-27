"""Seed (or reset) the demo outlet account advertised on the Login screen.

Usage:  python seed_demo.py
Creates test@store.com / password123 (idempotent — resets the password if the
account already exists).
"""
import secrets

from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models.outlet import Outlet

DEMO_EMAIL = 'test@store.com'
DEMO_PASSWORD = 'password123'
DEMO_NAME = 'Demo Store'


def main():
    app = create_app()
    with app.app_context():
        outlet = Outlet.query.filter(Outlet.email.ilike(DEMO_EMAIL)).first()
        if outlet:
            outlet.password_hash = generate_password_hash(DEMO_PASSWORD)
            outlet.is_active = True
            action = 'reset'
        else:
            outlet = Outlet(
                name=DEMO_NAME,
                email=DEMO_EMAIL,
                password_hash=generate_password_hash(DEMO_PASSWORD),
                location='Demo City',
                api_key=secrets.token_hex(32),
                is_active=True,
            )
            db.session.add(outlet)
            action = 'created'
        db.session.commit()
        print(f'Demo outlet {action}: {DEMO_EMAIL} / {DEMO_PASSWORD} (id={outlet.id})')


if __name__ == '__main__':
    main()
