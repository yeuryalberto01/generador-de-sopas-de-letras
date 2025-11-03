
import Toast from './Toast';

/**
 * Contenedor para renderizar múltiples notificaciones Toast
 * @param {Object} props
 * @param {Array} props.toasts - Array de objetos toast
 * @param {Function} props.onRemoveToast - Función para remover un toast
 */
export default function ToastContainer({ toasts, onRemoveToast }) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 1000,
        pointerEvents: 'none'
      }}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: 'auto',
            marginBottom: '8px',
            transform: `translateY(${index * 8}px)`,
            transition: 'transform 0.3s ease-in-out'
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemoveToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}