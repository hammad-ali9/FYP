"""Local smoke test for the VirtualFit backend — focuses on app boot + try-on wiring.
Run: ./venv/bin/python smoke_test.py
Does NOT require the Colab GPU server; it asserts graceful behaviour when it's absent."""
import json, sys, base64

print("1) importing app ...", flush=True)
from app import create_app, db
app = create_app()
print("   OK app created")

# Make sure DB tables exist for the auth/products checks (fresh SQLite).
with app.app_context():
    db.create_all()
    print("   OK db.create_all()")

c = app.test_client()
fails = []

def check(name, cond, detail=""):
    print(f"   [{'PASS' if cond else 'FAIL'}] {name} {detail}")
    if not cond:
        fails.append(name)

print("2) health ...", flush=True)
r = c.get("/api/health")
check("GET /api/health 200", r.status_code == 200, str(r.get_json()))

print("3) try-on server status (no Colab configured) ...", flush=True)
r = c.get("/api/tryon/server")
j = r.get_json()
check("GET /api/tryon/server 200", r.status_code == 200, json.dumps(j))
check("server reports configured flag", "configured" in (j or {}))

print("4) generate_multiview without server -> graceful 503/400 ...", flush=True)
tiny_png = base64.b64encode(bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000a49444154789c6360000002000154a24f5f0000000049454e44ae426082")).decode()
r = c.post("/api/tryon/generate_multiview", json={
    "person_images": {"front": tiny_png}, "garment_front": tiny_png,
    "clothing_type": "upper"})
j = r.get_json()
check("generate_multiview handled (not 500)", r.status_code in (400, 502, 503), f"{r.status_code} {json.dumps(j)}")
check("generate_multiview returns success=false", (j or {}).get("success") is False)

print("5) generate (single) without server -> graceful 503 ...", flush=True)
r = c.post("/api/tryon/generate", json={
    "person_image": tiny_png, "garment_image": tiny_png, "clothing_type": "upper"})
j = r.get_json()
check("generate handled (not 500)", r.status_code in (400, 503), f"{r.status_code} {json.dumps(j)}")

print("6) generate missing fields -> 400 ...", flush=True)
r = c.post("/api/tryon/generate", json={"person_image": tiny_png})
check("generate missing garment -> 503 or 400", r.status_code in (400, 503), str(r.status_code))

print("7) outlet register (POST /api/outlets) + login ...", flush=True)
import random
email = f"test{random.randint(1000,9999)}@example.com"
r = c.post("/api/outlets", json={
    "name": "Test Outlet", "email": email, "password": "secret123",
    "location": "Test City"})
check("register 201", r.status_code == 201, f"{r.status_code} {r.get_data(as_text=True)[:160]}")
outlet_id = ((r.get_json() or {}).get("data") or {}).get("id")
r = c.post("/api/auth/login", json={"email": email, "password": "secret123"})
j = r.get_json()
token = (j or {}).get("access_token")
check("login 200 + token", r.status_code == 200 and bool(token), f"{r.status_code} {json.dumps(j)[:160]}")

print("8) authed: list products + create product ...", flush=True)
hdr = {"Authorization": f"Bearer {token}"} if token else {}
r = c.get("/api/products", headers=hdr)
check("GET /api/products ok", r.status_code in (200,), f"{r.status_code}")
r = c.post("/api/products", headers=hdr, json={
    "outlet_id": outlet_id, "name": "Blue Shirt", "category": "shirts",
    "clothing_type": "upper", "price": 25, "image_url": "/uploads/x.jpg"})
check("POST /api/products created", r.status_code in (200, 201), f"{r.status_code} {r.get_data(as_text=True)[:160]}")

print(f"\nRESULT: {'ALL PASS' if not fails else 'FAILURES: ' + ', '.join(fails)}")
sys.exit(1 if fails else 0)
