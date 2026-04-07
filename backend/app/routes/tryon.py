from flask import Blueprint, request, jsonify, current_app
import os
import base64
import time
from app.utils.tryon_engine import tryon_engine
from app.utils.gesture_engine import engine
from app.utils.pose_analyzer import pose_analyzer
from app.utils.narrator import narrator

tryon_bp = Blueprint('tryon', __name__)

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
        if not engine.is_running:
            return jsonify({'success': False, 'error': 'Camera is not running'}), 400
        
        frame = engine.get_frame()
        if frame is None:
            return jsonify({'success': False, 'error': 'No frame available'}), 500
        
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
        
        if not engine.is_running:
            return jsonify({'success': False, 'error': 'Camera is not running'}), 400
        
        frame = engine.get_frame_raw()
        if frame is None:
            return jsonify({'success': False, 'error': 'No frame available'}), 500
        
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
    """Performs the full IDM-VTON try-on process."""
    try:
        data = request.json or {}
        token = data.get('token') or current_app.config.get('HF_TOKEN', '')
        space_url = data.get('space_url') or tryon_engine.ensure_space(token)
        
        person_b64 = data.get('person_image') # Base64
        garment_url = data.get('garment_image') # Full URL
        
        if not person_b64 or not garment_url:
            return jsonify({'success': False, 'error': 'Missing person or garment image'}), 400

        # 1. Upload person image
        print(f"  ⟳ TryOn: Uploading person image...")
        person_up = tryon_engine.upload_file(token, space_url, person_b64)
        
        # 2. Upload/Proxy garment image (from URL)
        print(f"  ⟳ TryOn: Preparing garment image (URL: {garment_url})...")
        
        garment_data = None
        is_local = "localhost:5000" in garment_url or garment_url.startswith("/uploads")
        
        if is_local:
            print(f"  ✓ TryOn: Detected local garment image. Reading from disk...")
            # Extract filename from URL (usually /uploads/filename.jpg)
            filename = garment_url.split('/')[-1]
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    garment_data = f.read()
            else:
                print(f"  ❌ TryOn: Local file not found: {filepath}")
        
        if not garment_data:
            print(f"  ⟳ TryOn: Downloading garment image from external URL...")
            import urllib.request
            with urllib.request.urlopen(garment_url) as r:
                garment_data = r.read()
        
        garment_b64 = base64.b64encode(garment_data).decode('utf-8')
        
        print(f"  ⟳ TryOn: Uploading garment image to Space...")
        garment_up = tryon_engine.upload_file(token, space_url, garment_b64)

        # 3. Predict
        print(f"  ⟳ TryOn: Triggering prediction...")
        event_id = tryon_engine.predict(token, space_url, person_up, garment_up)
        
        # 4. Wait for Result (Now synchronous stream)
        print(f"  ⟳ TryOn: Waiting for stream completion...")
        output = tryon_engine.poll(token, space_url, event_id)
        
        if not output:
             return jsonify({'success': False, 'error': 'Generation timed out or stream closed'}), 504
        
        # 5. Get final URL
        final_url = tryon_engine.get_final_url(space_url, output)
        return jsonify({
            'success': True,
            'result_url': final_url
        })

    except Exception as e:
        print(f"  ❌ TryOn Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
