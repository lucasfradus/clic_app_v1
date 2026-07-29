import {
  format,
  parseISO,
  differenceInMinutes,
  differenceInHours,
  differenceInCalendarDays,
  startOfWeek,
  addDays,
  isSameDay,
  getMonth,
  getYear,
  formatDistanceToNow,
} from 'date-fns';
import { es } from 'date-fns/locale';

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function esMedianocheUTC(d: Date): boolean {
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

/**
 * Resuelve un valor de la API al DIA que representa, como Date en medianoche
 * local. Distingue tres formatos:
 *  1. "YYYY-MM-DD" — fecha de calendario (vigencias, fecha de nacimiento). Es
 *     lo que manda la API v1; se toma tal cual.
 *  2. ISO a medianoche UTC exacta — fecha de calendario servida por una version
 *     vieja del backend. Parsearla como instante la corria al dia anterior en
 *     UTC-3 ("vence 01/08" cuando el fin era el 02/08), asi que se toma el dia UTC.
 *  3. cualquier otro ISO — instante real (pagos, clases): se resuelve en la TZ
 *     del dispositivo, que es lo correcto.
 */
function diaDeCalendario(iso: string): Date {
  const instante = parseISO(iso);
  const ymd = SOLO_FECHA.test(iso)
    ? iso
    : !isNaN(instante.getTime()) && esMedianocheUTC(instante)
      ? iso.slice(0, 10)
      : null;
  if (!ymd) return instante;
  const [anio, mes, dia] = ymd.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function formatShortDate(iso: string): string {
  return format(diaDeCalendario(iso), 'dd/MM/yyyy');
}

/**
 * Dias de calendario hasta la fecha. El `fin` de una suscripcion es INCLUSIVO
 * (el backend lo extiende a las 23:59 de ese dia), asi que comparar por dia y
 * no por instante es lo que hace que el ultimo dia todavia diga "Vence" y
 * recien al siguiente pase a "Vencio".
 */
export function daysFromNow(iso: string): number {
  return differenceInCalendarDays(diaDeCalendario(iso), new Date());
}

/**
 * "YYYY-MM-DD" -> Date en medianoche LOCAL, para inicializar un date picker
 * nativo. `new Date('2026-08-02')` lo parsea como UTC y en UTC-3 el picker
 * abriria posicionado en el dia anterior.
 */
export function fromYMD(ymd: string): Date {
  const [anio, mes, dia] = ymd.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

/**
 * Date -> "YYYY-MM-DD" tomando el dia LOCAL, que es el que el usuario eligio.
 * `toISOString().slice(0, 10)` sobre una fecha en medianoche local devuelve el
 * dia anterior en UTC-3.
 */
export function toYMD(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function formatARS(monto: number): string {
  return monto.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
}

export function relativeFromNow(iso: string): string {
  return formatDistanceToNow(parseISO(iso), {
    addSuffix: true,
    locale: es,
  });
}

export function parse(iso: string): Date {
  return parseISO(iso);
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

export function formatDate(iso: string, pattern = "EEE d MMM"): string {
  return format(parseISO(iso), pattern, { locale: es });
}

export function formatDateLong(iso: string): string {
  return format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });
}

export function durationMinutes(inicio: string, fin: string): number {
  return differenceInMinutes(parseISO(fin), parseISO(inicio));
}

export function hoursUntil(iso: string): number {
  return differenceInHours(parseISO(iso), new Date());
}

export function weekDays(ref: Date): Date[] {
  const monday = startOfWeek(ref, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function sameDay(isoA: string, b: Date): boolean {
  return isSameDay(parseISO(isoA), b);
}

export { addDays, getMonth, getYear };

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function toISODate(d: Date): string {
  return d.toISOString();
}
