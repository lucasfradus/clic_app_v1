import { apiFetch } from './client';
import type { Clase } from '../types';

export function getClases(params: {
  sedeId?: number;
  salonId?: number;
  desde: string;
  dias?: number;
}) {
  return apiFetch<Clase[]>('/clases', {
    query: {
      sedeId: params.sedeId,
      salonId: params.salonId,
      desde: params.desde,
      dias: params.dias ?? 7,
    },
  });
}
