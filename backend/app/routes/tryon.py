from flask import Blueprint, request, jsonify, current_app
import os
import base64
import time
from app.utils.tryon_engine import tryon_engine
from app.utils.catvton_engine import catvton_engine
from app.utils.gesture_engine import engine
from app.utils.pose_analyzer import pose_analyzer
from app.utils.narrator import narrator

tryon_bp = Blueprint('tryon', __name__)


def _ensure_camera(wait_frame=2.0):
    """Make sure the gesture-engine camera is running and has produced a frame.

    The TryOn capture screen assumes the Dashboard already started the camera,
    but it can be stopped (navigation / cleanup), which made /capture and
    /analyze return 400. Auto-starting here makes the flow self-healing.
    Returns (ok: bool, error: str|None)."""
    if not engine.is_running:
        if not engine.start():
            return False, ('Camera is not available. Grant Camera permission to the '
                           'app running the backend (System Settings > Privacy & '
                           'Security > Camera), then retry.')
    deadline = time.time() + wait_frame
    while engine.get_frame_raw() is None and time.time() < deadline:
        time.sleep(0.1)
    return True, None


@tryon_bp.route('/init', methods=['POST'])
def init_space():
    """Initializes/duplicates the Hugging Face space."""
    try:
        data = request.json or {}
        token = data.get('token') or current_app.config.get('HF_TOKEN', '')
        url = tryon_engine.ensure_space(token)
        return jsonify({
            'success': True,
            'space_url': url,
            'space_name': tryon_engine.user_space_name
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@tryon_bp.route('/capture', methods=['POST'])
def capture_frame():
    """Captures the current frame from the gesture engine's camera."""
    try:
        ok, err = _ensure_camera()
        if not ok:
            return jsonify({'success': False, 'error': err}), 503

        frame = engine.get_frame()
        if frame is None:
            return jsonify({'success': False, 'error': 'No frame available yet, please retry'}), 503
        
        # Frame is already JPEG bytes from engine.get_frame()
        b64_frame = base64.b64encode(frame).decode('utf-8')
        return jsonify({
            'success': True,
            'image_b64': b64_frame,
            'mime': 'image/jpeg'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@tryon_bp.route('/analyze', methods=['POST'])
def analyze_pose():
    """Provides real-time feedback on body pose and visibility."""
    try:
        data = request.json or {}
        step = data.get('step', 'FRONT')

        ok, err = _ensure_camera()
        if not ok:
            return jsonify({'success': False, 'error': err}), 503

        frame = engine.get_frame_raw()
        if frame is None:
            return jsonify({'success': False, 'error': 'No frame available yet, please retry'}), 503
        
        selected_upper = data.get('selected_upper', False)
        selected_lower = data.get('selected_lower', False)
        
        # Analyze with step and clothing context
        analysis = pose_analyzer.analyze_frame(
            frame, 
            step=step, 
            selected_upper=selected_upper, 
            selected_lower=selected_lower
        )
        
        # Get AI Narrator instruction
        instruction = narrator.get_instruction(step)
        analysis['narrator'] = instruction
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@tryon_bp.route('/generate', methods=['POST'])
def generate_tryon():
    """Single-shot photoreal try-on via the self-hosted IDM-VTON Colab server.

    This is the 'best photoreal' path: one high-quality IDM-VTON render of the
    given person image. It replaces the old public Hugging Face Space call, which
    was slow, frequently queued, and unreliable. The IDM-VTON server is reached
    through the same auto-discovered tunnel as the multi-view endpoint.

    Body:
        person_image:  base64/dataurl of the person (required)
        garment_image: URL or base64 of the garment (required)
        clothing_type: 'upper' | 'lower' | 'full'   (default 'upper')
        garment_desc:  short text description, improves IDM-VTON conditioning
        steps, guidance, seed: optional generation params
    """
    try:
        if not catvton_engine.is_configured():
            catvton_engine.discover()
        if not catvton_engine.is_configured():
            return jsonify({'success': False,
                            'error': 'Try-on server not available. Start the IDM-VTON '
                                     'Colab notebook (it publishes its URL automatically).'}), 503

        data = request.json or {}
        person_b64 = data.get('person_image')
        garment_src = data.get('garment_image')
        if not person_b64 or not garment_src:
            return jsonify({'success': False, 'error': 'Missing person or garment image'}), 400

        upload_folder = current_app.config.get('UPLOAD_FOLDER')
        garment_b64 = catvton_engine.resolve_image_to_b64(garment_src, upload_folder)

        out = catvton_engine.tryon(
            person_b64=person_b64,
            cloth_b64=garment_b64,
            cloth_type=data.get('clothing_type', 'upper'),
            steps=int(data.get('steps', 30)),
            guidance=float(data.get('guidance', 2.0)),
            seed=int(data.get('seed', 42)),
            cloth_desc=(data.get('garment_desc') or 'a garment'),
        )

        # Return both keys for compatibility: result_image is the data URL the IDM
        # server produced; result_url mirrors it so older callers keep working.
        return jsonify({
            'success': True,
            'result_image': out.get('image'),
            'result_url': out.get('image'),
            'seconds': out.get('seconds'),
        })

    except Exception as e:
        print(f"  ❌ TryOn Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ---------------------------------------------------------------------------
# CatVTON multi-view try-on (Colab server)
# ---------------------------------------------------------------------------

@tryon_bp.route('/server', methods=['GET', 'POST'])
def tryon_server():
    """Get or set the CatVTON Colab tunnel URL (changes every Colab session)."""
    try:
        if request.method == 'POST':
            data = request.json or {}
            url = data.get('url', '')
            catvton_engine.set_url(url)
        elif not catvton_engine.is_configured():
            # GET with nothing set yet — try to auto-discover from the store
            catvton_engine.discover()
        return jsonify({
            'success': True,
            'url': catvton_engine.base_url,
            'configured': catvton_engine.is_configured(),
            'discovery_url': catvton_engine.discovery_url,
            'health': catvton_engine.health(),
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@tryon_bp.route('/generate_multiview', methods=['POST'])
def generate_multiview():
    """Run CatVTON once per captured body view and return a result per view.

    Body:
        person_images: { front, back, left, right }  (base64/dataurl; front required)
        garment_front: URL or base64 of the garment's front image (required)
        garment_back:  URL or base64 of the garment's back image  (optional)
        clothing_type: 'upper' | 'lower' | 'full'
        steps, guidance, seed: optional generation params
    """
    try:
        if not catvton_engine.is_configured():
            catvton_engine.discover()  # auto-pick up the URL the notebook published
        if not catvton_engine.is_configured():
            return jsonify({'success': False,
                            'error': 'Try-on server not available. Start the Colab '
                                     'notebook (it publishes its URL automatically).'}), 503

        data = request.json or {}
        person_images = data.get('person_images') or {}
        person_views = {k: v for k, v in person_images.items() if v}
        if not person_views.get('front'):
            return jsonify({'success': False, 'error': 'front person image is required'}), 400

        upload_folder = current_app.config.get('UPLOAD_FOLDER')

        # Build the ordered list of garments to apply per view. Supports:
        #   - NEW: data['garments'] = [{image, clothing_type, desc, back_image}]
        #          (e.g. a shirt AND a pant -> applied in order, chained)
        #   - LEGACY: single garment via garment_front / clothing_type
        garments = []
        if data.get('garments'):
            for g in data['garments']:
                img = g.get('image')
                if not img:
                    continue
                garments.append({
                    'b64': catvton_engine.resolve_image_to_b64(img, upload_folder),
                    'back_b64': (catvton_engine.resolve_image_to_b64(g['back_image'], upload_folder)
                                 if g.get('back_image') else None),
                    'type': g.get('clothing_type', 'upper'),
                    'desc': g.get('desc') or 'a garment',
                })
        else:
            garment_front = data.get('garment_front')
            if not garment_front:
                return jsonify({'success': False, 'error': 'garment_front (or garments) is required'}), 400
            garment_back = data.get('garment_back')
            garments.append({
                'b64': catvton_engine.resolve_image_to_b64(garment_front, upload_folder),
                'back_b64': (catvton_engine.resolve_image_to_b64(garment_back, upload_folder)
                             if garment_back else None),
                'type': data.get('clothing_type', 'upper'),
                'desc': data.get('garment_desc') or 'a garment',
            })

        if not garments:
            return jsonify({'success': False, 'error': 'at least one garment is required'}), 400

        # Apply upper before lower so chaining looks natural.
        garments.sort(key=lambda g: {'upper': 0, 'full': 0, 'lower': 1}.get(g['type'], 0))

        out = catvton_engine.tryon_outfit(
            person_views=person_views,
            garments=garments,
            steps=int(data.get('steps', 30)),
            guidance=float(data.get('guidance', 2.0)),
            seed=int(data.get('seed', 42)),
        )

        if not out['results']:
            return jsonify({'success': False,
                            'error': 'All views failed',
                            'errors': out['errors']}), 502

        return jsonify({'success': True, **out})

    except Exception as e:
        print(f"  ❌ Multiview TryOn Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
