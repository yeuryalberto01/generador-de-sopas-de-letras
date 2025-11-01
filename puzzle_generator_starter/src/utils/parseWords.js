/**
 * Utilidad para parsear lotes de palabras con separadores múltiples (Sopa de Letras Español)
 */

// RegEx para validación de entrada (permite frases con separadores internos, números y guiones)
const INPUT_RE = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9]+(?:[ \-’'\-][A-Za-zÁÉÍÓÚÜáéíóúüÑñ0-9]+)*$/

// Separadores para tokenización (divide entradas, permite espacios en frases)
const SEPARATORS = /[,;\n\t]+/

// Configuración por defecto
const DEFAULT_CONFIG = {
  language: 'es-ES',
  allowPhrases: true,
  allowHyphen: true,
  allowApostrophe: true,
  allowDigits: false,
  minLengthNormalized: 2,
  maxLengthNormalizedPolicy: 'gridLongerSide', // o 'fixed'
  maxLengthNormalized: 15, // usado si policy es 'fixed'
  accentPolicy: {
    keepInDisplay: true,
    stripForGrid: true,
    preserveEnye: true
  },
  duplicatePolicy: {
    caseInsensitive: true,
    accentInsensitive: true,
    treatEnyeAsDistinct: true
  },
  stopwordsWarn: ['de', 'la', 'y', 'o', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas'],
  dictionaryMode: 'warn-only' // 'off', 'warn-only', 'strict'
}

/**
 * Normaliza una palabra para colocarla en la cuadrícula (quita tildes, espacios, etc.)
 * @param {string} s - Palabra en formato display
 * @returns {string} Palabra normalizada para cuadrícula
 */
export function normalizeForGrid(s) {
  if (!s) return ''

  // 1) Marcar ñ/Ñ para preservarlas
  const M_N = '\u0001', M_EN = '\u0002'
  let t = s.replace(/ñ/g, M_N).replace(/Ñ/g, M_EN)

  // 2) Quitar diacríticos (manteniendo marcadores)
  t = t.normalize('NFD').replace(/\p{Mn}+/gu, '')

  // 3) Restaurar Ñ
  t = t.replace(new RegExp(M_N, 'g'), 'ñ').replace(new RegExp(M_EN, 'g'), 'Ñ')

  // 4) Eliminar separadores
  t = t.replace(/[ \-’']/g, '')

  // 5) Mayúsculas locale
  return t.toUpperCase('es-ES')
}

/**
 * Valida si un token de entrada es válido (formato display)
 * @param {string} s - Token a validar
 * @returns {boolean} True si es válido
 */
export function isValidDisplayToken(s) {
  if (!s) return false
  const trimmed = s.trim().replace(/\s+/g, ' ')
  return INPUT_RE.test(trimmed)
}

/**
 * Valida un token contra las restricciones de la cuadrícula
 * @param {string} s - Token a validar
 * @param {number} gridRows - Filas de la cuadrícula
 * @param {number} gridCols - Columnas de la cuadrícula
 * @returns {Object} Resultado de validación
 */
export function validateTokenAgainstGrid(s, gridRows, gridCols) {
  const normalized = normalizeForGrid(s)
  const L = normalized.length
  const maxSide = Math.max(gridRows, gridCols)
  const errors = []

  if (L < 2) errors.push('La palabra es demasiado corta (mín. 2 letras).')
  if (L > maxSide) errors.push(`La palabra excede el tamaño de la cuadrícula (máx. ${maxSide}).`)

  return { ok: errors.length === 0, normalized, errors }
}

/**
 * Parsea un lote de texto en un array de palabras únicas
 * @param {string} batchInput - Texto con palabras separadas
 * @param {Object} options - Opciones de parsing
 * @param {number} options.gridRows - Filas de la cuadrícula (para límite de longitud)
 * @param {number} options.gridCols - Columnas de la cuadrícula (para límite de longitud)
 * @param {number} options.maxWords - Máximo de palabras permitidas
 * @returns {Object} Resultado del parsing
 */
export function parseWords(batchInput, options = {}) {
  const {
    gridRows = 15,
    gridCols = 15,
    maxWords = 500
  } = options

  if (!batchInput || typeof batchInput !== 'string') {
    return {
      words: [],
      duplicates: [],
      ignored: [],
      valid: true,
      message: 'Entrada vacía'
    }
  }

  // Tokenizar usando separadores
  const rawTokens = batchInput.split(SEPARATORS)

  // Limpiar y procesar tokens
  const processedWords = []
  const seenNormalized = new Set()
  const duplicates = []
  const ignored = []
  const invalidWords = []
  const warnings = []

  for (const token of rawTokens) {
    const trimmed = token.trim()

    // Ignorar vacíos
    if (!trimmed) {
      ignored.push(trimmed)
      continue
    }

    // Validar formato de entrada
    if (!isValidDisplayToken(trimmed)) {
      invalidWords.push(trimmed)
      continue
    }

    // Normalizar para comparación de duplicados
    const normalized = normalizeForGrid(trimmed)

    // Verificar duplicados
    if (seenNormalized.has(normalized)) {
      duplicates.push(trimmed)
      continue
    }

    // Validar contra cuadrícula
    const gridValidation = validateTokenAgainstGrid(trimmed, gridRows, gridCols)
    if (!gridValidation.ok) {
      invalidWords.push(trimmed)
      continue
    }

    // Verificar stop-words (advertir, no bloquear)
    const lowerTrimmed = trimmed.toLowerCase()
    if (DEFAULT_CONFIG.stopwordsWarn.includes(lowerTrimmed)) {
      warnings.push(trimmed)
    }

    // Agregar palabra válida
    processedWords.push(trimmed)
    seenNormalized.add(normalized)
  }

  // Verificar límite de palabras
  const valid = processedWords.length <= maxWords && invalidWords.length === 0

  return {
    words: processedWords,
    duplicates,
    ignored: [...ignored, ...invalidWords],
    warnings,
    valid,
    message: getParsingMessage(processedWords.length, duplicates.length, ignored.length, invalidWords.length, warnings.length),
    stats: {
      totalDetected: rawTokens.length,
      validWords: processedWords.length,
      duplicatesCount: duplicates.length,
      ignoredCount: ignored.length,
      invalidCount: invalidWords.length,
      warningsCount: warnings.length
    }
  }
}

/**
 * Genera mensaje descriptivo del parsing
 */
function getParsingMessage(validCount, duplicatesCount, ignoredCount, invalidCount, warningsCount) {
  const parts = []

  if (validCount > 0) {
    parts.push(`${validCount} palabra${validCount !== 1 ? 's' : ''} detectada${validCount !== 1 ? 's' : ''}`)
  }

  if (duplicatesCount > 0) {
    parts.push(`${duplicatesCount} duplicada${duplicatesCount !== 1 ? 's' : ''} ignorada${duplicatesCount !== 1 ? 's' : ''}`)
  }

  if (ignoredCount > 0) {
    parts.push(`${ignoredCount} elemento${ignoredCount !== 1 ? 's' : ''} ignorado${ignoredCount !== 1 ? 's' : ''}`)
  }

  if (invalidCount > 0) {
    parts.push(`${invalidCount} inválida${invalidCount !== 1 ? 's' : ''}`)
  }

  if (warningsCount > 0) {
    parts.push(`${warningsCount} aviso${warningsCount !== 1 ? 's' : ''} de stop-word`)
  }

  return parts.length > 0 ? parts.join(', ') : 'Sin palabras detectadas'
}

/**
 * Valida una palabra individual
 */
export function validateWord(word, gridRows = 15, gridCols = 15) {
  if (!word || typeof word !== 'string') {
    return { valid: false, message: 'Palabra vacía' }
  }

  const trimmed = word.trim()

  // Validar formato de entrada
  if (!isValidDisplayToken(trimmed)) {
    return {
      valid: false,
      message: 'Usa solo letras del español; espacios/guiones/apóstrofes solo entre palabras.'
    }
  }

  // Validar contra cuadrícula
  const gridValidation = validateTokenAgainstGrid(trimmed, gridRows, gridCols)
  if (!gridValidation.ok) {
    return { valid: false, message: gridValidation.errors.join(' ') }
  }

  // Verificar stop-words (advertir, no bloquear)
  const lowerTrimmed = trimmed.toLowerCase()
  if (DEFAULT_CONFIG.stopwordsWarn.includes(lowerTrimmed)) {
    return {
      valid: true,
      message: 'Palabra válida (stop-word detectada, considera si es necesaria)',
      warning: true
    }
  }

  return { valid: true, message: 'Palabra válida' }
}

/**
 * Detecta duplicados en una lista de palabras usando normalización para cuadrícula
 */
export function findDuplicates(words) {
  const seen = new Set()
  const duplicates = []

  for (const word of words) {
    const normalized = normalizeForGrid(word)
    if (seen.has(normalized)) {
      if (!duplicates.includes(normalized.toLowerCase())) {
        duplicates.push(normalized.toLowerCase())
      }
    } else {
      seen.add(normalized)
    }
  }

  return duplicates
}