import random
import time

# Configuration
DIFFICULTY = {
    'EASY': {'dirs': [(1,0), (0,1)], 'attempts': 200, 'multiplier': 3.5},
    'MEDIUM': {'dirs': [(1,0), (0,1), (1,1), (1,-1)], 'attempts': 200, 'multiplier': 2.8},
    'HARD': {'dirs': [(1,0), (0,1), (1,1), (1,-1), (-1,0), (0,-1), (-1,-1), (-1,1)], 'attempts': 500, 'multiplier': 1.8}
}

WORDS = [
    "INTELIGENCIA", "ARTIFICIAL", "ALGORITMO", "PYTHON", "TYPESCRIPT", 
    "REACT", "BACKEND", "FRONTEND", "DATABASE", "OPTIMIZATION",
    "DEBUGGING", "COMPILER", "FRAMEWORK", "VARIABLE", "FUNCTION"
]

def calculate_grid_size(words, difficulty):
    longest = max(len(w) for w in words)
    total_chars = sum(len(w) for w in words)
    multiplier = DIFFICULTY[difficulty]['multiplier']
    
    min_area = total_chars * multiplier
    size_area = int(min_area ** 0.5) + 1
    size_len = longest + (2 if difficulty == 'EASY' else 0)
    
    size = max(size_area, size_len)
    
    # Constraints
    if difficulty == 'EASY': size = max(10, min(size, 14))
    elif difficulty == 'MEDIUM': size = max(14, min(size, 18))
    elif difficulty == 'HARD': size = max(18, min(size, 26))
    
    return size

def solve(difficulty):
    size = calculate_grid_size(WORDS, difficulty)
    grid = [['' for _ in range(size)] for _ in range(size)]
    dirs = DIFFICULTY[difficulty]['dirs']
    max_attempts = DIFFICULTY[difficulty]['attempts']
    
    placed_count = 0
    sorted_words = sorted(WORDS, key=len, reverse=True)
    
    for word in sorted_words:
        placed = False
        for _ in range(max_attempts):
            d = random.choice(dirs)
            start_x = random.randint(0, size - 1)
            start_y = random.randint(0, size - 1)
            
            end_x = start_x + d[0] * (len(word) - 1)
            end_y = start_y + d[1] * (len(word) - 1)
            
            if not (0 <= end_x < size and 0 <= end_y < size):
                continue
                
            fits = True
            for i in range(len(word)):
                x = start_x + d[0] * i
                y = start_y + d[1] * i
                if grid[y][x] != '' and grid[y][x] != word[i]:
                    fits = False
                    break
            
            if fits:
                for i in range(len(word)):
                    x = start_x + d[0] * i
                    y = start_y + d[1] * i
                    grid[y][x] = word[i]
                placed = True
                placed_count += 1
                break
                
    return placed_count == len(WORDS), placed_count, len(WORDS)

print("=== SIMULATION START ===")
for diff in ['EASY', 'MEDIUM', 'HARD']:
    successes = 0
    total_runs = 100
    start_time = time.time()
    
    for _ in range(total_runs):
        success, _, _ = solve(diff)
        if success:
            successes += 1
            
    duration = time.time() - start_time
    print(f"Difficulty: {diff:6} | Success Rate: {successes}/{total_runs} ({successes}%) | Time: {duration:.2f}s")
