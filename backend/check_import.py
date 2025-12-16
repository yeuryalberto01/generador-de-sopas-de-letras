import sys
import os

# Ensure we can import from current directory
sys.path.append(os.getcwd())

try:
    from modules.brain.learning_engine import router
    print("Import Successful")
    print("Router Prefix:", router.prefix)
    print("Router Routes:", [r.path for r in router.routes])
except Exception as e:
    print(f"Import Failed: {e}")
    import traceback
    traceback.print_exc()
