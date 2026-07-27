import { apiFetch } from './client';
import type {
  AutorizacionMenoresTexto,
  AutorizacionMenoresFirmado,
  EnviarAutorizacionMenoresBody,
} from '../types';

export function getAutorizacionMenoresTexto() {
  return apiFetch<AutorizacionMenoresTexto>('/autorizacion-menores/texto', {
    auth: false,
  });
}

export function getAutorizacionMenoresFirmado() {
  return apiFetch<AutorizacionMenoresFirmado>('/autorizacion-menores/firmado');
}

export function enviarAutorizacionMenores(body: EnviarAutorizacionMenoresBody) {
  return apiFetch<{ message: string; estado: 'PENDIENTE' }>(
    '/autorizacion-menores',
    { method: 'POST', body }
  );
}
