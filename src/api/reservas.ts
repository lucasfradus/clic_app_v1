import { apiFetch } from './client';
import type { ReservaResult } from '../types';
import { trackEvent } from '../lib/analytics';

/**
 * POST /reservas. Si hay cupo, crea la reserva: { reservaId, message }. Si la
 * clase está llena, el backend inscribe en lista de espera y devuelve
 * { enListaEspera: true, posicion, yaEstaba, message }. `yaEstaba` es true si el
 * alumno ya estaba anotado (posicion trae la que ya tenía).
 */
export async function reservar(claseId: number): Promise<ReservaResult> {
  const d = await apiFetch<{
    enListaEspera?: boolean;
    posicion?: number;
    yaEstaba?: boolean;
    reservaId?: number;
    message?: string;
  }>('/reservas', { method: 'POST', body: { claseId } });
  const result: ReservaResult = {
    enListaEspera: d.enListaEspera === true,
    posicion: d.posicion,
    yaEstaba: d.yaEstaba === true,
    reservaId: d.reservaId,
    message: d.message,
  };
  trackEvent(result.enListaEspera ? 'lista_espera' : 'reserva_clase', {
    clase_id: claseId,
  });
  return result;
}

export async function cancelarReserva(reservaId: number) {
  await apiFetch<void>('/reservas', {
    method: 'DELETE',
    query: { reservaId },
  });
  trackEvent('cancelar_reserva');
}

/**
 * DELETE /reservas/lista-espera?claseId=... — sale de la lista de espera de una
 * clase. Distinto de cancelar una reserva confirmada (DELETE /reservas?reservaId).
 * Si no estaba en la lista, el backend responde 404 { error }.
 */
export async function salirListaEspera(claseId: number) {
  await apiFetch<void>('/reservas/lista-espera', {
    method: 'DELETE',
    query: { claseId },
  });
  trackEvent('salir_lista_espera', { clase_id: claseId });
}
