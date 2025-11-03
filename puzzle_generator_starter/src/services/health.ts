import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { get } from './apiClient';

// --- TIPOS ---

interface HealthResponse {
  status: string;
  version: string;
}

interface CheckHealthResult {
  online: boolean;
  version?: string;
}

// =============================================================================
// SERVICIO DE SALUD
// =============================================================================

export async function checkHealth(): Promise<CheckHealthResult> {
  const r = await get(API_ENDPOINTS.HEALTH);
  if (!r.ok) return { online: false };
  const { status, version } = r.data || {};
  return { online: status === 'ok', version };
}
