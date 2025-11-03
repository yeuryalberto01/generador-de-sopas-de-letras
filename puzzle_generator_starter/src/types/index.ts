export interface Palabra {
  texto: string;
  // Futuras propiedades como posición, etc.
}

export interface Tema {
  id: string;
  nombre: string;
  descripcion?: string;
  palabras: string[];
  updated_at?: string;
  // Añadir cualquier otra propiedad que venga de la API
}

export type CategoriaKey = 'educativo' | 'entretenimiento' | 'profesional' | 'general' | 'personalizado';

export interface Categoria {
  nombre: string;
  color: string;
  icon: string;
}