import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import type { FC } from 'react';
import { lazy, Suspense, useContext, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import CommandPalette from './components/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';
import { ROUTES } from './constants/routes';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { AppContext, AppProvider } from './context/AppContext';
import Layout from './Layout';

// Lazy loading de componentes para mejor performance
const Splash = lazy(() => import('./modules/splash/Splash'));
const Temas = lazy(() => import('./modules/temas/Temas'));
const Diagramacion = lazy(() => import('./modules/diagramacion/Diagramacion'));
const PanelAPIs = lazy(() => import('./modules/panel-apis/PanelAPIs'));

// Componente de carga
const LoadingFallback: FC = () => (
  <div className="flex items-center justify-center h-screen text-lg text-gray-500">
    Cargando...
  </div>
);

const AnimatedRoutes: FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location} key={location.pathname}>
            <Route path={ROUTES.HOME} element={<Splash />} />
            <Route path={ROUTES.TEMAS} element={<Temas />} />
            <Route path={ROUTES.DIAGRAMACION} element={<Diagramacion />} />
            <Route path={ROUTES.DIAGRAMACION_TEMA} element={<Diagramacion />} />
            <Route path={ROUTES.PANEL_APIS} element={<PanelAPIs />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AnimatePresence>
  );
};

const AppContent: FC = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('AppContent must be used within an AppProvider');
  }

  const { isCommandPaletteOpen, setCommandPaletteOpen } = context;

  // Listener para el atajo de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandPaletteOpen]);

  return (
    <>
      <CommandPalette />
      <Layout>
        <AnimatedRoutes />
      </Layout>
      {/* Botón para abrir el menú de comandos */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="fixed bottom-6 left-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Abrir menú de comandos (Ctrl+K)"
      >
        <Search size={22} />
      </button>
    </>
  );
};

const AppRouter: FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AccessibilityProvider>
          <AppContent />
        </AccessibilityProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
