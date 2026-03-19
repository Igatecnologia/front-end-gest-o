export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString().trim() || 'http://localhost:3000'

export const USE_MOCKS =
  String(import.meta.env.VITE_USE_MOCKS ?? 'true').toLowerCase() === 'true'

