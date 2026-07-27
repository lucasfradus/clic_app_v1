// Base URL absoluta de la API (en móvil no existe el proxy /api de Vite).
// Sobreescribible por entorno con EXPO_PUBLIC_API_BASE_URL (dev contra staging, etc).
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://app.clicpilates.com/api/v1';
