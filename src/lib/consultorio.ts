// Fechas del consultorio en hora argentina, independientes de la zona del
// dispositivo: el backend recibe y devuelve días como YYYY-MM-DD de Argentina.
// Argentina está en UTC-3 fijo (sin horario de verano desde 2009), así que se
// corre el instante 3 h y se leen los campos UTC. No depende del soporte de
// zonas horarias de Intl en el motor JS. Al final, qué puede reservar en cada
// servicio (lo usan los pasos de "Sacar una cita").

import type { PrestacionConsultorio, ServicioConsultorio } from '@/types';

const OFFSET_AR_MS = -3 * 60 * 60 * 1000;

/** El instante corrido a hora argentina: leer siempre con getUTC*. */
function enAR(d: Date): Date {
  return new Date(d.getTime() + OFFSET_AR_MS);
}

/** YYYY-MM-DD del día argentino que contiene `d`. */
export function ymdAR(d: Date): string {
  return enAR(d).toISOString().slice(0, 10);
}

/** Suma días a un YYYY-MM-DD (aritmética en UTC: no depende de la zona). */
export function sumarDias(ymd: string, dias: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

/** Los días reservables: desde hoy hasta hoy + `dias` inclusive. */
export function diasReservables(hoy: string, dias: number): string[] {
  return Array.from({ length: dias + 1 }, (_, i) => sumarDias(hoy, i));
}

const LETRAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function partesDia(ymd: string): { letra: string; numero: number; mes: string } {
  const [y, m, d] = ymd.split('-').map(Number);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  return { letra: LETRAS[fecha.getUTCDay()], numero: d, mes: MESES[m - 1] };
}

/** "lunes 20 de octubre" de un YYYY-MM-DD. */
export function diaLargo(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const fecha = new Date(Date.UTC(y, m - 1, d));
  return `${DIAS[fecha.getUTCDay()]} ${d} de ${MESES_LARGOS[m - 1]}`;
}

/** "lunes 20 de octubre" del día argentino de un instante ISO. */
export function fechaLargaAR(iso: string): string {
  return diaLargo(ymdAR(new Date(iso)));
}

/** HH:mm en hora argentina. */
export function horaAR(iso: string): string {
  const d = enAR(new Date(iso));
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** ¿Todavía puede cancelar o reprogramar él mismo? */
export function puedeModificar(cancelableHasta: string, ahora: Date = new Date()): boolean {
  return new Date(cancelableHasta).getTime() > ahora.getTime();
}

// ── Qué puede reservar en cada servicio ──

/** ¿Le queda alguna incluida este mes o el que viene? */
export function tieneIncluida(s: ServicioConsultorio): boolean {
  return s.incluidasPorMes > 0 && s.meses.slice(0, 2).some((m) => m.disponibles > 0);
}

/** Se puede sacar si entra como incluida o si se da como particular. */
export function prestacionDisponible(
  s: ServicioConsultorio,
  p: PrestacionConsultorio
): boolean {
  return tieneIncluida(s) || p.precioParticular !== null;
}

/** "Te queda 1 consulta incluida en octubre" / "Ya usaste la de octubre"; null si el plan no incluye. */
export function textoIncluidas(s: ServicioConsultorio): string | null {
  const mes = s.meses[0];
  if (s.incluidasPorMes === 0 || !mes) return null;
  if (mes.disponibles === 0) {
    return `Ya usaste ${s.incluidasPorMes === 1 ? 'la' : 'las'} de ${mes.mes}`;
  }
  return mes.disponibles === 1
    ? `Te queda 1 consulta incluida en ${mes.mes}`
    : `Te quedan ${mes.disponibles} consultas incluidas en ${mes.mes}`;
}
