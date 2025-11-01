import { get } from './apiClient'
export async function checkHealth() {
  const r = await get('/health')
  if (!r.ok) return { online:false }
  const { status, version } = r.data || {}
  return { online: status === 'ok', version }
}
