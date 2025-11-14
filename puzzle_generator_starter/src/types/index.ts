export interface Palabra {
  texto: string;
  // Futuras propiedades como posición, etc.
}

export interface Tema {
  id: string;
  nombre: string;
  descripcion?: string;
  palabras: Palabra[]; // Ahora es array de objetos {texto: string}
  categoria?: string;
  etiquetas?: string[];
  dificultad?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Libro {
  id: string;
  nombre: string;
  descripcion?: string;
  plantilla?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginaLibro {
  id: string;
  libro_id: string;
  numero_pagina: number;
  titulo?: string;
  tema_id?: string;
  contenido_json?: any;
  created_at?: string;
  updated_at?: string;
}

export interface LibroConPaginas extends Libro {
  paginas?: PaginaLibro[];
  total_paginas?: number;
}

export type CategoriaKey = 'educativo' | 'entretenimiento' | 'profesional' | 'general' | 'personalizado';

export interface Categoria {
  nombre: string;
  color: string;
  icon: string;
}