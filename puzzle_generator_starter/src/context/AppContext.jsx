import { useEffect, useState } from 'react'
import { AppContext } from '../hooks/useApp'
import useLocalStorage from '../hooks/useLocalStorage'

export function AppProvider({ children }) {
  const [userPreferences, setUserPreferences] = useLocalStorage('user-preferences', {
    theme: 'light'
  })
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [recentItems, setRecentItems] = useLocalStorage('recent-navigation-items', [])

  // Función para cambiar el tema
  const toggleTheme = () => {
    setUserPreferences(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }))
  }

  // Función para agregar un elemento a los recientes
  const addRecentItem = (item) => {
    setRecentItems(prev => {
      // Evitar duplicados
      const filtered = prev.filter(i => i.path !== item.path)
      // Agregar al inicio y mantener máximo 5 elementos
      return [item, ...filtered].slice(0, 5)
    })
  }

  // Aplicar clase de tema al body
  useEffect(() => {
    document.body.className = userPreferences.theme
  }, [userPreferences.theme])

  const value = {
    userPreferences,
    toggleTheme,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    recentItems,
    addRecentItem
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}


