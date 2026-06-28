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
    """Video streaming generator. Resilient: ensures the camera is running, waits
    for it to produce frames (instead of ending the stream when none are ready
    yet), and restarts it if it dies — so the browser <img> doesn't go black."""
    if not engine.is_running:
        engine.start()
    idle = 0
    while True:
        frame = engine.get_frame()
        if frame is None:
            time.sleep(0.03)
            idle += 1
            # Camera died mid-stream? try to bring it back.
            if not engine.is_running and idle % 30 == 0:
                engine.start()
            if idle > 300:  # ~9s with no frames at all -> stop this stream
                break
            continue
        idle = 0
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.03)

@gestures_bp.route('/video_feed')
def video_feed():
    """Video streaming route. Put this in the src attribute of an img tag."""
    if not engine.is_running:
        engine.start()  # Autostart if feed requested
    # Wait briefly for the first frame so the stream isn't empty on connect
    # (which would leave the <img> stalled/black).
    for _ in range(60):  # up to ~3s
        if engine.get_frame() is not None:
            break
        time.sleep(0.05)
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')
