export const API_ENDPOINTS = {
  TEMAS: {
    BASE: '/api/db/temas',
    BY_ID: (id: string) => `/api/db/temas/${id}`,
    PALABRAS: (id: string) => `/api/db/temas/${id}/palabras`,
    PALABRA_BY_INDEX: (id: string, index: number) => `/api/db/temas/${id}/palabras/${index}`,
  },
  LIBROS: {
    BASE: '/api/db/libros',
    BY_ID: (id: string) => `/api/db/libros/${id}`,
    PAGES: (id: string) => `/api/db/libros/${id}/paginas`,
    PAGE_BY_ID: (id: string, pageId: string) => `/api/db/libros/${id}/paginas/${pageId}`,
  },
  HEALTH: '/api/health',
};
