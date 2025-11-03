const base = (import.meta?.env?.VITE_API_BASE_URL) || '/api'
const DEFAULT_TIMEOUT = 10000 // 10 segundos

// Función helper para crear fetch con timeout
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Función helper para validar y parsear respuesta
async function handleResponse(response) {
  if (!response.ok) {
    return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` }
  }
  
  try {
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return { ok: true, data }
    } else {
      // Si no es JSON, devolver texto
      const text = await response.text()
      return { ok: true, data: text }
    }
  } catch (parseError) {
    return { 
      ok: false, 
      error: `Error parsing response: ${parseError.message}` 
    }
  }
}

export async function get(path, options = {}) {
  try {
    const res = await fetchWithTimeout(`${base}${path}`, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        ...options.headers 
      },
      timeout: options.timeout || DEFAULT_TIMEOUT
    })
    return await handleResponse(res)
  } catch (e) {
    if (e.name === 'AbortError') {
      return { ok: false, error: 'Request timeout' }
    }
    return { ok: false, error: `Network error: ${e.message}` }
  }
}

export async function post(path, payload, options = {}) {
  try {
    const res = await fetchWithTimeout(`${base}${path}`, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        ...options.headers 
      },
      body: JSON.stringify(payload),
      timeout: options.timeout || DEFAULT_TIMEOUT
    })
    return await handleResponse(res)
  } catch (e) {
    if (e.name === 'AbortError') {
      return { ok: false, error: 'Request timeout' }
    }
    return { ok: false, error: `Network error: ${e.message}` }
  }
}

export async function put(path, payload, options = {}) {
  try {
    const res = await fetchWithTimeout(`${base}${path}`, {
      method: 'PUT',
      headers: { 
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        ...options.headers 
      },
      body: JSON.stringify(payload),
      timeout: options.timeout || DEFAULT_TIMEOUT
    })
    return await handleResponse(res)
  } catch (e) {
    if (e.name === 'AbortError') {
      return { ok: false, error: 'Request timeout' }
    }
    return { ok: false, error: `Network error: ${e.message}` }
  }
}

export async function del(path, options = {}) {
  try {
    const res = await fetchWithTimeout(`${base}${path}`, {
      method: 'DELETE',
      headers: { 
        'Accept': 'application/json',
        ...options.headers 
      },
      timeout: options.timeout || DEFAULT_TIMEOUT
    })
    return await handleResponse(res)
  } catch (e) {
    if (e.name === 'AbortError') {
      return { ok: false, error: 'Request timeout' }
    }
    return { ok: false, error: `Network error: ${e.message}` }
  }
}
