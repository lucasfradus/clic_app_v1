import { apiFetch } from './client';
import type { Turno } from '../types';

// El backend devuelve un array plano de turnos. Cada item trae `tipo`
// ('RESERVA' | 'LISTA_ESPERA') y `claseId`; `posicion` solo en lista de espera,
// `reservaId`/`estado` solo en reservas. Las entradas de lista de espera solo
// aparecen en ?tipo=proximos (historial/cancelados son todas RESERVA).
export function getTurnos(tipo: 'proximos' | 'historial' | 'cancelados') {
  return apiFetch<Turno[]>('/turnos', { query: { tipo } });
}
