import { useCallback, useState } from 'react'
import { parseWords } from '../../utils/parseWords'

/**
 * Panel de entrada por lotes para crear temas
 */
export default function TemaPanelEntrada({
  onCreateTema,
  isLoading = false
}) {
  const [draft, setDraft] = useState({
    title: '',
    batchInput: '',
    parsedPreview: []
  })
  const [parsingResult, setParsingResult] = useState(null)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)

  // Crear tema
  const handleCreateTema = useCallback(async () => {
    setHasAttemptedSubmit(true)

    // Validaciones
    if (!draft.title.trim()) {
      return { ok: false, error: 'El título es obligatorio' }
    }

    if (draft.parsedPreview.length === 0) {
      return { ok: false, error: 'Agrega al menos 1 palabra' }
    }

    if (parsingResult && !parsingResult.valid) {
      return { ok: false, error: 'Hay palabras inválidas en el lote' }
    }

    // Crear tema
    const result = await onCreateTema({
      nombre: draft.title.trim(),
      descripcion: draft.parsedPreview.join(', ') // Por ahora, unir las palabras en descripción
    })

    if (result.ok) {
      // Limpiar formulario
      setDraft({ title: '', batchInput: '', parsedPreview: [] })
      setParsingResult(null)
      setHasAttemptedSubmit(false)
    }

    return result
  }, [draft.title, draft.parsedPreview, parsingResult, onCreateTema])

  // Manejar Enter vs Ctrl+Enter en el textarea
  const handleBatchInputKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      handleCreateTema()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      // Parsear el lote
      const result = parseWords(draft.batchInput)
      setParsingResult(result)
      setDraft(prev => ({ ...prev, parsedPreview: result.words }))
    }
  }, [draft.batchInput, handleCreateTema])

  // Limpiar formulario
  const handleClear = useCallback(() => {
    setDraft({ title: '', batchInput: '', parsedPreview: [] })
    setParsingResult(null)
    setHasAttemptedSubmit(false)
  }, [])

  const titleError = hasAttemptedSubmit && !draft.title.trim()
  const wordsError = hasAttemptedSubmit && draft.parsedPreview.length === 0
  const canCreate = draft.title.trim() && draft.parsedPreview.length > 0 && 
                   (!parsingResult || parsingResult.valid)

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border-primary p-6 h-full">
      <h2 className="text-2xl font-bold text-text-primary mb-6">Crear Nuevo Tema</h2>
      
      {/* Input de título */}
      <div className="mb-6">
        <label htmlFor="tema-title" className="block text-sm font-semibold text-text-secondary mb-2">
          Título del tema *
        </label>
        <input
          id="tema-title"
          type="text"
          value={draft.title}
          onChange={(e) => setDraft(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ej.: Animales del Bosque"
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
            titleError 
              ? 'border-red-500 bg-red-50' 
              : 'border-border-secondary hover:border-gray-400 focus:border-blue-500'
          }`}
          aria-required="true"
          aria-invalid={titleError}
          aria-describedby={titleError ? 'title-error' : undefined}
        />
        {titleError && (
          <p id="title-error" className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
            <span>⚠</span>
            El título es obligatorio
          </p>
        )}
      </div>

      {/* Textarea para lote de palabras */}
      <div className="mb-6">
        <label htmlFor="batch-input" className="block text-sm font-semibold text-text-secondary mb-2">
          Lote de palabras
        </label>
        <textarea
          id="batch-input"
          value={draft.batchInput}
          onChange={(e) => setDraft(prev => ({ ...prev, batchInput: e.target.value }))}
          onKeyDown={handleBatchInputKeyDown}
          placeholder="Pega aquí tus palabras separadas por coma, salto de línea o espacio..."
          rows={8}
          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${
            wordsError 
              ? 'border-red-500 bg-red-50' 
              : 'border-border-secondary hover:border-gray-400 focus:border-blue-500'
          }`}
          aria-describedby="batch-help batch-preview"
        />
        <div id="batch-help" className="mt-2 text-sm text-text-secondary flex items-center gap-1">
          <span>💡</span>
          <span>Presiona Enter para parsear, Ctrl+Enter para crear</span>
        </div>
        
        {/* Vista previa del parsing */}
        {parsingResult && (
          <div id="batch-preview" className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-border-primary">
            <p className={`text-sm font-medium flex items-center gap-2 ${
              parsingResult.valid ? 'text-green-600' : 'text-amber-600'
            }`}>
              <span>{parsingResult.valid ? '✅' : '⚠'}</span>
              {parsingResult.message}
            </p>
            {parsingResult.stats && (
              <div className="mt-2 text-xs text-text-secondary grid grid-cols-2 gap-1">
                <span>Total detectadas: <strong>{parsingResult.stats.totalDetected}</strong></span>
                <span>Válidas: <strong className="text-green-600">{parsingResult.stats.validWords}</strong></span>
                <span>Duplicadas: <strong className="text-amber-600">{parsingResult.stats.duplicatesCount}</strong></span>
                <span>Ignoradas: <strong className="text-gray-500">{parsingResult.stats.ignoredCount}</strong></span>
              </div>
            )}
          </div>
        )}
        
        {wordsError && (
          <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
            <span>⚠</span>
            Agrega al menos 1 palabra
          </p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={handleCreateTema}
          disabled={!canCreate || isLoading}
          className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            canCreate && !isLoading
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          aria-label="Crear tema con las palabras parseadas"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creando...
            </>
          ) : (
            <>
              <span>✨</span>
              Crear
            </>
          )}
        </button>
        
        <button
          onClick={handleClear}
          type="button"
          className="px-6 py-3 border-2 border-border-secondary text-text-primary rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          aria-label="Limpiar formulario"
        >
          🗑️ Limpiar
        </button>
      </div>

      {/* Información de ayuda */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <span>ℹ️</span>
          Formato aceptado:
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span><strong>Separadores:</strong> coma, punto y coma, salto de línea, tabulador, espacios</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span><strong>Caracteres permitidos:</strong> letras (incluye ñ y tildes), números, guiones, subrayados</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span><strong>Longitud:</strong> 2-32 caracteres por palabra</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span><strong>Máximo:</strong> 500 palabras por tema</span>
          </li>
        </ul>
      </div>
    </div>
  )
}