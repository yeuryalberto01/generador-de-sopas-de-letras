import { useState, useCallback, useEffect } from 'react'
import { validateWord, findDuplicates } from '../../utils/parseWords'

/**
 * Componente para editar una palabra individual
 */
function PalabraItem({ 
  palabra, 
  index, 
  onEdit, 
  onDelete, 
  onDuplicate,
  isEditing,
  onStartEdit,
  onCancelEdit,
  allWords 
}) {
  const [editValue, setEditValue] = useState(palabra)
  const [validation, setValidation] = useState({ valid: true, message: '' })

  // Validar en tiempo real
  useEffect(() => {
    if (isEditing) {
      const result = validateWord(editValue)
      setValidation(result)
      
      // Verificar duplicados (excluyendo la palabra actual)
      const otherWords = allWords.filter((_, i) => i !== index)
      const normalizedEdit = editValue.toLowerCase().trim()
      const normalizedOthers = otherWords.map(w => w.toLowerCase().trim())
      
      if (normalizedOthers.includes(normalizedEdit)) {
        setValidation({ 
          valid: false, 
          message: 'Esta palabra ya existe en la lista' 
        })
      }
    }
  }, [editValue, isEditing, allWords, index])

  const handleSave = useCallback(() => {
    if (validation.valid && editValue.trim() !== palabra) {
      onEdit(index, editValue.trim())
    }
    onCancelEdit()
  }, [editValue, validation.valid, onEdit, onCancelEdit, index, palabra])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(palabra)
      onCancelEdit()
    }
  }, [handleSave, palabra, onCancelEdit])

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 ${
            validation.valid ? 'border-gray-300' : 'border-red-500'
          }`}
          autoFocus
          aria-label={`Editando palabra ${index + 1}`}
        />
        {!validation.valid && (
          <span className="text-xs text-red-600" title={validation.message}>
            ⚠
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={!validation.valid}
          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-label="Guardar cambios"
        >
          ✓
        </button>
        <button
          onClick={() => {
            setEditValue(palabra)
            onCancelEdit()
          }}
          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
          aria-label="Cancelar edición"
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-2 border-b border-gray-200 last:border-b-0">
      <span className="text-sm flex-1">{palabra}</span>
      <div className="flex gap-1">
        <button
          onClick={() => {
            setEditValue(palabra)
            onStartEdit(index)
          }}
          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          aria-label={`Editar palabra ${palabra}`}
          title="Editar"
        >
          ✎
        </button>
        <button
          onClick={() => onDuplicate(index)}
          className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
          aria-label={`Duplicar palabra ${palabra}`}
          title="Duplicar"
        >
          ⎘
        </button>
        <button
          onClick={() => onDelete(index)}
          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
          aria-label={`Eliminar palabra ${palabra}`}
          title="Eliminar"
        >
          ×
        </button>
      </div>
    </div>
  )
}

/**
 * Input para agregar nueva palabra
 */
function AgregarPalabraInput({ onAdd, allWords }) {
  const [value, setValue] = useState('')
  const [validation, setValidation] = useState({ valid: true, message: '' })

  const handleAdd = useCallback(() => {
    if (validation.valid && value.trim()) {
      onAdd(value.trim())
      setValue('')
      setValidation({ valid: true, message: '' })
    }
  }, [value, validation.valid, onAdd])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }, [handleAdd])

  useEffect(() => {
    if (value.trim()) {
      const result = validateWord(value.trim())
      setValidation(result)
      
      // Verificar duplicados
      const normalizedValue = value.toLowerCase().trim()
      const normalizedWords = allWords.map(w => w.toLowerCase().trim())
      
      if (normalizedWords.includes(normalizedValue)) {
        setValidation({ 
          valid: false, 
          message: 'Esta palabra ya existe en la lista' 
        })
      }
    } else {
      setValidation({ valid: true, message: '' })
    }
  }, [value, allWords])

  return (
    <div className="mb-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Agregar nueva palabra..."
          className={`flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-1 ${
            validation.valid ? 'border-gray-300' : 'border-red-500'
          }`}
          aria-label="Agregar nueva palabra"
        />
        <button
          onClick={handleAdd}
          disabled={!validation.valid || !value.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          aria-label="Agregar palabra"
        >
          +
        </button>
      </div>
      {!validation.valid && (
        <p className="mt-1 text-xs text-red-600">{validation.message}</p>
      )}
    </div>
  )
}

/**
 * Panel de edición del tema (derecha)
 */
export default function TemaPanelEdicion({
  tema,
  onUpdateTitle,
  onUpdateWords,
  onUndo,
  isLoading = false
}) {
  const [editingWordIndex, setEditingWordIndex] = useState(null)
  const [localTema, setLocalTema] = useState(tema)
  const [lastSaved, setLastSaved] = useState(tema)
  const [titleDraft, setTitleDraft] = useState(tema?.title || '')

  // Sincronizar con prop cambios
  useEffect(() => {
    if (tema) {
      setLocalTema(tema)
      setLastSaved(tema)
      setTitleDraft(tema.nombre || '')
    }
  }, [tema])

  // Verificar cambios
  const hasChanges = JSON.stringify(localTema) !== JSON.stringify(lastSaved)
  const hasTitleChanges = titleDraft !== lastSaved?.nombre

  // Manejar edición de palabras
  const handleEditWord = useCallback((index, newWord) => {
    setLocalTema(prev => ({
      ...prev,
      words: prev.words.map((word, i) => i === index ? newWord : word)
    }))
    setEditingWordIndex(null)
  }, [])

  const handleDeleteWord = useCallback((index) => {
    setLocalTema(prev => ({
      ...prev,
      words: prev.words.filter((_, i) => i !== index)
    }))
  }, [])

  const handleDuplicateWord = useCallback((index) => {
    const wordToDuplicate = localTema.words[index]
    setLocalTema(prev => ({
      ...prev,
      words: [...prev.words, wordToDuplicate]
    }))
  }, [localTema])

  const handleAddWord = useCallback((newWord) => {
    setLocalTema(prev => ({
      ...prev,
      words: [...prev.words, newWord]
    }))
  }, [])

  // Guardar cambios
  const handleSaveChanges = useCallback(async () => {
    if (hasTitleChanges) {
      await onUpdateTitle(localTema.id, titleDraft)
    }
    
    if (hasChanges) {
      await onUpdateWords(localTema.id, localTema.words)
    }
    
    setLastSaved(localTema)
  }, [localTema, titleDraft, hasTitleChanges, hasChanges, onUpdateTitle, onUpdateWords])

  // Deshacer cambios
  const handleUndo = useCallback(() => {
    setLocalTema(lastSaved)
    setTitleDraft(lastSaved?.nombre || '')
    setEditingWordIndex(null)
    onUndo?.()
  }, [lastSaved, onUndo])

  if (!tema) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500 py-8">
          <p>Selecciona un tema para editarlo</p>
        </div>
      </div>
    )
  }

  const duplicates = findDuplicates(localTema.words)
  const hasDuplicates = duplicates.length > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header con título editable */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            className="text-xl font-semibold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 px-2 py-1 rounded"
            aria-label="Título del tema"
          />
          {(hasChanges || hasTitleChanges) && (
            <button
              onClick={handleSaveChanges}
              disabled={isLoading || hasDuplicates}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              aria-label="Guardar cambios"
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>ID: {tema.id}</span>
          <span>•</span>
          <span>
            Actualizado: {new Date(tema.updated_at || Date.now()).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Contadores y estado */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center text-sm">
          <span>
            {localTema.words.length} palabra{localTema.words.length !== 1 ? 's' : ''}
          </span>
          {hasDuplicates && (
            <span className="text-amber-600 font-medium">
              {duplicates.length} duplicado{duplicates.length !== 1 ? 's' : ''} detectado{duplicates.length !== 1 ? 's' : ''}
            </span>
          )}
          {hasChanges && !hasDuplicates && (
            <span className="text-blue-600 font-medium">Cambios sin guardar</span>
          )}
        </div>
      </div>

      {/* Input para agregar palabra */}
      <AgregarPalabraInput 
        onAdd={handleAddWord}
        allWords={localTema.words}
      />

      {/* Lista de palabras */}
      <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
        {localTema.words.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No hay palabras en este tema
          </div>
        ) : (
          localTema.words.map((palabra, index) => (
            <PalabraItem
              key={`${palabra}-${index}`}
              palabra={palabra}
              index={index}
              onEdit={handleEditWord}
              onDelete={handleDeleteWord}
              onDuplicate={handleDuplicateWord}
              isEditing={editingWordIndex === index}
              onStartEdit={setEditingWordIndex}
              onCancelEdit={() => setEditingWordIndex(null)}
              allWords={localTema.words}
            />
          ))
        )}
      </div>

      {/* Botones de acción */}
      {(hasChanges || hasTitleChanges) && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSaveChanges}
            disabled={isLoading || hasDuplicates}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Guardar todos los cambios"
          >
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            onClick={handleUndo}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            aria-label="Deshacer cambios"
          >
            Deshacer
          </button>
        </div>
      )}
    </div>
  )
}