import { useApp } from '../context/AppContext'

export default function ThemeToggle() {
  const { userPreferences, toggleTheme } = useApp()
  
  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        color: 'var(--text-primary)',
        transition: 'all 0.3s ease'
      }}
      title={`Cambiar a modo ${userPreferences.theme === 'light' ? 'oscuro' : 'claro'}`}
      aria-label={`Cambiar a modo ${userPreferences.theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      {userPreferences.theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}