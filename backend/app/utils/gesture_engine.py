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
        self.current_frame = None
        self.last_raw_frame = None
        
        # Performance settings
        self.wCam, self.hCam = 640, 480
        self.frameR = 100
        self.smoothening = 5
        self.plocX, self.plocY = 0, 0
        self.wScr, self.hScr = pyautogui.size()

    def start(self):
        with self.lock:
            if self.is_running:
                return True
            
            try:
                self.cap = cv2.VideoCapture(0)
                if not self.cap.isOpened():
                    print("Camera failed to open via cv2")
                    return False
                
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.wCam)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.hCam)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize buffer delay
                
                self.detector = HandDetector(detectionCon=0.5, trackCon=0.5)
                self.is_running = True
                self.thread = threading.Thread(target=self._update, daemon=True)
                self.thread.start()
                return True
            except Exception as e:
                print(f"Failed to start GestureEngine: {e}")
                if self.cap:
                    self.cap.release()
                self.is_running = False
                return False

    def stop(self):
        with self.lock:
            self.is_running = False
            if self.cap:
                self.cap.release()
            self.cap = None

    def _update(self):
        while self.is_running:
            success, img = self.cap.read()
            if not success:
                continue
            
            img = cv2.flip(img, 1)
            
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
