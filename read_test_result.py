import sys
try:
    with open("test_result.txt", "r", encoding="utf-16") as f:
        print(f.read())
except:
    try:
        with open("test_result.txt", "r", encoding="utf-8") as f:
            print(f.read())
    except Exception as e:
        print(e)
