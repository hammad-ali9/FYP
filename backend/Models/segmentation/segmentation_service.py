"""
Product Segmentation Module for VirtualFit
Uses SAM (Segment Anything Model) to segment products from their backgrounds.

This is a beginner-friendly implementation with clear, simple logic.
"""

import os
import numpy as np
from PIL import Image
import torch

# Optional: OpenCV for advanced processing
try:
    import cv2
    HAS_OPENCV = True
except ImportError:
    HAS_OPENCV = False
    print("Note: OpenCV not installed. Some features may be limited.")

# Path to SAM model weights (in same folder)
SAM_CHECKPOINT = os.path.join(os.path.dirname(__file__), "sam_vit_h_4b8939.pth")


def load_sam_model():
    """
    Load the SAM model.
    Returns the model and predictor ready to use.
    """
    # Import SAM library
    from segment_anything import sam_model_registry, SamPredictor
    
    # Choose model type - we're using the largest one (vit_h)
    model_type = "vit_h"
    
    # Check if GPU is available, otherwise use CPU
    if torch.cuda.is_available():
        device = "cuda"
        print("Using GPU for segmentation")
    else:
        device = "cpu"
        print("Using CPU for segmentation (this will be slower)")
    
    # Load the model
    print(f"Loading SAM model from {SAM_CHECKPOINT}...")
    sam = sam_model_registry[model_type](checkpoint=SAM_CHECKPOINT)
    sam.to(device=device)
    
    # Create predictor
    predictor = SamPredictor(sam)
    
    print("SAM model loaded successfully!")
    return predictor


def segment_product(image_path, predictor=None, output_folder=None):
    """
    Segment a product from its background.
    
    How it works:
    1. Load the image
    2. Use SAM to find the main object (the product)
    3. Create a mask (white = product, black = background)
    4. Save the segmented product with transparent background
    
    Args:
        image_path: Path to the product image
        predictor: SAM predictor (will load if not provided)
        output_folder: Where to save results (defaults to same folder as input)
    
    Returns:
        Dictionary with paths to:
        - segmented_image: Product with transparent background (PNG)
        - mask_image: Binary mask
        - bbox: Bounding box coordinates
    """
    
    # Step 1: Load SAM if not provided
    if predictor is None:
        predictor = load_sam_model()
    
    # Step 2: Load and prepare the image
    print(f"Loading image: {image_path}")
    image = Image.open(image_path)
    image_array = np.array(image)
    
    # Make sure image is RGB (not RGBA or grayscale)
    if len(image_array.shape) == 2:
        # Grayscale - convert to RGB
        image_array = np.stack([image_array] * 3, axis=-1)
    elif image_array.shape[2] == 4:
        # RGBA - remove alpha channel
        image_array = image_array[:, :, :3]
    
    # Step 3: Set the image in SAM
    predictor.set_image(image_array)
    
    # Step 4: Get the center point of the image
    # We assume the product is roughly in the center
    height, width = image_array.shape[:2]
    center_x = width // 2
    center_y = height // 2
    
    # Step 5: Ask SAM to segment using the center point
    # point_coords: where to look for the object
    # point_labels: 1 = foreground (this is the object we want)
    input_point = np.array([[center_x, center_y]])
    input_label = np.array([1])
    
    print("Running segmentation...")
    masks, scores, _ = predictor.predict(
        point_coords=input_point,
        point_labels=input_label,
        multimask_output=True  # Get multiple options
    )
    
    # Step 6: Pick the best mask (highest score)
    best_mask_index = np.argmax(scores)
    mask = masks[best_mask_index]
    
    print(f"Segmentation complete! Confidence: {scores[best_mask_index]:.2%}")
    
    # Step 7: Find bounding box of the mask
    # This tells us where the product is located
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    y_min, y_max = np.where(rows)[0][[0, -1]]
    x_min, x_max = np.where(cols)[0][[0, -1]]
    
    bbox = {
        "x": int(x_min),
        "y": int(y_min),
        "width": int(x_max - x_min),
        "height": int(y_max - y_min)
    }
    
    # Step 8: Create output folder
    if output_folder is None:
        output_folder = os.path.dirname(image_path)
        # If image is in current directory, use current directory
        if output_folder == "":
            output_folder = "."
    
    os.makedirs(output_folder, exist_ok=True)
    
    # Get filename without extension
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    
    # Step 9: Save the mask
    mask_path = os.path.join(output_folder, f"{base_name}_mask.png")
    mask_image = Image.fromarray((mask * 255).astype(np.uint8))
    mask_image.save(mask_path)
    print(f"Mask saved: {mask_path}")
    
    # Step 10: Create segmented image with transparent background
    segmented_path = os.path.join(output_folder, f"{base_name}_segmented.png")
    
    # Create RGBA image (RGB + Alpha channel)
    rgba_image = np.zeros((height, width, 4), dtype=np.uint8)
    rgba_image[:, :, :3] = image_array  # Copy RGB
    rgba_image[:, :, 3] = (mask * 255).astype(np.uint8)  # Alpha from mask
    
    segmented_image = Image.fromarray(rgba_image, 'RGBA')
    segmented_image.save(segmented_path)
    print(f"Segmented image saved: {segmented_path}")
    
    # Return results
    return {
        "segmented_image": segmented_path,
        "mask_image": mask_path,
        "bbox": bbox,
        "confidence": float(scores[best_mask_index])
    }


