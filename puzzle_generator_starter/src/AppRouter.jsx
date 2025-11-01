import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense } from 'react'
import { AppProvider } from './context/AppContext'
import { AccessibilityProvider } from './context/AccessibilityContext'
import NetBadge from './components/NetBadge'
import AccessibilityControls from './components/AccessibilityControls'
import ErrorBoundary from './components/ErrorBoundary'

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
            <Route path="/diagramacion/:id" element={<Diagramacion />} />
            <Route path="/panel-apis" element={<PanelAPIs />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AnimatePresence>
  )
}

export default function AppRouter(){
  return (
    <BrowserRouter>
      <AppProvider>
        <AccessibilityProvider>
          <NetBadge />
          <AccessibilityControls />
          <AnimatedRoutes />
        </AccessibilityProvider>
      </AppProvider>
    </BrowserRouter>
  )
}
