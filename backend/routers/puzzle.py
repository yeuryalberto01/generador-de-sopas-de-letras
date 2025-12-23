from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import random
import time
import string
import uuid

router = APIRouter(prefix="/api/puzzle", tags=["Puzzle Generator"])

class PuzzleCreateRequest(BaseModel):
    words: List[str]
    width: int
    height: int
    difficulty: str
    seed: Optional[str] = None
    hidden_message: Optional[str] = None

class PlacedWord(BaseModel):
    id: str
    word: str
    startX: int
    startY: int
    endX: int
    endY: int

class GridCell(BaseModel):
    letter: str
    isWord: bool
    wordId: Optional[str] = None
    isValid: bool
    x: int
    y: int

class PuzzleResponse(BaseModel):
    grid: List[List[GridCell]]
    placedWords: List[PlacedWord]
    unplacedWords: List[str]
    seed: str
    timestamp: float
    width: int
    height: int

DIRECTIONS = {
    "E": (1, 0),
    "S": (0, 1),
    "SE": (1, 1),
    "NE": (1, -1),
    "W": (-1, 0),
    "N": (0, -1),
    "NW": (-1, -1),
    "SW": (-1, 1)
}

def get_allowed_directions(difficulty: str) -> List[str]:
    if difficulty == "EASY":
        return ["E", "S"]
    elif difficulty == "MEDIUM":
        return ["E", "S", "SE", "NE"]
    else: # HARD
        return list(DIRECTIONS.keys())

def generate_puzzle(request: PuzzleCreateRequest) -> PuzzleResponse:
    # Seed handling
    seed = request.seed if request.seed else str(uuid.uuid4())
    random.seed(seed)
    
    width = request.width
    height = request.height
    
    # helper for bounds
    def is_valid(x, y):
        return 0 <= x < width and 0 <= y < height

    # 1. Initialize empty grid
    # We use a simple 2D array of chars or None initially
    temp_grid = [[None for _ in range(height)] for _ in range(width)]
    # Also track ownership for response
    cell_metadata = [[{"isWord": False, "wordId": None} for _ in range(height)] for _ in range(width)]

    placed_words = []
    unplaced_words = []
    
    # 2. Sort words (longest first usually helps)
    # Filter empty strings and uppercase
    words_to_place = [w.upper().strip() for w in request.words if w.strip()]
    words_to_place.sort(key=len, reverse=True)
    
    directions = get_allowed_directions(request.difficulty)
    
    for word in words_to_place:
        placed = False
        attempts = 0
        max_attempts = 100
        
        while not placed and attempts < max_attempts:
            attempts += 1
            # Pick random start and direction
            d_name = random.choice(directions)
            dx, dy = DIRECTIONS[d_name]
            
            # Prune search space mainly to valid starts
            # If word len is L, end must be valid.
            # No perfect formula for random simple generation, just bruteforce trial
            start_x = random.randint(0, width - 1)
            start_y = random.randint(0, height - 1)
            
            # Check fit
            fits = True
            chars_placed = []
            
            curr_x, curr_y = start_x, start_y
            
            for i, char in enumerate(word):
                if not is_valid(curr_x, curr_y):
                    fits = False
                    break
                
                existing = temp_grid[curr_x][curr_y]
                if existing is not None and existing != char:
                    fits = False
                    break
                
                chars_placed.append((curr_x, curr_y))
                curr_x += dx
                curr_y += dy
            
            if fits:
                # Place it
                word_id = str(uuid.uuid4())
                for i, (cx, cy) in enumerate(chars_placed):
                    temp_grid[cx][cy] = word[i]
                    cell_metadata[cx][cy]["isWord"] = True
                    cell_metadata[cx][cy]["wordId"] = word_id # Last writer wins or share? Typically share.
                
                placed_words.append(PlacedWord(
                    id=word_id,
                    word=word,
                    startX=start_x,
                    startY=start_y,
                    endX=chars_placed[-1][0],
                    endY=chars_placed[-1][1]
                ))
                placed = True
        
        if not placed:
            unplaced_words.append(word)

    # 3. Fill empty spaces
    letters = string.ascii_uppercase
    final_grid = []
    
    # Tranform to Column-First Grid Response (GridCell[][]) as expected by frontend
    # Frontend expects grid[x][y] (Columns)
    for x in range(width):
        col = []
        for y in range(height):
            char = temp_grid[x][y]
            is_static = char is not None
            if not is_static:
                char = random.choice(letters)
            
            meta = cell_metadata[x][y]
            
            col.append(GridCell(
                letter=char,
                isWord=meta["isWord"],
                wordId=meta["wordId"],
                isValid=True, # Shape support can be added later
                x=x,
                y=y
            ))
        final_grid.append(col)

    return PuzzleResponse(
        grid=final_grid,
        placedWords=placed_words,
        unplacedWords=unplaced_words,
        seed=seed,
        timestamp=time.time(),
        width=width,
        height=height
    )

@router.post("/create", response_model=PuzzleResponse)
async def create_puzzle(request: PuzzleCreateRequest):
    return generate_puzzle(request)
