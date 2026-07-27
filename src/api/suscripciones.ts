import { apiFetch } from './client';
import type { Suscripcion } from '../types';

export function getSuscripciones() {
  return apiFetch<Suscripcion[]>('/suscripciones');
}
