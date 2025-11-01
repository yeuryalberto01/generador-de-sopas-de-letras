import { useEffect, useState, useCallback } from 'react'

/**
 * Componente de notificación toast
 * @param {Object} props
 * @param {string} props.message - Mensaje a mostrar
 * @param {string} props.type - Tipo de toast: 'success', 'error', 'warning', 'info'
 * @param {number} props.duration - Duración en ms (default: 4000)
 * @param {Function} props.onClose - Callback al cerrar
 * @param {boolean} props.autoClose - Si cerrar automáticamente (default: true)
 */
export default function Toast({
  message,
  type = 'success',
  duration = 4000,
  onClose,
  autoClose = true
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  // Configuración por tipo
  const config = {
    success: {
      bgColor: '#10b981',
      icon: '✓'
    },
    error: {
      bgColor: '#ef4444',
      icon: '✕'
    },
    warning: {
      bgColor: '#f59e0b',
      icon: '⚠'
    },
    info: {
      bgColor: '#3b82f6',
      icon: 'ℹ'
    }
  }

  const { bgColor, icon } = config[type] || config.success

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300) // Tiempo de la animación de salida
  }, [onClose])

  // Auto-cerrar después de la duración
  useEffect(() => {
    if (!autoClose) return

    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, autoClose, handleClose])

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        minWidth: '300px',
        maxWidth: '500px'
      }}
    >
      <div
        style={{
          backgroundColor: bgColor,
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
          opacity: isExiting ? 0 : 1,
          transition: 'all 0.3s ease-out',
          cursor: 'pointer'
        }}
        onClick={handleClose}
        role="alert"
        aria-live="assertive"
      >
        {/* Icono */}
        <span
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            flexShrink: 0
          }}
        >
          {icon}
        </span>

        {/* Mensaje */}
        <span
          style={{
            flex: 1,
            fontSize: '14px',
            lineHeight: '1.4'
          }}
        >
          {message}
        </span>

        {/* Botón cerrar */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleClose()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            marginLeft: '8px',
            opacity: 0.8,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.8}
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      </div>
    </div>
  )
}

