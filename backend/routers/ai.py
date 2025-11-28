from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx
import os
import json
import google.generativeai as genai
import base64

import logging

# Configure logging
logging.basicConfig(
    filename='backend_debug.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    force=True
)

router = APIRouter()

class AIRequest(BaseModel):
    provider: str
    model: Optional[str] = None
    prompt: str
    schema_type: Optional[Dict[str, Any]] = None # For Gemini JSON schema
    json_mode: bool = False

class ImageRequest(BaseModel):
    prompt: str
    style: str = 'color' # 'bw' or 'color'
    model: Optional[str] = 'imagen-3.0-generate-001'

class SVGRequest(BaseModel):
    prompt: str
    style: str = 'color' # 'bw' or 'color'

@router.post("/generate")
async def generate_content(request: AIRequest, x_api_key: Optional[str] = Header(None)):
    """
    Proxy AI generation requests to Gemini, DeepSeek, or Grok.
    Prioritizes X-API-Key header, then environment variables.
    """
    
    api_key = x_api_key
    
    # 1. Determine Provider and Config
    if request.provider == 'gemini':
        return await call_gemini(request, api_key)
    elif request.provider in ['deepseek', 'grok', 'openai', 'openrouter']:
        return await call_openai_compatible(request, api_key)
    else:
        raise HTTPException(status_code=400, detail=f"Provider '{request.provider}' not supported.")

async def call_gemini(request: AIRequest, header_key: Optional[str]):
    api_key = header_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing Gemini API Key")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{request.model or 'gemini-2.0-flash'}:generateContent?key={api_key}"
    
    headers = {"Content-Type": "application/json"}
    
    generation_config = {"temperature": 0.7}
    if request.schema_type:
        generation_config["response_mime_type"] = "application/json"
        generation_config["response_schema"] = request.schema_type

    payload = {
        "contents": [{"parts": [{"text": request.prompt}]}],
        "generationConfig": generation_config
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            
            # Extract text from Gemini response structure
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {"text": text}
            except (KeyError, IndexError):
                return {"text": "{}"} # Fallback
                
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Gemini API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

async def call_openai_compatible(request: AIRequest, header_key: Optional[str]):
    # Configuration Map
    configs = {
        'deepseek': {
            'url': 'https://api.deepseek.com/chat/completions',
            'env_key': 'DEEPSEEK_API_KEY',
            'default_model': 'deepseek-chat'
        },
        'grok': {
            'url': 'https://api.x.ai/v1/chat/completions',
            'env_key': 'GROK_API_KEY',
            'default_model': 'grok-4-latest'
        },
        'openai': {
            'url': 'https://api.openai.com/v1/chat/completions',
            'env_key': 'OPENAI_API_KEY',
            'default_model': 'gpt-4o'
        }
    }
    
    config = configs.get(request.provider)
    if not config:
         raise HTTPException(status_code=400, detail="Unknown OpenAI compatible provider")

    api_key = header_key or os.getenv(config['env_key'])
    if not api_key:
        raise HTTPException(status_code=401, detail=f"Missing API Key for {request.provider}")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
        "model": request.model or config['default_model'],
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
            {"role": "user", "content": request.prompt}
        ],
        "temperature": 0.7
    }

    if request.json_mode:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(config['url'], json=payload, headers=headers, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            
            return {"text": data["choices"][0]["message"]["content"]}
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"{request.provider} API Error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

from google import genai as google_genai
from google.genai import types

# ... (keep existing imports)

@router.post("/generate-image")
async def generate_image(request: ImageRequest, x_api_key: Optional[str] = Header(None)):
    logging.info(f"Received Image Request: {request}")
    api_key = x_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing Gemini API Key")

    # Construct Prompt based on Style
    if request.style == 'bw':
        final_prompt = f"""
            Design a professional coloring book style PAGE BORDER / FRAME about: {request.prompt}.
            
            CRITICAL LAYOUT RULES:
            1. The art must be ONLY around the edges (top, bottom, sides) acting as a frame.
            2. The CENTER (80% of the page area) must be COMPLETELY EMPTY WHITE SPACE.
            3. Do not place any objects, lines, or textures in the center. It must be blank for text.
            
            Style Rules:
            1. Black and white vector line art ONLY.
            2. Crisp lines, high contrast.
            3. No grayscale shading, no gradients.
            4. Intricate details on edges only.
            5. Aspect Ratio: Vertical Portrait (3:4).
        """
    else:
        final_prompt = f"""
            Design a professional decorative VECTOR FRAME / BORDER about: {request.prompt}.
            
            CRITICAL LAYOUT RULES:
            1. The illustration must be restricted to the edges to form a frame.
            2. The CENTER must be pure EMPTY WHITE SPACE (Negative Space).
            3. This is for a document background, so the middle must be clean.
            
            Style Rules:
            1. Style: Clean Flat Vector Art / Sticker Art / Clip Art.
            2. Use flat, vibrant colors.
            3. White background.
            4. DO NOT use watercolor, complex paintings, or photographic styles that fill the page.
            5. Aspect Ratio: Vertical Portrait (3:4).
        """

    try:
        # Imagen 3 Generation using google-genai SDK
        client = google_genai.Client(api_key=api_key)
        
        response = client.models.generate_images(
            model=request.model or 'imagen-4.0-fast-generate-001',
            prompt=final_prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio="3:4",
                safety_filter_level="block_low_and_above",
                person_generation="allow_adult"
            )
        )
        
        if response.generated_images:
            img_bytes = response.generated_images[0].image.image_bytes
            base64_img = base64.b64encode(img_bytes).decode('utf-8')
            return {"image": f"data:image/png;base64,{base64_img}"}
        else:
            raise HTTPException(status_code=500, detail="No image generated")

    except Exception as e:
        logging.error(f"Imagen Generation Error: {e}")
        print(f"Imagen 3 Error: {e}")
        raise HTTPException(status_code=500, detail=f"Image Generation Failed: {str(e)}")

@router.post("/generate-svg")
async def generate_svg(request: SVGRequest, x_api_key: Optional[str] = Header(None)):
    logging.info(f"Received SVG Request: {request}")
    api_key = x_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing Gemini API Key")

    genai.configure(api_key=api_key)

    svg_prompt = f"""
        You are an expert SVG artist. Generate a SCALABLE VECTOR GRAPHICS (SVG) code for a page border/frame about: {request.prompt}.
        
        CRITICAL REQUIREMENTS:
        1. Output ONLY the raw <svg>...</svg> code. Do NOT wrap in markdown code blocks. Do NOT add explanations.
        2. ViewBox: "0 0 600 800" (Portrait 3:4 aspect ratio).
        3. Style: {'Black and white line art, coloring book style. High contrast.' if request.style == 'bw' else 'Flat vector art, vibrant colors, decorative.'}
        4. Layout: The art must be ONLY on the borders. The center must be transparent/empty.
        5. Complexity: Medium-High. Use paths, not just rectangles.
    """

    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(svg_prompt)
        
        svg_text = response.text
        
        # Cleanup
        svg_text = svg_text.replace('```svg', '').replace('```xml', '').replace('```', '').strip()
        
        if '<svg' not in svg_text:
             raise HTTPException(status_code=500, detail="Invalid SVG generated")

        # Encode
        base64_svg = base64.b64encode(svg_text.encode('utf-8')).decode('utf-8')
        return {"image": f"data:image/svg+xml;base64,{base64_svg}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SVG Generation Failed: {str(e)}")
