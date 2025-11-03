import { AnimatePresence, motion } from 'framer-motion';
import { FileText, Home, Layout, Palette, Search, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { useApp } from '../hooks/useApp';

// Definición de todos los comandos
const staticCommands = [
  {
    id: 'home',
    title: 'Ir a Inicio',
    section: 'Navegación',
    icon: <Home size={18} />,
    path: '/',
  },
  {
    id: 'temas',
    title: 'Gestionar Temas',
    section: 'Navegación',
    icon: <FileText size={18} />,
    path: '/temas',
  },
  {
    id: 'diagramacion',
    title: 'Crear Sopa de Letras',
    section: 'Navegación',
    icon: <Layout size={18} />,
    path: '/diagramacion',
  },
  {
    id: 'apis',
    title: 'Panel de APIs',
    section: 'Navegación',
    icon: <Palette size={18} />,
    path: '/panel-apis',
  },
  {
    id: 'toggle-theme',
    title: 'Cambiar Tema',
    section: 'Acciones',
    icon: <Sun size={18} />,
    action: (app) => app.toggleTheme(),
  },
  {
    id: 'font-large',
    title: 'Aumentar Tamaño de Texto',
    section: 'Accesibilidad',
    icon: <ZoomIn size={18} />,
    action: (app, acc) => acc.setFontSizePreference('large'),
  },
  {
    id: 'font-normal',
    title: 'Tamaño de Texto Normal',
    section: 'Accesibilidad',
    icon: <ZoomOut size={18} />,
    action: (app, acc) => acc.setFontSizePreference('normal'),
  },
];

const CommandPalette = memo(function CommandPalette() {
  const app = useApp();
  const accessibility = useAccessibility();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const handleClose = useCallback(() => {
    app.setCommandPaletteOpen(false);
  }, [app]);

  const filteredCommands = query === ''
    ? staticCommands
    : staticCommands.filter(cmd => 
        cmd.title.toLowerCase().includes(query.toLowerCase()) ||
        cmd.section.toLowerCase().includes(query.toLowerCase())
      );

  const executeCommand = useCallback((command) => {
    if (command.path) {
      navigate(command.path);
    } else if (command.action) {
      command.action(app, accessibility);
    }
    handleClose();
  }, [navigate, app, accessibility, handleClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowDown') {
        setActiveIndex(i => (i + 1) % filteredCommands.length);
      }
      if (e.key === 'ArrowUp') {
        setActiveIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
      }
      if (e.key === 'Enter' && filteredCommands[activeIndex]) {
        executeCommand(filteredCommands[activeIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, activeIndex, handleClose, executeCommand]);

  return (
    <AnimatePresence>
      {app.isCommandPaletteOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="w-full max-w-xl bg-primary rounded-lg shadow-2xl overflow-hidden smooth-transition"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center p-4 border-b border-primary">
              <Search className="text-secondary" size={20} />
              <input
                type="text"
                placeholder="Buscar comandos o navegar..."
                className="w-full ml-4 bg-transparent focus:outline-none text-primary"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <ul className="p-2 max-h-96 overflow-y-auto">
              {filteredCommands.length > 0 ? (
                filteredCommands.map((cmd, index) => (
                  <li
                    key={cmd.id}
                    onClick={() => executeCommand(cmd)}
                    onMouseMove={() => setActiveIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer smooth-transition ${activeIndex === index ? 'bg-accent text-white' : 'text-secondary hover:bg-secondary'}`}>
                    <div className="flex items-center">
                      <div className={`mr-3 ${activeIndex === index ? 'text-white' : 'text-tertiary'}`}>{cmd.icon}</div>
                      {cmd.title}
                    </div>
                    <span className={`text-xs ${activeIndex === index ? 'text-blue-200' : 'text-slate-400'}`}>{cmd.section}</span>
                  </li>
                ))
              ) : (
                <li className="p-4 text-center text-slate-500">No se encontraron resultados.</li>
              )}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default CommandPalette;