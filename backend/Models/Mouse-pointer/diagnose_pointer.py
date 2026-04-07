import cv2
import numpy as np
import HandTrackingModule as htm
import time
import pyautogui
import sys

# Diagnostic settings
print("Starting Gesture Diagnostic...")
print(f"Python version: {sys.version}")
print(f"OpenCV version: {cv2.__version__}")
try:
    print(f"Screen size: {pyautogui.size()}")
except Exception as e:
    print(f"Error getting screen size: {e}")

wCam, hCam = 640, 480
frameR = 100
smoothening = 5

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("ERROR: Could not open webcam. It might be in use by another application (like your browser).")
    sys.exit(1)

cap.set(3, wCam)
cap.set(4, hCam)

try:
    detector = htm.FindHands(detection_con=0.7, tracking_con=0.7)
    print("Hand detector initialized.")
except Exception as e:
    print(f"Error initializing hand detector: {e}")
    sys.exit(1)

wScr, hScr = pyautogui.size()

plocX, plocY = 0, 0

print("Loop starting... Press 'q' in the window to quit.")

while True:
    success, img = cap.read()
    if not success:
        print("Failed to capture image")
        break
    
    img = cv2.flip(img, 1)
    
    try:
        lmList = detector.getPosition(img, indexes=range(21))
    except Exception as e:
        print(f"Error running detector: {e}")
        break

    if len(lmList) != 0:
        x1, y1 = lmList[8] 
        index_up = lmList[8][1] < lmList[6][1]
        middle_up = lmList[12][1] < lmList[10][1]

        if index_up and not middle_up:
            x3 = np.interp(x1, (frameR, wCam - frameR), (0, wScr))
            y3 = np.interp(y1, (frameR, hCam - frameR), (0, hScr))
            
            clocX = plocX + (x3 - plocX) / smoothening
            clocY = plocY + (y3 - plocY) / smoothening
            
            try:
                # Testing without the underscore if it fails
                pyautogui.moveTo(clocX, clocY) 
                plocX, plocY = clocX, clocY
            except Exception as e:
                print(f"Mouse Movement Error: {e}")

        elif index_up and middle_up:
            dist_bw = np.hypot(lmList[12][0] - x1, lmList[12][1] - y1)
            if dist_bw < 30: 
                print("Click detected!")
                pyautogui.click()
                time.sleep(0.1)

    cv2.imshow("Diagnostic Mode", img)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
