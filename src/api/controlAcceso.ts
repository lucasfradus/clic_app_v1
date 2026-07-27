import { apiFetch } from './client';

export interface CredencialQr {
  qrValue: string;
}

/** Credencial de acceso del alumno. Mismo valor siempre (no depende de la sede). */
export function getCredencialQr() {
  return apiFetch<CredencialQr>('/control-acceso/qr');
}
