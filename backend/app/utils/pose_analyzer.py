import cv2
import mediapipe as mp
import numpy as np

class PoseAnalyzer:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.mp_draw = mp.solutions.drawing_utils

    def analyze_frame(self, frame, step="FRONT", selected_upper=False, selected_lower=False):
        """
        Analyzes a frame for body visibility and alignment based on the current capture step
        and the clothing items being tried on.
        """
        if frame is None:
            return {"status": "error", "feedback": "No frame provided"}

        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(img_rgb)
        
        h, w, c = frame.shape
        feedback = []
        is_ready = True
        
        if not results.pose_landmarks:
            return {
                "status": "waiting",
                "feedback": "Step into the frame",
                "parts_visible": 0
            }

        lms = results.pose_landmarks.landmark
        
        # 1. Determine Key Points Visibility requirements based on step
        # Front/Left/Right usually need some face parts, but BACK strictly does not.
        is_back = step.upper() == "BACK"
        
        # Determine what parts are needed
        needs_upper = selected_upper or (not selected_upper and not selected_lower) # Default to upper if none
        needs_lower = selected_lower
        
        # We always check shoulders for alignment/scaling
        core_indices = [11, 12]
        if needs_lower:
            core_indices.extend([23, 24, 31, 32])
        else: # upper body mode
            # Optional hips for better scaling, but NO LONGER MANDATORY if upper body selected
            # This allows closer / more casual captures of just shirts
            pass

        visible_count = 0
        for idx in core_indices:
            if idx < len(lms) and lms[idx].visibility > 0.5:
                visible_count += 1
                
        # Optional Nose Index (only for Front/Sides)
        nose_visible = lms[0].visibility > 0.5
        if not is_back and nose_visible:
            visible_count += 1

        # 2. Alignment Checks
        # Head/Top Check (Use nose if visible, else shoulder midpoint + buffer)
        top_y = lms[0].y if nose_visible else (lms[11].y + lms[12].y) / 2 - 0.1
        
        # Relax this check if the user just wants a shirt and is closer
        top_limit = -0.05 if (needs_upper and not needs_lower) else 0.02
        if top_y < top_limit:
            feedback.append("Head cut off at top")
            is_ready = False

        # Feet Check - Only if lower body is selected
        if needs_lower:
            if lms[31].y > 0.98 or lms[32].y > 0.98:
                 feedback.append("Step back to show feet")
                 is_ready = False

        # Centering Check (X coordinate)
        avg_x = (lms[11].x + lms[12].x) / 2
        center_threshold = 0.25 if (needs_upper and not needs_lower) else 0.3
        if avg_x < center_threshold:
            feedback.append("Move right")
            is_ready = False
        elif avg_x > (1 - center_threshold):
            feedback.append("Move left")
            is_ready = False

        # 3. Final Decision
        # Adjust min_required based on context
        if needs_upper and needs_lower:
            min_required = 6 if is_back else 7
        elif needs_lower:
            min_required = 6 # Shoulders + Hips + Feet
        else: # Upper only (default or selected)
            min_required = 2 if is_back else 3 # Shoulders + Nose
            
        if visible_count < min_required:
            feedback_msg = "Look at the camera" if not nose_visible and not is_back else "Step into the frame"
            feedback.append(feedback_msg)
            is_ready = False

        if is_ready:
            final_feedback = "Perfect! Stand still."
        else:
            final_feedback = feedback[0] if feedback else "Adjusting..."

        return {
            "status": "ready" if is_ready else "adjusting",
            "feedback": final_feedback,
            "visible_ratio": visible_count / min_required,
            "landmarks": [[lm.x, lm.y, lm.visibility] for lm in lms]
        }

pose_analyzer = PoseAnalyzer()
