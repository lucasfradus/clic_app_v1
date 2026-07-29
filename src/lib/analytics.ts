// Analytics con Firebase (Google Analytics for Firebase). El wiring es a prueba
// de fallos: si el módulo nativo no está presente (dev-build sin el rebuild que
// lo incluye), todo hace no-op en vez de romper la app. Los call-sites
// (login/logout en el store, reservas/lista-espera en la API) ya existen.

export type AnalyticsEventName =
  | 'login'
  | 'logout'
  | 'reserva_clase'
  | 'lista_espera'
  | 'cancelar_reserva'
  | 'salir_lista_espera'
  | 'page_view';

type AnalyticsInstance = {
  logEvent: (name: string, params?: Record<string, unknown>) => Promise<void>;
  logScreenView: (params: {
    screen_name: string;
    screen_class: string;
  }) => Promise<void>;
};
type AnalyticsFactory = () => AnalyticsInstance;

let cached: AnalyticsFactory | null = null;
let intentado = false;

function getAnalytics(): AnalyticsFactory | null {
  if (intentado) return cached;
  intentado = true;
  try {
    // Require lazy: si el módulo nativo no está (build viejo), no rompe.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('@react-native-firebase/analytics').default;
  } catch {
    cached = null;
  }
  return cached;
}

export function trackEvent(
  name: AnalyticsEventName,
  params?: Record<string, unknown>
) {
  try {
    const a = getAnalytics();
    if (a) void a().logEvent(name, params);
  } catch {
    // no-op
  }
}

/** Registra una vista de pantalla (screen_view de Firebase). */
export function trackScreen(name: string) {
  try {
    const a = getAnalytics();
    if (a) void a().logScreenView({ screen_name: name, screen_class: name });
  } catch {
    // no-op
  }
}
