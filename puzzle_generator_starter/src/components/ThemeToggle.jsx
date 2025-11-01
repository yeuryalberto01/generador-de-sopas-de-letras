import { Moon, Sun } from 'lucide-react'
import { useApp } from '../hooks/useApp'

export default function ThemeToggle() {
  const { userPreferences, toggleTheme } = useApp()
  const isDarkMode = userPreferences.theme === 'dark'
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      title={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
      aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  )
}