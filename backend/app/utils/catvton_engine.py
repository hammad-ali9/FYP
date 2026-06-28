"""
CatVTON try-on engine client.

Talks to the CatVTON FastAPI server that runs on Google Colab (T4 GPU) and is
exposed through a cloudflared/ngrok tunnel. The tunnel URL changes every Colab
session, so the base URL is read from the TRYON_API_URL env var at startup and
can be overridden at runtime via set_url() (see /api/tryon/server route).

Server contract (see colab/catvton_server.ipynb):
    GET  /health -> {"status": "ok", "gpu": ..., "vram_gb": ...}
    POST /tryon  -> {"image": "data:image/png;base64,...", "seconds": float}
        body: {
            person_image: base64/dataurl,
            cloth_image:  base64/dataurl,
            cloth_type:   "upper" | "lower" | "overall",
            num_inference_steps: int,
            guidance_scale: float,
            seed: int
        }

Multi-view: CatVTON is a single-image model. We approximate the MV-Fashion
360 look by running it once per captured body view (front/back/left/right),
using the garment's back image for the BACK view and the front image for the
rest. Generation is sequential (one tunnel call per view).
"""

import os
import re
import base64
import urllib.request

import requests

# Map the product's clothing_type to CatVTON's cloth_type vocabulary.
_CLOTH_TYPE_MAP = {
    'upper': 'upper',
    'lower': 'lower',
    'full': 'overall',
    'overall': 'overall',
}

# Views rendered for the 360 viewer, in display order.
VIEWS = ['front', 'left', 'right', 'back']


