import cv2
import mediapipe as mp

class HandDetector:
    def __init__(self, mode=False, maxHands=1, modelComplexity=0, detectionCon=0.5, trackCon=0.5):
        self.mode = mode
        self.maxHands = maxHands
        self.modelComplexity = modelComplexity
        self.detectionCon = detectionCon
        self.trackCon = trackCon

        self.mpHands = mp.solutions.hands
        self.hands = self.mpHands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.maxHands,
            model_complexity=self.modelComplexity,
            min_detection_confidence=self.detectionCon,
            min_tracking_confidence=self.trackCon
        )
        self.mpDraw = mp.solutions.drawing_utils

    def getPosition(self, img, indexes=range(21), hand_no=0, draw=False):
        lst = []
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = self.hands.process(imgRGB)
        if results.multi_hand_landmarks:
            if len(results.multi_hand_landmarks) >= hand_no + 1:
                myHand = results.multi_hand_landmarks[hand_no]
                for id, lm in enumerate(myHand.landmark):
                    if id in indexes:
                        h, w, c = img.shape
                        x, y = int(lm.x * w), int(lm.y * h)
                        lst.append((x, y))
                if draw:
                    self.mpDraw.draw_landmarks(img, myHand, self.mpHands.HAND_CONNECTIONS)
        return lst
