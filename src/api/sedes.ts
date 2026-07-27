import { apiFetch } from './client';
import type { SedeAccesible, Salon } from '../types';

export function getSedesAccesibles() {
  return apiFetch<SedeAccesible[]>('/sedes');
}

export function getSalones(sedeId?: number) {
  return apiFetch<Salon[]>('/salones', { query: { sedeId } });
}
