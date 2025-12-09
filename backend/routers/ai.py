from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx
import os
import json
import google.generativeai as genai
import base64
from google.genai.errors import ClientError

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
    model: Optional[str] = 'gemini-2.5-flash-image'

class SVGRequest(BaseModel):
    prompt: str
    style: str = 'color' # 'bw' or 'color'



import time
import json
from datetime import datetime

# Helper for Launcher API Monitoring
def log_api_event(provider: str, method: str, status: str, duration_ms: float, details: Dict[str, Any] = None):
    """
    Log a structured event for the Launcher API Analyzer.
    Format: [API_METRIC] <JSON_PAYLOAD>
    """
    payload = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "provider": provider,
        "method": method,
        "status": status,
        "duration_ms": round(duration_ms, 2),
        "details": details or {}
    }
    # Force print to stdout so launcher captures it
    print(f"[API_METRIC] {json.dumps(payload)}")

async def generate_image_openai(api_key: str, prompt: str, model: str = "dall-e-3") -> str:
    """Fallback using OpenAI DALL-E 3"""
    url = "https://api.openai.com/v1/images/generations"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "prompt": prompt,
        "n": 1,
        "size": "1024x1792", # Vertical portrait approximation
        "response_format": "b64_json",
        "quality": "standard"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers, timeout=60.0)
        response.raise_for_status()
        data = response.json()
        return data["data"][0]["b64_json"]


