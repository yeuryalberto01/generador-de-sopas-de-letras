import { useState, useCallback } from 'react'
import {
  getTemas,
  createTema,
  updateTema,
  deleteTema,
  getPalabrasTema,
  addPalabraTema,
  updatePalabraTema,
  deletePalabraTema,
  replacePalabrasTema
} from '../services/temas'

export function useTemaOperations() {
  const [loadingStates, setLoadingStates] = useState({
    list: false,
    operations: {} // { [id]: 'operationType' }
  })
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Actualizar estados de carga específicos
  const updateLoadingState = useCallback((key, value) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  // Limpiar mensajes
  const clearMessages = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
  }, [])

  // Cargar lista de temas
  const loadTemas = useCallback(async () => {
    updateLoadingState('list', true)
    clearMessages()

    try {
      const response = await getTemas()
      if (!response.ok) {
        setError(response.error || 'Error al cargar temas')
        return { ok: false, error: response.error }
      }
      return { ok: true, data: response.data || [] }
    } catch (err) {
      const errorMsg = 'Error de conexión al cargar temas'
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    } finally {
      updateLoadingState('list', false)
    }
  }, [updateLoadingState, clearMessages])

  // Crear tema
  const createNewTema = useCallback(async (temaData) => {
    updateLoadingState('operations', { ...loadingStates.operations, 'creating': 'create' })
    clearMessages()

    try {
      // Validación básica
      if (!temaData.nombre || temaData.nombre.trim().length < 2) {
        const errorMsg = 'El nombre debe tener al menos 2 caracteres'
        setError(errorMsg)
        return { ok: false, error: errorMsg }
      }

      const response = await createTema({
        nombre: temaData.nombre.trim(),
        descripcion: temaData.descripcion?.trim() || ''
      })

      if (!response.ok) {
        setError(response.error || 'Error al crear el tema')
        return { ok: false, error: response.error }
      }

      setSuccessMessage('Tema creado correctamente')
      return { ok: true, data: response.data }
    } catch (err) {
      const errorMsg = 'Error de conexión al crear tema'
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    } finally {
      updateLoadingState('operations', { ...loadingStates.operations, 'creating': undefined })
    }
  }, [loadingStates.operations, updateLoadingState, clearMessages])

  // Actualizar tema
  const updateExistingTema = useCallback(async (id, temaData) => {
    updateLoadingState('operations', { ...loadingStates.operations, [id]: 'update' })
    clearMessages()

    try {
      // Validación básica
      if (!temaData.nombre || temaData.nombre.trim().length < 2) {
        const errorMsg = 'El nombre debe tener al menos 2 caracteres'
        setError(errorMsg)
        return { ok: false, error: errorMsg }
      }

      const response = await updateTema(id, {
        nombre: temaData.nombre.trim(),
        descripcion: temaData.descripcion?.trim() || ''
      })

      if (!response.ok) {
        setError(response.error || 'Error al actualizar el tema')
        return { ok: false, error: response.error }
      }

      setSuccessMessage('Tema actualizado correctamente')
      return { ok: true, data: response.data }
    } catch (err) {
      const errorMsg = 'Error de conexión al actualizar tema'
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    } finally {
      updateLoadingState('operations', { ...loadingStates.operations, [id]: undefined })
    }
  }, [loadingStates.operations, updateLoadingState, clearMessages])

  // Eliminar tema
  const deleteExistingTema = useCallback(async (id) => {
    updateLoadingState('operations', { ...loadingStates.operations, [id]: 'delete' })
    clearMessages()

    try {
      const response = await deleteTema(id)

      if (!response.ok) {
        setError(response.error || 'Error al eliminar el tema')
        return { ok: false, error: response.error }
      }

      setSuccessMessage('Tema eliminado correctamente')
      return { ok: true }
    } catch (err) {
      const errorMsg = 'Error de conexión al eliminar tema'
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    } finally {
      updateLoadingState('operations', { ...loadingStates.operations, [id]: undefined })
    }
  }, [loadingStates.operations, updateLoadingState, clearMessages])

  // Obtener palabras de un tema
  const getTemaPalabras = useCallback(async (id) => {
    updateLoadingState('operations', { ...loadingStates.operations, [`palabras_${id}`]: 'get_palabras' })
    clearMessages()

    try {
      const response = await getPalabrasTema(id)
      if (!response.ok) {
        setError(response.error || 'Error al obtener palabras del tema')
        return { ok: false, error: response.error }
      }
      return { ok: true, data: response.data }
    } catch (err) {
      const errorMsg = 'Error de conexión al obtener palabras del tema'
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    } finally {
      updateLoadingState('operations', { ...loadingStates.operations, [`palabras_${id}`]: undefined })
    }
  }, [loadingStates.operations, updateLoadingState, clearMessages])

  // Agregar palabra a un tema
  const addPalabraToTema = useCallback(async (id, palabra) => {
    updateLoadingState('operations', { ...loadingStates.operations, [`add_palabra_${id}`]: 'add_palabra' })
    clearMessages()

    try {
      const response = await addPalabraTema(id, palabra)
      if (!response.ok) {
        setError(response.error || 'Error al agregar palabra al tema')
        return { ok: false, error: response.error }
      }

      setSuccessMessage('Palabra agregada correctamente')
      return { ok: true, data: response.data }
    } catch (err) {
      const errorMsg = 'Error de conexión al agregar palabra al tema'
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    } finally {
      updateLoadingState('operations', { ...loadingStates.operations, [`add_palabra_${id}`]: undefined })
    }
  }, [loadingStates.operations, updateLoadingState, clearMessages])

  // Actualizar palabra en un tema
  const updatePalabraInTema = useCallback(async (id, index, palabra) => {
    updateLoadingState('operations', { ...loadingStates.operations, [`update_palabra_${id}_${index}`]: 'update_palabra' })
    clearMessages()

    try {
      const response = await updatePalabraTema(id, index, palabra)
      if (!response.ok) {
        setError(response.error || 'Error al actualizar palabra del tema')
        return { ok: false, error: response.error }
      }

      setSuccessMessage('Palabra actualizada correctamente')
      return { ok: true, data: response.data }
    } catch (err) {
      const errorMsg = 'Error de conexión al actualizar palabra del tema'
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    } finally {
      updateLoadingState('operations', { ...loadingStates.operations, [`update_palabra_${id}_${index}`]: undefined })
    }
  }, [loadingStates.operations, updateLoadingState, clearMessages])

  // Eliminar palabra de un tema
  const deletePalabraFromTema = useCallback(async (id, index) => {
    updateLoadingState('operations', { ...loadingStates.operations, [`delete_palabra_${id}_${index}`]: 'delete_palabra' })
    clearMessages()

    try {
      const response = await deletePalabraTema(id, index)
      if (!response.ok) {
        setError(response.error || 'Error al eliminar palabra del tema')
        return { ok: false, error: response.error }
      }

      setSuccessMessage('Palabra eliminada correctamente')
      return { ok: true, data: response.data }
    } catch (err) {
      const errorMsg = 'Error de conexión al eliminar palabra del tema'
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    } finally {
      updateLoadingState('operations', { ...loadingStates.operations, [`delete_palabra_${id}_${index}`]: undefined })
    }
  }, [loadingStates.operations, updateLoadingState, clearMessages])

  // Reemplazar todas las palabras de un tema
  const replaceTemaPalabras = useCallback(async (id, palabras) => {
    updateLoadingState('operations', { ...loadingStates.operations, [`replace_palabras_${id}`]: 'replace_palabras' })
    clearMessages()

    try {
      const response = await replacePalabrasTema(id, palabras)
      if (!response.ok) {
        setError(response.error || 'Error al reemplazar palabras del tema')
        return { ok: false, error: response.error }
      }

      setSuccessMessage('Palabras del tema actualizadas correctamente')
      return { ok: true, data: response.data }
    } catch (err) {
      const errorMsg = 'Error de conexión al reemplazar palabras del tema'
      setError(errorMsg)
      return { ok: false, error: errorMsg }
    } finally {
      updateLoadingState('operations', { ...loadingStates.operations, [`replace_palabras_${id}`]: undefined })
    }
  }, [loadingStates.operations, updateLoadingState, clearMessages])

  return {
    // Estados
    loadingStates,
    error,
    successMessage,

    // Acciones básicas de temas
    loadTemas,
    createNewTema,
    updateExistingTema,
    deleteExistingTema,

    // Acciones de palabras
    getTemaPalabras,
    addPalabraToTema,
    updatePalabraInTema,
    deletePalabraFromTema,
    replaceTemaPalabras,

    clearMessages,

    // Utilidades
    isLoading: (operation) => {
      if (operation) {
        return loadingStates.operations[operation] !== undefined
      }
      return loadingStates.list || Object.keys(loadingStates.operations).length > 0
    }
  }
}