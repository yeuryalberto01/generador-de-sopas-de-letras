from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx
import os
import json
import time
import google.generativeai as genai
import base64
from google.genai.errors import ClientError
import logging
import asyncio

import sys

# Configure logging to both File and Console
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# File Handler
file_handler = logging.FileHandler('backend_debug.log')
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

# Console Handler (Stdout) - Critical for Launcher to capture it
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(logging.Formatter('%(message)s'))
logger.addHandler(console_handler)

# Initialize Router
router = APIRouter()

def log_api_event(provider: str, endpoint: str, status: str, duration: float, meta: Dict[str, Any]):
    # Formato visual para el Launcher
    icon = "🟢" if status == "SUCCESS" else "🔴"
    print(f"API_TRAFFIC: {icon} [{provider.upper()}] {endpoint} | {duration:.0f}ms | {json.dumps(meta)}")
    logging.info(f"API Event: {provider} {endpoint} - {status} ({duration:.2f}ms) - {json.dumps(meta)}")

class AIRequest(BaseModel):
    provider: str
    model: Optional[str] = None
    prompt: str
    image: Optional[str] = None # Base64 encoded image
    schema_type: Optional[Dict[str, Any]] = None # For Gemini JSON schema
    json_mode: bool = False

class ImageRequest(BaseModel):
    prompt: str
    style: str  # 'bw' or 'color'
    model: Optional[str] = None
    print_quality: bool = False  # If True, upscale to print resolution (3072x4096)

class SVGRequest(BaseModel):
    prompt: str
    style: str = "color"
    count: int = 1

