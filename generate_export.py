
import json
import random
import string
import uuid
import time

def generate_grid(size, words):
    grid = [['' for _ in range(size)] for _ in range(size)]
    placed_words = []
    
    for word_text in words:
        word = word_text.upper()
        placed = False
        attempts = 0
        while not placed and attempts < 100:
            direction = random.choice(['H', 'V', 'D'])
            row = random.randint(0, size - 1)
            col = random.randint(0, size - 1)
            
            if direction == 'H':
                if col + len(word) <= size:
                    can_place = True
                    for k in range(len(word)):
                        if grid[row][col + k] != '' and grid[row][col + k] != word[k]:
                            can_place = False
                            break
                    if can_place:
                        for k in range(len(word)):
                            grid[row][col + k] = word[k]
                        placed_words.append({
                            "id": str(uuid.uuid4()),
                            "word": word,
                            "startX": col,
                            "startY": row,
                            "endX": col + len(word) - 1,
                            "endY": row
                        })
                        placed = True
            elif direction == 'V':
                if row + len(word) <= size:
                    can_place = True
                    for k in range(len(word)):
                        if grid[row + k][col] != '' and grid[row + k][col] != word[k]:
                            can_place = False
                            break
                    if can_place:
                        for k in range(len(word)):
                            grid[row + k][col] = word[k]
                        placed_words.append({
                            "id": str(uuid.uuid4()),
                            "word": word,
                            "startX": col,
                            "startY": row,
                            "endX": col,
                            "endY": row + len(word) - 1
                        })
                        placed = True
            attempts += 1

    # Fill empty cells
    grid_cells = []
    for r in range(size):
        row_cells = []
        for c in range(size):
            char = grid[r][c]
            is_word = char != ''
            if not is_word:
                char = random.choice(string.ascii_uppercase)
            
            row_cells.append({
                "letter": char,
                "isWord": is_word,
                "isValid": True,
                "x": c,
                "y": r
            })
        grid_cells.append(row_cells)
            
    return grid_cells, placed_words

def create_matatiempo_export():
    words = ["AJEDREZ", "LECTURA", "MUSICA", "BAILE", "CINE", "JUEGOS", "ARTE", "DEPORTE", "COCINA", "VIAJES"]
    grid_size = 15
    grid, placed_words = generate_grid(grid_size, words)
    
    # Placeholder for a generated image (1x1 transparent pixel just to have something valid)
    container_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

    puzzle_data = {
        "id": str(uuid.uuid4()),
        "name": "Matatiempo",
        "createdAt": int(time.time() * 1000),
        "config": {
            "title": "Matatiempo: Pasatiempos Favoritos",
            "headerLeft": "Sopa de Letras",
            "headerRight": "Edición Especial",
            "difficulty": "EASY",
            "gridSize": grid_size,
            "gridHeight": grid_size,
            "words": words,
            "showSolution": False,
            "styleMode": "color",
            "backgroundImage": container_base64,
            "themeData": {
                 "primaryColor": "#FF5733",
                 "secondaryColor": "#C70039",
                 "textColor": "#000000",
                 "backgroundColor": "#FFFFFF"
            }
        },
        "puzzleData": {
            "grid": grid,
            "placedWords": placed_words,
            "theme": {
                "primaryColor": "#FF5733",
                 "secondaryColor": "#C70039",
                 "textColor": "#000000",
                 "backgroundColor": "#FFFFFF"
            },
            "seed": "matatiempo_seed_123"
        }
    }
    
    filename = "Matatiempo_Export.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(puzzle_data, f, indent=2, ensure_ascii=True)
        
    print(f"Exported to {filename}")

if __name__ == "__main__":
    create_matatiempo_export()
