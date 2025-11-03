import { useCallback, useState } from 'react';
import { createTema } from '../../services/temas';
import type { Tema } from '../../types';
import TemaPanelEntrada from './TemaPanelEntrada';

// --- TIPOS ---

interface CreateTemaParams {
  title: string;
  words: string[];
}

interface CreateTemaResult {
  ok: boolean;
  data?: Tema;
  error?: string;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export default function TemaPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTema = useCallback(async ({ title, words }: CreateTemaParams): Promise<CreateTemaResult> => {
    setIsLoading(true);

    try {
      const tema = await createTema({
        nombre: title,
        words: words,
      });

      return { ok: true, data: tema };
    } catch (error: any) {
      const message = error?.message || 'Error de conexión al crear tema';
      return { ok: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crear Tema</h1>
          <p className="text-gray-600 dark:text-slate-300 mt-2">
            Ingresa un título y palabras separadas por comas
          </p>
        </header>

        <TemaPanelEntrada
          onCreateTema={handleCreateTema}
          isLoading={isLoading}
        />

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Nota</h3>
          <p className="text-sm text-blue-700">
            Actualmente solo se puede crear temas. La edición avanzada requiere actualizar el backend.
          </p>
        </div>
      </div>
    </div>
  );
}