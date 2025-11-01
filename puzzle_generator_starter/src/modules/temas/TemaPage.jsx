import { useState, useCallback } from 'react'
import { useToast } from '../../hooks/useToast'
import { createTema } from '../../services/temas'
import TemaPanelEntrada from './TemaPanelEntrada'
import ToastContainer from '../../components/ToastContainer'

/**
 * Vista principal del módulo de temas con entrada por lotes y edición
 */
export default function TemaPage() {
  const { toasts, showToast, removeToast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Crear nuevo tema
  const handleCreateTema = useCallback(async ({ title, words }) => {
    setIsLoading(true)

    try {
      const response = await createTema({
        nombre: title,
        descripcion: words.join(', ')
      })

      if (!response.ok) {
        showToast({
          type: 'error',
          message: response.error || 'Error al crear el tema',
          duration: 5000
        })
        return { ok: false, error: response.error }
      }

      showToast({
        type: 'success',
        message: 'Tema creado correctamente',
        duration: 3000
      })

      return { ok: true, data: response.data }
    } catch (error) {
      const message = 'Error de conexión al crear tema'
      showToast({ type: 'error', message, duration: 5000 })
      return { ok: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }, [showToast])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crear Tema</h1>
          <p className="text-gray-600 mt-2">
            Ingresa un título y palabras separadas por comas
          </p>
        </header>

        {/* Panel de entrada */}
        <TemaPanelEntrada
          onCreateTema={handleCreateTema}
          isLoading={isLoading}
        />

        {/* Nota sobre limitaciones actuales */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Nota</h3>
          <p className="text-sm text-blue-700">
            Actualmente solo se puede crear temas. La edición avanzada requiere actualizar el backend.
          </p>
        </div>
      </div>

      {/* Contenedor de toasts */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}