async def call_gemini(request: AIRequest, header_key: Optional[str]):
    # Robust fallback: Use header key only if it's a non-empty string
    env_key = os.getenv("GEMINI_API_KEY")
    
    if header_key and header_key.strip():
        api_key = header_key
        logging.info("Using API Key from Header")
    else:
        api_key = env_key
        logging.info("Using API Key from Environment")

    if not api_key:
        raise HTTPException(status_code=500, detail="API Key not found (Header or Env)")

    model_name = request.model or "gemini-2.0-flash" # User-specified default
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    
    headers = {"Content-Type": "application/json"}
    
    generation_config = {
        "temperature": 0.7,
        "maxOutputTokens": 8192,
    }

    if request.json_mode or request.schema_type:
         generation_config["responseMimeType"] = "application/json"
         if request.schema_type:
             # If schema is provided, use it (Generic JSON enforcement)
             generation_config["responseSchema"] = request.schema_type 

    parts = [{"text": request.prompt}]

    if request.image:
        try:
            mime_type = "image/png"
            image_data = request.image
            if ";base64," in request.image:
                header, image_data = request.image.split(";base64,")
                if "data:" in header:
                    mime_type = header.replace("data:", "")
            
            parts.insert(0, {
                "inlineData": {
                    "mimeType": mime_type,
                    "data": image_data
                }
            })
        except Exception as e:
             logging.error(f"Error processing image data: {e}")

    payload = {
        "contents": [{"parts": parts}],
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
            logging.error(f"Gemini API Error: {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail=f"Gemini API Error: {e.response.text}")
        except Exception as e:
            import traceback
            logging.error(f"Gemini Client Error: {e}\n{traceback.format_exc()}")
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
            'default_model': 'grok-2-latest'
        }
    }


    provider_config = configs.get(request.provider)
    if not provider_config:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {request.provider}")

    # Key Logic: Header > Env
    api_key = header_key if header_key and header_key.strip() else os.getenv(provider_config['env_key'])
    
    if not api_key:
         raise HTTPException(status_code=500, detail=f"API Key not found for {request.provider}")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    model = request.model or provider_config['default_model']

    messages = [{"role": "user", "content": request.prompt}]
    
    # Simple image handling for OpenAI compatible (URL or base64 if supported)
    # This largely assumes text-only for now unless expanded.
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7
    }

    if request.json_mode:
        payload["response_format"] = {"type": "json_object"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(provider_config['url'], json=payload, headers=headers, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            
            # Smart Reasoning Extraction (DeepSeek R1)
            content = data['choices'][0]['message'].get('content', "")
            reasoning = data['choices'][0]['message'].get('reasoning_content', None)
            
            if reasoning:
                content = f"<thinking>\n{reasoning}\n</thinking>\n\n{content}"
                
            return {"text": content}
        except Exception as e:
            logging.error(f"Provider {request.provider} Error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


# --- ENDPOINTS ---

@router.post("/generate")
async def generate_text(request: AIRequest, x_api_key: Optional[str] = Header(None, alias='X-API-Key')):
    """
    General purpose text/JSON generation endpoint.
    Handles calls from generateWordListAI and generateThemeAI.
    """
    start_time = time.time()
    try:
        logging.info(f"Generating text with provider: {request.provider}, model: {request.model}")
        
        if request.provider == 'gemini':
            result = await call_gemini(request, x_api_key)
        else:
            result = await call_openai_compatible(request, x_api_key)
            
        duration = (time.time() - start_time) * 1000
        log_api_event(request.provider, "/generate", "SUCCESS", duration, {"model": request.model})
        return result

    except Exception as e:
        duration = (time.time() - start_time) * 1000
        log_api_event(request.provider, "/generate", "ERROR", duration, {"error": str(e)})
        raise e


@router.post("/generate-image")
async def generate_image(request: ImageRequest):
    """
    Generates an image using Gemini 2.0 Flash Image Generation with fallback to DALL-E 3 or SVG.
    """
    print(f"Generating image for prompt: {request.prompt}")
    start_time = time.time()
    
    # 1. Try Gemini 2.0 Flash Image Generation (Available on user's API key)
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found")

        # Use Gemini 2.0 Flash experimental image generation
        model_name = "gemini-2.0-flash-exp-image-generation"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        
        headers = {"Content-Type": "application/json"}
        
        # Payload for Gemini 2.0 Flash Image Generation
        # Must include responseModalities with both TEXT and IMAGE
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"Generate an image: {request.prompt}. Style: {request.style}. High quality, detailed."
                }]
            }],
            "generationConfig": {
                "responseModalities": ["TEXT", "IMAGE"],
                "temperature": 0.9
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=90.0)
            
            if response.status_code == 404:
                raise ValueError(f"Model {model_name} Not Found (404)")
            
            response.raise_for_status()
            data = response.json()
            
            # Extract image from Gemini response
            # Structure: { "candidates": [{ "content": { "parts": [{ "inlineData": { "mimeType": "...", "data": "..." } }] } }] }
            b64_image = None
            mime_type = "image/png"
            
            try:
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for part in parts:
                        if "inlineData" in part:
                            b64_image = part["inlineData"].get("data")
                            mime_type = part["inlineData"].get("mimeType", "image/png")
                            break
            except (KeyError, IndexError) as e:
                logging.error(f"Error parsing Gemini image response: {e}")
                raise ValueError("Invalid response structure from Gemini Image Gen")

            if not b64_image:
                raise ValueError("No image data found in Gemini response")

            # Upscale for print quality if requested
            final_image = f"data:{mime_type};base64,{b64_image}"
            
            if request.print_quality:
                try:
                    from upscaler import upscale_for_print, get_image_dimensions
                    logging.info("Upscaling image for print quality (3072x4096)...")
                    
                    original_dims = get_image_dimensions(final_image)
                    final_image = upscale_for_print(final_image, target_size=(3072, 4096), aspect_ratio="3:4")
                    new_dims = get_image_dimensions(final_image)
                    
                    logging.info(f"Upscaled: {original_dims} -> {new_dims}")
                    model_name += "-print-quality"
                except Exception as upscale_error:
                    logging.warning(f"Upscaling failed, returning original: {upscale_error}")

            duration = (time.time() - start_time) * 1000
            log_api_event("gemini", "/generate-image", "SUCCESS", duration, {"model": model_name})
            
            return {
                "image": final_image,
                "provider": model_name
            }

    except Exception as e:
        logging.warning(f"Imagen 3 generation failed: {e}. Attempting fallbacks...")

        # 3. Last Resort: Gemini SVG Generation
        try:
             logging.info("Fallback: Attempting Gemini SVG")
             svg_req = SVGRequest(prompt=request.prompt, style=request.style)
             svg_result = await generate_smart_design(svg_req) # Use existing SVG logic
             
             # Handle structure difference: generate_smart_design returns {"assets": [...]}
             if "assets" in svg_result and len(svg_result["assets"]) > 0:
                 svg_image = svg_result["assets"][0]["image"]
             else:
                 svg_image = svg_result.get("image", "") # Fallback if structure changes
             
             duration = (time.time() - start_time) * 1000
             log_api_event("gemini", "/generate-image", "SUCCESS-SVG-FALLBACK", duration, {"model": "gemini-svg"})
             
             return {
                 "image": svg_image,
                 "provider": "gemini-svg"
             }
        except Exception as svg_e:
            logging.error(f"SVG Fallback failed: {svg_e}")
            
        # If all fail
        log_api_event("all", "/generate-image", "FAILURE", (time.time() - start_time) * 1000, {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"Image Generation Failed (Fallback attempted): {str(e)}")


@router.post("/generate-svg")
async def generate_svg_alias(request: SVGRequest):
    """
    Alias for generate-smart-design to match frontend expectations.
    """
    return await generate_smart_design(request)


@router.post("/generate-smart-design")
async def generate_smart_design(request: SVGRequest):
    """
    Generates decorative SVG elements using Gemini.
    Supports batch generation (up to 4).
    """
    try:
        base_prompt = f"""
        Create a PROFESSIONAL ABSTRACT or GEOMETRIC decorative background for a word search puzzle.
        Theme: {request.style} - {request.prompt}
        
        CRITICAL RULES:
        1. NO CARTOONS, NO CHARACTERS, NO REALISTIC SCENES.
        2. Use Abstract Shapes, Fluid Lines, Geometric Patterns, or Floral Ornaments.
        3. Style: Minimalist, Elegant, High-End Stationery Design.
        4. Colors: Harmonious palette, professional looking.
        5. Complexity: High detail in patterns, but clean vector paths.
        
        Output: ONLY the raw SVG string (<svg...></svg>).
        """

        tasks = []
        count = max(1, min(request.count, 4)) # Limit to 4

        for i in range(count):
            # Add slight variation to prompt to ensure distinct results
            variation_prompt = f"{base_prompt}\n variation {i+1}: Make it unique."
            
            ai_req = AIRequest(
                provider="gemini",
                model="gemini-2.0-flash", 
                prompt=variation_prompt
            )
            tasks.append(call_gemini(ai_req, None))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        generated_assets = []
        
        for res in results:
            if isinstance(res, Exception):
                logging.error(f"Batch generation error: {res}")
                continue
                
            raw_text = res["text"]
            cleaned_svg = raw_text.replace("```svg", "").replace("```xml", "").replace("```", "").strip()
             # Basic validation
            if "<svg" not in cleaned_svg:
                continue

            b64_svg = base64.b64encode(cleaned_svg.encode('utf-8')).decode('utf-8')
            data_uri = f"data:image/svg+xml;base64,{b64_svg}"
            
            generated_assets.append({
                "image": data_uri,
                "raw_svg": cleaned_svg,
                "provider": "gemini-2.5-flash-svg"
            })
            
        if not generated_assets:
            # Fallback for SVG failure, return at least one placeholder or retry?
            # For now, let's return a basic fallback SVG
            fallback_svg = '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0f0f0"/><text x="10" y="50" font-family="Arial" font-size="12" fill="#999">Fallback Design</text></svg>'
            b64_svg = base64.b64encode(fallback_svg.encode('utf-8')).decode('utf-8')
            return {"assets": [{
                "image": f"data:image/svg+xml;base64,{b64_svg}",
                "raw_svg": fallback_svg,
                "provider": "fallback-svg"
            }]}

        return {"assets": generated_assets}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Smart Design Error: {str(e)}")

@router.get("/test-imagen-direct")
async def test_imagen_direct():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "No API Key in Env"}
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key={api_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "instances": [{"prompt": "Test image"}],
        "parameters": {"sampleCount": 1, "aspectRatio": "1:1"}
    }
    
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
        return {"status": resp.status_code, "body": resp.text[:200]}

print('>>> MODULE AI RELOADED <<<')
