import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccessibility } from '../context/AccessibilityContext'

export default function AccessibilityControls() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    reducedMotion,
    highContrast,
    fontSize,
    toggleReducedMotion,
    toggleHighContrast,
    setFontSizePreference
  } = useAccessibility()

  return (
    <div style={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1000 }}>
      {/* Botón principal */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: 56,
          height: 56,
          fontSize: 24,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Controles de accesibilidad"
        aria-expanded={isOpen}
      >
        ♿
      </motion.button>

      {/* Panel de controles */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: 60,
              left: 0,
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              padding: 16,
              minWidth: 200,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h3 style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              marginBottom: 12,
              color: '#111827'
            }}>
              Accesibilidad
            </h3>

            {/* Control de movimiento reducido */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                fontSize: 14,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={toggleReducedMotion}
                  style={{ width: 16, height: 16 }}
                />
                Movimiento reducido
              </label>
            </div>

            {/* Control de alto contraste */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                fontSize: 14,
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={toggleHighContrast}
                  style={{ width: 16, height: 16 }}
                />
                Alto contraste
              </label>
            </div>

            {/* Control de tamaño de fuente */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 500, 
                marginBottom: 6,
                color: '#6b7280'
              }}>
                Tamaño de texto
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['small', 'normal', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setFontSizePreference(size)}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      border: `1px solid ${fontSize === size ? '#3b82f6' : '#d1d5db'}`,
                      background: fontSize === size ? '#3b82f6' : 'white',
                      color: fontSize === size ? 'white' : '#374151',
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {size === 'small' ? 'A' : size === 'normal' ? 'A' : 'A'}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%',
                padding: '6px 12px',
                border: '1px solid #d1d5db',
                background: 'white',
                color: '#374151',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                marginTop: 8
              }}
            >
              Cerrar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
