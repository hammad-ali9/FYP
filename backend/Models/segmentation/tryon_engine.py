"""
Virtual Try-On Engine for VirtualFit
Fits segmented clothing onto a human body image using pose estimation.

This is a beginner-friendly implementation with clear, simple logic.
"""

import os
import numpy as np
from PIL import Image
import cv2

# Try to import mediapipe for pose detection
try:
    import mediapipe as mp
    HAS_MEDIAPIPE = True
except ImportError:
    HAS_MEDIAPIPE = False
    print("WARNING: MediaPipe not installed! Run: pip install mediapipe")


def detect_body_landmarks(image_path):
    """
    Detect body pose landmarks in an image using MediaPipe.
    
    Returns key points for fitting clothes:
    - shoulders (left, right)
    - hips (left, right)
    - elbows (left, right)
    - wrists (left, right)
    
    Args:
        image_path: Path to the user's body image
    
    Returns:
        Dictionary with landmark positions as (x, y) tuples
        Returns None if no pose detected
    """
    
    if not HAS_MEDIAPIPE:
        print("Error: MediaPipe required for pose detection!")
        return None
    
    # Load image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not load image: {image_path}")
        return None
    
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    height, width = image.shape[:2]
    
    # Initialize MediaPipe Pose
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
    
    # Process image
    results = pose.process(image_rgb)
    
    if not results.pose_landmarks:
        print("No pose detected in image!")
        pose.close()
        return None
    
    landmarks = results.pose_landmarks.landmark
    
    # Extract key landmarks
    # MediaPipe landmark indices:
    # 11 = left shoulder, 12 = right shoulder
    # 13 = left elbow, 14 = right elbow
    # 15 = left wrist, 16 = right wrist
    # 23 = left hip, 24 = right hip
    
    def get_point(idx):
        """Get (x, y) coordinates for a landmark index"""
        lm = landmarks[idx]
        return (int(lm.x * width), int(lm.y * height))
    
    body_landmarks = {
        "left_shoulder": get_point(11),
        "right_shoulder": get_point(12),
        "left_elbow": get_point(13),
        "right_elbow": get_point(14),
        "left_wrist": get_point(15),
        "right_wrist": get_point(16),
        "left_hip": get_point(23),
        "right_hip": get_point(24),
        "image_size": (width, height)
    }
    
    # Calculate derived measurements
    body_landmarks["shoulder_width"] = abs(
        body_landmarks["right_shoulder"][0] - body_landmarks["left_shoulder"][0]
    )
    body_landmarks["torso_height"] = abs(
        body_landmarks["left_hip"][1] - body_landmarks["left_shoulder"][1]
    )
    
    # Shoulder center point
    body_landmarks["shoulder_center"] = (
        (body_landmarks["left_shoulder"][0] + body_landmarks["right_shoulder"][0]) // 2,
        (body_landmarks["left_shoulder"][1] + body_landmarks["right_shoulder"][1]) // 2
    )
    
    # Hip center point
    body_landmarks["hip_center"] = (
        (body_landmarks["left_hip"][0] + body_landmarks["right_hip"][0]) // 2,
        (body_landmarks["left_hip"][1] + body_landmarks["right_hip"][1]) // 2
    )
    
    pose.close()
    
    print(f"Pose detected! Shoulder width: {body_landmarks['shoulder_width']}px")
    return body_landmarks


