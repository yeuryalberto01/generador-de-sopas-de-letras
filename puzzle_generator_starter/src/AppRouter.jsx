import { AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import CommandPalette from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import { AccessibilityProvider } from './context/AccessibilityContext'
import { AppProvider } from './context/AppContext'
import { useApp } from './hooks/useApp'
import Layout from './Layout'

// Lazy loading de componentes para mejor performance
const Splash = lazy(() => import('./modules/splash/Splash'))
const Temas = lazy(() => import('./modules/temas/Temas'))
const Diagramacion = lazy(() => import('./modules/diagramacion/Diagramacion'))
const PanelAPIs = lazy(() => import('./modules/panel-apis/PanelAPIs'))

// Componente de carga
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontSize: '18px',
    color: '#64748b'
  }}>
    Cargando...
  </div>
)

function AnimatedRoutes(){
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Splash />} />
            <Route path="/temas" element={<Temas />} />
            <Route path="/diagramacion" element={<Diagramacion />} />
            <Route path="/panel-apis" element={<PanelAPIs />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AnimatePresence>
  )
}

function AppContent() {
  const { setCommandPaletteOpen } = useApp();

  // Listener para el atajo de teclado
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(isOpen => !isOpen);
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
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Abrir menú de comandos (Ctrl+K)"
      >
        <Search size={22} />
      </button>
    </>
  );
}

export default function AppRouter(){
  return (
    <BrowserRouter>
      <AppProvider>
        <AccessibilityProvider>
          <AppContent />
        </AccessibilityProvider>
      </AppProvider>
    </BrowserRouter>
  )
}
