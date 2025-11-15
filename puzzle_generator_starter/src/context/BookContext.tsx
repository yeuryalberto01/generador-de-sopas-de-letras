import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { UI_TEXTS } from '../constants/uiTexts';
import WordSearchGenerator from '../services/wordSearchAlgorithm';

// ==================== TYPES ====================

export interface PuzzlePage {
  id: string;
  title: string;
  puzzleData: any; // Datos del puzzle generado
  layout: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    pageNumber: number;
  };
  elements: any[]; // Elementos gráficos adicionales (decoraciones, títulos, etc.)
  createdAt: string;
  updatedAt: string;
}

export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  category: 'infantil' | 'educativo' | 'entretenimiento' | 'profesional';
  pageSize: 'LETTER' | 'TABLOID' | 'A4';
  layout: {
    puzzlesPerPage: number;
    margin: { top: number; right: number; bottom: number; left: number };
    spacing: number;
    showPageNumbers: boolean;
    showTitles: boolean;
  };
  styles: {
    backgroundColor: string;
    titleFont: string;
    titleSize: number;
    decorations: boolean;
  };
}

export interface BookProject {
  id: string;
  name: string;
  description: string;
  template: BookTemplate;
  temaIds: string[]; // Temas incluidos en el libro
  pages: PuzzlePage[];
  metadata: {
    author: string;
    createdAt: string;
    updatedAt: string;
    version: string;
  };
  settings: {
    autoGeneratePages: boolean;
    includeIndex: boolean;
    includeSolutions: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BookContextValue {
  currentProject: BookProject | null;
  projects: BookProject[];
  templates: BookTemplate[];
  isCreating: boolean;
  isLoading: boolean;
  creationProgress: { current: number; total: number; message: string };
  createProject: (name: string, templateId: string, temaIds: string[], temasData?: any[]) => Promise<BookProject>;
  loadProject: (projectId: string) => Promise<BookProject | null>;
  saveProject: () => Promise<boolean>;
  deleteProject: (projectId: string) => Promise<boolean>;
  addPuzzleToBook: (temaId: string, puzzleData: any) => Promise<PuzzlePage>;
  updatePage: (pageId: string, updates: Partial<PuzzlePage>) => Promise<boolean>;
  removePage: (pageId: string) => Promise<boolean>;
  reorderPages: (pageIds: string[]) => Promise<boolean>;
  exportBook: (format: 'pdf' | 'html') => Promise<Blob>;
  getProjectsByTema: (temaId: string) => BookProject[];
  duplicateProject: (projectId: string) => Promise<BookProject>;
  validateBookData: (project: BookProject) => { isValid: boolean; errors: string[] };
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean) => void;
}

// ==================== DEFAULT TEMPLATES ====================

const DEFAULT_TEMPLATES: BookTemplate[] = [
  {
    id: 'infantil-basico',
    name: 'Libro Infantil Básico',
    description: 'Perfecto para niños pequeños con puzzles grandes y colores vivos',
    category: 'infantil',
    pageSize: 'LETTER',
    layout: {
      puzzlesPerPage: 1,
      margin: { top: 1, right: 1, bottom: 1, left: 1 },
      spacing: 0.5,
      showPageNumbers: true,
      showTitles: true
    },
    styles: {
      backgroundColor: '#ffffff',
      titleFont: 'Comic Sans MS, cursive',
      titleSize: 24,
      decorations: true
    }
  },
  {
    id: 'educativo-estandar',
    name: 'Libro Educativo Estándar',
    description: 'Para uso escolar con múltiples puzzles por página',
    category: 'educativo',
    pageSize: 'LETTER',
    layout: {
      puzzlesPerPage: 2,
      margin: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
      spacing: 0.25,
      showPageNumbers: true,
      showTitles: true
    },
    styles: {
      backgroundColor: '#ffffff',
      titleFont: 'Arial, sans-serif',
      titleSize: 18,
      decorations: false
    }
  },
  {
    id: 'profesional-completo',
    name: 'Libro Profesional Completo',
    description: 'Para publicaciones profesionales con índice y soluciones',
    category: 'profesional',
    pageSize: 'TABLOID',
    layout: {
      puzzlesPerPage: 4,
      margin: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      spacing: 0.2,
      showPageNumbers: true,
      showTitles: true
    },
    styles: {
      backgroundColor: '#f8f9fa',
      titleFont: 'Times New Roman, serif',
      titleSize: 16,
      decorations: false
    }
  }
];

// ==================== CONTEXT ====================

const BookContext = createContext<BookContextValue | undefined>(undefined);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<BookProject | null>(null);
  const [projects, setProjects] = useState<BookProject[]>([]);
  const [templates] = useState<BookTemplate[]>(DEFAULT_TEMPLATES);
  const [isCreating, setIsCreating] = useState(false);
  const [creationProgress, setCreationProgress] = useState({ current: 0, total: 0, message: '' });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // ==================== API HELPERS ====================

