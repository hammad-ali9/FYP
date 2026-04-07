import base64
import json
import os
import time
import urllib.request
import urllib.error
from huggingface_hub import HfApi
from huggingface_hub.utils import RepositoryNotFoundError, HfHubHTTPError

class TryOnEngine:
    def __init__(self, source_space="yisol/IDM-VTON"):
        self.source_space = source_space
        self.public_url = "https://yisol-idm-vton.hf.space"
        self.user_space_url = None
        self.user_space_name = None

    def get_username(self, token):
        api = HfApi(token=token)
        info = api.whoami()
        return info["name"]

    def ensure_space(self, token=None):
        """Duplicate IDM-VTON to user's account if not already there. Returns space URL."""
        if self.user_space_url:
            return self.user_space_url

        # Fallback if no token provided
        if not token or token.strip() == "":
            print("  ℹ TryOn: No HF Token provided. Using public Space.")
            self.user_space_url = self.public_url
            self.user_space_name = "yisol/IDM-VTON (Public)"
            return self.public_url

        try:
            api = HfApi(token=token)
            username = self.get_username(token)
            repo_id = f"{username}/IDM-VTON-drape"

            # Check if already exists
            try:
                runtime = api.get_space_runtime(repo_id=repo_id, token=token)
                print(f"  ✓ TryOn: Space already exists: {repo_id} [{runtime.stage}]")
            except RepositoryNotFoundError:
                print(f"  ⟳ TryOn: Duplicating {self.source_space} → {repo_id} ...")
                api.duplicate_space(
                    from_id=self.source_space,
                    to_id=repo_id,
                    token=token,
                    exist_ok=True,
                    private=False,
                )
                print(f"  ✓ TryOn: Space duplicated: {repo_id}")

            # Wait for space to be running
            deadline = time.time() + 300
            while time.time() < deadline:
                try:
                    runtime = api.get_space_runtime(repo_id=repo_id, token=token)
                    if runtime.stage == "RUNNING":
                        break
                    if runtime.stage in ("BUILD_ERROR", "CONFIG_ERROR", "RUNTIME_ERROR"):
                        raise RuntimeError(f"Space failed to start: {runtime.stage}")
                except RepositoryNotFoundError:
                    pass
                time.sleep(8)
            else:
                raise RuntimeError("Space did not start within 5 minutes.")

            slug = repo_id.replace("/", "-").lower()
            self.user_space_url = f"https://{slug}.hf.space"
            self.user_space_name = repo_id
            return self.user_space_url

        except Exception as e:
            print(f"  ⚠️ TryOn: Fallback to public Space due to error: {e}")
            self.user_space_url = self.public_url
            self.user_space_name = "yisol/IDM-VTON (Public)"
            return self.public_url

    def upload_file(self, token, space_url, image_base64, mime_type="image/jpeg"):
        """Uploads a base64 image to the Hugging Face space."""
        try:
            img_data = base64.b64decode(image_base64)
            filename = f"img_{int(time.time()*1000)}.jpg"
            boundary = f"Boundary{int(time.time()*1000)}"
            
            parts = (
                f"--{boundary}\r\n"
                f'Content-Disposition: form-data; name="files"; filename="{filename}"\r\n'
                f"Content-Type: {mime_type}\r\n\r\n"
            ).encode() + img_data + f"\r\n--{boundary}--\r\n".encode()

            req = urllib.request.Request(f"{space_url}/upload", data=parts, method="POST")
            req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
            if token:
                req.add_header("Authorization", f"Bearer {token}")

            with urllib.request.urlopen(req, timeout=60) as r:
                res = json.loads(r.read())
                return res[0] # Returns the partial path or filename
        except Exception as e:
            raise RuntimeError(f"Upload failed: {e}")

    def predict(self, token, space_url, person_path, garment_path, description="a garment", steps=30):
        """Triggers the try-on prediction using the official 7-parameter schema."""
        try:
            payload = {
                "data": [
                    {"background": {"path": person_path}, "layers": [], "composite": None},
                    {"path": garment_path},
                    description,
                    True, # is_checked (use auto-mask)
                    False, # is_checked_crop (False by default to avoid unwanted cropping)
                    steps,
                    42 # seed
                ]
            }
            data = json.dumps(payload).encode()
            req = urllib.request.Request(f"{space_url}/call/tryon", data=data, method="POST")
            req.add_header("Content-Type", "application/json")
            if token:
                req.add_header("Authorization", f"Bearer {token}")

            with urllib.request.urlopen(req, timeout=60) as r:
                res = json.loads(r.read())
                return res.get("event_id")
        except Exception as e:
            raise RuntimeError(f"Prediction trigger failed: {e}")

    def poll(self, token, space_url, event_id):
        """Consume the SSE stream from Gradio 4.x until completion or error."""
        try:
            req = urllib.request.Request(f"{space_url}/call/tryon/{event_id}", method="GET")
            if token:
                req.add_header("Authorization", f"Bearer {token}")

            print(f"  ⟳ TryOn Stream opened: {event_id}")
            # We don't set a short timeout here because we WANT it to block until generation is complete.
            # 5 minutes is a safe total deadline for this space.
            with urllib.request.urlopen(req, timeout=300) as r:
                current_event = None
                for line in r:
                    line = line.decode('utf-8').strip()
                    if not line: continue
                    
                    if line.startswith('event: '):
                        current_event = line[7:]
                        # print(f"  ℹ Stream Event: {current_event}")
                    elif line.startswith('data: '):
                        try:
                            # Gradio 4.x format for data chunks
                            data_str = line[6:]
                            data = json.loads(data_str)
                            
                            if current_event == 'complete':
                                # data should be the list of result objects
                                if isinstance(data, list) and len(data) > 0:
                                    print(f"  ✓ TryOn Stream complete!")
                                    return data[0]
                                return data # Fallback to full list if expected
                            
                            if current_event == 'heartbeat':
                                # print(f"  ... beating ...")
                                pass
                                
                            if current_event == 'error':
                                raise RuntimeError(f"Gradio Space error: {data}")
                                
                        except json.JSONDecodeError:
                            print(f"  ⚠️ Could not parse JSON from line: {line}")
                            continue

                print(f"  ⚠️ Stream closed without a completion event.")
                return None
        except Exception as e:
            print(f"  ❌ TryOn SSE Error: {e}")
            raise e

    def get_final_url(self, space_url, output_data):
        """Helper to construct the full image URL from output data."""
        if not output_data: return None
        if isinstance(output_data, str):
            return output_data if output_data.startswith('http') else f"{space_url}/file={output_data}"
        
        path = output_data.get('url') or output_data.get('path')
        if not path: return None
        return path if path.startswith('http') else f"{space_url}/file={path}"

tryon_engine = TryOnEngine()
