import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import React, { useEffect } from 'react'

/**
 * Componente de diálogo modal para confirmaciones
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el diálogo está abierto
 * @param {string} props.title - Título del diálogo
 * @param {string} props.message - Mensaje del diálogo
 * @param {string} props.confirmText - Texto del botón de confirmar (default: 'Confirmar')
 * @param {string} props.cancelText - Texto del botón de cancelar (default: 'Cancelar')
 * @param {string} props.type - Tipo de confirmación: 'danger', 'warning', 'info' (default: 'danger')
 * @param {Function} props.onConfirm - Callback al confirmar
 * @param {Function} props.onCancel - Callback al cancelar
 * @param {boolean} props.isLoading - Si está cargando la operación
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  onConfirm,
  onCancel,
  isLoading = false
}) {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={24} className="text-yellow-500" />
      case 'info':
        return <Info size={24} className="text-blue-500" />
      default: // danger
        return <AlertCircle size={24} className="text-red-500" />
    }
  }

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white'
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      default: // danger
        return 'bg-red-600 hover:bg-red-700 text-white'
    }
  }

  // Manejar teclas de escape y enter
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter' && !isLoading) {
        onConfirm()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel, onConfirm, isLoading])

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onCancel} // Cerrar al hacer click en el overlay
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxWidth: '28rem',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          transform: 'scale(1)',
          transition: 'transform 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()} // Prevenir cerrar al hacer click dentro
      >
        {/* Título */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem'
          }}
        >
          {getIcon()}
          <h3
            id="confirm-dialog-title"
            style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}
          >
            {title}
          </h3>
        </div>

        {/* Mensaje */}
        <p
          id="confirm-dialog-message"
          style={{
            color: '#6b7280',
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}
        >
          {message}
        </p>

        {/* Botones */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.target.style.backgroundColor = 'white'
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors min-w-[80px] ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : getConfirmButtonClass()
            }`}
          >
            {isLoading ? 'Eliminando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
