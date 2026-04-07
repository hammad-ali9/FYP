from flask import Blueprint, jsonify, Response, current_app
import os
import time
from app.utils.gesture_engine import engine

gestures_bp = Blueprint('gestures', __name__)

@gestures_bp.route('/start', methods=['POST'])
def start_gestures():
    try:
        success = engine.start()
        if success:
            return jsonify({'success': True, 'message': 'Gesture control started'})
        else:
            return jsonify({
                'success': False, 
                'error': 'Could not start camera. Ensure it is not being used by the browser or another app.'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Engine error: {str(e)}'
        }), 500

@gestures_bp.route('/stop', methods=['POST'])
def stop_gestures():
    engine.stop()
    return jsonify({'success': True, 'message': 'Gesture control stopped'})

@gestures_bp.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        'success': True, 
        'is_running': engine.is_running
    })

def gen_frames():
    """Video streaming generator function."""
    while engine.is_running:
        frame = engine.get_frame()
        if frame is None:
            time.sleep(0.01)
            continue
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.01)

@gestures_bp.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    if not engine.is_running:
        engine.start() # Autostart if feed requested
        
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')
