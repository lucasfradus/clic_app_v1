import { apiFetch } from './client';
import type { MusculacionEstado } from '../types';
import { trackEvent } from '../lib/analytics';
import { API_BASE_URL } from '../config';

/** La rutina asignada, los pesos de la vez pasada y los últimos entrenamientos. */
export function getMusculacion() {
  return apiFetch<MusculacionEstado>('/musculacion');
}

/** Crea (o recupera, si ya existe) el entrenamiento de hoy para ese día de la rutina. */
export async function iniciarEntrenamiento(
  asignacionId: number,
  version: number,
  diaKey: string
): Promise<number> {
  const res = await apiFetch<{ id: number }>('/musculacion', {
    method: 'POST',
    body: { asignacionId, version, diaKey },
  });
  trackEvent('iniciar_entrenamiento');
  return res.id;
}

/** Marca o desmarca un bloque. Devuelve la versión nueva del entrenamiento. */
export async function registrarBloque(
  id: number,
  version: number,
  bloqueKey: string,
  completado: boolean
): Promise<number> {
  const res = await apiFetch<{ version: number }>('/musculacion', {
    method: 'PATCH',
    body: { id, version, tipo: 'bloque', bloqueKey, completado },
  });
  if (completado) trackEvent('terminar_bloque');
  return res.version;
}

/** Guarda el peso de un ejercicio (null lo borra). Devuelve la versión nueva del entrenamiento. */
export async function registrarPeso(
  id: number,
  version: number,
  bloqueKey: string,
  ejercicioIndex: number,
  kg: number | null
): Promise<number> {
  const res = await apiFetch<{ version: number }>('/musculacion', {
    method: 'PATCH',
    body: { id, version, tipo: 'peso', bloqueKey, ejercicioIndex, kg },
  });
  return res.version;
}

/**
 * El backend devuelve el video relativo (/api/v1/musculacion/video?token=…):
 * se resuelve contra el host de la API. El token de la URL es la autorización,
 * así que el reproductor nativo no necesita el header Bearer.
 */
export function urlVideo(videoUrl: string): string {
  if (videoUrl.startsWith('http')) return videoUrl;
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '') + videoUrl;
}
