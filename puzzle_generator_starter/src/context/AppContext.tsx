import { createContext, FC, ReactNode, useCallback, useEffect, useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { useTemaOperations } from '../hooks/useTemaOperations';
import type { Tema } from '../types';
import { normalizeTema, stringsToPalabras } from '../utils/temaConverters';
import { BookProvider } from './BookContext';

// --- TIPOS ---

interface UserPreferences {
  theme: 'light' | 'dark';
}

interface RecentItem {
  path: string;
  label: string;
  icon: FC<any>; // O un tipo más específico para los iconos de Lucide
}

interface AppContextValue {
  userPreferences: UserPreferences;
  toggleTheme: () => void;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (isOpen: boolean) => void;
  recentItems: RecentItem[];
  addRecentItem: (item: RecentItem) => void;
  temas: Tema[];
  selectedTemaId: string | null;
  activeTema: Tema | null;
  selectTema: (id: string | null) => void;
  createNewTema: (data: { nombre: string; descripcion?: string }) => Promise<{ ok: boolean; data?: Tema; error?: string; }>;
  updateTemaData: (id: string, data: { nombre: string; descripcion?: string }) => Promise<{ ok: boolean; data?: Tema; error?: string; }>;
  deleteTemaById: (id: string) => Promise<{ ok: boolean; error?: string; }>;
  replaceTemaPalabras: (id: string, palabras: string[]) => Promise<{ ok: boolean; data?: { palabras: string[] }; error?: string; }>;
  loadingStates: any; // Debería tener un tipo más específico
  error: string | null;
  successMessage: string | null;
  clearMessages: () => void;
  isLoading: (operation?: string) => boolean;
}

interface AppProviderProps {
  children: ReactNode;
}

// =============================================================================
// CONTEXTO
// =============================================================================

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
  const [userPreferences, setUserPreferences] = useLocalStorage('user-preferences', { theme: 'light' });
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [recentItems, setRecentItems] = useLocalStorage('recent-navigation-items', []);

  const [temas, setTemas] = useState<Tema[]>([]);
  const [selectedTemaId, setSelectedTemaId] = useLocalStorage('selectedTemaId', null);
  const [activeTema, setActiveTema] = useState<Tema | null>(null);
  const temaOps = useTemaOperations();

  useEffect(() => {
    const cargarTemasIniciales = async () => {
      try {
        const result = await temaOps.loadTemas();
        if (result.ok && result.data) {
          const temasNormalizados = (result.data as Tema[]).map(normalizeTema);
          setTemas(temasNormalizados);
        } else {
          // Fallback: cargar desde localStorage si existe
          const temasLocales = localStorage.getItem('temas_backup');
          if (temasLocales) {
            try {
              const parsedTemas = JSON.parse(temasLocales);
              const temasNormalizados = parsedTemas.map(normalizeTema);
              setTemas(temasNormalizados);
            } catch (parseError) {
              console.error('Error al parsear temas de localStorage:', parseError);
            }
          }
        }
      } catch (error) {
        // Fallback: intentar localStorage
        const temasLocales = localStorage.getItem('temas_backup');
        if (temasLocales) {
          try {
            const parsedTemas = JSON.parse(temasLocales);
            const temasNormalizados = parsedTemas.map(normalizeTema);
            setTemas(temasNormalizados);
          } catch (parseError) {
            console.error('Error al parsear temas de localStorage:', parseError);
          }
        }
      }
    };
    cargarTemasIniciales();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedTemaId) {
      const found = temas.find((t) => t.id === selectedTemaId);
      setActiveTema(found || null);
    } else {
      setActiveTema(null);
    }
  }, [selectedTemaId, temas]);

  const toggleTheme = useCallback(() => {
    setUserPreferences((prev) => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  }, [setUserPreferences]);

  const addRecentItem = useCallback((item: RecentItem) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => i.path !== item.path);
      return [item, ...filtered].slice(0, 5);
    });
  }, [setRecentItems]);

  useEffect(() => {
    const root = document.documentElement;
    if (userPreferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [userPreferences.theme]);

  const selectTema = useCallback((id: string | null) => {
    setSelectedTemaId(id);
  }, [setSelectedTemaId]);

  const createNewTema = useCallback(async (data: { nombre: string; descripcion?: string }) => {
    const result = await temaOps.createNewTema(data);
    if (result.ok && result.data) {
      const normalizedTema = normalizeTema(result.data as Tema);
      setTemas((prev) => {
        const newTemas = [normalizedTema, ...prev];
        // Backup to localStorage
        localStorage.setItem('temas_backup', JSON.stringify(newTemas));
        return newTemas;
      });
      setSelectedTemaId(normalizedTema.id);
    }
    return result;
  }, [temaOps, setSelectedTemaId]);

  const updateTemaData = useCallback(async (id: string, data: { nombre: string; descripcion?: string }) => {
    const result = await temaOps.updateExistingTema(id, data);
    if (result.ok && result.data) {
      setTemas((prev) => {
        const newTemas = prev.map((t) => (t.id === id ? normalizeTema(result.data as Tema) : t));
        // Backup to localStorage
        localStorage.setItem('temas_backup', JSON.stringify(newTemas));
        return newTemas;
      });
    }
    return result;
  }, [temaOps]);

  const deleteTemaById = useCallback(async (id: string) => {
    const result = await temaOps.deleteExistingTema(id);
    if (result.ok) {
      setTemas((prev) => {
        const newTemas = prev.filter((t) => t.id !== id);
        // Backup to localStorage
        localStorage.setItem('temas_backup', JSON.stringify(newTemas));
        return newTemas;
      });
      if (selectedTemaId === id) {
        setSelectedTemaId(null);
      }
    }
    return result;
  }, [temaOps, selectedTemaId, setSelectedTemaId]);
  
  const replaceTemaPalabras = useCallback(async (id: string, palabras: string[]) => {
    const result = await temaOps.replaceTemaPalabras(id, { palabras });
    if (result.ok && result.data) {
        setTemas(prev => prev.map(t => t.id === id ? { ...t, palabras: stringsToPalabras(result.data!.palabras) } : t));
    }
    return result;
  }, [temaOps]);

  const value: AppContextValue = {
    userPreferences,
    toggleTheme,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    recentItems,
    addRecentItem,
    temas,
    selectedTemaId,
    activeTema,
    selectTema,
    createNewTema,
    updateTemaData,
    deleteTemaById,
    replaceTemaPalabras,
    loadingStates: temaOps.loadingStates,
    error: temaOps.error,
    successMessage: temaOps.successMessage,
    clearMessages: temaOps.clearMessages,
    isLoading: temaOps.isLoading
  };

  return (
    <BookProvider>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </BookProvider>
  );
}
