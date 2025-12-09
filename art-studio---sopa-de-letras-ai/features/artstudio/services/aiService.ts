import { GoogleGenAI } from "@google/genai";
import { GenerateDesignParams, PuzzleInfo, DesignPlan, KnowledgeBase, VisionAnalysis, LayoutConfig } from "../lib/types";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

// --- REFINAMIENTO: PARSER JSON A PRUEBA DE BALAS ---
const cleanJsonString = (str: string): string => {
  try {
    // 1. Intentar limpiar bloques de código markdown
    let cleaned = str.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
    cleaned = cleaned.replace(/\s*```$/, "");
    
    // 2. Extracción quirúrgica: Buscar el primer '{' y el último '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned.trim();
  } catch (e) {
    console.error("Error limpiando JSON:", e);
    return str; // Devolver original si falla la limpieza para que el parser final decida
  }
};

// --- CENE-CLONE (Ingeniería Inversa de Estilos) ---
export const extractStyleFromImage = async (base64Image: string): Promise<Partial<DesignPlan>> => {
    try {
        console.log("🧬 [CENE-CLONE] Extrayendo ADN de estilo...");
        const base64Data = base64Image.split(',')[1];

        const prompt = `
        Actúa como un Diseñador Gráfico Experto en Ingeniería Inversa.
        Analiza esta imagen de referencia de un juego de palabras (puzzle).
        
        Tu objetivo es extraer la configuración de diseño para REPLICAR este estilo en un sistema digital.
        
        Extrae y responde SOLO con este JSON:
        {
            "recommendedStyle": "string (elige uno: editorial_pro, nature_illustration, cultural_vibrant, tech_modern)",
            "palette": "string (descripción de colores)",
            "layoutConfig": {
                "fontFamilyHeader": "string (elige la más parecida: Cinzel, Playfair Display, Inter, Share Tech Mono, Indie Flower)",
                "fontFamilyGrid": "string (Inter, Share Tech Mono, etc)",
                "textColor": "string (código HEX del color principal de texto)",
                "gridBackground": "string (código HEX o rgba del fondo de la grilla)",
                "gridBorderColor": "string (HEX color borde grilla)",
                "gridBorderWidth": "string (ej: 2px)",
                "gridRadius": "string (ej: 12px)",
                "wordBoxVariant": "string (VALID VALUES: none, border, solid, parchment, tech, glass_dark, glass_light, notebook, brush)",
                "headerBackdrop": "string (VALID VALUES: none, glass, solid, banner, clean_gradient, brush_stroke, floating_card)",
                "blendMode": "string (normal, multiply, screen)"
            },
            "suggestedPrompt": "string (escribe un prompt de imagen para generar un fondo muy similar a este)"
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Data } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) throw new Error("No se pudo analizar la imagen");
        
        return JSON.parse(cleanJsonString(text)) as Partial<DesignPlan>;

    } catch (error) {
        console.error("Error CENE-CLONE:", error);
        throw error;
    }
};

