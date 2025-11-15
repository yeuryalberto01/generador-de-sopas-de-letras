import React, { useEffect } from 'react'

/**
 * Componente Skip Navigation para accesibilidad
 * Permite a usuarios de teclado saltar al contenido principal
 */
export default function SkipNavigation() {

  // Asegurar que el contenido principal tenga un ID
  useEffect(() => {
    const mainElement = document.querySelector('main')
    if (mainElement && !mainElement.id) {
      mainElement.id = 'main-content'
    }
  }, [])

  return (
    <>
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 dark:bg-blue-700 text-white dark:text-gray-100 px-4 py-2 rounded-lg shadow-lg font-medium transition-all duration-200 hover:bg-blue-700 dark:hover:bg-blue-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        onClick={(e) => {
          e.preventDefault()
          const mainElement = document.getElementById('main-content')
          if (mainElement) {
            mainElement.tabIndex = -1
            mainElement.focus()
            setTimeout(() => mainElement.removeAttribute('tabindex'), 1000)
          }
        }}
      >
        Saltar al contenido principal
      </a>
    </>
  )
}
