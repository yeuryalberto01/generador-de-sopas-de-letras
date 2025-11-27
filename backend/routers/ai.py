from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import httpx
import os
import json

router = APIRouter()

class AIRequest(BaseModel):
    provider: str
    model: Optional[str] = None
    prompt: str
    schema_type: Optional[Dict[str, Any]] = None # For Gemini JSON schema
    json_mode: bool = False

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
