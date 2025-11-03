import { del, get, post, put } from '../apiClient';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import type { Tema } from '../../types';

// --- TIPOS ---

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

interface CreateTemaPayload {
  nombre: string;
  words: string[];
}

interface UpdateTemaPayload {
  nombre?: string;
  words?: string[];
}

interface PalabrasResponse {
  palabras: string[];
  total: number;
}

// =============================================================================
// REPOSITORIO DE TEMAS
// =============================================================================

export class TemasRepository {
  async create(title: string, words: string[]): Promise<ApiResponse<Tema>> {
    if (words.length > 500) {
      return { ok: false, error: `Máximo 500 palabras por tema` };
    }

    const response: ApiResponse<Tema> = await post(API_ENDPOINTS.TEMAS.BASE, {
      nombre: title.trim(),
      words: words
    });

    return response;
  }

  async getAll(): Promise<ApiResponse<Tema[]>> {
    const response: ApiResponse<Tema[]> = await get(API_ENDPOINTS.TEMAS.BASE);
    return response;
  }

  async getById(id: string): Promise<ApiResponse<Tema>> {
    const response: ApiResponse<Tema> = await get(API_ENDPOINTS.TEMAS.BY_ID(id));
    return response;
  }

  async update(id: string, payload: UpdateTemaPayload): Promise<ApiResponse<Tema>> {
    if (payload.words && payload.words.length > 500) {
      return { ok: false, error: `Máximo 500 palabras por tema` };
    }

    const response: ApiResponse<Tema> = await put(API_ENDPOINTS.TEMAS.BY_ID(id), payload);
    return response;
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    const response: ApiResponse<any> = await del(API_ENDPOINTS.TEMAS.BY_ID(id));
    return response;
  }

  async getPalabras(id: string): Promise<ApiResponse<PalabrasResponse>> {
    const response: ApiResponse<string[]> = await get(API_ENDPOINTS.TEMAS.PALABRAS(id));
    return response.ok ? { ok: true, data: { palabras: response.data || [], total: (response.data || []).length } } : { ok: false, error: response.error };
  }

  async addPalabra(id: string, palabra: string): Promise<ApiResponse<string>> {
    return await post(API_ENDPOINTS.TEMAS.PALABRAS(id), { palabra });
  }

  async updatePalabra(id: string, index: number, palabra: string): Promise<ApiResponse<string>> {
    return await put(API_ENDPOINTS.TEMAS.PALABRA_BY_INDEX(id, index), { palabra });
  }

  async deletePalabra(id: string, index: number): Promise<ApiResponse<any>> {
    return await del(API_ENDPOINTS.TEMAS.PALABRA_BY_INDEX(id, index));
  }

  async replacePalabras(id: string, palabras: string[]): Promise<ApiResponse<{ palabras: string[] }>> {
    return await put(API_ENDPOINTS.TEMAS.PALABRAS(id), { palabras });
  }
}

export const temasRepository = new TemasRepository();
