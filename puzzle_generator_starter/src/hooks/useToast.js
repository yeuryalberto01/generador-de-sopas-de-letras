import { useState, useCallback } from 'react'

/**
 * Hook personalizado para manejar múltiples toasts
 * @returns {Object} - { toasts, showToast, removeToast, toast }
 */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((messageOrOptions, type = 'success', duration = 4000) => {
    let message, toastType, toastDuration

    // Si el primer parámetro es un objeto, extraer propiedades
    if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
      ({ message, type: toastType = type, duration: toastDuration = duration } = messageOrOptions)
    } else {
      // Parámetros separados
      message = messageOrOptions
      toastType = type
      toastDuration = duration
    }

    const id = Date.now() + Math.random()
    const toast = { id, message, type: toastType, duration: toastDuration }

    setToasts(prev => [...prev, toast])

    return id
  }, [])
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  // Métodos de conveniencia para diferentes tipos de toast
  const toast = {
    success: (message, duration) => showToast(message, 'success', duration),
    error: (message, duration) => showToast(message, 'error', duration),
    warning: (message, duration) => showToast(message, 'warning', duration),
    info: (message, duration) => showToast(message, 'info', duration),
    default: (message, duration) => showToast(message, 'success', duration)
  }

  return {
    toasts,
    showToast,
    removeToast,
    toast
  }
}