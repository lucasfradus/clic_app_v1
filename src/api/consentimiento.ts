import { apiFetch } from './client';
import type {
  ConsentimientoTexto,
  ConsentimientoFirmado,
  FirmarConsentimientoBody,
} from '../types';

export function getConsentimientoTexto() {
  return apiFetch<ConsentimientoTexto>('/consentimiento/texto');
}

export function firmarConsentimiento(body: FirmarConsentimientoBody) {
  return apiFetch<void>('/consentimiento', {
    method: 'POST',
    body,
  });
}

export function getConsentimientoFirmado() {
  return apiFetch<ConsentimientoFirmado>('/consentimiento/firmado');
}