// --- CENE-VISION (El Ojo Multimodal) ---
export const analyzeGeneratedImageWithVision = async (base64Image: string): Promise<VisionAnalysis> => {
    try {
        console.log("👁️ [CENE-VISION] Inspeccionando imagen generada...");
        const base64Data = base64Image.split(',')[1];

        const prompt = `
        Actúa como un Experto en Control de Calidad de Impresión (QA).
        Analiza esta imagen de una página de sopa de letras.
        
        Responde estrictamente en JSON con este formato:
        {
            "contrastScore": (0-100, cuán legible es el centro),
            "gridObstruction": (true/false, ¿hay dibujos tapando el área central donde irían las letras?),
            "textLegibility": ("high", "medium", "low"),
            "detectedElements": ["lista de cosas que ves, ej: peces, arboles"],
            "critique": "Breve opinión técnica en español sobre el diseño"
        }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", 
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/png", data: base64Data } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) throw new Error("Visión fallida");
        
        return JSON.parse(cleanJsonString(text)) as VisionAnalysis;

    } catch (error) {
        console.warn("Fallo en CENE-VISION:", error);
        return {
            contrastScore: 50,
            gridObstruction: false,
            textLegibility: 'medium',
            detectedElements: [],
            critique: "Análisis visual no disponible."
        };
    }
};

// --- CEREBRO ANALÍTICO ---
export const analyzeAndPlanDesign = async (
    puzzle: PuzzleInfo, 
    userIntent?: string, 
    knowledgeBase?: KnowledgeBase,
    currentCritique?: string
): Promise<DesignPlan> => {
  try {
    console.log("🧠 [CENE-BRAIN] Planificando con historial:", knowledgeBase?.logs.length, "registros.");

    let learningContext = "";
    
    if (knowledgeBase && knowledgeBase.logs.length > 0) {
        const badLogs = knowledgeBase.logs.filter(l => l.human_rating === 0).slice(-5);
        if (badLogs.length > 0) {
            learningContext += `
            ⛔ ERRORES RECIENTES (EVITAR A TODA COSTA):
            ${badLogs.map(l => `- El usuario rechazó: "${l.human_critique}". Prompt usado: "${l.ai_prompt.substring(0, 50)}..."`).join('\n')}
            `;
        }

        const goodLogs = knowledgeBase.logs.filter(l => l.human_rating === 1).slice(-5);
        if (goodLogs.length > 0) {
            learningContext += `
            ✅ ACIERTOS RECIENTES (IMITAR):
            ${goodLogs.map(l => `- Estilo exitoso: ${l.style_used}. Tema: ${l.user_intent}`).join('\n')}
            `;
        }
    }

    if (currentCritique) {
        learningContext += `
        🚨 PRIORIDAD MÁXIMA - CORRECCIÓN:
        El usuario reportó: "${currentCritique}".
        Modifica radicalmente el diseño para solucionar esto.
        `;
    }

    const prompt = `
      MANDATO PARA AI STUDIO – DISEÑO ADAPTATIVO
      
      INPUT:
      - Título: "${puzzle.title}"
      - Tema Solicitado: "${userIntent || "Coherente con título"}"

      ${learningContext}

      REGLAS DE DECISIÓN DE ESTILO (Sigue estrictamente):
      1. Si el tema es 'Bosque', 'Naturaleza' o 'Antiguo':
         - Usa 'wordBoxVariant': 'parchment', 'notebook' o 'brush'.
         - 'fontFamilyHeader': 'Cinzel' o 'Indie Flower'.
      2. Si el tema es 'Tech', 'Futuro', 'Cyberpunk':
         - Usa 'wordBoxVariant': 'tech' o 'glass_dark'.
         - 'fontFamilyHeader': 'Share Tech Mono' o 'Space Grotesk'.
         - 'textColor': '#FFFFFF' (Casi siempre).
      3. Si el tema es 'Editorial' o 'Libro':
         - Usa 'wordBoxVariant': 'solid' o 'border'.
         - 'fontFamilyHeader': 'Playfair Display'.

      IMPORTANTE: 'wordBoxVariant' DEBE SER UNO DE ESTOS VALORES EXACTOS (No inventes):
      ['none', 'border', 'solid', 'parchment', 'tech', 'glass_dark', 'glass_light', 'brush', 'notebook']

      IMPORTANTE: 'headerBackdrop' DEBE SER UNO DE ESTOS VALORES EXACTOS:
      ['none', 'glass', 'solid', 'banner', 'clean_gradient', 'brush_stroke', 'floating_card']

      Output JSON (DesignPlan schema):
      {
        "recommendedStyle": "string",
        "concept": "string",
        "background": "string",
        "characters": "string",
        "gridTreatment": "string",
        "wordListTreatment": "string",
        "palette": "string",
        "decorations": "string",
        "artStyle": "string",
        "suggestedPrompt": "PROMPT FINAL EN INGLÉS",
        "layoutConfig": {
            "fontFamilyHeader": "string",
            "textColor": "string",
            "wordBoxVariant": "string",
            "headerBackdrop": "string",
            "blendMode": "string"
            ...otras propiedades
        }
      }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const parsedJson = JSON.parse(cleanJsonString(response.text || "{}"));
    return parsedJson as DesignPlan;

  } catch (error) {
    console.error("Error CENE-BRAIN:", error);
    // Fallback plan
    return {
        recommendedStyle: 'editorial_pro',
        concept: "Fallback Plan",
        background: "Clean white",
        characters: "None",
        gridTreatment: "Simple",
        wordListTreatment: "Simple",
        palette: "B/W",
        decorations: "None",
        artStyle: "Minimal",
        suggestedPrompt: "A simple, clean puzzle page background, white paper texture.",
        layoutConfig: {
            fontFamilyHeader: 'Inter',
            fontFamilyGrid: 'Inter',
            textColor: '#000000',
            gridBackground: 'rgba(255,255,255,0.9)',
            gridBorderColor: '#000000',
            paddingTop: '48px',
            headerStyle: 'standard',
            wordListStyle: 'classic',
            wordBoxVariant: 'border'
        }
    };
  }
};

// --- ARTISTA ---
export const generateSmartDesign = async (params: GenerateDesignParams): Promise<string> => {
  try {
    const { prompt, imageSize = "draft_fast" } = params;
    
    // Optimización de costos: Usar 2K para Impresión (suficiente para 300DPI en Letter si el texto es vectorial)
    // Usar 1K para Draft.
    const apiImageSize = imageSize === 'print_300dpi' ? '2K' : '1K';
    
    console.log(`🎨 [ARTIST] Generando (${apiImageSize})...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "3:4", imageSize: apiImageSize } }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data found.");
  } catch (error) {
    console.error("Error Artista:", error);
    throw error;
  }
};