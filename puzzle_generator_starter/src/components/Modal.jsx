import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Contenido del Modal */}
          <motion.div
            className={`relative w-full bg-card rounded-lg shadow-xl flex flex-col max-h-[90vh] ${className || 'max-w-2xl'}`}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Encabezado */}
            <div className="flex items-center justify-between p-4 border-b border-border-primary flex-shrink-0">
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full text-text-secondary hover:bg-surface transition-colors"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo con scroll */}
            <div className="flex-grow p-6 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
