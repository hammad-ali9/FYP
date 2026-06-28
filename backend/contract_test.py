"""Contract round-trip test: stands up a FAKE try-on server (same /health + /tryon
contract the Colab IDM-VTON notebook exposes), points the backend at it, then drives
the real backend try-on routes. Validates the payload the backend sends (cloth_type,
cloth_desc, guidance) and that responses are wired correctly — no GPU needed.

Run: DATABASE_URL=sqlite:///smoketest.db ./venv/bin/python contract_test.py
"""
import json, base64, threading, time, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

received = []  # capture what the backend POSTs to /tryon

DUMMY_IMG = "data:image/png;base64," + base64.b64encode(bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
    "890000000a49444154789c6360000002000154a24f5f0000000049454e44ae426082")).decode()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body))); self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"status": "ok", "model": "IDM-VTON-FAKE",
                             "gpu": "FakeGPU", "vram_gb": 24.0})
        else:
            self._send(404, {"error": "nope"})
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        payload = json.loads(self.rfile.read(n) or b"{}")
        received.append(payload)
        self._send(200, {"image": DUMMY_IMG, "seconds": 1.2})

srv = HTTPServer(("127.0.0.1", 8799), Handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
time.sleep(0.5)
FAKE_URL = "http://127.0.0.1:8799"

from app import create_app
app = create_app()
c = app.test_client()
fails = []
def check(name, cond, detail=""):
    print(f"   [{'PASS' if cond else 'FAIL'}] {name} {detail}")
    if not cond: fails.append(name)

print("1) point backend at fake server via POST /api/tryon/server ...")
r = c.post("/api/tryon/server", json={"url": FAKE_URL})
j = r.get_json()
check("server configured", j.get("configured") is True and j.get("url") == FAKE_URL, json.dumps(j.get("health")))

print("2) single-shot /api/tryon/generate ...")
received.clear()
r = c.post("/api/tryon/generate", json={
    "person_image": DUMMY_IMG, "garment_image": DUMMY_IMG,
    "clothing_type": "lower", "garment_desc": "blue denim jeans"})
j = r.get_json()
check("generate success", r.status_code == 200 and j.get("success") is True, f"{r.status_code}")
check("generate returns result_image dataurl", str(j.get("result_image", "")).startswith("data:image"))
sent = received[-1] if received else {}
check("backend mapped cloth_type lower->lower", sent.get("cloth_type") == "lower", str(sent.get("cloth_type")))
check("backend forwarded cloth_desc", sent.get("cloth_desc") == "blue denim jeans", str(sent.get("cloth_desc")))
check("backend default guidance 2.0", sent.get("guidance_scale") == 2.0, str(sent.get("guidance_scale")))

print("3) multi-view /api/tryon/generate_multiview (front+back) ...")
received.clear()
r = c.post("/api/tryon/generate_multiview", json={
    "person_images": {"front": DUMMY_IMG, "back": DUMMY_IMG},
    "garment_front": DUMMY_IMG, "garment_back": DUMMY_IMG,
    "clothing_type": "full", "garment_desc": "a floral summer dress"})
j = r.get_json()
check("multiview success", r.status_code == 200 and j.get("success") is True, f"{r.status_code}")
check("multiview returned 2 views", set((j.get("results") or {}).keys()) == {"front", "back"}, str((j.get("results") or {}).keys()))
check("multiview ran 2 tryon calls", len(received) == 2, str(len(received)))
check("multiview mapped full->overall", all(p.get("cloth_type") == "overall" for p in received), str([p.get("cloth_type") for p in received]))
check("multiview forwarded cloth_desc", all(p.get("cloth_desc") == "a floral summer dress" for p in received))

print(f"\nRESULT: {'ALL PASS' if not fails else 'FAILURES: ' + ', '.join(fails)}")
srv.shutdown()
sys.exit(1 if fails else 0)
