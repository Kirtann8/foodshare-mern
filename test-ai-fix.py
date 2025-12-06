#!/usr/bin/env python3
"""
Quick test script to verify the AI service fixes
"""
import requests
import base64
import io
from PIL import Image
import numpy as np

def create_test_image():
    """Create a simple test image"""
    # Create a simple colored image (like an apple)
    img = np.zeros((224, 224, 3), dtype=np.uint8)
    img[:, :] = [255, 100, 100]  # Reddish color
    
    # Convert to PIL Image
    pil_img = Image.fromarray(img)
    
    # Convert to base64
    buffer = io.BytesIO()
    pil_img.save(buffer, format='JPEG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/jpeg;base64,{img_str}"

def test_ai_service():
    """Test the AI service with a sample image"""
    try:
        print("Creating test image...")
        test_image = create_test_image()
        
        print("Sending request to AI service...")
        response = requests.post(
            'http://localhost:5001/assess-food',
            json={'image': test_image},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI service test successful!")
            print(f"Response: {result}")
            return True
        else:
            print(f"❌ AI service returned error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ AI service is not running. Start it with: python backend/services/foodCV.py")
        return False
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing AI service fixes...")
    success = test_ai_service()
    
    if success:
        print("\n🎉 All tests passed! The AI service is working correctly.")
    else:
        print("\n⚠️ Tests failed. Please check the AI service.")