def fit_upper_body_garment(garment_path, body_image_path, output_path=None, landmarks=None):
    """
    Fit an upper body garment (shirt, jacket) onto a person's image.
    
    How it works:
    1. Detect body pose (shoulders, hips)
    2. Scale garment to match shoulder width
    3. Position garment at shoulder center
    4. Blend onto the body image
    
    Args:
        garment_path: Path to segmented garment PNG (with transparency)
        body_image_path: Path to the user's body image
        output_path: Where to save the result (optional)
        landmarks: Pre-computed landmarks (optional, will detect if not provided)
    
    Returns:
        Dictionary with result path and fitting info
    """
    
    print("=" * 50)
    print("Fitting Upper Body Garment")
    print("=" * 50)
    
    # Step 1: Detect body landmarks
    if landmarks is None:
        print("\nStep 1: Detecting body pose...")
        landmarks = detect_body_landmarks(body_image_path)
        
        if landmarks is None:
            print("Error: Could not detect pose!")
            return None
    else:
        print("\nStep 1: Using provided landmarks")
    
    # Step 2: Load images
    print("\nStep 2: Loading images...")
    
    # Load body image
    body_image = Image.open(body_image_path).convert("RGBA")
    body_width, body_height = body_image.size
    
    # Load garment (should have transparency)
    garment = Image.open(garment_path).convert("RGBA")
    garment_width, garment_height = garment.size
    
    print(f"  Body image: {body_width}x{body_height}")
    print(f"  Garment: {garment_width}x{garment_height}")
    
    # Step 3: Calculate scaling
    print("\nStep 3: Calculating fit...")
    
    # We want the garment to match the person's shoulder width
    # Add some extra width for natural look (15% wider)
    target_width = int(landmarks["shoulder_width"] * 1.4)
    
    # Calculate scale factor
    scale = target_width / garment_width
    
    # New garment size
    new_width = int(garment_width * scale)
    new_height = int(garment_height * scale)
    
    print(f"  Scale factor: {scale:.2f}")
    print(f"  New garment size: {new_width}x{new_height}")
    
    # Step 4: Resize garment
    print("\nStep 4: Resizing garment...")
    garment_resized = garment.resize((new_width, new_height), Image.LANCZOS)
    
    # Step 5: Calculate position
    print("\nStep 5: Positioning garment...")
    
    # Center the garment on the shoulder center
    # Offset upward slightly so collar aligns with neck
    shoulder_center = landmarks["shoulder_center"]
    
    # Position: center horizontally on shoulders, top at shoulder level
    x_position = shoulder_center[0] - (new_width // 2)
    y_position = shoulder_center[1] - int(new_height * 0.15)  # Slight offset up
    
    print(f"  Position: ({x_position}, {y_position})")
    
    # Step 6: Composite images
    print("\nStep 6: Compositing...")
    
    # Create output image (copy of body)
    result = body_image.copy()
    
    # Paste garment onto body
    # We need to handle negative positions (garment goes off edge)
    result.paste(garment_resized, (x_position, y_position), garment_resized)
    
    # Step 7: Save result
    if output_path is None:
        base_name = os.path.splitext(os.path.basename(body_image_path))[0]
        output_folder = os.path.dirname(body_image_path)
        if output_folder == "":
            output_folder = "."
        output_path = os.path.join(output_folder, f"{base_name}_tryon.png")
    
    result.save(output_path)
    print(f"\nResult saved: {output_path}")
    
    return {
        "result_image": output_path,
        "scale": scale,
        "position": (x_position, y_position),
        "garment_size": (new_width, new_height)
    }


def virtual_tryon(garment_path, body_image_path, garment_type="upper_body", output_path=None):
    """
    Main function to perform virtual try-on.
    
    Args:
        garment_path: Path to segmented garment PNG
        body_image_path: Path to user's body image
        garment_type: "upper_body", "lower_body", or "shoes"
        output_path: Where to save result (optional)
    
    Returns:
        Dictionary with result info
    """
    
    print("\n" + "=" * 50)
    print("VirtualFit Try-On Engine")
    print("=" * 50)
    print(f"\nGarment: {garment_path}")
    print(f"Body: {body_image_path}")
    print(f"Type: {garment_type}")
    
    # Validate files exist
    if not os.path.exists(garment_path):
        print(f"Error: Garment not found: {garment_path}")
        return None
    
    if not os.path.exists(body_image_path):
        print(f"Error: Body image not found: {body_image_path}")
        return None
    
    # Route to appropriate fitting function
    if garment_type == "upper_body":
        return fit_upper_body_garment(garment_path, body_image_path, output_path)
    elif garment_type == "lower_body":
        print("Lower body fitting not yet implemented!")
        return None
    elif garment_type == "shoes":
        print("Shoe fitting not yet implemented!")
        return None
    else:
        print(f"Unknown garment type: {garment_type}")
        return None


# ============================================
# EXAMPLE USAGE
# ============================================

if __name__ == "__main__":
    """
    Test the try-on engine:
    python tryon_engine.py <garment_path> <body_image_path>
    
    Example:
    python tryon_engine.py shirt_clothing_segmented.png person.jpg
    """
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python tryon_engine.py <garment_path> <body_image_path>")
        print("")
        print("Example:")
        print("  python tryon_engine.py shirt_clothing_segmented.png person.jpg")
        print("")
        print("The garment should be a segmented PNG with transparent background.")
        print("The body image should show a person (front view works best).")
        sys.exit(1)
    
    garment_path = sys.argv[1]
    body_image_path = sys.argv[2]
    
    # Run try-on
    result = virtual_tryon(garment_path, body_image_path, "upper_body")
    
    if result:
        print("\n" + "=" * 50)
        print("SUCCESS!")
        print("=" * 50)
        print(f"Result saved to: {result['result_image']}")
    else:
        print("\nTry-on failed!")
