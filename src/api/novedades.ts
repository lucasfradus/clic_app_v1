import { apiFetch } from './client';
import type { Novedad } from '../types';

export async function getNovedades(): Promise<Novedad[]> {
  const res = await apiFetch<{ novedades: Novedad[] }>('/novedades');
  return res.novedades;
}
