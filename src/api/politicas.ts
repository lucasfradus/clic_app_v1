import { apiFetch } from './client';
import type { PoliticasTexto } from '../types';

export function getPoliticasTexto() {
  return apiFetch<PoliticasTexto>('/politicas/texto', { auth: false });
}
