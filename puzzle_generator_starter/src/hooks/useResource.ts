import { useState, useCallback } from 'react';

// --- TIPOS ---

interface Repository<T> {
  getAll: () => Promise<{ ok: boolean; data?: T[]; error?: string; }>;
  getById: (id: string) => Promise<{ ok: boolean; data?: T; error?: string; }>;
  create: (data: any) => Promise<{ ok: boolean; data?: T; error?: string; }>;
  update: (id: string, data: any) => Promise<{ ok: boolean; data?: T; error?: string; }>;
  delete: (id: string) => Promise<{ ok: boolean; error?: string; }>;
}

interface ResourceHook<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  fetchById: (id: string) => Promise<T | null>;
  create: (data: any) => Promise<T | null>;
  update: (id: string, data: any) => Promise<T | null>;
  remove: (id: string) => Promise<void>;
}

// =============================================================================
// FACTORÍA DE HOOKS
// =============================================================================

export function createResourceHook<T>(repository: Repository<T>): () => ResourceHook<T> {
  return function useResource(): ResourceHook<T> {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await repository.getAll();
        if (result.ok && result.data) {
          setData(result.data);
        } else {
          setError(result.error || 'Error al cargar los recursos');
        }
      } catch (err: any) {
        setError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    }, []);

    const fetchById = useCallback(async (id: string): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await repository.getById(id);
        if (result.ok && result.data) {
          return result.data;
        } else {
          setError(result.error || 'Error al cargar el recurso');
          return null;
        }
      } catch (err: any) {
        setError(err.message || 'Error de conexión');
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

    const create = useCallback(async (createData: any): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await repository.create(createData);
        if (result.ok && result.data) {
          setData((prevData) => [result.data as T, ...prevData]);
          return result.data;
        } else {
          setError(result.error || 'Error al crear el recurso');
          return null;
        }
      } catch (err: any) {
        setError(err.message || 'Error de conexión');
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

    const update = useCallback(async (id: string, updateData: any): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await repository.update(id, updateData);
        if (result.ok && result.data) {
          setData((prevData) => prevData.map((item: any) => (item.id === id ? result.data : item)));
          return result.data;
        } else {
          setError(result.error || 'Error al actualizar el recurso');
          return null;
        }
      } catch (err: any) {
        setError(err.message || 'Error de conexión');
        return null;
      } finally {
        setLoading(false);
      }
    }, []);

    const remove = useCallback(async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await repository.delete(id);
        if (result.ok) {
          setData((prevData) => prevData.filter((item: any) => item.id !== id));
        } else {
          setError(result.error || 'Error al eliminar el recurso');
        }
      } catch (err: any) {
        setError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    }, []);

    return { data, loading, error, fetchAll, fetchById, create, update, remove };
  };
}
