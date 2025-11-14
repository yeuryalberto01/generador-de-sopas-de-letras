import type { Libro, LibroConPaginas, PaginaLibro } from '../types';
import { librosRepository } from './repositories/LibrosRepository';

// =============================================================================
// SERVICIO DE LIBROS
// =============================================================================

export const librosService = {
  async createLibro(nombre: string, descripcion?: string, plantilla?: string): Promise<Libro> {
    const libroData = {
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      plantilla: plantilla || 'basico'
    };

    const response = await librosRepository.create(libroData);
    if (!response.ok) {
      throw new Error(response.error || 'Error al crear el libro');
    }
    return response.data as Libro;
  },

  async getLibros(): Promise<Libro[]> {
    const response = await librosRepository.getAll();
    if (!response.ok) {
      throw new Error('Error al cargar libros');
    }
    return response.data as Libro[];
  },

  async getLibroById(id: string): Promise<LibroConPaginas> {
    const response = await librosRepository.getById(id);
    if (!response.ok) {
      throw new Error('Error al cargar libro');
    }
    return response.data as LibroConPaginas;
  },

  async updateLibro(id: string, nombre: string, descripcion?: string, plantilla?: string): Promise<Libro> {
    const libroData = {
      nombre: nombre.trim(),
      descripcion: descripcion || '',
      plantilla: plantilla || 'basico'
    };

    const response = await librosRepository.update(id, libroData);
    if (!response.ok) {
      throw new Error(response.error || 'Error al actualizar el libro');
    }
    return response.data as Libro;
  },

  async deleteLibro(id: string): Promise<boolean> {
    const response = await librosRepository.delete(id);
    if (!response.ok) {
      throw new Error('Error al eliminar libro');
    }
    return true;
  },

  async createPagina(libroId: string, numeroPagina: number, titulo?: string, contenidoJson?: any, temaId?: string): Promise<PaginaLibro> {
    const paginaData = {
      numero_pagina: numeroPagina,
      titulo: titulo || `Página ${numeroPagina}`,
      tema_id: temaId,
      contenido_json: contenidoJson || {}
    };

    const response = await librosRepository.createPagina(libroId, paginaData);
    if (!response.ok) {
      throw new Error(response.error || 'Error al crear la página');
    }
    return response.data as PaginaLibro;
  },

  async getPaginas(libroId: string): Promise<PaginaLibro[]> {
    const response = await librosRepository.getPaginas(libroId);
    if (!response.ok) {
      throw new Error('Error al cargar páginas');
    }
    return response.data?.paginas || [];
  }
};

// =============================================================================
// FUNCIONES LEGACY (PARA COMPATIBILIDAD)
// =============================================================================

export async function getLibros(): Promise<Libro[]> {
  return await librosService.getLibros();
}

export async function createLibro(payload: { nombre: string; descripcion?: string; plantilla?: string }): Promise<Libro> {
  return await librosService.createLibro(payload.nombre, payload.descripcion, payload.plantilla);
}

export async function updateLibro(id: string, payload: { nombre: string; descripcion?: string; plantilla?: string }): Promise<Libro> {
  return await librosService.updateLibro(id, payload.nombre, payload.descripcion, payload.plantilla);
}

export async function deleteLibro(id: string): Promise<boolean> {
  return await librosService.deleteLibro(id);
}

export async function getLibroById(id: string): Promise<LibroConPaginas> {
  return await librosService.getLibroById(id);
}

export async function createPagina(libroId: string, numeroPagina: number, titulo?: string, contenidoJson?: any, temaId?: string): Promise<PaginaLibro> {
  return await librosService.createPagina(libroId, numeroPagina, titulo, contenidoJson, temaId);
}

export async function getPaginas(libroId: string): Promise<PaginaLibro[]> {
  return await librosService.getPaginas(libroId);
}