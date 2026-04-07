import urllib.request
import json

# Test health endpoint
try:
    with urllib.request.urlopen('http://localhost:5000/api/health') as response:
        data = json.loads(response.read().decode())
        print("Health endpoint:", data)
except Exception as e:
    print("Health endpoint error:", e)

# Test login endpoint
try:
    login_data = json.dumps({'email': 'test@store.com', 'password': 'password123'}).encode('utf-8')
    req = urllib.request.Request(
        'http://localhost:5000/api/auth/login',
        data=login_data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("Login endpoint:", data.get('success', False))
except Exception as e:
    print("Login endpoint error:", e)
