import os
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision

# Path to the bundled HandLandmarker model (downloaded once during setup).
_MODEL_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "..", "Models", "mediapipe", "hand_landmarker.task"
)

# Standard 21-point hand skeleton connections (for drawing).
_HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),         # thumb
    (0, 5), (5, 6), (6, 7), (7, 8),         # index
    (5, 9), (9, 10), (10, 11), (11, 12),    # middle
    (9, 13), (13, 14), (14, 15), (15, 16),  # ring
    (13, 17), (17, 18), (18, 19), (19, 20), # pinky
    (0, 17),                                # palm base
]


class HandDetector:
    """Hand landmark detector.

    Migrated from the legacy mp.solutions.hands API (removed from the Python
    3.13 mediapipe wheels) to the new mediapipe Tasks API (HandLandmarker).
    The public getPosition() signature is unchanged so GestureEngine keeps
    working without modification.
    """

    def __init__(self, mode=False, maxHands=1, modelComplexity=0, detectionCon=0.5, trackCon=0.5):
        self.maxHands = maxHands
        options = mp_vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=os.path.abspath(_MODEL_PATH)),
            running_mode=mp_vision.RunningMode.IMAGE,
            num_hands=maxHands,
            min_hand_detection_confidence=detectionCon,
            min_hand_presence_confidence=detectionCon,
            min_tracking_confidence=trackCon,
        )
        self.landmarker = mp_vision.HandLandmarker.create_from_options(options)

    def getPosition(self, img, indexes=range(21), hand_no=0, draw=False):
        lst = []
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(img_rgb))
        results = self.landmarker.detect(mp_image)

        hands = results.hand_landmarks  # list of hands, each a list of 21 landmarks
        if hands and len(hands) >= hand_no + 1:
            my_hand = hands[hand_no]
            h, w, _ = img.shape
            pts = [(int(lm.x * w), int(lm.y * h)) for lm in my_hand]

            indexes = set(indexes)
            for idx, (x, y) in enumerate(pts):
                if idx in indexes:
                    lst.append((x, y))

            if draw:
                for a, b in _HAND_CONNECTIONS:
                    cv2.line(img, pts[a], pts[b], (255, 255, 255), 2)
                for (x, y) in pts:
                    cv2.circle(img, (x, y), 4, (0, 255, 0), cv2.FILLED)

        return lst
