const API_ROOTLESS_PREFIX = '/db';

export const API_ENDPOINTS = {
  TEMAS: {
    BASE: `${API_ROOTLESS_PREFIX}/temas`,
    BY_ID: (id: string) => `${API_ROOTLESS_PREFIX}/temas/${id}`,
    PALABRAS: (id: string) => `${API_ROOTLESS_PREFIX}/temas/${id}/palabras`,
    PALABRA_BY_INDEX: (id: string, index: number) => `${API_ROOTLESS_PREFIX}/temas/${id}/palabras/${index}`,
  },
  LIBROS: {
    BASE: `${API_ROOTLESS_PREFIX}/libros`,
    BY_ID: (id: string) => `${API_ROOTLESS_PREFIX}/libros/${id}`,
    PAGES: (id: string) => `${API_ROOTLESS_PREFIX}/libros/${id}/paginas`,
    PAGE_BY_ID: (id: string, pageId: string) => `${API_ROOTLESS_PREFIX}/libros/${id}/paginas/${pageId}`,
  },
  HEALTH: '/health',
};
