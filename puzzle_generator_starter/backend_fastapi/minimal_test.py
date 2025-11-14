#!/usr/bin/env python3
"""
Test minimal FastAPI app
"""

from fastapi import FastAPI

app = FastAPI()

@app.get("/test")
def test():
    return {"message": "Hello World"}

@app.post("/test")
def test_post(data: dict):
    return {"received": data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")