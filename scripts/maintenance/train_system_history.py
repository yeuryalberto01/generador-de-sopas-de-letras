"""
Entrena el sistema actualizando el historial con las decisiones recientes del usuario.
"""
import json
import os
import datetime

EXAMPLES_PATH = r"c:\Users\yeury\Desktop\Proyecto Cenecompuc\SOPA DE LETRAS IA\backend\data\art_training\examples.json"

def train_with_history():
    if not os.path.exists(EXAMPLES_PATH):
        print("❌ No se encontró examples.json")
        return

    with open(EXAMPLES_PATH, "r", encoding="utf-8") as f:
        examples = json.load(f)

    # Identificar las sesiones recientes (Reino Submarino e Isla Mágica)
    target_ids = ["c6e5cae8", "37d75dbc"] # IDs tomados de la lectura previa
    
    updated_count = 0
    for ex in examples:
        if ex["id"] in target_ids:
            print(f"✨ Entrenando con sesión: {ex['puzzle_title']} ({ex['id']})")
            
            # 1. Asignar calificación perfecta (Decisión del usuario: "hermosa", "refina el sistema")
            ex["rating"] = 5
            
            # 2. Agregar tags de aprendizaje
            tags = ["fantasy", "vibrant", "full_color", "best_of_2", "masterpiece"]
            if "ISLA" in ex["puzzle_title"]:
                tags.append("reference_style")
            
            ex["feedback_tags"] = tags
            ex["feedback_text"] = "User Decision: Full opacity, vibrant colors, no text yet. Best of 2 selected."
            
            # 3. Refinar parámetros de diseño (Fine-tuning)
            if "design_plan" in ex:
                ex["design_plan"]["art_style"] += ", high saturation, no opacity"
                
            updated_count += 1

    if updated_count > 0:
        with open(EXAMPLES_PATH, "w", encoding="utf-8") as f:
            json.dump(examples, f, indent=2, ensure_ascii=False)
        print(f"✅ Sistema entrenado con {updated_count} sesiones exitosas.")
    else:
        print("⚠️ No se encontraron las sesiones objetivo para entrenar.")

if __name__ == "__main__":
    train_with_history()
