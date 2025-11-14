import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import type { Libro, LibroConPaginas, PaginaLibro } from '../../types';
import { del, get, post, put } from '../apiClient';

// --- TIPOS ---

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

interface CreateLibroPayload {
  nombre: string;
  descripcion?: string;
  plantilla?: string;
}

interface UpdateLibroPayload {
  nombre?: string;
  descripcion?: string;
  plantilla?: string;
}

interface CreatePaginaPayload {
  numero_pagina: number;
  titulo?: string;
  tema_id?: string;
  contenido_json?: any;
}

interface PaginasResponse {
  paginas: PaginaLibro[];
  total_paginas: number;
}

// =============================================================================
// REPOSITORIO DE LIBROS
// =============================================================================

export class LibrosRepository {
  async create(libroData: CreateLibroPayload): Promise<ApiResponse<Libro>> {
    const response: ApiResponse<Libro> = await post(API_ENDPOINTS.LIBROS.BASE, libroData);
    return response;
  }

  async getAll(): Promise<ApiResponse<Libro[]>> {
    const response: ApiResponse<Libro[]> = await get(API_ENDPOINTS.LIBROS.BASE);
    return response;
  }

  async getById(id: string): Promise<ApiResponse<LibroConPaginas>> {
    const response: ApiResponse<Libro> = await get(API_ENDPOINTS.LIBROS.BY_ID(id));
    if (!response.ok) return response;

    // Obtener páginas también
    const paginasResponse = await this.getPaginas(id);
    const libroConPaginas: LibroConPaginas = {
      ...response.data!,
      paginas: paginasResponse.ok ? paginasResponse.data?.paginas : [],
      total_paginas: paginasResponse.ok ? paginasResponse.data?.total_paginas : 0
    };

    return { ok: true, data: libroConPaginas };
  }

  async update(id: string, payload: UpdateLibroPayload): Promise<ApiResponse<Libro>> {
    const response: ApiResponse<Libro> = await put(API_ENDPOINTS.LIBROS.BY_ID(id), payload);
    return response;
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    const response: ApiResponse<any> = await del(API_ENDPOINTS.LIBROS.BY_ID(id));
    return response;
  }

  async createPagina(libroId: string, paginaData: CreatePaginaPayload): Promise<ApiResponse<PaginaLibro>> {
    const response: ApiResponse<PaginaLibro> = await post(API_ENDPOINTS.LIBROS.PAGES(libroId), paginaData);
    return response;
  }

  async getPaginas(libroId: string): Promise<ApiResponse<PaginasResponse>> {
    const response: ApiResponse<PaginasResponse> = await get(API_ENDPOINTS.LIBROS.PAGES(libroId));
    return response;
  }
}

export const librosRepository = new LibrosRepository();