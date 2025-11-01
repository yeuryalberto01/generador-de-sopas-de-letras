// Utilidad para manejo consistente de errores en la aplicación

export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

export const ERROR_MESSAGES = {
  [ERROR_TYPES.NETWORK]: 'Error de conexión. Verifica tu conexión a internet.',
  [ERROR_TYPES.VALIDATION]: 'Los datos proporcionados no son válidos.',
  [ERROR_TYPES.SERVER]: 'Error del servidor. Inténtalo de nuevo más tarde.',
  [ERROR_TYPES.UNKNOWN]: 'Ha ocurrido un error inesperado.'
}

/**
 * Determina el tipo de error basado en la respuesta o excepción
 * @param {Error|Object} error - El error a clasificar
 * @returns {string} - Tipo de error
 */
export function classifyError(error) {
  if (!error) return ERROR_TYPES.UNKNOWN

  // Errores de red
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return ERROR_TYPES.NETWORK
  }

  // Errores de validación (códigos 400-499)
  if (error.status >= 400 && error.status < 500) {
    return ERROR_TYPES.VALIDATION
  }

  // Errores del servidor (códigos 500-599)
  if (error.status >= 500) {
    return ERROR_TYPES.SERVER
  }

  return ERROR_TYPES.UNKNOWN
}

/**
 * Obtiene el mensaje de error apropiado
 * @param {Error|Object|string} error - El error original
 * @param {string} fallbackMessage - Mensaje alternativo si no se puede determinar
 * @returns {string} - Mensaje de error para mostrar al usuario
 */
export function getErrorMessage(error, fallbackMessage = null) {
  if (!error) return fallbackMessage || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]

  // Si es un string, devolverlo directamente
  if (typeof error === 'string') return error

  // Si tiene un mensaje específico, usarlo
  if (error.message) return error.message

  // Si tiene un campo error, usarlo
  if (error.error) return error.error

  // Clasificar y usar mensaje genérico
  const errorType = classifyError(error)
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN]
}

/**
 * Maneja errores de manera consistente
 * @param {Error|Object} error - El error a manejar
 * @param {Object} options - Opciones de manejo
 * @param {Function} options.onError - Callback para manejar el error
 * @param {Function} options.onRetry - Callback para reintentar
 * @param {boolean} options.showToast - Si mostrar toast (default: true)
 * @param {string} options.context - Contexto del error para logging
 */
export function handleError(error, options = {}) {
  const {
    onError,
    showToast = true,
    context = 'Unknown'
  } = options

  const errorMessage = getErrorMessage(error)
  const errorType = classifyError(error)

  // Logging para debugging
  console.error(`[${context}] Error (${errorType}):`, error)

  // Callback personalizado
  if (onError) {
    onError(errorMessage, errorType)
  }

  // Mostrar toast si está habilitado
  if (showToast && window.showToast) {
    window.showToast(errorMessage, 'error')
  }

  return {
    message: errorMessage,
    type: errorType,
    originalError: error
  }
}

/**
 * Wrapper para operaciones asíncronas con manejo automático de errores
 * @param {Function} operation - Función asíncrona a ejecutar
 * @param {Object} options - Opciones de manejo
 * @returns {Promise} - Resultado de la operación o error manejado
 */
export async function withErrorHandling(operation, options = {}) {
  const { context = 'Async Operation' } = options

  try {
    return await operation()
  } catch (error) {
    return handleError(error, { ...options, context })
  }
}

/**
 * Valida datos de entrada comunes
 * @param {Object} data - Datos a validar
 * @param {Object} rules - Reglas de validación
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateInput(data, rules) {
  const errors = []

  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field]

    if (rule.required && (!value || value.toString().trim().length === 0)) {
      errors.push(`${field} es requerido`)
      return
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      errors.push(`${field} debe tener al menos ${rule.minLength} caracteres`)
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors.push(`${field} no puede tener más de ${rule.maxLength} caracteres`)
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors.push(rule.patternMessage || `${field} tiene un formato inválido`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}