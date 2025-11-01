import ThemeToggle from './ThemeToggle'

/**
 * Componente de navegación rápida para usar en otras páginas
 */
export default function QuickNav() {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      display: 'flex',
      gap: '8px',
      flexDirection: 'column'
    }}>
      <ThemeToggle />
    </div>
  )
}