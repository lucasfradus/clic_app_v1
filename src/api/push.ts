// Cliente de la API de push (Clicnet /api/v1/push/*). Los endpoints se crean en
// el backend en la Fase 1; hasta entonces estas llamadas 404ean (los callers
// las envuelven en try/catch, el push es best-effort).
import { apiFetch } from './client';
import type { NotifPrefs } from '@/lib/notifPrefs';

/** Registra/actualiza el push token del dispositivo para el alumno logueado. */
export function registerPushToken(token: string, platform: string) {
  return apiFetch('/push/register', {
    method: 'POST',
    body: { token, platform },
  });
}

/** Da de baja el token (al cerrar sesión). */
export function unregisterPushToken(token: string) {
  return apiFetch('/push/register', {
    method: 'DELETE',
    body: { token },
  });
}

/** Sincroniza las preferencias de notificación al server. */
export function syncNotifPrefs(prefs: NotifPrefs) {
  return apiFetch('/push/prefs', { method: 'PUT', body: prefs });
}

/** Trae las preferencias guardadas en el server (para hidratar los toggles). */
export function fetchNotifPrefs() {
  return apiFetch<NotifPrefs>('/push/prefs');
}
