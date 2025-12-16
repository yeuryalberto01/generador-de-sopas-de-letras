import json
import os
from typing import List, Dict, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/brain", tags=["brain"])

from pathlib import Path

# Define Storage Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BRAIN_DATA_DIR = BASE_DIR / "backend" / "data" / "brain"
BRAIN_RULES_FILE = BRAIN_DATA_DIR / "rules.json"

# Ensure directory exists
os.makedirs(BRAIN_DATA_DIR, exist_ok=True)


class Rule(BaseModel):
    id: str
    type: str  # 'visual' | 'logic' | 'tone'
    content: str
    active: bool = True

class BrainRules(BaseModel):
    rules: List[Rule] = []

def load_rules() -> BrainRules:
    if not os.path.exists(BRAIN_RULES_FILE):
        return BrainRules()
    try:
        with open(BRAIN_RULES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return BrainRules(**data)
    except Exception as e:
        print(f"Error loading rules: {e}")
        return BrainRules()

def save_rules(rules: BrainRules):
    with open(BRAIN_RULES_FILE, "w", encoding="utf-8") as f:
        json.dump(rules.dict(), f, indent=2)

@router.get("/rules")
def get_rules():
    return load_rules()

@router.post("/rules")
def add_rule(rule: Rule):
    brain = load_rules()
    # Check if exists
    existing = next((r for r in brain.rules if r.id == rule.id), None)
    if existing:
        existing.content = rule.content
        existing.active = rule.active
        existing.type = rule.type
    else:
        brain.rules.append(rule)
    save_rules(brain)
    return {"status": "saved", "rule": rule}

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: str):
    brain = load_rules()
    brain.rules = [r for r in brain.rules if r.id != rule_id]
    save_rules(brain)
    return {"status": "deleted"}

def get_system_context(context_type: str) -> str:
    """
    Returns a compiled string of ACTIVE rules for a specific context.
    Used by AI services to inject 'System Prompts'.
    """
    brain = load_rules()
    active_rules = [r.content for r in brain.rules if r.active and (r.type == context_type or r.type == 'global')]
    
    if not active_rules:
        return ""
    
    return "DIRECTIVAS SUPREMAS (Estas reglas tienen prioridad sobre todo lo demás):\n" + "\n".join(f"- {rule}" for rule in active_rules)
