"""
Advanced Garment Warping for VirtualFit
Uses Thin-Plate Spline (TPS) warping to deform garments to body shape.

This module provides pixel-by-pixel transformation of garments to match body contours.
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


def get_garment_keypoints(garment_mask):
    """
    Extract control points from a garment for TPS warping.
    
    These are the source points that will be transformed to match body landmarks.
    
    Args:
        garment_mask: Binary mask of the garment
    
    Returns:
        Dictionary of keypoint positions (normalized 0-1)
    """
    # Find bounding box of garment
    rows = np.any(garment_mask > 0, axis=1)
    cols = np.any(garment_mask > 0, axis=0)
    
    if not np.any(rows) or not np.any(cols):
        return None
    
    y_min, y_max = np.where(rows)[0][[0, -1]]
    x_min, x_max = np.where(cols)[0][[0, -1]]
    
    height = y_max - y_min
    width = x_max - x_min
    
    # Define control points on garment (in absolute coordinates)
    # These represent: shoulders, underarms, waist, hem
    keypoints = {
        # Top row - shoulder area
        "left_shoulder": (x_min + int(width * 0.15), y_min + int(height * 0.05)),
        "neck_left": (x_min + int(width * 0.35), y_min),
        "neck_center": (x_min + int(width * 0.5), y_min),
        "neck_right": (x_min + int(width * 0.65), y_min),
        "right_shoulder": (x_min + int(width * 0.85), y_min + int(height * 0.05)),
        
        # Upper body - chest/underarm
        "left_underarm": (x_min, y_min + int(height * 0.25)),
        "left_chest": (x_min + int(width * 0.25), y_min + int(height * 0.25)),
        "center_chest": (x_min + int(width * 0.5), y_min + int(height * 0.25)),
        "right_chest": (x_min + int(width * 0.75), y_min + int(height * 0.25)),
        "right_underarm": (x_max, y_min + int(height * 0.25)),
        
        # Mid body - waist
        "left_waist": (x_min + int(width * 0.1), y_min + int(height * 0.6)),
        "center_waist": (x_min + int(width * 0.5), y_min + int(height * 0.6)),
        "right_waist": (x_min + int(width * 0.9), y_min + int(height * 0.6)),
        
        # Bottom - hem
        "left_hem": (x_min + int(width * 0.15), y_max),
        "center_hem": (x_min + int(width * 0.5), y_max),
        "right_hem": (x_min + int(width * 0.85), y_max),
        
        # Bounding box info
        "bbox": (x_min, y_min, x_max, y_max)
    }
    
    return keypoints


def get_body_target_points(body_landmarks, garment_keypoints):
    """
    Calculate target positions for garment keypoints based on body pose.
    
    Args:
        body_landmarks: Dictionary of body landmark positions
        garment_keypoints: Dictionary of garment control points
    
    Returns:
        Dictionary of target positions for each garment keypoint
    """
    # Get body reference points
    left_shoulder = body_landmarks["left_shoulder"]
    right_shoulder = body_landmarks["right_shoulder"]
    left_hip = body_landmarks["left_hip"]
    right_hip = body_landmarks["right_hip"]
    
    # Calculate body dimensions
    shoulder_width = abs(right_shoulder[0] - left_shoulder[0])
    torso_height = abs(left_hip[1] - left_shoulder[1])
    
    # Shoulder center
    shoulder_cx = (left_shoulder[0] + right_shoulder[0]) // 2
    shoulder_cy = (left_shoulder[1] + right_shoulder[1]) // 2
    
    # Hip center
    hip_cx = (left_hip[0] + right_hip[0]) // 2
    hip_cy = (left_hip[1] + right_hip[1]) // 2
    
    # Define target points on body
    # Scale and position garment control points to body
    targets = {}
    
    # Shoulders - extend slightly beyond body shoulders
    extend = int(shoulder_width * 0.15)
    targets["left_shoulder"] = (left_shoulder[0] - extend, left_shoulder[1] - 10)
    targets["right_shoulder"] = (right_shoulder[0] + extend, right_shoulder[1] - 10)
    
    # Neck area - at collar level
    neck_y = shoulder_cy - int(torso_height * 0.05)
    targets["neck_left"] = (shoulder_cx - int(shoulder_width * 0.15), neck_y)
    targets["neck_center"] = (shoulder_cx, neck_y)
    targets["neck_right"] = (shoulder_cx + int(shoulder_width * 0.15), neck_y)
    
    # Underarm/chest - below shoulders
    chest_y = shoulder_cy + int(torso_height * 0.2)
    targets["left_underarm"] = (left_shoulder[0] - extend, chest_y)
    targets["left_chest"] = (shoulder_cx - int(shoulder_width * 0.25), chest_y)
    targets["center_chest"] = (shoulder_cx, chest_y)
    targets["right_chest"] = (shoulder_cx + int(shoulder_width * 0.25), chest_y)
    targets["right_underarm"] = (right_shoulder[0] + extend, chest_y)
    
    # Waist - narrower than chest
    waist_y = shoulder_cy + int(torso_height * 0.6)
    hip_width = abs(right_hip[0] - left_hip[0])
    targets["left_waist"] = (hip_cx - int(hip_width * 0.5), waist_y)
    targets["center_waist"] = (hip_cx, waist_y)
    targets["right_waist"] = (hip_cx + int(hip_width * 0.5), waist_y)
    
    # Hem - at hip level, slightly wider
    hem_y = hip_cy + int(torso_height * 0.1)
    targets["left_hem"] = (hip_cx - int(hip_width * 0.55), hem_y)
    targets["center_hem"] = (hip_cx, hem_y)
    targets["right_hem"] = (hip_cx + int(hip_width * 0.55), hem_y)
    
    return targets


def compute_tps_transform(source_points, target_points):
    """
    Compute Thin-Plate Spline transformation matrices.
    
    TPS provides smooth interpolation between control points,
    allowing the garment to deform naturally.
    
    Args:
        source_points: Nx2 array of source control points
        target_points: Nx2 array of target control points
    
    Returns:
        TPS transformation object
    """
    # Create TPS transformer
    tps = cv2.createThinPlateSplineShapeTransformer()
    
    # Reshape points for OpenCV
    source = source_points.reshape(1, -1, 2).astype(np.float32)
    target = target_points.reshape(1, -1, 2).astype(np.float32)
    
    # Create matches (each point maps to itself)
    matches = [cv2.DMatch(i, i, 0) for i in range(len(source_points))]
    
    # Estimate transformation
    tps.estimateTransformation(target, source, matches)
    
    return tps


def warp_garment_tps(garment_image, garment_mask, source_keypoints, target_keypoints, output_size):
    """
    Warp garment using Thin-Plate Spline transformation.
    
    Args:
        garment_image: RGBA garment image
        garment_mask: Binary mask of garment
        source_keypoints: Control points on garment
        target_keypoints: Target points on body
        output_size: (width, height) of output image
    
    Returns:
        Warped garment image (RGBA)
    """
    # Extract matching point pairs
    point_names = ["left_shoulder", "neck_left", "neck_center", "neck_right", "right_shoulder",
                   "left_underarm", "left_chest", "center_chest", "right_chest", "right_underarm",
                   "left_waist", "center_waist", "right_waist",
                   "left_hem", "center_hem", "right_hem"]
    
    source_pts = []
    target_pts = []
    
    for name in point_names:
        if name in source_keypoints and name in target_keypoints:
            source_pts.append(source_keypoints[name])
            target_pts.append(target_keypoints[name])
    
    source_pts = np.array(source_pts, dtype=np.float32)
    target_pts = np.array(target_pts, dtype=np.float32)
    
    print(f"  Using {len(source_pts)} control points for TPS warping")
    
    # Compute TPS transformation
    tps = compute_tps_transform(source_pts, target_pts)
    
    # Convert garment to BGR for OpenCV
    garment_array = np.array(garment_image)
    garment_bgra = cv2.cvtColor(garment_array, cv2.COLOR_RGBA2BGRA)
    
    # Create output image
    output_width, output_height = output_size
    warped = np.zeros((output_height, output_width, 4), dtype=np.uint8)
    
    # Apply TPS warp
    # We need to warp each pixel
    tps.warpImage(garment_bgra, warped)
    
    # Convert back to RGBA
    warped_rgba = cv2.cvtColor(warped, cv2.COLOR_BGRA2RGBA)
    
    return Image.fromarray(warped_rgba)


def warp_garment_grid(garment_image, source_keypoints, target_keypoints, output_size):
    """
    Warp garment using grid-based transformation (simpler alternative to TPS).
    
    Uses perspective transforms on triangulated mesh for pixel-by-pixel mapping.
    
    Args:
        garment_image: RGBA garment image
        source_keypoints: Control points on garment
        target_keypoints: Target points on body
        output_size: (width, height) of output image
    
    Returns:
        Warped garment image (RGBA)
    """
    from scipy.spatial import Delaunay
    
    # Extract point pairs
    point_names = ["left_shoulder", "neck_center", "right_shoulder",
                   "left_underarm", "center_chest", "right_underarm",
                   "left_waist", "center_waist", "right_waist",
                   "left_hem", "center_hem", "right_hem"]
    
    source_pts = []
    target_pts = []
    
    for name in point_names:
        if name in source_keypoints and name in target_keypoints:
            source_pts.append(source_keypoints[name])
            target_pts.append(target_keypoints[name])
    
    source_pts = np.array(source_pts, dtype=np.float32)
    target_pts = np.array(target_pts, dtype=np.float32)
    
    # Create Delaunay triangulation on source points
    tri = Delaunay(source_pts)
    
    # Convert garment to numpy
    garment_array = np.array(garment_image)
    output_width, output_height = output_size
    warped = np.zeros((output_height, output_width, 4), dtype=np.uint8)
    
    # Warp each triangle
    for simplex in tri.simplices:
        src_tri = source_pts[simplex].astype(np.float32)
        dst_tri = target_pts[simplex].astype(np.float32)
        
        # Get bounding rectangles
        src_rect = cv2.boundingRect(src_tri)
        dst_rect = cv2.boundingRect(dst_tri)
        
        # Offset triangles to rectangle origin
        src_tri_offset = src_tri - src_rect[:2]
        dst_tri_offset = dst_tri - dst_rect[:2]
        
        # Get affine transform
        warp_mat = cv2.getAffineTransform(src_tri_offset, dst_tri_offset)
        
        # Crop source region
        x, y, w, h = src_rect
        if x < 0 or y < 0 or x+w > garment_array.shape[1] or y+h > garment_array.shape[0]:
            continue
        src_crop = garment_array[y:y+h, x:x+w]
        
        # Warp the cropped region
        dst_w, dst_h = dst_rect[2], dst_rect[3]
        warped_crop = cv2.warpAffine(src_crop, warp_mat, (dst_w, dst_h))
        
        # Create mask for triangle
        mask = np.zeros((dst_h, dst_w), dtype=np.uint8)
        cv2.fillConvexPoly(mask, dst_tri_offset.astype(np.int32), 255)
        
        # Paste into output
        dx, dy = dst_rect[:2]
        if dx < 0 or dy < 0 or dx+dst_w > output_width or dy+dst_h > output_height:
            continue
        
        for c in range(4):
            warped[dy:dy+dst_h, dx:dx+dst_w, c] = np.where(
                mask > 0,
                warped_crop[:, :, c],
                warped[dy:dy+dst_h, dx:dx+dst_w, c]
            )
    
    return Image.fromarray(warped)


def fit_garment_with_warping(garment_path, body_image_path, output_path=None):
    """
    Fit a garment onto a body image with proper warping.
    
    This is the main function for realistic virtual try-on.
    
    Args:
        garment_path: Path to segmented garment PNG
        body_image_path: Path to body image
        output_path: Where to save result
    
    Returns:
        Dictionary with result information
    """
    print("\n" + "=" * 50)
    print("Advanced Garment Fitting with Warping")
    print("=" * 50)
    
    if not HAS_MEDIAPIPE:
        print("Error: MediaPipe required!")
        return None
    
    # Step 1: Load garment
    print("\nStep 1: Loading garment...")
    garment = Image.open(garment_path).convert("RGBA")
    garment_array = np.array(garment)
    garment_mask = garment_array[:, :, 3]  # Alpha channel as mask
    
    print(f"  Garment size: {garment.size}")
    
    # Step 2: Get garment control points
    print("\nStep 2: Extracting garment keypoints...")
    garment_keypoints = get_garment_keypoints(garment_mask)
    
    if garment_keypoints is None:
        print("Error: Could not extract garment keypoints!")
        return None
    
    print(f"  Found {len(garment_keypoints) - 1} keypoints")
    
    # Step 3: Detect body pose
    print("\nStep 3: Detecting body pose...")
    
    body_image = cv2.imread(body_image_path)
    body_rgb = cv2.cvtColor(body_image, cv2.COLOR_BGR2RGB)
    body_height, body_width = body_image.shape[:2]
    
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
    results = pose.process(body_rgb)
    
    if not results.pose_landmarks:
        print("Error: No pose detected!")
        pose.close()
        return None
    
    landmarks = results.pose_landmarks.landmark
    
    def get_point(idx):
        lm = landmarks[idx]
        return (int(lm.x * body_width), int(lm.y * body_height))
    
    body_landmarks = {
        "left_shoulder": get_point(11),
        "right_shoulder": get_point(12),
        "left_hip": get_point(23),
        "right_hip": get_point(24),
    }
    
    pose.close()
    
    print(f"  Body detected! Shoulder width: {abs(body_landmarks['right_shoulder'][0] - body_landmarks['left_shoulder'][0])}px")
    
    # Step 4: Calculate target positions
    print("\nStep 4: Calculating target positions...")
    target_keypoints = get_body_target_points(body_landmarks, garment_keypoints)
    
    # Step 5: Warp garment
    print("\nStep 5: Warping garment to body...")
    try:
        warped_garment = warp_garment_grid(
            garment,
            garment_keypoints,
            target_keypoints,
            (body_width, body_height)
        )
        print("  Warping complete!")
    except Exception as e:
        print(f"  Warping error: {e}")
        print("  Falling back to simple overlay...")
        # Fallback to simple scaling
        return None
    
    # Step 6: Composite onto body
    print("\nStep 6: Compositing...")
    
    body_pil = Image.open(body_image_path).convert("RGBA")
    result = Image.alpha_composite(body_pil, warped_garment)
    
    # Step 7: Save result
    if output_path is None:
        base_name = os.path.splitext(os.path.basename(body_image_path))[0]
        output_folder = os.path.dirname(body_image_path) or "."
        output_path = os.path.join(output_folder, f"{base_name}_warped_tryon.png")
    
    result.save(output_path)
    print(f"\nResult saved: {output_path}")
    
    return {
        "result_image": output_path,
        "garment_keypoints": len(garment_keypoints),
        "body_detected": True
    }


# ============================================
# EXAMPLE USAGE
# ============================================

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python warping.py <garment_path> <body_image_path>")
        print("")
        print("Example:")
        print("  python warping.py shirt_clothing_segmented.png person.jpg")
        sys.exit(1)
    
    garment_path = sys.argv[1]
    body_image_path = sys.argv[2]
    
    result = fit_garment_with_warping(garment_path, body_image_path)
    
    if result:
        print("\n" + "=" * 50)
        print("SUCCESS!")
        print("=" * 50)
        print(f"Result: {result['result_image']}")
    else:
        print("\nWarping failed!")
