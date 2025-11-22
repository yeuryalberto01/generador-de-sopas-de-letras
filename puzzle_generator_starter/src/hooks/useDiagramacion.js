import { useCallback, useEffect, useState } from 'react';
import { generatePDF } from '../services/pdfExporter';
import WordSearchGenerator from '../services/wordSearchAlgorithm';
import { GRID_TYPES, WORD_BOX_STYLES } from '../utils/diagramacionConstants';

export function useDiagramacion() {
  const [state, setState] = useState({
    pageSize: 'LETTER',
    selectedTema: null,
    gridConfig: {
      type: GRID_TYPES.AUTO,
      rows: 15,
      cols: 15,
      cellSize: 30,
      allowDiagonal: true,
      allowReverse: true
    },
    wordBoxConfig: {
      visible: true,
      style: WORD_BOX_STYLES.COLUMNS,
      columns: 3,
      numbered: true,
      position: 'bottom'
    },
    placedWords: [],
    grid: [],
    zoom: 100,
    showGrid: true,
    isGenerating: false,
    error: null,
    hasUnsavedChanges: false,
    lastSaved: null
  });

  const updateState = useCallback((updates) => {
    setState(prev => {
      const newState = { ...prev, ...updates };

      // Marcar como cambios no guardados si hay contenido
      if (newState.grid.length > 0 || newState.selectedTema) {
        newState.hasUnsavedChanges = true;
      }

      return newState;
    });
  }, []);

  const calculateGridSize = useCallback((words, pageSize, gridType = 'auto') => {
    const wordLengths = words.map(w => w.texto.length);
    const maxLength = Math.max(...wordLengths);
    const wordCount = words.length;

    // Calcular tamaño base óptimo
    let baseSize;
    if (wordCount <= 10) {
      baseSize = Math.max(12, maxLength + 3);
    } else if (wordCount <= 20) {
      baseSize = Math.max(15, maxLength + 2);
    } else if (wordCount <= 30) {
      baseSize = Math.max(18, maxLength + 1);
    } else {
      baseSize = Math.max(20, maxLength);
    }

    // Ajustar según tamaño de página
    if (pageSize === 'TABLOID') {
      baseSize = Math.floor(baseSize * 1.4);
    }

    // Aplicar modificadores según tipo de grid
    let finalSize;
    switch (gridType) {
      case 'compact':
        // Reducir tamaño para hacer más compacto (mínimo 10x10)
        finalSize = Math.max(10, Math.floor(baseSize * 0.8));
        break;

      case 'spacious':
        // Aumentar tamaño para hacer más espacioso (máximo 35x35)
        finalSize = Math.min(35, Math.floor(baseSize * 1.4));
        break;

      case 'auto':
      default:
        // Mantener tamaño óptimo
        finalSize = baseSize;
        break;
    }

    return Math.min(finalSize, 35);
  }, []);

  // Mantener compatibilidad con la función anterior
  const calculateOptimalGridSize = useCallback((words, pageSize) => {
    return calculateGridSize(words, pageSize, 'auto');
  }, [calculateGridSize]);

  // Exportar para compatibilidad
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.calculateOptimalGridSize = calculateOptimalGridSize;
    }
  }, [calculateOptimalGridSize]);

  const generateWordSearch = useCallback(async () => {
    if (!state.selectedTema) {
      updateState({ error: 'Selecciona un tema primero' });
      return;
    }

    updateState({ isGenerating: true, error: null });

    try {
      const words = state.selectedTema.palabras;
      let rows = state.gridConfig.rows;
      let cols = state.gridConfig.cols;

      // Calcular tamaño según tipo de grid
      if (state.gridConfig.type !== GRID_TYPES.MANUAL) {
        const gridType = state.gridConfig.type.toLowerCase(); // Convertir a minúsculas para coincidir con la función
        const size = calculateGridSize(words, state.pageSize, gridType);
        rows = cols = size;
      }

      // Generar sopa de letras
      const generator = new WordSearchGenerator(rows, cols, {
        allowReverse: state.gridConfig.allowReverse,
        allowDiagonal: state.gridConfig.allowDiagonal,
        fillWithRandom: true,
        useWordLetters: false,
        maxAttempts: 200
      });

      const result = generator.generate(words);

      updateState({
        grid: result.grid,
        placedWords: result.placedWords,
        gridConfig: { ...state.gridConfig, rows, cols },
        isGenerating: false
      });
    } catch (error) {
      updateState({
        error: 'Error al generar la sopa de letras',
        isGenerating: false
      });
    }
  }, [state.selectedTema, state.gridConfig, state.pageSize, calculateGridSize, updateState]);

  const exportToPDF = useCallback(async () => {
    if (state.grid.length === 0) {
      alert('Genera una sopa de letras primero');
      return;
    }

    try {
      await generatePDF({
        grid: state.grid,
        tema: state.selectedTema,
        pageSize: state.pageSize,
        gridConfig: state.gridConfig,
        wordBoxConfig: state.wordBoxConfig,
        placedWords: state.placedWords
      });
    } catch (error) {
      updateState({ error: 'Error al exportar PDF' });
    }
  }, [state, updateState]);

  const resetGrid = useCallback(() => {
    updateState({
      grid: [],
      placedWords: [],
      error: null,
      hasUnsavedChanges: false
    });
  }, [updateState]);

  const savePuzzle = useCallback(() => {
    // Aquí iría la lógica para guardar en el backend
    updateState({
      hasUnsavedChanges: false,
      lastSaved: new Date()
    });
  }, [updateState]);

  const markAsSaved = useCallback(() => {
    updateState({
      hasUnsavedChanges: false,
      lastSaved: new Date()
    });
  }, [updateState]);

  return {
    state,
    updateState,
    generateWordSearch,
    exportToPDF,
    resetGrid,
    savePuzzle,
    markAsSaved
  };
}
