import type { Palabra, Tema } from '../types';

/**
 * Convierte un array de strings a array de objetos Palabra
 */
export function stringsToPalabras(strings: string[]): Palabra[] {
  return strings.map(texto => ({ texto: texto.trim() }));
}

/**
 * Convierte un array de objetos Palabra a array de strings
 */
export function palabrasToStrings(palabras: Palabra[]): string[] {
  return palabras.map(p => p.texto);
}

/**
 * Normaliza un tema para asegurar formato consistente
 */
export function normalizeTema(tema: Tema): Tema {
  return {
    ...tema,
    palabras: Array.isArray(tema.palabras)
      ? tema.palabras.map(p =>
          typeof p === 'string'
            ? { texto: p }
            : p
        )
      : []
  };
}

/**
 * Convierte palabras para búsqueda (maneja ambos formatos)
 */
export function getPalabrasForSearch(palabras: Palabra[] | string[]): string[] {
  if (!palabras || !Array.isArray(palabras)) return [];

  return palabras.map(p =>
    typeof p === 'string' ? p : p.texto
  );
}

/**
 * Convierte palabras para display (maneja ambos formatos)
 */
export function getPalabrasForDisplay(palabras: Palabra[] | string[]): Palabra[] {
  if (!palabras || !Array.isArray(palabras)) return [];

  return palabras.map(p =>
    typeof p === 'string'
      ? { texto: p }
      : p
  );
}