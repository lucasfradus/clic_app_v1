// Abstracción de analytics. En la v1 móvil es no-op (sin SDK); se mantienen
// los nombres de eventos de la webapp para poder enchufar Firebase Analytics
// (u otro) después sin tocar los call sites.

export type AnalyticsEventName =
  | 'login'
  | 'logout'
  | 'reserva_clase'
  | 'lista_espera'
  | 'cancelar_reserva'
  | 'salir_lista_espera'
  | 'page_view';

export function trackEvent(
  _name: AnalyticsEventName,
  _params?: Record<string, unknown>
) {
  // no-op en v1
}
