import { AlertCircle, CheckCircle, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Componente de notificación Toast
 * @param {Object} props
 * @param {string} props.message - Mensaje a mostrar
 * @param {string} props.type - Tipo de toast: 'success', 'error', 'warning', 'info'
 * @param {Function} props.onClose - Función para cerrar el toast
 * @param {number} props.duration - Duración en ms (default: 5000)
 */
export default function Toast({ message, type = 'info', onClose, duration = 5000 }) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [onClose, duration]);

  const getToastStyles = () => {
    const baseStyles = {
      position: 'fixed',
      top: 20,
      right: 20,
      padding: '12px 16px',
      borderRadius: 8,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      maxWidth: '400px',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'all 0.3s ease-in-out'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: '#10b981',
          color: 'white',
          border: '1px solid #059669'
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: '#ef4444',
          color: 'white',
          border: '1px solid #dc2626'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#f59e0b',
          color: 'white',
          border: '1px solid #d97706'
        };
      default: // info
        return {
          ...baseStyles,
          backgroundColor: '#3b82f6',
          color: 'white',
          border: '1px solid #2563eb'
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  return (
    <div style={getToastStyles()}>
      {getIcon()}
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: 0,
          opacity: 0.8,
          transition: 'opacity 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.8'}
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </div>
  );
}