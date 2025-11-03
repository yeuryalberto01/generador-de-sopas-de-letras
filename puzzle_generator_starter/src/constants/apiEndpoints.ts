export const API_ENDPOINTS = {
  TEMAS: {
    BASE: '/temas',
    BY_ID: (id: string) => `/temas/${id}`,
    PALABRAS: (id: string) => `/temas/${id}/palabras`,
    PALABRA_BY_INDEX: (id: string, index: number) => `/temas/${id}/palabras/${index}`,
  },
  HEALTH: '/health',
};
