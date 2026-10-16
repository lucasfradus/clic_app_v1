// Base URL absoluta de la API (en móvil no existe el proxy /api de Vite).
// Sobreescribible por entorno con EXPO_PUBLIC_API_BASE_URL (dev contra staging, etc).
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://app.clicpilates.com/api/v1';

// Web del socio (clic-webapp-clientes). Mercado Pago vuelve a una URL de ahí:
// el backend solo acepta vueltas https bajo clicpilates.com, no un esquema
// propio de la app (clic://).
export const WEB_SOCIO_URL =
  process.env.EXPO_PUBLIC_WEB_SOCIO_URL || 'https://clicpilates.com/mi-cuenta';
