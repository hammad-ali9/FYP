import os
# macOS: OpenCV's AVFoundation backend can't request camera permission from a
# background thread (the gesture engine runs in one) and crashes with
# "can not spin main run loop from other thread". Skipping the auth request lets
# it capture directly — provided the terminal app has been granted Camera access
# in System Settings > Privacy & Security > Camera.
os.environ.setdefault("OPENCV_AVFOUNDATION_SKIP_AUTH", "1")
import cv2
import numpy as np
from app.utils.hand_tracking import HandDetector
import time
import pyautogui
import threading

# Disable pyautogui failsafe (moving mouse to corner won't stop script)
pyautogui.FAILSAFE = False

class GestureEngine:
    def __init__(self):
        self.cap = None
        self.detector = None
        self.is_running = False
        self.thread = None
        self.lock = threading.Lock()
        self.start_lock = threading.Lock()  # serializes start()/stop() so concurrent
                                            # requests can't open two cameras at once
        self.current_frame = None
        self.last_raw_frame = None
        
        # Performance settings
        self.wCam, self.hCam = 640, 480
        self.frameR = 100
        self.smoothening = 5
        self.plocX, self.plocY = 0, 0
        self.wScr, self.hScr = pyautogui.size()

    def start(self):
        # Serialize the whole start so two concurrent requests can't each open a
        # camera (Flask runs with threaded=True).
        with self.start_lock:
            with self.lock:
                if self.is_running:
                    return True
            # Fully tear down any leftover thread/camera/detector first so rapid
            # start/stop cycles (e.g. React StrictMode) don't open a second camera
            # or leak MediaPipe resources — both of which crash OpenCV on macOS.
            self._teardown()
            return self._open()

    def _open(self):
        try:
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                print("Camera failed to open via cv2")
                try: cap.release()
                except Exception: pass
                return False

            cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.wCam)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.hCam)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize buffer delay

            detector = HandDetector(detectionCon=0.5, trackCon=0.5)
            with self.lock:
                self.cap = cap
                self.detector = detector
                self.is_running = True
                self.thread = threading.Thread(target=self._update, daemon=True)
                self.thread.start()
            return True
        except Exception as e:
            print(f"Failed to start GestureEngine: {e}")
            self._teardown()
            return False

    def stop(self):
        with self.start_lock:
            self._teardown()

    def _teardown(self):
        """Stop the worker thread, then release the camera and close MediaPipe.
        Joining BEFORE releasing the camera avoids releasing a VideoCapture while
        _update() is mid-read() (that segfaults macOS AVFoundation)."""
        with self.lock:
            self.is_running = False
            thread = self.thread
        if thread and thread.is_alive() and thread is not threading.current_thread():
            thread.join(timeout=3.0)
        with self.lock:
            if self.cap is not None:
                try: self.cap.release()
                except Exception: pass
                self.cap = None
            if self.detector is not None:
                try:
                    lm = getattr(self.detector, 'landmarker', None)
                    if lm is not None and hasattr(lm, 'close'):
                        lm.close()
                except Exception:
                    pass
                self.detector = None
            self.thread = None
            self.current_frame = None
            self.last_raw_frame = None

    def _update(self):
        frame_count = 0
        while self.is_running:
            success, img = self.cap.read()
            if not success:
                continue

            img = cv2.flip(img, 1)
            frame_count += 1

            # Run hand tracking only every 3rd frame to cut CPU load (MediaPipe is
            # expensive). The video feed still streams every frame, so the try-on
            # screen stays smooth; the gesture-mouse remains responsive enough.
            if frame_count % 3 == 0:
              try:
                # Run hand tracking - enable drawing to see landmarks on stream
                lmList = self.detector.getPosition(img, indexes=range(21), draw=True)

                if len(lmList) != 0:
                    x1, y1 = lmList[8]  # Index finger tip
                    index_up = lmList[8][1] < lmList[6][1]
                    middle_up = lmList[12][1] < lmList[10][1]

                    # Move Mouse
                    if index_up and not middle_up:
                        x3 = np.interp(x1, (self.frameR, self.wCam - self.frameR), (0, self.wScr))
                        y3 = np.interp(y1, (self.frameR, self.hCam - self.frameR), (0, self.hScr))
                        clocX = self.plocX + (x3 - self.plocX) / self.smoothening
                        clocY = self.plocY + (y3 - self.plocY) / self.smoothening
                        
                        try:
                            pyautogui.moveTo(clocX, clocY)
                            self.plocX, self.plocY = clocX, clocY
                        except:
                            pass

                    # Click
                    elif index_up and middle_up:
                        dist_bw = np.hypot(lmList[12][0] - x1, lmList[12][1] - y1)
                        if dist_bw < 35: 
                            try:
                                pyautogui.click()
                                time.sleep(0.2)
                            except:
                                pass
              except Exception as e:
                print(f"Engine update error: {e}")

            # Encode frame for streaming (lower quality = faster)
            ret, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 70])
            if ret:
                with self.lock:
                    self.current_frame = buffer.tobytes()
                    self.last_raw_frame = img.copy()

    def get_frame(self):
        with self.lock:
            return self.current_frame

    def get_frame_raw(self):
        with self.lock:
            return self.last_raw_frame

# Global instance for shared use across requests
engine = GestureEngine()
