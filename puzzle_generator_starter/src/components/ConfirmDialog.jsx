import { useEffect } from 'react'

/**
 * Componente de diálogo modal para confirmaciones
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el diálogo está abierto
 * @param {string} props.title - Título del diálogo
 * @param {string} props.message - Mensaje del diálogo
 * @param {string} props.confirmText - Texto del botón de confirmar (default: 'Confirmar')
 * @param {string} props.cancelText - Texto del botón de cancelar (default: 'Cancelar')
 * @param {string} props.confirmButtonClass - Clase CSS para el botón de confirmar
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
  confirmButtonClass = 'bg-red-500 hover:bg-red-600 text-white',
  onConfirm,
  onCancel,
  isLoading = false
}) {
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
        <h3
          id="confirm-dialog-title"
          style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.5rem'
          }}
        >
          {title}
        </h3>

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
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.375rem',
              backgroundColor: isLoading ? '#9ca3af' : '#ef4444',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.2s',
              minWidth: '80px'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.target.style.backgroundColor = '#dc2626'
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.target.style.backgroundColor = isLoading ? '#9ca3af' : '#ef4444'
            }}
          >
            {isLoading ? 'Eliminando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}