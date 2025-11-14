// Textos de la interfaz de usuario en español
export const UI_TEXTS = {
  // Errores de contexto
  CONTEXT_ERRORS: {
    DIAGRAMACION_PROVIDER: 'useDiagramacion debe usarse dentro de un DiagramacionProvider',
    EDICION_PROVIDER: 'useEdicion debe usarse dentro de un EdicionProvider',
    APP_PROVIDER: 'AppContent debe usarse dentro de un AppProvider',
    BOOK_PROVIDER: 'useBook debe usarse dentro de un BookProvider',
    THEME_PROVIDER: 'ThemeToggle debe usarse dentro de un AppProvider',
  },

  // Mensajes de error
  ERRORS: {
    LOADING_BOOKS: 'Error al cargar libros',
    LOADING_PROJECT: 'Error al cargar proyecto',
    SAVING_PROJECT: 'Error al guardar proyecto',
    DELETING_PROJECT: 'Error al eliminar proyecto',
    UPDATING_PAGE: 'Error al actualizar página',
    REMOVING_PAGE: 'Error al eliminar página',
    UPDATING_TITLE: 'Error al actualizar título',
    UPDATING_WORDS: 'Error al actualizar palabras',
    LOADING_THEMES: 'Error al cargar temas',
    CREATING_THEME: 'Error al crear el tema',
    SAVING_CHANGES: 'Error al guardar cambios',
    DELETING_THEME: 'Error al eliminar tema',
    IMPORTING_THEMES: 'Error al importar temas',
    EXPORTING_BOOK: 'Error al exportar el libro',
    REGENERATING_GRID: 'Error al regenerar la grilla',
    ADDING_PUZZLE_TO_BOOK: 'Error al agregar el puzzle al libro',
  },

  // Mensajes de éxito
  SUCCESS: {
    PUZZLE_ADDED_TO_BOOK: 'Puzzle agregado al libro exitosamente',
  },

  // Mensajes informativos
  INFO: {
    SELECT_THEME_FIRST: 'Por favor selecciona un tema primero',
    GENERATE_PUZZLE_FIRST: 'Genera un puzzle primero',
    LOADING: 'Cargando...',
    NO_WORDS: 'No hay palabras',
    CHANGES_NOT_SAVED: 'Cambios sin guardar',
    SELECT_ELEMENT_TO_EDIT: 'Selecciona un elemento para editar sus propiedades',
  },

  // Etiquetas de botones
  BUTTONS: {
    SAVE: 'Guardar',
    EXPORT_PDF: 'Exportar PDF',
    NEW: 'Nuevo',
    EDIT: 'Editar',
    DELETE: 'Eliminar',
    CANCEL: 'Cancelar',
    CREATE: 'Crear',
    UPDATE: 'Actualizar',
    CLOSE: 'Cerrar',
    BACK: 'Atrás',
    SETTINGS: 'Configuración',
    ZOOM_IN: 'Acercar',
    ZOOM_OUT: 'Alejar',
    GRID: 'Cuadrícula',
    LAYOUT: 'Diseño',
    DELETE_ELEMENT: 'Eliminar elemento',
    ADJUST_GRID: 'Ajustar malla',
  },

  // Configuración
  SETTINGS: {
    GRID_CONFIGURATION: 'Configuración de Cuadrícula',
    MANUAL_CONFIGURATION: 'Manual (Configuración personalizada)',
    CUSTOM_CONFIGURATION: 'Configuración personalizada',
  },

  // Logs de consola (para desarrollo)
  LOGS: {
    SAVING_DOCUMENT: 'Guardando documento',
    EXPORTING_DOCUMENT: 'Exportando documento como',
  },
} as const;