def segment_clothing(image_path, predictor=None, output_folder=None):
    """
    Segment ONLY the clothing from an image (excluding the person/model).
    
    This function uses MediaPipe Pose to detect body parts and exclude them:
    1. Uses SAM to segment the main object
    2. Uses MediaPipe Pose to find face, hands, forearms
    3. Creates exclusion zones around these body parts
    4. Removes body parts from mask to keep only clothing
    
    Args:
        image_path: Path to the product image (with model wearing it)
        predictor: SAM predictor (will load if not provided)
        output_folder: Where to save results
    
    Returns:
        Same format as segment_product()
    """
    
    if not HAS_OPENCV:
        print("WARNING: OpenCV required for clothing segmentation!")
        print("Install with: pip install opencv-python")
        print("Falling back to basic segmentation...")
        return segment_product(image_path, predictor, output_folder)
    
    # Try to import mediapipe for pose detection
    try:
        import mediapipe as mp
        HAS_MEDIAPIPE = True
    except ImportError:
        print("WARNING: MediaPipe not installed!")
        print("Install with: pip install mediapipe")
        print("Falling back to color-based detection...")
        HAS_MEDIAPIPE = False
    
    # Load SAM if not provided
    if predictor is None:
        predictor = load_sam_model()
    
    # Load image
    print(f"Loading image: {image_path}")
    image = Image.open(image_path)
    image_array = np.array(image)
    
    # Handle image formats
    if len(image_array.shape) == 2:
        image_array = np.stack([image_array] * 3, axis=-1)
    elif image_array.shape[2] == 4:
        image_array = image_array[:, :, :3]
    
    height, width = image_array.shape[:2]
    
    # Step 1: Get SAM segmentation (this will include person + clothing)
    predictor.set_image(image_array)
    
    center_x = width // 2
    center_y = height // 2
    
    input_point = np.array([[center_x, center_y]])
    input_label = np.array([1])
    
    print("Running SAM segmentation...")
    masks, scores, _ = predictor.predict(
        point_coords=input_point,
        point_labels=input_label,
        multimask_output=True
    )
    
    best_mask_index = np.argmax(scores)
    sam_mask = masks[best_mask_index]
    sam_mask_uint8 = (sam_mask * 255).astype(np.uint8)
    
    print(f"SAM segmentation done. Confidence: {scores[best_mask_index]:.2%}")
    
    # Step 2: Create exclusion mask for body parts
    exclusion_mask = np.zeros((height, width), dtype=np.uint8)
    
    if HAS_MEDIAPIPE:
        print("Detecting body parts with MediaPipe...")
        
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
        
        # Process image
        results = pose.process(cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR))
        
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            
            # Get key body part positions
            # Face region (nose, eyes, ears)
            face_points = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]  # Face landmarks
            
            # Hands
            hand_points = [15, 16, 17, 18, 19, 20, 21, 22]  # Wrists and hands
            
            # Draw circles to exclude face area
            for idx in face_points:
                if idx < len(landmarks):
                    lm = landmarks[idx]
                    x = int(lm.x * width)
                    y = int(lm.y * height)
                    # Large circle for face
                    cv2.circle(exclusion_mask, (x, y), int(width * 0.15), 255, -1)
            
            # Draw circles to exclude hands
            for idx in hand_points:
                if idx < len(landmarks):
                    lm = landmarks[idx]
                    x = int(lm.x * width)
                    y = int(lm.y * height)
                    # Medium circle for hands
                    cv2.circle(exclusion_mask, (x, y), int(width * 0.08), 255, -1)
            
            # Also exclude forearms (between elbow and wrist)
            elbow_wrist_pairs = [(13, 15), (14, 16)]  # Left and right
            for elbow_idx, wrist_idx in elbow_wrist_pairs:
                if elbow_idx < len(landmarks) and wrist_idx < len(landmarks):
                    elbow = landmarks[elbow_idx]
                    wrist = landmarks[wrist_idx]
                    
                    # Draw thick line between elbow and wrist
                    pt1 = (int(elbow.x * width), int(elbow.y * height))
                    pt2 = (int(wrist.x * width), int(wrist.y * height))
                    cv2.line(exclusion_mask, pt1, pt2, 255, int(width * 0.06))
            
            print("Body parts detected and marked for exclusion!")
        else:
            print("No pose detected - using top region exclusion for face")
            # If no pose detected, assume face is in top 25% of the person
            rows = np.any(sam_mask, axis=1)
            if np.any(rows):
                y_min = np.where(rows)[0][0]
                face_height = int(height * 0.2)
                exclusion_mask[y_min:y_min+face_height, :] = 255
        
        pose.close()
    else:
        # Fallback: Just exclude top portion where face usually is
        print("Using simple top-region exclusion for face...")
        rows = np.any(sam_mask, axis=1)
        if np.any(rows):
            y_min = np.where(rows)[0][0]
            face_height = int(height * 0.2)
            exclusion_mask[y_min:y_min+face_height, :] = 255
    
    # Step 3: Remove exclusion areas from SAM mask
    clothing_mask = cv2.bitwise_and(sam_mask_uint8, cv2.bitwise_not(exclusion_mask))
    
    # Clean up the clothing mask
    kernel = np.ones((5, 5), np.uint8)
    clothing_mask = cv2.morphologyEx(clothing_mask, cv2.MORPH_CLOSE, kernel)
    clothing_mask = cv2.morphologyEx(clothing_mask, cv2.MORPH_OPEN, kernel)
    
    print("Exclusion areas removed from mask!")
    
    # Step 4: Find bounding box
    final_mask = clothing_mask > 127
    rows = np.any(final_mask, axis=1)
    cols = np.any(final_mask, axis=0)
    
    if not np.any(rows) or not np.any(cols):
        print("WARNING: No clothing detected after exclusion!")
        return segment_product(image_path, predictor, output_folder)
    
    y_min, y_max = np.where(rows)[0][[0, -1]]
    x_min, x_max = np.where(cols)[0][[0, -1]]
    
    bbox = {
        "x": int(x_min),
        "y": int(y_min),
        "width": int(x_max - x_min),
        "height": int(y_max - y_min)
    }
    
    # Step 5: Save outputs
    if output_folder is None:
        output_folder = os.path.dirname(image_path)
        if output_folder == "":
            output_folder = "."
    
    os.makedirs(output_folder, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    
    # Save mask
    mask_path = os.path.join(output_folder, f"{base_name}_clothing_mask.png")
    mask_image = Image.fromarray(clothing_mask)
    mask_image.save(mask_path)
    print(f"Clothing mask saved: {mask_path}")
    
    # Save segmented clothing
    segmented_path = os.path.join(output_folder, f"{base_name}_clothing_segmented.png")
    
    rgba_image = np.zeros((height, width, 4), dtype=np.uint8)
    rgba_image[:, :, :3] = image_array
    rgba_image[:, :, 3] = clothing_mask
    
    segmented_image = Image.fromarray(rgba_image, 'RGBA')
    segmented_image.save(segmented_path)
    print(f"Segmented clothing saved: {segmented_path}")
    
    return {
        "segmented_image": segmented_path,
        "mask_image": mask_path,
        "bbox": bbox,
        "confidence": float(scores[best_mask_index])
    }


def segment_product_with_click(image_path, click_x, click_y, predictor=None, output_folder=None):
    """
    Segment a product by clicking on it.
    
    This is useful when the product is not in the center,
    or when automatic detection doesn't work well.
    
    Args:
        image_path: Path to the product image
        click_x: X coordinate where user clicked
        click_y: Y coordinate where user clicked
        predictor: SAM predictor (will load if not provided)
        output_folder: Where to save results
    
    Returns:
        Same as segment_product()
    """
    
    # Load SAM if not provided
    if predictor is None:
        predictor = load_sam_model()
    
    # Load image
    image = Image.open(image_path)
    image_array = np.array(image)
    
    # Handle different image formats
    if len(image_array.shape) == 2:
        image_array = np.stack([image_array] * 3, axis=-1)
    elif image_array.shape[2] == 4:
        image_array = image_array[:, :, :3]
    
    height, width = image_array.shape[:2]
    
    # Set image in SAM
    predictor.set_image(image_array)
    
    # Use the click point
    input_point = np.array([[click_x, click_y]])
    input_label = np.array([1])
    
    print(f"Segmenting at click point ({click_x}, {click_y})")
    masks, scores, _ = predictor.predict(
        point_coords=input_point,
        point_labels=input_label,
        multimask_output=True
    )
    
    # Pick best mask
    best_mask_index = np.argmax(scores)
    mask = masks[best_mask_index]
    
    # Find bounding box
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    y_min, y_max = np.where(rows)[0][[0, -1]]
    x_min, x_max = np.where(cols)[0][[0, -1]]
    
    bbox = {
        "x": int(x_min),
        "y": int(y_min),
        "width": int(x_max - x_min),
        "height": int(y_max - y_min)
    }
    
    # Create output folder
    if output_folder is None:
        output_folder = os.path.dirname(image_path)
        if output_folder == "":
            output_folder = "."
    
    os.makedirs(output_folder, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(image_path))[0]
    
    # Save mask
    mask_path = os.path.join(output_folder, f"{base_name}_mask.png")
    mask_image = Image.fromarray((mask * 255).astype(np.uint8))
    mask_image.save(mask_path)
    
    # Save segmented image
    segmented_path = os.path.join(output_folder, f"{base_name}_segmented.png")
    rgba_image = np.zeros((height, width, 4), dtype=np.uint8)
    rgba_image[:, :, :3] = image_array
    rgba_image[:, :, 3] = (mask * 255).astype(np.uint8)
    
    segmented_image = Image.fromarray(rgba_image, 'RGBA')
    segmented_image.save(segmented_path)
    
    return {
        "segmented_image": segmented_path,
        "mask_image": mask_path,
        "bbox": bbox,
        "confidence": float(scores[best_mask_index])
    }


# ============================================
# EXAMPLE USAGE
# ============================================

if __name__ == "__main__":
    """
    Example: How to use this module
    
    Run this file directly to test segmentation:
    python segmentation_service.py path/to/your/image.jpg
    
    Options:
    --basic    Use basic segmentation (includes person)
    --clothing Use clothing-only segmentation (excludes skin) [DEFAULT]
    """
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python segmentation_service.py <image_path> [--basic|--clothing]")
        print("Example: python segmentation_service.py shirt.jpg")
        print("")
        print("Options:")
        print("  --basic     Segment entire object (includes person if present)")
        print("  --clothing  Segment clothing only, exclude skin (DEFAULT)")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Check for mode flag
    use_basic = "--basic" in sys.argv
    
    if not os.path.exists(image_path):
        print(f"Error: Image not found: {image_path}")
        sys.exit(1)
    
    # Load model once
    print("=" * 50)
    print("VirtualFit Product Segmentation")
    print("=" * 50)
    
    predictor = load_sam_model()
    
    # Segment the product
    if use_basic:
        print("\nUsing BASIC segmentation (includes person)...")
        result = segment_product(image_path, predictor)
    else:
        print("\nUsing CLOTHING segmentation (excludes skin)...")
        result = segment_clothing(image_path, predictor)
    
    print("\n" + "=" * 50)
    print("RESULTS:")
    print("=" * 50)
    print(f"Segmented image: {result['segmented_image']}")
    print(f"Mask image: {result['mask_image']}")
    print(f"Bounding box: {result['bbox']}")
    print(f"Confidence: {result['confidence']:.2%}")

