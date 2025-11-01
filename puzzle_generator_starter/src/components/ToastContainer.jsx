import Toast from './Toast.jsx'

/**
 * Componente contenedor para múltiples toasts
 * @param {Object} props
 * @param {Array} props.toasts - Array de toasts
 * @param {Function} props.onRemoveToast - Función para remover toast
 */
export default function ToastContainer({ toasts, onRemoveToast }) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      style={{
            position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
          }}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
        >
      {toasts.map((toast, _index) => (
          <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
            onClose={() => onRemoveToast(toast.id)}
          />
      ))}
    </div>
  )
}