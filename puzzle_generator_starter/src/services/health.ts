import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { get } from './apiClient';

// --- TIPOS ---

export interface HealthResponse {
  status: 'ok' | 'error';
  version: string;
  database: 'ok' | 'error';
}

export interface SystemStatus {
  api: 'ok' | 'error' | 'loading';
  database: 'ok' | 'error' | 'loading';
  version?: string;
}

// =============================================================================
// SERVICIO DE SALUD
// =============================================================================

/**
 * Verifica el estado de la API y la conexión a la base de datos.
 * @returns Un objeto con el estado detallado del sistema.
 */
export async function checkSystemHealth(): Promise<SystemStatus> {
  try {
    const r = await get<HealthResponse>(API_ENDPOINTS.HEALTH);
    
    if (!r.ok || r.data?.status !== 'ok') {
      // Si la petición falla o el estado de la API no es 'ok'
      return { api: 'error', database: 'error' };
    }

    const { version, database } = r.data;
    
    // El estado de la DB depende de la respuesta del endpoint
    const dbStatus = database === 'ok' ? 'ok' : 'error';

    return { api: 'ok', database: dbStatus, version };

  } catch (error) {
    console.error("Error al verificar el estado del sistema:", error);
    return { api: 'error', database: 'error' };
  }
}