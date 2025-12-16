"""
Image Upscaling Module
Uses bicubic/Lanczos interpolation for high-quality upscaling.
For production, consider using Real-ESRGAN or similar AI upscalers.
"""
import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import Tuple, Optional

def decode_base64_image(data_uri: str) -> np.ndarray:
    """Decode a base64 data URI to numpy array."""
    # Remove header if present
    if "base64," in data_uri:
        data_uri = data_uri.split("base64,")[1]
    
    # Decode base64
    img_bytes = base64.b64decode(data_uri)
    
    # Convert to numpy array
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    return img

def encode_image_to_base64(img: np.ndarray, format: str = "PNG") -> str:
    """Encode numpy array to base64 data URI."""
    # Convert BGR to RGB
    if len(img.shape) == 3 and img.shape[2] == 3:
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    else:
        img_rgb = img
    
    # Convert to PIL
    pil_img = Image.fromarray(img_rgb)
    
    # Encode to bytes
    buffer = io.BytesIO()
    pil_img.save(buffer, format=format, quality=95)
    buffer.seek(0)
    
    # Encode to base64
    b64 = base64.b64encode(buffer.read()).decode('utf-8')
    
    mime = "image/png" if format.upper() == "PNG" else "image/jpeg"
    return f"data:{mime};base64,{b64}"

def upscale_image(img: np.ndarray, scale: int = 4, method: str = "lanczos") -> np.ndarray:
    """
    Upscale image using high-quality interpolation.
    
    Args:
        img: Input image as numpy array
        scale: Upscale factor (2, 4, etc.)
        method: Interpolation method ('lanczos', 'cubic', 'area')
    
    Returns:
        Upscaled image
    """
    h, w = img.shape[:2]
    new_h, new_w = h * scale, w * scale
    
    # Select interpolation method
    interpolation_methods = {
        "lanczos": cv2.INTER_LANCZOS4,
        "cubic": cv2.INTER_CUBIC,
        "area": cv2.INTER_AREA,
        "linear": cv2.INTER_LINEAR
    }
    
    interp = interpolation_methods.get(method.lower(), cv2.INTER_LANCZOS4)
    
    # Upscale
    upscaled = cv2.resize(img, (new_w, new_h), interpolation=interp)
    
    return upscaled

def upscale_for_print(
    data_uri: str, 
    target_size: Tuple[int, int] = (3072, 4096),
    aspect_ratio: str = "3:4"
) -> str:
    """
    Upscale image from base64 data URI for print quality.
    
    Args:
        data_uri: Base64 encoded image
        target_size: Target resolution (width, height) in pixels
        aspect_ratio: Desired aspect ratio for cropping
    
    Returns:
        Base64 encoded upscaled image
    """
    # Decode
    img = decode_base64_image(data_uri)
    
    if img is None:
        raise ValueError("Failed to decode image")
    
    h, w = img.shape[:2]
    target_w, target_h = target_size
    
    # Calculate scale needed
    scale_w = target_w / w
    scale_h = target_h / h
    scale = max(scale_w, scale_h)  # Use larger scale to ensure coverage
    
    # Upscale
    upscaled = upscale_image(img, scale=int(np.ceil(scale)), method="lanczos")
    
    # Crop to target aspect ratio
    up_h, up_w = upscaled.shape[:2]
    
    # Calculate crop
    if aspect_ratio == "3:4":
        # Portrait Letter-like
        target_ratio = 3 / 4
    elif aspect_ratio == "4:3":
        target_ratio = 4 / 3
    else:
        target_ratio = 1.0
    
    current_ratio = up_w / up_h
    
    if current_ratio > target_ratio:
        # Too wide, crop width
        new_w = int(up_h * target_ratio)
        start_x = (up_w - new_w) // 2
        cropped = upscaled[:, start_x:start_x + new_w]
    else:
        # Too tall, crop height
        new_h = int(up_w / target_ratio)
        start_y = (up_h - new_h) // 2
        cropped = upscaled[start_y:start_y + new_h, :]
    
    # Final resize to exact target
    final = cv2.resize(cropped, target_size, interpolation=cv2.INTER_LANCZOS4)
    
    # Encode back to base64
    return encode_image_to_base64(final, "PNG")

def get_image_dimensions(data_uri: str) -> Tuple[int, int]:
    """Get image dimensions from base64 data URI."""
    img = decode_base64_image(data_uri)
    if img is None:
        return (0, 0)
    h, w = img.shape[:2]
    return (w, h)
