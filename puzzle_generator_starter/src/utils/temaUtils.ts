import type { Tema } from '../types';

/**
 * Utilidades para manejo de temas
 * Funciones puras para validación, transformación y cálculo de estadísticas
 */

/**
 * Valida un tema antes de guardarlo
 */
export function validateTema(tema: Partial<Tema>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!tema.nombre?.trim()) {
    errors.push('El nombre del tema es obligatorio')
  }

  if (tema.nombre && tema.nombre.length > 100) {
    errors.push('El nombre no puede exceder 100 caracteres')
  }

  if (tema.descripcion && tema.descripcion.length > 500) {
    errors.push('La descripción no puede exceder 500 caracteres')
  }

  if (tema.palabras) {
    if (tema.palabras.length === 0) {
      errors.push('El tema debe tener al menos una palabra')
    }

    if (tema.palabras.length > 100) {
      errors.push('El tema no puede tener más de 100 palabras')
    }

    // Validar palabras individuales
    const invalidWords = tema.palabras.filter(word => {
      const trimmed = word.trim()
      return !trimmed ||
             trimmed.length < 2 ||
             trimmed.length > 32 ||
             !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]+$/.test(trimmed)
    })

    if (invalidWords.length > 0) {
      errors.push(`Palabras inválidas: ${invalidWords.slice(0, 3).join(', ')}${invalidWords.length > 3 ? '...' : ''}`)
    }

    // Verificar duplicados
    const uniqueWords = new Set(tema.palabras.map(w => w.toLowerCase().trim()))
    if (uniqueWords.size !== tema.palabras.length) {
      errors.push('No se permiten palabras duplicadas')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Crea un nuevo tema con valores por defecto
 */
export function createTemaTemplate(baseData?: Partial<Tema>): Omit<Tema, 'id'> {
  const now = new Date().toISOString()

  return {
    nombre: baseData?.nombre || '',
    descripcion: baseData?.descripcion || '',
    palabras: baseData?.palabras || [],
    updated_at: now,
    ...baseData
  }
}

/**
 * Actualiza un tema existente
 */
export function updateTema(tema: Tema, updates: Partial<Tema>): Tema {
  return {
    ...tema,
    ...updates,
    updated_at: new Date().toISOString()
  }
}

/**
 * Genera un ID único para un tema
 */
export function generateTemaId(): string {
  return `tema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Normaliza palabras para eliminación de duplicados y validación
 */
export function normalizeWords(words: string[]): string[] {
  return words
    .map(word => word.trim())
    .filter(word => word.length >= 2 && word.length <= 32)
    .filter((word, index, arr) =>
      arr.findIndex(w => w.toLowerCase() === word.toLowerCase()) === index
    )
}

/**
 * Calcula estadísticas de un tema
 */
export function getTemaStats(tema: Tema) {
  const words = tema.palabras || []
  const totalWords = words.length
  const avgLength = totalWords > 0
    ? Math.round(words.reduce((sum, word) => sum + word.length, 0) / totalWords)
    : 0
  const uniqueChars = new Set(words.join('').toLowerCase()).size

  return {
    totalWords,
    avgLength,
    uniqueChars,
    hasDescription: !!tema.descripcion?.trim(),
    lastUpdated: new Date(tema.updated_at || Date.now())
  }
}

/**
 * Categoriza un tema basado en su nombre
 */
export function categorizeTema(nombre: string): 'educativo' | 'entretenimiento' | 'profesional' | 'general' | 'personalizado' {
  const lowerNombre = nombre.toLowerCase()

  if (lowerNombre.includes('edu') || lowerNombre.includes('escuela') || lowerNombre.includes('clase')) {
    return 'educativo'
  } else if (lowerNombre.includes('juego') || lowerNombre.includes('diver') || lowerNombre.includes('entrete')) {
    return 'entretenimiento'
  } else if (lowerNombre.includes('trabajo') || lowerNombre.includes('empresa') || lowerNombre.includes('profesional')) {
    return 'profesional'
  } else if (lowerNombre.includes('personal') || lowerNombre.includes('custom')) {
    return 'personalizado'
  }

  return 'general'
}