class CatVTONEngine:
    def __init__(self, base_url: str = '', discovery_url: str = ''):
        self.base_url = (base_url or os.getenv('TRYON_API_URL', '')).rstrip('/')
        # A small public JSON store ({"url": "..."}) that the Colab notebook
        # writes its tunnel URL to on startup, so the backend can auto-discover
        # the current URL without anyone setting it manually each session.
        self.discovery_url = discovery_url or os.getenv('TRYON_DISCOVERY_URL', '')

    # ----- configuration ---------------------------------------------------
    def set_url(self, url: str):
        """Override the tunnel URL at runtime (Colab URL changes per session)."""
        self.base_url = (url or '').rstrip('/')
        return self.base_url

    def set_discovery_url(self, url: str):
        self.discovery_url = url or ''
        return self.discovery_url

    def discover(self):
        """Fetch the current tunnel URL from the discovery store. Returns the
        resolved base_url, or None if discovery is unset/unavailable."""
        if not self.discovery_url:
            return None
        try:
            r = requests.get(self.discovery_url, timeout=15,
                             headers={'Accept': 'application/json'})
            r.raise_for_status()
            url = ''
            try:
                url = (r.json() or {}).get('url', '')
            except ValueError:
                m = re.search(r'https://[^\s"\']+', r.text)
                url = m.group(0) if m else ''
            if url:
                return self.set_url(url)
        except Exception:
            return None
        return None

    def is_configured(self) -> bool:
        return bool(self.base_url)

    def health(self):
        if not self.base_url:
            return {'ok': False, 'error': 'TRYON_API_URL not set'}
        try:
            r = requests.get(f'{self.base_url}/health', timeout=30)
            r.raise_for_status()
            return {'ok': True, **r.json()}
        except Exception as e:
            return {'ok': False, 'error': str(e)}

    # ----- helpers ---------------------------------------------------------
    @staticmethod
    def _strip_dataurl(b64: str) -> str:
        if b64 and ',' in b64 and b64.strip().startswith('data:'):
            return b64.split(',', 1)[1]
        return b64

    @staticmethod
    def resolve_image_to_b64(src: str, upload_folder: str = None) -> str:
        """Accepts a base64/dataurl string, a local /uploads URL, or an external
        URL, and returns a raw base64 string (no data: prefix)."""
        if not src:
            raise ValueError('empty image source')

        # Already base64 / data URL
        if src.startswith('data:') or (len(src) > 200 and '://' not in src[:12]):
            return CatVTONEngine._strip_dataurl(src)

        # Local upload served by Flask
        is_local = 'localhost:5000' in src or '127.0.0.1:5000' in src or src.startswith('/uploads')
        if is_local and upload_folder:
            filename = src.split('/')[-1]
            path = os.path.join(upload_folder, filename)
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    return base64.b64encode(f.read()).decode('utf-8')

        # External URL — use requests (bundles certifi) so it works on macOS,
        # where urllib raises SSL: CERTIFICATE_VERIFY_FAILED. Fall back to an
        # unverified urllib fetch only if requests itself fails.
        try:
            r = requests.get(src, timeout=60)
            r.raise_for_status()
            return base64.b64encode(r.content).decode('utf-8')
        except Exception:
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with urllib.request.urlopen(src, context=ctx, timeout=60) as resp:
                return base64.b64encode(resp.read()).decode('utf-8')

    # ----- inference -------------------------------------------------------
    def _post_tryon(self, payload: dict, timeout: int) -> dict:
        r = requests.post(f'{self.base_url}/tryon', json=payload, timeout=timeout)
        r.raise_for_status()
        return r.json()

    def tryon(self, person_b64: str, cloth_b64: str, cloth_type: str = 'upper',
              steps: int = 30, guidance: float = 2.0, seed: int = 42,
              cloth_desc: str = 'a garment', timeout: int = 300) -> dict:
        """Single-view try-on. Returns {'image': dataurl, 'seconds': float}.

        Auto-discovers the tunnel URL if not configured, and re-discovers once
        if the request fails (the Colab URL changes every session).

        cloth_desc is IDM-VTON's text conditioning ("model is wearing <desc>") and
        meaningfully improves results; the CatVTON server simply ignores the field.
        guidance default 2.0 is IDM-VTON's recommended scale."""
        if not self.base_url:
            self.discover()
        if not self.base_url:
            raise RuntimeError('Try-on server not available (discovery failed). '
                               'Start the Colab notebook so it publishes its URL.')

        payload = {
            'person_image': self._strip_dataurl(person_b64),
            'cloth_image': self._strip_dataurl(cloth_b64),
            'cloth_type': _CLOTH_TYPE_MAP.get(cloth_type, 'upper'),
            'num_inference_steps': steps,
            'guidance_scale': guidance,
            'seed': seed,
            'cloth_desc': cloth_desc,
        }
        try:
            return self._post_tryon(payload, timeout)
        except (requests.ConnectionError, requests.Timeout):
            # Stale URL (likely a new Colab session) — re-discover and retry once.
            if self.discover():
                return self._post_tryon(payload, timeout)
            raise

    def tryon_multiview(self, person_views: dict, garment_front_b64: str,
                        garment_back_b64: str = None, cloth_type: str = 'upper',
                        steps: int = 30, guidance: float = 2.0, seed: int = 42,
                        garment_desc: str = 'a garment') -> dict:
        """Run try-on for every captured view.

        person_views: {'front': b64, 'back': b64, 'left': b64, 'right': b64}
            (only the views present are processed)
        garment_back_b64 is used for the BACK view; the front image is used for
        every other view (and as a fallback if no back image is supplied).

        Returns {'results': {view: dataurl}, 'timings': {view: seconds}, 'errors': {view: msg}}.
        """
        results, timings, errors = {}, {}, {}
        back_garment = garment_back_b64 or garment_front_b64

        for view in VIEWS:
            person = person_views.get(view)
            if not person:
                continue
            garment = back_garment if view == 'back' else garment_front_b64
            try:
                out = self.tryon(person, garment, cloth_type=cloth_type,
                                 steps=steps, guidance=guidance, seed=seed,
                                 cloth_desc=garment_desc)
                results[view] = out.get('image')
                timings[view] = out.get('seconds')
            except Exception as e:  # one failed view shouldn't kill the rest
                errors[view] = str(e)

        return {'results': results, 'timings': timings, 'errors': errors}

    def mesh(self, image_b64: str, timeout: int = 300) -> dict:
        """Single-image -> 3D mesh via the Colab server's /mesh (TripoSR).
        Returns {'mesh_b64': base64-of-glb, 'format': 'glb', 'seconds': float}."""
        if not self.base_url:
            self.discover()
        if not self.base_url:
            raise RuntimeError('Try-on server not available (discovery failed). '
                               'Start the Colab notebook so it publishes its URL.')
        payload = {'image': self._strip_dataurl(image_b64)}
        try:
            r = requests.post(f'{self.base_url}/mesh', json=payload, timeout=timeout)
            r.raise_for_status()
            return r.json()
        except (requests.ConnectionError, requests.Timeout):
            if self.discover():
                r = requests.post(f'{self.base_url}/mesh', json=payload, timeout=timeout)
                r.raise_for_status()
                return r.json()
            raise

    def tryon_outfit(self, person_views: dict, garments: list,
                     steps: int = 30, guidance: float = 2.0, seed: int = 42) -> dict:
        """Apply an ordered list of garments to each captured view, CHAINING each
        result as the person input for the next garment — so a shirt (upper) and a
        pant (lower) get composited into one image. IDM-VTON only fits one region
        per pass, so a full outfit needs one pass per garment.

        garments: [{'b64': str, 'type': 'upper'|'lower'|'full', 'desc': str,
                    'back_b64': optional str}]  applied in order.
        Returns {'results': {view: dataurl}, 'timings': {view: seconds}, 'errors': {view: msg}}.
        """
        results, timings, errors = {}, {}, {}
        for view in VIEWS:
            person = person_views.get(view)
            if not person:
                continue
            try:
                img = person
                total = 0.0
                for g in garments:
                    cloth = (g.get('back_b64') if (view == 'back' and g.get('back_b64'))
                             else g['b64'])
                    out = self.tryon(img, cloth, cloth_type=g.get('type', 'upper'),
                                     steps=steps, guidance=guidance, seed=seed,
                                     cloth_desc=g.get('desc', 'a garment'))
                    img = out.get('image')          # chain: result -> next pass's person
                    total += out.get('seconds') or 0
                results[view] = img
                timings[view] = round(total, 1)
            except Exception as e:  # one failed view shouldn't kill the rest
                errors[view] = str(e)
        return {'results': results, 'timings': timings, 'errors': errors}


# Global shared instance
catvton_engine = CatVTONEngine()