@router.post("/generate")
async def generate_content(request: AIRequest, x_api_key: Optional[str] = Header(None)):
    """
    Proxy AI generation requests to Gemini, DeepSeek, or Grok.
    Prioritizes X-API-Key header, then environment variables.
    """
    start_time = time.time()
    provider = request.provider
    model = request.model or "default"
    
    try:
        api_key = x_api_key
        
        # 1. Determine Provider and Config
        result = None
        if request.provider == 'gemini':
            result = await call_gemini(request, api_key)
        elif request.provider in ['deepseek', 'grok', 'openai', 'openrouter']:
            result = await call_openai_compatible(request, api_key)
        else:
            raise HTTPException(status_code=400, detail=f"Provider '{request.provider}' not supported.")
        
        duration = (time.time() - start_time) * 1000
        log_api_event(provider, "generate_content", "SUCCESS", duration, {"model": model})
        return result

    except HTTPException as e:
        duration = (time.time() - start_time) * 1000
        log_api_event(provider, "generate_content", "ERROR", duration, {"code": e.status_code, "error": e.detail})
        raise e
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        log_api_event(provider, "generate_content", "CRITICAL", duration, {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


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
        logging.error("No API Key found in Header or Environment")
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
    start_time = time.time()
    model = request.model or 'gemini-2.5-flash-image'
    
    try:
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

        # Imagen 3 Generation using google-genai SDK
        client = google_genai.Client(api_key=api_key)
        
        response = client.models.generate_images(
            model=model,
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
            
            duration = (time.time() - start_time) * 1000
            log_api_event("IMAGEN", "generate_image", "SUCCESS", duration, {"model": model})
            return {"image": f"data:image/png;base64,{base64_img}"}
        else:
            raise HTTPException(status_code=500, detail="No image generated")

    except HTTPException as e:
        duration = (time.time() - start_time) * 1000
        log_api_event("IMAGEN", "generate_image", "ERROR", duration, {"code": e.status_code, "error": e.detail})
        raise e
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        logging.error(f"Imagen Generation Error: {e}")
        print(f"Imagen 3 Error: {e}")
        
        duration = (time.time() - start_time) * 1000
        log_api_event("IMAGEN", "generate_image", "CRITICAL", duration, {"error": str(e), "trace": error_trace})
        raise HTTPException(status_code=500, detail=f"Image Generation Failed: {str(e)}")


@router.post("/generate-svg")
async def generate_svg(request: SVGRequest, x_api_key: Optional[str] = Header(None)):
    start_time = time.time()
    try:
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

        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(svg_prompt)
        
        svg_text = response.text
        
        # Cleanup
        svg_text = svg_text.replace('```svg', '').replace('```xml', '').replace('```', '').strip()
        
        if '<svg' not in svg_text:
             raise HTTPException(status_code=500, detail="Invalid SVG generated")

        # Encode
        base64_svg = base64.b64encode(svg_text.encode('utf-8')).decode('utf-8')
        
        duration = (time.time() - start_time) * 1000
        log_api_event("GEMINI", "generate_svg", "SUCCESS", duration, {})
        return {"image": f"data:image/svg+xml;base64,{base64_svg}"}

    except HTTPException as e:
        duration = (time.time() - start_time) * 1000
        log_api_event("GEMINI", "generate_svg", "ERROR", duration, {"code": e.status_code, "error": e.detail})
        raise e
    except Exception as e:
        duration = (time.time() - start_time) * 1000
        log_api_event("GEMINI", "generate_svg", "CRITICAL", duration, {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"SVG Generation Failed: {str(e)}")

class SmartDesignRequest(BaseModel):
    prompt: str
    mask_image: str # Base64 encoded image
    style: str = 'color'

@router.post("/generate-smart-design")
async def generate_smart_design(
    request: SmartDesignRequest, 
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    x_openai_api_key: Optional[str] = Header(None, alias="X-OpenAI-API-Key")
):
    start_time = time.time()
    model = 'gemini-2.5-flash-image'
    
    try:
        logging.info(f"Received Smart Design Request (Imagen 3 Mode)")
        logging.info(f"Prompt: {request.prompt}")

        api_key = x_api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            logging.error("Missing API Key")
            raise HTTPException(status_code=401, detail="Missing Gemini API Key")

        # Construct a prompt that enforces the frame layout
        # We ignore the mask_image for generation because Imagen 3 follows text instructions well for layout
        final_prompt = f"""
            Create a high-quality, detailed illustration acting as a PAGE BORDER / FRAME about: {request.prompt}.
            
            CRITICAL LAYOUT RULES:
            1. The art must be ONLY around the edges (top, bottom, sides).
            2. The CENTER (approx 70-80% of the page) must be COMPLETELY EMPTY WHITE SPACE.
            3. Do not place any objects, heavy textures, or lines in the center. It must be clean white.
            
            Style & Content:
            1. Style: High quality digital art, detailed, vibrant.
            2. Content: {request.prompt}.
            3. Aspect Ratio: Vertical Portrait (3:4).
            4. Background: White.
        """

        logging.info("Calling Imagen 3...")
        
        # Use google_genai Client for Imagen 3
        client = google_genai.Client(api_key=api_key)
        
        response = client.models.generate_images(
            model=model,
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
            logging.info("Imagen 3 generation successful.")
            
            duration = (time.time() - start_time) * 1000
            log_api_event("IMAGEN", "generate_smart_design", "SUCCESS", duration, {"model": model})
            return {"image": f"data:image/png;base64,{base64_img}"}
        else:
            raise HTTPException(status_code=500, detail="No image generated by Imagen 3")


    except HTTPException as e:
        duration = (time.time() - start_time) * 1000
        log_api_event("IMAGEN", "generate_smart_design", "ERROR", duration, {"code": e.status_code, "error": e.detail})
        raise e
    except ClientError as e:
        print(f"CAUGHT ClientError from Imagen 3: {e}")
        logging.warning(f"Imagen 3 ClientError: {e}")
        # Force jump to fallback, same logic as generic Exception but explicit
        try:
             # --- FALLBACK 1: OpenAI DALL-E 3 ---
            openai_key = x_openai_api_key or os.getenv("OPENAI_API_KEY")
            
            if openai_key:
                try:
                    print("Fallback 1: Attempting DALL-E 3...")
                    logging.info("Falling back to DALL-E 3")
                    base64_img = await generate_image_openai(openai_key, final_prompt)
                    
                    duration = (time.time() - start_time) * 1000
                    log_api_event("OPENAI", "generate_smart_design_fallback", "SUCCESS", duration, {"model": "dall-e-3"})
                    return {"image": f"data:image/png;base64,{base64_img}"}
                except Exception as fallback_e:
                    logging.error(f"DALL-E 3 fallback failed: {fallback_e}")
                    print(f"DALL-E 3 fallback failed: {fallback_e}")
            else:
                print("No OpenAI API Key found, skipping DALL-E fallback.")

            # --- FALLBACK 2: SVG via Gemini Text Model ---
            if api_key:
                try:
                    logging.info("Falling back to SVG generation via Gemini (Standard SDK)")
                    
                    genai.configure(api_key=api_key)
                    
                    svg_prompt = f"""
                        You are an expert SVG artist. Generate a SCALABLE VECTOR GRAPHICS (SVG) code for a decorative page border/frame about: {request.prompt}.
                        
                        CRITICAL REQUIREMENTS:
                        1. Output ONLY the raw <svg>...</svg> code. Do NOT wrap in markdown code blocks.
                        2. ViewBox: "0 0 600 800" (Portrait 3:4).
                        3. Style: Flat vector art, vibrant colors, decorative borders.
                        4. Layout: The art must be ONLY on the borders. CENTER must be empty.
                        5. Background: Transparent.
                    """
                    
                    # Fallback to the available model
                    svg_model = genai.GenerativeModel('gemini-2.0-flash')
                    svg_response = svg_model.generate_content(svg_prompt)
                    
                    svg_text = svg_response.text
                    svg_text = svg_text.replace('```svg', '').replace('```xml', '').replace('```', '').strip()
                    
                    if '<svg' in svg_text:
                        base64_svg = base64.b64encode(svg_text.encode('utf-8')).decode('utf-8')
                        
                        duration = (time.time() - start_time) * 1000
                        log_api_event("GEMINI", "generate_smart_design_svg_fallback", "SUCCESS", duration, {"model": "gemini-2.0-flash"})
                        print("SVG fallback SUCCESS!")
                        return {"image": f"data:image/svg+xml;base64,{base64_svg}"}
                    else:
                        print("SVG fallback generated invalid content (no <svg> tag).")
                        
                except Exception as svg_e:
                    logging.error(f"SVG fallback failed: {svg_e}")
                    print(f"SVG fallback failed: {svg_e}")
            
            # If fallbacks fail, raise
            raise HTTPException(status_code=500, detail=f"Imagen 3 failed with ClientError: {e}")

        except Exception as fallback_logic_error:
             print(f"CRITICAL ERROR inside fallback logic: {fallback_logic_error}")
             raise fallback_logic_error

    except Exception as e:
        duration = (time.time() - start_time) * 1000
        error_msg = str(e)
        
        logging.warning(f"Imagen 3 calling failed ({error_msg}). Starting fallback sequence...")
        print(f"Imagen 3 failed. Error: {error_msg}")
        
        # --- FALLBACK 1: OpenAI DALL-E 3 ---
        openai_key = x_openai_api_key or os.getenv("OPENAI_API_KEY")
        
        if openai_key:
            try:
                print("Fallback 1: Attempting DALL-E 3...")
                logging.info("Falling back to DALL-E 3")
                base64_img = await generate_image_openai(openai_key, final_prompt)
                
                duration = (time.time() - start_time) * 1000
                log_api_event("OPENAI", "generate_smart_design_fallback", "SUCCESS", duration, {"model": "dall-e-3"})
                return {"image": f"data:image/png;base64,{base64_img}"}
            except Exception as fallback_e:
                logging.error(f"DALL-E 3 fallback failed: {fallback_e}")
                print(f"DALL-E 3 fallback failed: {fallback_e}")
        else:
            print("No OpenAI API Key found, skipping DALL-E fallback.")

        # --- FALLBACK 2: SVG via Gemini Text Model ---
        # This uses the same Gemini API key as the original request, so it should be available.
        if api_key:
            try:
                print("Fallback 2: Generating SVG with Gemini Text Model...")
                logging.info("Falling back to SVG generation via Gemini")
                
                # Re-configure genai just in case
                genai.configure(api_key=api_key)
                
                svg_prompt = f"""
                    You are an expert SVG artist. Generate a SCALABLE VECTOR GRAPHICS (SVG) code for a decorative page border/frame about: {request.prompt}.
                    
                    CRITICAL REQUIREMENTS:
                    1. Output ONLY the raw <svg>...</svg> code. Do NOT wrap in markdown code blocks.
                    2. ViewBox: "0 0 600 800" (Portrait 3:4).
                    3. Style: Flat vector art, vibrant colors, decorative borders.
                    4. Layout: The art must be ONLY on the borders. CENTER must be empty.
                    5. Background: Transparent.
                """
                
                # Fallback to the available model
                svg_model = genai.GenerativeModel('gemini-2.0-flash')
                svg_response = svg_model.generate_content(svg_prompt)
                
                svg_text = svg_response.text
                svg_text = svg_text.replace('```svg', '').replace('```xml', '').replace('```', '').strip()
                
                if '<svg' in svg_text:
                    base64_svg = base64.b64encode(svg_text.encode('utf-8')).decode('utf-8')
                    
                    duration = (time.time() - start_time) * 1000
                    log_api_event("GEMINI", "generate_smart_design_svg_fallback", "SUCCESS", duration, {"model": "gemini-2.0-flash"})
                    print("SVG fallback SUCCESS!")
                    return {"image": f"data:image/svg+xml;base64,{base64_svg}"}
                else:
                    print("SVG fallback generated invalid content (no <svg> tag).")
                    
            except Exception as svg_e:
                logging.error(f"SVG fallback failed: {svg_e}")
                print(f"SVG fallback failed: {svg_e}")

        # If we reach here, ALL methods failed
        import traceback
        error_trace = traceback.format_exc()
        print(f"CRITICAL ERROR in generate_smart_design: All methods failed.")
        logging.error(f"Smart Design Error - All Fallbacks Failed: {e}")
        
        raise HTTPException(status_code=500, detail=f"Generation failed after trying Imagen 3, OpenAI, and SVG fallback. Error: {str(e)}")
