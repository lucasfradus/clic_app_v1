import { apiFetch } from './client';
import type { AuthResponse } from '../types';

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
}

export function changePassword(passwordActual: string, passwordNueva: string) {
  return apiFetch<void>('/auth/password', {
    method: 'PUT',
    body: { passwordActual, passwordNueva },
  });
}

/** Pide un código de 6 dígitos por email. Siempre resuelve (anti-enumeración). */
export function forgotPassword(email: string) {
  return apiFetch<{ ok: boolean }>('/auth/forgot', {
    method: 'POST',
    body: { email },
    auth: false,
  });
}

/** Valida el código y setea la nueva contraseña. */
export function resetPassword(email: string, code: string, password: string) {
  return apiFetch<{ ok: boolean }>('/auth/reset', {
    method: 'POST',
    body: { email, code, password },
    auth: false,
  });
}

/**
 * Elimina (anonimiza) la cuenta del usuario autenticado. Irreversible. El
 * server pide confirmar la contraseña si la cuenta tiene una.
 */
export function deleteAccount(password: string) {
  return apiFetch<{ ok: boolean }>('/auth/account', {
    method: 'DELETE',
    body: { password },
  });
}
