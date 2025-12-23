import os

file_path = r"c:\Users\yeury\Desktop\Proyecto Cenecompuc\SOPA DE LETRAS IA\backend\routers\ai.py"

try:
    with open(file_path, "rb") as f:
        content = f.read()

    # Remove null bytes
    cleaned_content = content.replace(b'\x00', b'')
    
    # Also remove the BOM if present (fe ff)
    if cleaned_content.startswith(b'\xff\xfe') or cleaned_content.startswith(b'\xfe\xff'):
        cleaned_content = cleaned_content[2:]
        
    # Decode to check validity
    text = cleaned_content.decode('utf-8', errors='ignore')
    
    # Remove the print statement I added if it's there
    text = text.replace("print('>>> MODULE AI RELOADED <<<')", "")
    
    # Write back as UTF-8
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
        
    print("Successfully repaired ai.py")

except Exception as e:
    print(f"Error repairing file: {e}")
