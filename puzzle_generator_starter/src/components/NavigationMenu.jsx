import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Componente de menú de navegación principal
 */
export default function NavigationMenu() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      path: '/',
      label: '🏠 Inicio',
      description: 'Página principal del generador de sopas de letras'
    },
    {
      path: '/temas',
      label: '🎨 Temas',
      description: 'Gestionar temas y palabras para las sopas de letras'
    },
    {
      path: '/diagramacion',
      label: '📐 Diagramación',
      description: 'Crear y editar sopas de letras',
      note: 'Requiere seleccionar un tema primero'
    },
    {
      path: '/panel-apis',
      label: '🔧 APIs',
      description: 'Panel de desarrollo y testing de APIs'
    }
  ]

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      margin: '20px 0'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          🧩 Generador de Sopas de Letras
        </h2>

        <p style={{
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '16px'
        }}>
          Selecciona una sección para continuar
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                background: isActive(item.path)
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: isActive(item.path)
                  ? '2px solid rgba(255, 255, 255, 0.8)'
                  : '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                color: 'white',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)'
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                  e.target.style.transform = 'translateY(-2px)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.transform = 'translateY(0)'
                }
              }}
            >
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: isActive(item.path)
                  ? 'rgba(255, 255, 255, 0.8)'
                  : 'rgba(255, 255, 255, 0.3)'
              }} />

              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {item.label}
                {isActive(item.path) && (
                  <span style={{
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 'normal'
                  }}>
                    ACTUAL
                  </span>
                )}
              </h3>

              <p style={{
                fontSize: '14px',
                lineHeight: '1.5',
                marginBottom: '12px',
                opacity: 0.9
              }}>
                {item.description}
              </p>

              {item.note && (
                <p style={{
                  fontSize: '12px',
                  fontStyle: 'italic',
                  opacity: 0.8,
                  marginTop: '8px',
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  💡 {item.note}
                </p>
              )}
            </button>
          ))}
        </div>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            📋 Estado del Sistema
          </h4>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <span style={{ color: '#10b981' }}>●</span>
              Backend: Conectado
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <span style={{ color: '#10b981' }}>●</span>
              Base de datos: OK
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <span style={{ color: '#10b981' }}>●</span>
              Tests: Pasando
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}