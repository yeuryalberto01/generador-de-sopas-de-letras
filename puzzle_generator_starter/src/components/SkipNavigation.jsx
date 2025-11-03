import { useEffect } from 'react'

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
        className="skip-nav"
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