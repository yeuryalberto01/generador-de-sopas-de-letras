import { Moon, Sun } from 'lucide-react';
import type { FC } from 'react';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const ThemeToggle: FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('ThemeToggle must be used within an AppProvider');
  }

  const { userPreferences, toggleTheme } = context;
  const isDarkMode = userPreferences.theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        isDarkMode 
          ? 'hover:bg-white/20 text-yellow-300' 
          : 'hover:bg-gray-200 text-gray-700'
      }`}
      title={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
      aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
