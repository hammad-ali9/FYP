import cv2
import numpy as np
import HandTrackingModule as htm
import time
import pyautogui

##########################
wCam, hCam = 640, 480
frameR = 100 # Frame Reduction
smoothening = 5
##########################

pTime = 0
plocX, plocY = 0, 0
clocX, clocY = 0, 0

# For scrolling
prev_scroll_y = None

cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("CRITICAL: Could not open webcam. Ensure no other app (like your browser) is using it.")

cap.set(3, wCam)
cap.set(4, hCam)

# Lower confidence slightly to improve detection speed/reliability
detector = htm.FindHands(detection_con=0.7, tracking_con=0.7)
wScr, hScr = pyautogui.size()

# Standard resizable window
window_name = "Virtual Fit Gesture Control"
cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)

print("Gesture Control Started. Use your hand to control the mouse.")

fail_count = 0
while True:
    success, img = cap.read()
    if not success:
        fail_count += 1
        if fail_count > 10:
            print("ERROR: Lost camera connection or camera is busy.")
            break
        time.sleep(0.1)
        continue
    
    fail_count = 0
    # Mirror effect
    img = cv2.flip(img, 1)
    
    # landmarks tracking
    try:
        lmList = detector.getPosition(img, indexes=range(21))
    except Exception as e:
        print(f"Tracking error: {e}")
        continue

    if len(lmList) != 0:
        x1, y1 = lmList[8]  # Index finger tip
        
        # Tip is higher (smaller y) than the middle joint (PIP)
        index_up = lmList[8][1] < lmList[6][1]
        middle_up = lmList[12][1] < lmList[10][1]

        # --- MOVE MOUSE LOGIC ---
        if index_up and not middle_up:
            # Convert mapping to screen coordinates
            x3 = np.interp(x1, (frameR, wCam - frameR), (0, wScr))
            y3 = np.interp(y1, (frameR, hCam - frameR), (0, hScr))
            
            # Smoothing
            clocX = plocX + (x3 - plocX) / smoothening
            clocY = plocY + (y3 - plocY) / smoothening
            
            try:
                pyautogui.moveTo(clocX, clocY)
                cv2.circle(img, (x1, y1), 10, (255, 0, 255), cv2.FILLED)
                plocX, plocY = clocX, clocY
            except Exception as e:
                print(f"Mouse Move Error: {e}")

        # --- CLICK & SCROLL LOGIC ---
        elif index_up and middle_up:
            dist_bw = np.hypot(lmList[12][0] - x1, lmList[12][1] - y1)
            
            # CLICKING: If Index and Middle collide (pinched)
            if dist_bw < 35: 
                cv2.circle(img, (x1, y1), 15, (0, 255, 0), cv2.FILLED)
                try:
                    pyautogui.click()
                    print("Click Action")
                    time.sleep(0.2) # Debounce
                except Exception as e:
                    print(f"Click Error: {e}")
    
    # Show the feed so the user knows what the camera sees
    cv2.imshow(window_name, img)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
