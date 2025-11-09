import { Moon, Sun } from 'lucide-react';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import type { FC } from 'react';

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
      className={`p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent ${
        isDarkMode ? 'hover:bg-white/10' : 'hover:bg-primary/10'
      }`}
      title={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
      aria-label={`Cambiar a modo ${isDarkMode ? 'claro' : 'oscuro'}`}
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5 text-warning" />
      ) : (
        <Moon className="h-5 w-5 text-secondary" />
      )}
    </button>
  );
};

export default ThemeToggle;
