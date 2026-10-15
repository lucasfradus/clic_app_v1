import { apiFetch } from './client';
import type {
  CitaConsultorio,
  EstadoSena,
  HuecoConsultorio,
  InicioSena,
  ServicioConsultorio,
} from '../types';
import { trackEvent } from '../lib/analytics';

/** Servicios que el socio puede reservar (nutrición, kinesio) con sus incluidas del mes. */
export function getServiciosConsultorio() {
  return apiFetch<ServicioConsultorio[]>('/consultorio');
}

/**
 * Horarios libres de un día (fecha = YYYY-MM-DD de Argentina). Al reprogramar
 * se pasa la cita actual para que no cuente contra la incluida del mes.
 */
export function getHuecos(params: {
  sedeId: number;
  prestacionId: number;
  fecha: string;
  citaId?: number;
}) {
  return apiFetch<HuecoConsultorio[]>('/consultorio/huecos', {
    query: params,
  });
}

export function getCitas(tipo: 'proximas' | 'historial') {
  return apiFetch<CitaConsultorio[]>('/consultorio/citas', {
    query: { tipo },
  });
}

export async function reservarCita(body: {
  prestacionId: number;
  franjaId: number;
  inicio: string;
}) {
  const r = await apiFetch<{ citaId: number; message: string }>(
    '/consultorio/citas',
    { method: 'POST', body }
  );
  trackEvent('reservar_cita', { prestacion_id: body.prestacionId });
  return r;
}

export async function reprogramarCita(body: {
  citaId: number;
  franjaId: number;
  inicio: string;
}) {
  const r = await apiFetch<{ message: string }>('/consultorio/citas', {
    method: 'PATCH',
    body,
  });
  trackEvent('reprogramar_cita', { cita_id: body.citaId });
  return r;
}

/**
 * Consulta particular: retiene el horario 15 minutos y devuelve el link de MP
 * para pagar la seña. `volverA`: a dónde vuelve MP (una URL https de la web del
 * socio). Si el servicio no cobra seña, la cita queda reservada directamente.
 */
export async function iniciarSena(body: {
  prestacionId: number;
  franjaId: number;
  inicio: string;
  volverA: string;
}) {
  const r = await apiFetch<InicioSena>('/consultorio/senas', {
    method: 'POST',
    body,
  });
  trackEvent('initPoint' in r ? 'iniciar_sena' : 'reservar_cita', {
    prestacion_id: body.prestacionId,
  });
  return r;
}

/** Estado de la seña al volver de MP (el backend consulta a MP si sigue pendiente). */
export function getEstadoSena(solicitudId: number) {
  return apiFetch<EstadoSena>(`/consultorio/senas/${solicitudId}`);
}

export async function cancelarCita(citaId: number) {
  const r = await apiFetch<{ message: string }>('/consultorio/citas', {
    method: 'DELETE',
    query: { citaId },
  });
  trackEvent('cancelar_cita', { cita_id: citaId });
  return r;
}
