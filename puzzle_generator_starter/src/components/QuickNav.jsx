import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Componente de navegación rápida para usar en otras páginas
 */
export default function QuickNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/', label: '🏠 Inicio', title: 'Volver al inicio' },
    { path: '/temas', label: '🎨 Temas', title: 'Gestionar temas' },
    { path: '/panel-apis', label: '🔧 APIs', title: 'Panel de desarrollo' }
  ]

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      gap: '8px',
      flexDirection: 'column'
    }}>
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          disabled={location.pathname === item.path}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: location.pathname === item.path
              ? '#3b82f6'
              : 'rgba(255, 255, 255, 0.9)',
            color: location.pathname === item.path ? 'white' : '#374151',
            cursor: location.pathname === item.path ? 'default' : 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'all 0.2s ease',
            backdropFilter: 'blur(10px)'
          }}
          title={item.title}
          aria-label={item.title}
          onMouseEnter={(e) => {
            if (location.pathname !== item.path) {
              e.target.style.transform = 'scale(1.05)'
              e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)'
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== item.path) {
              e.target.style.transform = 'scale(1)'
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            }
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}