  const API_BASE = (import.meta?.env?.VITE_API_BASE_URL as string | undefined) || '/api';

  const buildEndpointUrl = (endpoint: string) => {
    const normalizedBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${normalizedBase}${normalizedEndpoint}`;
  };

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(buildEndpointUrl(endpoint), {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${response.status} - ${error}`);
    }

    return response.json();
  };

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    const loadBooks = async () => {
      try {
        setIsLoading(true);
        const books = await apiRequest('/db/libros');
        setProjects(books);
      } catch (error) {
        console.error(UI_TEXTS.ERRORS.LOADING_BOOKS, error);
        // Fallback to empty array if API fails
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, []);

  // ==================== PROJECT MANAGEMENT ====================

  const createProject = useCallback(async (
    name: string,
    templateId: string,
    temaIds: string[],
    temasData?: any[]
  ): Promise<BookProject> => {
    setIsCreating(true);
    setCreationProgress({ current: 0, total: temaIds.length + 2, message: 'Validando datos...' });

    try {
      // 1. Validaciones iniciales
      if (!name?.trim()) {
        throw new Error('El nombre del libro es obligatorio');
      }

      if (temaIds.length === 0) {
        throw new Error('Debe seleccionar al menos un tema');
      }

      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Plantilla no encontrada');
      }

      setCreationProgress(prev => ({ ...prev, current: 1, message: 'Creando libro en el servidor...' }));

      // 2. Crear libro en el backend
      const bookInput = {
        name: name.trim(),
        description: `Libro creado con plantilla ${template.name}`,
        temaIds
      };

      const createdBook = await apiRequest('/db/libros', {
        method: 'POST',
        body: JSON.stringify(bookInput),
      });

      setCreationProgress(prev => ({ ...prev, message: 'Generando puzzles...' }));

      // 3. Generar páginas con puzzles reales si hay datos de temas
      if (temasData && temasData.length > 0) {
        const pages: PuzzlePage[] = [];

        for (let i = 0; i < temaIds.length; i++) {
          const temaId = temaIds[i];
          const tema = temasData.find(t => t.id === temaId);

          if (tema && tema.words && tema.words.length > 0) {
            setCreationProgress(prev => ({
              ...prev,
              current: 2 + i,
              message: `Generando puzzle para ${tema.nombre}...`
            }));

            // Usar el algoritmo avanzado de sopa de letras
            const generator = new WordSearchGenerator(15, 15, {
              allowReverse: true,
              allowDiagonal: true,
              fillWithRandom: true
            });

            const words = tema.words.map((word: string) => ({ texto: word }));
            const result = generator.generate(words);

            const puzzleData = {
              grid: result.grid.map(row =>
                row.map(cell => cell.letter)
              ),
              words: result.placedWords.map(word => ({
                text: word.text,
                positions: word.positions
              })),
              config: { rows: 15, cols: 15 }
            };

            const pageInput = {
              title: `Puzzle: ${tema.nombre}`,
              puzzleData,
              layout: {
                position: { x: 50, y: 100 },
                size: { width: 400, height: 300 },
                pageNumber: i + 1
              },
              elements: []
            };

            const createdPage = await apiRequest(`/db/libros/${createdBook.id}/paginas`, {
              method: 'POST',
              body: JSON.stringify(pageInput),
            });

            pages.push(createdPage);
          }
        }
      }

      setCreationProgress(prev => ({ ...prev, current: prev.total, message: 'Finalizando...' }));

      // 4. Recargar libros y establecer proyecto actual
      const updatedBooks = await apiRequest('/db/libros');
      setProjects(updatedBooks);

      const finalBook = updatedBooks.find((b: BookProject) => b.id === createdBook.id);
      setCurrentProject(finalBook);

      setCreationProgress({ current: 0, total: 0, message: '' });
      setIsCreating(false);

      return finalBook;

    } catch (error) {
      setIsCreating(false);
      setCreationProgress({ current: 0, total: 0, message: '' });
      throw error;
    }
  }, [templates]);

  const loadProject = useCallback(async (projectId: string): Promise<BookProject | null> => {
    try {
      const project = await apiRequest(`/db/libros/${projectId}`);
      setCurrentProject(project);
      return project;
    } catch (error) {
      console.error(UI_TEXTS.ERRORS.LOADING_PROJECT, error);
      return null;
    }
  }, []);

  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!currentProject) return false;

    try {
      const updateData = {
        name: currentProject.name,
        description: currentProject.description,
        temaIds: currentProject.temaIds
      };

      const updatedBook = await apiRequest(`/db/libros/${currentProject.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Actualizar el proyecto en el estado local
      setProjects(prev => prev.map(p =>
        p.id === currentProject.id ? updatedBook : p
      ));

      setCurrentProject(updatedBook);
      return true;
    } catch (error) {
      console.error(UI_TEXTS.ERRORS.SAVING_PROJECT, error);
      return false;
    }
  }, [currentProject]);

  // ==================== AUTO-SAVE ====================

  useEffect(() => {
    if (!currentProject || !autoSaveEnabled) return;

    const autoSaveTimer = setTimeout(async () => {
      try {
        await saveProject();
      } catch (error) {
        console.warn('Auto-save failed:', error);
      }
    }, 30000); // Auto-guardar cada 30 segundos

    return () => clearTimeout(autoSaveTimer);
  }, [currentProject, autoSaveEnabled, saveProject]);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      await apiRequest(`/db/libros/${projectId}`, {
        method: 'DELETE',
      });

      // Actualizar estado local
      setProjects(prev => prev.filter(p => p.id !== projectId));

      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }

      return true;
    } catch (error) {
      console.error(UI_TEXTS.ERRORS.DELETING_PROJECT, error);
      return false;
    }
  }, [currentProject]);

  // ==================== PAGE MANAGEMENT ====================

  const addPuzzleToBook = useCallback(async (
    temaId: string,
    puzzleData: any
  ): Promise<PuzzlePage> => {
    if (!currentProject) {
      throw new Error('No active project');
    }

    const pageInput = {
      title: `Puzzle ${currentProject.pages.length + 1}`,
      puzzleData,
      layout: {
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        pageNumber: currentProject.pages.length + 1
      },
      elements: []
    };

    const newPage = await apiRequest(`/db/libros/${currentProject.id}/paginas`, {
      method: 'POST',
      body: JSON.stringify(pageInput),
    });

    // Recargar el proyecto actualizado
    const updatedBook = await apiRequest(`/db/libros/${currentProject.id}`);
    setCurrentProject(updatedBook);
    setProjects(prev => prev.map(p =>
      p.id === currentProject.id ? updatedBook : p
    ));

    return newPage;
  }, [currentProject]);

  const updatePage = useCallback(async (
    pageId: string,
    updates: Partial<PuzzlePage>
  ): Promise<boolean> => {
    if (!currentProject) return false;

    try {
      // Nota: La API actual no tiene endpoint para actualizar páginas individuales
      // Por ahora, recargamos el libro completo
      const updatedBook = await apiRequest(`/db/libros/${currentProject.id}`);
      setCurrentProject(updatedBook);
      setProjects(prev => prev.map(p =>
        p.id === currentProject.id ? updatedBook : p
      ));
      return true;
    } catch (error) {
      console.error(UI_TEXTS.ERRORS.UPDATING_PAGE, error);
      return false;
    }
  }, [currentProject]);

  const removePage = useCallback(async (pageId: string): Promise<boolean> => {
    if (!currentProject) return false;

    try {
      await apiRequest(`/db/libros/${currentProject.id}/paginas/${pageId}`, {
        method: 'DELETE',
      });

      // Recargar el proyecto actualizado
      const updatedBook = await apiRequest(`/db/libros/${currentProject.id}`);
      setCurrentProject(updatedBook);
      setProjects(prev => prev.map(p =>
        p.id === currentProject.id ? updatedBook : p
      ));

      return true;
    } catch (error) {
      console.error(UI_TEXTS.ERRORS.REMOVING_PAGE, error);
      return false;
    }
  }, [currentProject]);

  const reorderPages = useCallback(async (pageIds: string[]): Promise<boolean> => {
    if (!currentProject) return false;

    // Nota: La API actual no soporta reordenamiento de páginas
    // Por ahora, solo actualizamos el estado local
    const reorderedPages = pageIds.map((id, index) => {
      const page = currentProject.pages.find(p => p.id === id);
      if (!page) return null;
      return {
        ...page,
        layout: { ...page.layout, pageNumber: index + 1 }
      };
    }).filter(Boolean) as PuzzlePage[];

    const updatedProject = {
      ...currentProject,
      pages: reorderedPages,
      updatedAt: new Date().toISOString()
    };

    setCurrentProject(updatedProject);
    setProjects(prev => prev.map(p =>
      p.id === currentProject.id ? updatedProject : p
    ));

    return true;
  }, [currentProject]);

  // ==================== EXPORT & UTILITIES ====================

  const exportBook = useCallback(async (format: 'pdf' | 'html'): Promise<Blob> => {
    if (!currentProject) {
      throw new Error('No active project to export');
    }

    // TODO: Implement actual export logic
    // For now, return a placeholder
    const content = JSON.stringify(currentProject, null, 2);
    return new Blob([content], { type: 'application/json' });
  }, [currentProject]);

  const getProjectsByTema = useCallback((temaId: string): BookProject[] => {
    return projects.filter(project => project.temaIds.includes(temaId));
  }, [projects]);

  const duplicateProject = useCallback(async (projectId: string): Promise<BookProject> => {
    const originalProject = projects.find(p => p.id === projectId);
    if (!originalProject) {
      throw new Error('Project not found');
    }

    const duplicateInput = {
      name: `${originalProject.name} (Copia)`,
      description: originalProject.description,
      temaIds: originalProject.temaIds
    };

    const duplicatedBook = await apiRequest('/db/libros', {
      method: 'POST',
      body: JSON.stringify(duplicateInput),
    });

    // Recargar libros
    const updatedBooks = await apiRequest('/db/libros');
    setProjects(updatedBooks);

    const finalBook = updatedBooks.find((b: BookProject) => b.id === duplicatedBook.id);
    setCurrentProject(finalBook);

    return finalBook;
  }, [projects]);

  const validateBookData = useCallback((project: BookProject): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!project.name?.trim()) {
      errors.push('El nombre del libro es obligatorio');
    }

    if (!project.template) {
      errors.push('Debe seleccionar una plantilla');
    }

    if (!project.temaIds || project.temaIds.length === 0) {
      errors.push('Debe seleccionar al menos un tema');
    }

    if (project.pages.length === 0) {
      errors.push('El libro debe tener al menos una página');
    }

    // Validar que cada página tenga datos de puzzle válidos
    project.pages.forEach((page, index) => {
      if (!page.puzzleData?.grid || page.puzzleData.grid.length === 0) {
        errors.push(`La página ${index + 1} no tiene datos de puzzle válidos`);
      }
      if (!page.puzzleData?.words || page.puzzleData.words.length === 0) {
        errors.push(`La página ${index + 1} no tiene palabras definidas`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  const contextValue: BookContextValue = {
    currentProject,
    projects,
    templates,
    isCreating,
    isLoading,
    creationProgress,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    addPuzzleToBook,
    updatePage,
    removePage,
    reorderPages,
    exportBook,
    getProjectsByTema,
    duplicateProject,
    validateBookData,
    autoSaveEnabled,
    setAutoSaveEnabled
  };

  return (
    <BookContext.Provider value={contextValue}>
      {children}
    </BookContext.Provider>
  );
};

export const useBook = (): BookContextValue => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error(UI_TEXTS.CONTEXT_ERRORS.BOOK_PROVIDER);
  }
  return context;
};

export default BookContext;
