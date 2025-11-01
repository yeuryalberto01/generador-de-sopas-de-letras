import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AccessibilityContext = createContext()

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility debe ser usado dentro de AccessibilityProvider')
  }
  return context
}

export function AccessibilityProvider({ children }) {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    fontSize: 'normal',
    focusVisible: true
  })

  // Aplicar preferencias al documento
  useEffect(() => {
    // Movimiento reducido
    if (preferences.reducedMotion) {
      document.documentElement.style.setProperty('--animation-duration', '0.001ms')
      document.documentElement.style.setProperty('--animation-timing', 'step-end')
    } else {
      document.documentElement.style.removeProperty('--animation-duration')
      document.documentElement.style.removeProperty('--animation-timing')
    }

    // Alto contraste
    if (preferences.highContrast) {
      document.documentElement.classList.add('high-contrast')
    } else {
      document.documentElement.classList.remove('high-contrast')
    }

    // Tamaño de fuente
    document.documentElement.style.fontSize = 
      preferences.fontSize === 'small' ? '14px' :
      preferences.fontSize === 'large' ? '18px' : '16px'

    // Indicador de foco visible
    if (preferences.focusVisible) {
      document.documentElement.classList.add('focus-visible')
    } else {
      document.documentElement.classList.remove('focus-visible')
    }
  }, [preferences])

  // Cargar preferencias desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('accessibilityPreferences')
      if (saved) {
        setPreferences(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error cargando preferencias de accesibilidad:', error)
    }
  }, [])

  // Guardar preferencias en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('accessibilityPreferences', JSON.stringify(preferences))
    } catch (error) {
      console.error('Error guardando preferencias de accesibilidad:', error)
    }
  }, [preferences])

  const toggleReducedMotion = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      reducedMotion: !prev.reducedMotion
    }))
  }, [])

  const toggleHighContrast = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      highContrast: !prev.highContrast
    }))
  }, [])

  const setFontSizePreference = useCallback((size) => {
    setPreferences(prev => ({
      ...prev,
      fontSize: size
    }))
  }, [])

  const toggleFocusVisible = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      focusVisible: !prev.focusVisible
    }))
  }, [])

  const value = {
    // Estado
    reducedMotion: preferences.reducedMotion,
    highContrast: preferences.highContrast,
    fontSize: preferences.fontSize,
    focusVisible: preferences.focusVisible,
    
    // Acciones
    toggleReducedMotion,
    toggleHighContrast,
    setFontSizePreference,
    toggleFocusVisible
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}
