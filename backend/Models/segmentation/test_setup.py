"""
Simple Test Script for Segmentation
Run this to test if segmentation works correctly.
"""

import os

# Get the folder where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def test_segmentation():
    """
    Test the segmentation with a sample image.
    """
    print("=" * 50)
    print("Testing VirtualFit Segmentation")
    print("=" * 50)
    
    # Check if SAM model exists
    sam_path = os.path.join(SCRIPT_DIR, "sam_vit_h_4b8939.pth")
    if os.path.exists(sam_path):
        print(f"✓ SAM model found: {sam_path}")
    else:
        print(f"✗ SAM model NOT found at: {sam_path}")
        print("  Please download the model first!")
        return False
    
    # Check if segment-anything is installed
    try:
        import segment_anything
        from segment_anything import sam_model_registry
        print("✓ segment-anything library installed")
    except ImportError as e:
        print(f"✗ segment-anything library NOT installed: {e}")
        print("  Run: pip install segment-anything")
        return False
    
    # Check if torch is installed
    try:
        import torch
        print(f"✓ PyTorch installed (version {torch.__version__})")
        if torch.cuda.is_available():
            print(f"  GPU available: {torch.cuda.get_device_name(0)}")
        else:
            print("  No GPU - will use CPU (slower)")
    except ImportError:
        print("✗ PyTorch NOT installed")
        print("  Run: pip install torch torchvision")
        return False
    
    # Check other dependencies
    try:
        from PIL import Image
        import numpy as np
        print("✓ PIL and NumPy installed")
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        return False
    
    print("\n" + "=" * 50)
    print("All dependencies OK!")
    print("=" * 50)
    
    # Look for any test images
    print("\nLooking for test images...")
    test_images = []
    for f in os.listdir(SCRIPT_DIR):
        if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            if not f.endswith('_mask.png') and not f.endswith('_segmented.png'):
                test_images.append(f)
    
    if test_images:
        print(f"Found {len(test_images)} image(s):")
        for img in test_images:
            print(f"  - {img}")
        
        print("\nTo test segmentation, run:")
        print(f"  python segmentation_service.py {test_images[0]}")
    else:
        print("No test images found in this folder.")
        print("To test, add an image and run:")
        print("  python segmentation_service.py your_image.jpg")
    
    return True


if __name__ == "__main__":
    test_segmentation()
