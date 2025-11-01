import { del, get, post, put } from './apiClient';

// Constantes para validación
const MAX_WORDS_PER_THEME = 500;
const VALIDATION_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]{2,32}$/;

// Servicio mejorado para temas
export const temasService = {
  async createTema(title, words) {
    if (words.length > MAX_WORDS_PER_THEME) {
      throw new Error(`Máximo ${MAX_WORDS_PER_THEME} palabras por tema`);
    }

    const response = await post('/temas', {
      nombre: title.trim(),
      words: words
    });

    if (!response.ok) {
      throw new Error(response.error || 'Error al crear el tema');
    }

    return response.data;
  },

  async getTemas() {
    const response = await get('/temas');
    if (!response.ok) {
      throw new Error('Error al cargar temas');
    }
    return response.data;
  },

  async updateTema(id, title, words) {
    if (words.length > MAX_WORDS_PER_THEME) {
      throw new Error(`Máximo ${MAX_WORDS_PER_THEME} palabras por tema`);
    }

    const response = await put(`/temas/${id}`, {
      nombre: title.trim(),
      words: words
    });

    if (!response.ok) {
      throw new Error(response.error || 'Error al actualizar el tema');
    }

    return response.data;
  },

  async deleteTema(id) {
    const response = await del(`/temas/${id}`);
    if (!response.ok) {
      throw new Error('Error al eliminar tema');
    }
    return true;
  },

  async bulkImport(temas) {
    // Para importación masiva, creamos cada tema individualmente
    const importedTemas = [];
    
    for (const tema of temas) {
      try {
        const newTema = await this.createTema(tema.nombre || tema.title, tema.words || []);
        importedTemas.push(newTema);
      } catch (error) {
        // Silenciar error de importación individual para evitar warnings
        // Continuar con el siguiente tema
      }
    }
    
    return importedTemas;
  }
};

// Funciones de utilidad para parseo de palabras
export const parseWords = (input) => {
  if (!input?.trim()) return { words: [], duplicates: 0, invalid: 0 };
  
  const tokens = input.split(/[,;\n\t\s]+/);
  const seen = new Set();
  const words = [];
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

// Funciones de exportación/importación
export const exportToJSON = (temas) => {
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

export const importFromJSON = (file, onSuccess, onError) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const temas = JSON.parse(e.target.result);
      if (Array.isArray(temas)) {
        onSuccess(temas);
      } else {
        onError('Formato de archivo inválido');
      }
    } catch (err) {
      onError('Error al leer el archivo');
    }
  };
  reader.onerror = () => onError('Error al leer el archivo');
  reader.readAsText(file);
};

// Funciones legacy para compatibilidad
export async function getTemas() { 
  return await temasService.getTemas();
}

export async function createTema(payload) { 
  return await temasService.createTema(payload.nombre, payload.words || []);
}

export async function updateTema(id, payload) { 
  return await temasService.updateTema(id, payload.nombre, payload.words || []);
}

export async function deleteTema(id) { 
  return await temasService.deleteTema(id);
}

export async function getPalabrasTema(id) {
  const response = await get(`/temas/${id}/palabras`);
  return response.ok ? response.data : { palabras: [], total: 0 };
}

export async function addPalabraTema(id, palabra) {
  return await post(`/temas/${id}/palabras`, { palabra });
}

export async function updatePalabraTema(id, index, palabra) {
  return await put(`/temas/${id}/palabras/${index}`, { palabra });
}

export async function deletePalabraTema(id, index) {
  return await del(`/temas/${id}/palabras/${index}`);
}

export async function replacePalabrasTema(id, palabras) {
  return await put(`/temas/${id}/palabras`, { palabras });
}
