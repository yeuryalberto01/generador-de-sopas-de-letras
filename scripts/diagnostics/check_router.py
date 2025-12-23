import requests

def check_router():
    try:
        print("Checking Template Engine Router...")
        response = requests.get("http://localhost:8000/api/template-engine/status")
        print(f"Router Status: {response.status_code}")
        if response.status_code == 200:
            print(response.json())
        else:
            print(response.text)
            
        print("Checking Comfy Endpoint again...")
        comfy = requests.get("http://localhost:8000/api/template-engine/comfy/status")
        print(f"Comfy Status: {comfy.status_code}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_router()
