import type { Tema } from '../types';
import { temasRepository } from './repositories/TemasRepository';

// --- TIPOS ---

interface ParseWordsResult {
  words: string[];
  duplicates: number;
  invalid: number;
}

// --- CONSTANTES ---

const VALIDATION_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]{2,32}$/;

// =============================================================================
// SERVICIO DE TEMAS
// =============================================================================

export const temasService = {
  async createTema(title: string, words: string[], options?: { categoria?: string; dificultad?: string; etiquetas?: string[] }): Promise<Tema> {
    // Convertir words array a formato de objetos para la API
    const palabras = words.map(texto => ({ texto }));

    const temaData = {
      nombre: title.trim(),
      descripcion: '',
      palabras,
      categoria: options?.categoria || 'general',
      etiquetas: options?.etiquetas || [],
      dificultad: options?.dificultad || 'medio'
    };

    const response = await temasRepository.create(temaData);
    if (!response.ok) {
      throw new Error(response.error || 'Error al crear el tema');
    }
    return response.data as Tema;
  },

  async getTemas(): Promise<Tema[]> {
    const response = await temasRepository.getAll();
    if (!response.ok) {
      throw new Error('Error al cargar temas');
    }
    // Convertir el formato de la API al formato interno si es necesario
    const temas = response.data as Tema[];
    return temas.map(tema => ({
      ...tema,
      palabras: Array.isArray(tema.palabras) && tema.palabras.length > 0 && typeof tema.palabras[0] === 'object'
        ? tema.palabras
        : (tema.palabras as any)?.map((texto: string) => ({ texto })) || []
    }));
  },

  async updateTema(id: string, title: string, words: string[], options?: { categoria?: string; dificultad?: string; etiquetas?: string[] }): Promise<Tema> {
    // Convertir words array a formato de objetos para la API
    const palabras = words.map(texto => ({ texto }));

    const temaData = {
      nombre: title.trim(),
      descripcion: '',
      palabras,
      categoria: options?.categoria || 'general',
      etiquetas: options?.etiquetas || [],
      dificultad: options?.dificultad || 'medio'
    };

    const response = await temasRepository.update(id, temaData);
    if (!response.ok) {
      throw new Error(response.error || 'Error al actualizar el tema');
    }
    return response.data as Tema;
  },

  async deleteTema(id: string): Promise<boolean> {
    const response = await temasRepository.delete(id);
    if (!response.ok) {
      throw new Error('Error al eliminar tema');
    }
    return true;
  },

  async bulkImport(temas: Tema[]): Promise<Tema[]> {
    const importedTemas: Tema[] = [];
    for (const tema of temas) {
      try {
        const newTema = await this.createTema(tema.nombre || (tema as any).title, tema.palabras || []);
        importedTemas.push(newTema);
      } catch (error) {
        console.error('Error importing tema:', error);
      }
    }
    return importedTemas;
  }
};

// =============================================================================
// FUNCIONES DE UTILIDAD
// =============================================================================

export const parseWords = (input: string): ParseWordsResult => {
  if (!input?.trim()) return { words: [], duplicates: 0, invalid: 0 };
  
  const tokens = input.split(/[,;\n\t\s]+/);
  const seen = new Set<string>();
  const words: string[] = [];
  let duplicates = 0;
  let invalid = 0;

  tokens.forEach(token => {
    const cleaned = token.trim();
    if (!cleaned) return;
    
    if (!VALIDATION_REGEX.test(cleaned)) {
      invalid++;
      return;
    }
    
    const normalized = cleaned.toLowerCase();
    if (seen.has(normalized)) {
      duplicates++;
      return;
    }
    
    seen.add(normalized);
    words.push(cleaned);
  });

  return { words, duplicates, invalid };
};

export const exportToJSON = (temas: Tema[]) => {
  const dataStr = JSON.stringify(temas, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `temas-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File, onSuccess: (temas: Tema[]) => void, onError: (error: string) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const temas = JSON.parse(result);
        if (Array.isArray(temas)) {
          onSuccess(temas);
        } else {
          onError('Formato de archivo inválido');
        }
      } else {
        onError('Error al leer el archivo: resultado no es string');
      }
    } catch (err: any) {
      onError(`Error al leer el archivo: ${err.message}`);
    }
  };
  reader.onerror = () => onError('Error al leer el archivo');
  reader.readAsText(file);
};

// =============================================================================
// FUNCIONES LEGACY (PARA COMPATIBILIDAD)
// =============================================================================

export async function getTemas(): Promise<Tema[]> { 
  return await temasService.getTemas();
}

export async function createTema(payload: { nombre: string; words?: string[] }): Promise<Tema> {
  return await temasService.createTema(payload.nombre, payload.words || []);
}

export async function updateTema(id: string, payload: { nombre: string; words?: string[] }): Promise<Tema> {
  return await temasService.updateTema(id, payload.nombre, payload.words || []);
}

export async function deleteTema(id: string): Promise<boolean> { 
  return await temasService.deleteTema(id);
}

export async function getPalabrasTema(id: string): Promise<{ palabras: string[]; total: number; }> {
  const response = await temasRepository.getPalabras(id);
  return response.ok ? (response.data || { palabras: [], total: 0 }) : { palabras: [], total: 0 };
}

export async function addPalabraTema(id: string, palabra: string): Promise<{ ok: boolean; data?: string; error?: string; }> {
  return await temasRepository.addPalabra(id, palabra);
}

export async function updatePalabraTema(id: string, index: number, palabra: string): Promise<{ ok: boolean; data?: string; error?: string; }> {
  return await temasRepository.updatePalabra(id, index, palabra);
}

export async function deletePalabraTema(id: string, index: number): Promise<{ ok: boolean; data?: any; error?: string; }> {
  return await temasRepository.deletePalabra(id, index);
}

export async function replacePalabrasTema(id: string, palabras: string[]): Promise<{ ok: boolean; data?: { palabras: string[]; }; error?: string; }> {
  return await temasRepository.replacePalabras(id, palabras);
}
