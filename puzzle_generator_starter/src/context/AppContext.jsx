import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp debe ser usado dentro de AppProvider')
  }
  return context
}

export function AppProvider({ children }) {
  const [currentTema, setCurrentTema] = useState(null)
  const [userPreferences, setUserPreferences] = useState({
    theme: 'light',
    language: 'es',
    notifications: true
  })

  // Función para cambiar entre temas claro/oscuro
  const toggleTheme = useCallback(() => {
    setUserPreferences(prev => {
      const newTheme = prev.theme === 'light' ? 'dark' : 'light'
      const updated = { ...prev, theme: newTheme }

      // Aplicar clase al body para CSS
      document.body.classList.remove('light-theme', 'dark-theme')
      document.body.classList.add(`${newTheme}-theme`)

      // Persistir
      try {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      } catch (error) {
        console.error('Error guardando preferencias:', error)
      }

      return updated
    })
  }, [])

  // Gestión de tema actual
  const selectTema = useCallback((tema) => {
    setCurrentTema(tema)
    // Persistir en localStorage
    try {
      localStorage.setItem('currentTema', JSON.stringify(tema))
    } catch (error) {
      console.error('Error guardando tema actual:', error)
    }
  }, [])

  // Gestión de preferencias
  const updatePreferences = useCallback((newPreferences) => {
    setUserPreferences(prev => {
      const updated = { ...prev, ...newPreferences }

      // Aplicar tema si cambió
      if (newPreferences.theme && newPreferences.theme !== prev.theme) {
        document.body.classList.remove('light-theme', 'dark-theme')
        document.body.classList.add(`${newPreferences.theme}-theme`)
      }

      try {
        localStorage.setItem('userPreferences', JSON.stringify(updated))
      } catch (error) {
        console.error('Error guardando preferencias:', error)
      }
      return updated
    })
  }, [])

  // Cargar estado inicial desde localStorage y aplicar tema
  useEffect(() => {
    try {
      const savedTema = localStorage.getItem('currentTema')
      const savedPrefs = localStorage.getItem('userPreferences')
      
      if (savedTema) {
        setCurrentTema(JSON.parse(savedTema))
      }
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs)
        setUserPreferences(prefs)

        // Aplicar tema guardado
        document.body.classList.remove('light-theme', 'dark-theme')
        document.body.classList.add(`${prefs.theme}-theme`)
      } else {
        // Tema por defecto
        document.body.classList.add('light-theme')
      }
    } catch (error) {
      console.error('Error cargando estado inicial:', error)
      // Tema por defecto en caso de error
      document.body.classList.add('light-theme')
    }
  }, [])

  const value = {
    // Estado
    currentTema,
    userPreferences,
    
    // Acciones
    selectTema,
    updatePreferences,
    toggleTheme
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}