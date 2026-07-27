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
