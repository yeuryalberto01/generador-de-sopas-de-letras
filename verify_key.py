import requests

API_KEY = "sk-8eab5332135b49d39cb33ae502c8b59f"
URL = "https://api.deepseek.com/chat/completions"

def test_deepseek():
    print(f"Testing Key: {API_KEY[:6]}...{API_KEY[-4:]}")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}"
    }
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, who are you?"}
        ],
        "max_tokens": 10
    }
    
    try:
        response = requests.post(URL, json=payload, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print("Success! This is a valid DeepSeek API key.")
            print("Response:", response.json()['choices'][0]['message']['content'])
            return True
        else:
            print("Failed:", response.text)
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_deepseek()
