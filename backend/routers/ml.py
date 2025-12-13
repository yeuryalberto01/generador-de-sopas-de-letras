import os
import json
import glob
import shutil
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
import time

router = APIRouter(prefix="/api/ml", tags=["ml"])

# Configuration Store (Simple file-based for now, or in-memory)
CONFIG_FILE = "ml_config.json"

class MLConfig(BaseModel):
    training_path: str

class TrainingExample(BaseModel):
    prompt: str
    image_path: str # Base64 or local path if we move files
    style: str
    rating: int # 1 (Like) or -1 (Dislike)
    timestamp: float
    meta: dict = {}

class RetrievalRequest(BaseModel):
    prompt: str
    limit: int = 5
    min_rating: int = 1

# Helpers
def get_active_path(config: dict) -> tuple[str, bool]:
    path = config.get("training_path")
    using_fallback = False
    
    # Check if configured path is valid
    if not path or not os.path.exists(path):
        # Fallback to local
        path = os.path.join(os.getcwd(), "brain_backup")
        os.makedirs(path, exist_ok=True)
        using_fallback = True
        
    return path, using_fallback

@router.get("/config")
def get_config():
    config = {}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            config = json.load(f)
            
    # Determine active status
    active_path, is_fallback = get_active_path(config)
    
    return {
        "training_path": config.get("training_path", ""),
        "active_path": active_path,
        "mode": "FALLBACK_LOCAL" if is_fallback else "EXTERNAL_DRIVE_ACTIVE",
        "status": "warning" if is_fallback else "ok"
    }

@router.post("/config")
def set_config(config: MLConfig):
    # Verify path exists or create it
    if not os.path.exists(config.training_path):
        try:
            os.makedirs(config.training_path, exist_ok=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Cannot create directory: {str(e)}")
    
    with open(CONFIG_FILE, "w") as f:
        json.dump(config.dict(), f)
    return {"status": "success", "path": config.training_path}

@router.post("/log")
def log_training_example(example: TrainingExample):
    # 1. Get Config & Active Path
    raw_config = {}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            raw_config = json.load(f)
            
    base_path, is_fallback = get_active_path(raw_config)
    
    # 2. Create Filename
    # naming convention: timestamp_rating_style.json
    filename = f"{int(example.timestamp)}_{'LIKE' if example.rating > 0 else 'DISLIKE'}_{example.style}.json"
    file_path = os.path.join(base_path, filename)

    # 3. Save Image if it's Base64
    image_filename = filename.replace(".json", ".png")
    image_full_path = os.path.join(base_path, image_filename)
    
    # Simple base64 decode and save
    if example.image_path.startswith("data:image"):
        import base64
        try:
            header, encoded = example.image_path.split(",", 1)
            data = base64.b64decode(encoded)
            with open(image_full_path, "wb") as f:
                f.write(data)
            example.image_path = image_filename # Store relative path
        except Exception as e:
            print(f"Failed to save image: {e}")

    # 4. Save JSON
    try:
        with open(file_path, "w", encoding='utf-8') as f:
            json.dump(example.dict(), f, indent=2, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write log: {str(e)}")

    return {"status": "saved", "file": filename}

@router.patch("/log/{filename}")
def update_training_log(filename: str, updates: dict = Body(...)):
    raw_config = {}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            raw_config = json.load(f)
            
    base_path, _ = get_active_path(raw_config)
    file_path = os.path.join(base_path, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Log entry not found")
        
    try:
        with open(file_path, "r", encoding='utf-8') as f:
            data = json.load(f)
            
        # Update fields
        # Allow updating meta, rating, style
        if "meta" in updates:
            data["meta"].update(updates["meta"])
        if "rating" in updates:
            data["rating"] = updates["rating"]
        if "style" in updates:
            data["style"] = updates["style"]
         
        # Save back
        with open(file_path, "w", encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        return {"status": "updated", "data": data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update log: {str(e)}")

@router.post("/retrieve")
def retrieve_examples(req: RetrievalRequest):
    raw_config = {}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            raw_config = json.load(f)
            
    base_path, _ = get_active_path(raw_config)
    
    if not os.path.exists(base_path):
        return []

    # Simple Keyword Matching (RAG Lite)
    # In a full system, we might use embeddings. 
    # Here, we scan JSONs for matching words in the prompt.
    
    results = []
    search_terms = set(req.prompt.lower().split())
    
    # Get all JSON files
    files = glob.glob(os.path.join(base_path, "*.json"))
    
    # Sort by newest first
    files.sort(key=os.path.getmtime, reverse=True)
    
    # If prompt is empty, return latest interactions
    is_empty_search = not req.prompt.strip()

    for fpath in files:
        if len(results) >= req.limit:
            break
            
        try:
            with open(fpath, "r", encoding='utf-8') as f:
                data = json.load(f)
            
            # Filter by rating
            if data.get("rating", 0) < req.min_rating:
                continue

            if is_empty_search:
                data["_filename"] = os.path.basename(fpath)
                results.append(data)
                continue

            # Check relevance
            data_prompt = data.get("prompt", "").lower()
            data_style = data.get("style", "").lower()
            
            # Score: count matching words
            score = sum(1 for term in search_terms if term in data_prompt)
            
            # Bonus for style match
            if data_style in req.prompt.lower():
                score += 2
            
            if score > 0: # Found at least one relevant keyword
                # Add filename to result so frontend knows what to patch
                data["_filename"] = os.path.basename(fpath)
                results.append(data)
                
        except:
            continue
            
    return results

@router.delete("/log/{filename}")
def delete_training_log(filename: str):
    """Elimina un registro de entrenamiento y su imagen asociada"""
    raw_config = {}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            raw_config = json.load(f)
    
    base_path, _ = get_active_path(raw_config)
    file_path = os.path.join(base_path, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Log entry not found")
    
    try:
        # Delete JSON
        os.remove(file_path)
        
        # Try delete image (png)
        image_path = file_path.replace(".json", ".png")
        if os.path.exists(image_path):
            os.remove(image_path)
            
        return {"status": "deleted", "file": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete: {str(e)}")

@router.get("/stats")
def get_brain_stats():
    """Retorna estadísticas rápidas del cerebro"""
    raw_config = {}
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r") as f:
            raw_config = json.load(f)
            
    base_path, _ = get_active_path(raw_config)
    
    if not os.path.exists(base_path):
        return {"count": 0, "success_rate": 0, "total_size_mb": 0}
        
    files = glob.glob(os.path.join(base_path, "*.json"))
    total_count = len(files)
    
    success_count = 0
    total_size = 0
    
    try:
        # Quick scan (limited to last 100 for speed if needed, but here we do all)
        for fpath in files:
            # Stats (Size)
            total_size += os.path.getsize(fpath)
            
            # success rate (requires reading json, might be slow if thousands? optimize later)
            # For now, just rely on filename convention if possible or read
            # naming: timestamp_LIKE_style.json
            if "_LIKE_" in fpath:
                success_count += 1
                
        # Add image sizes approx
        img_files = glob.glob(os.path.join(base_path, "*.png"))
        for ipath in img_files:
            total_size += os.path.getsize(ipath)
            
    except:
        pass

    return {
        "count": total_count,
        "success_rate": round((success_count / total_count * 100) if total_count > 0 else 0, 1),
        "total_size_mb": round(total_size / (1024 * 1024), 2)
    }
