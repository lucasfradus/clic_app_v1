import {
  format,
  parseISO,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  startOfWeek,
  addDays,
  isSameDay,
  getMonth,
  getYear,
  formatDistanceToNow,
} from 'date-fns';
import { es } from 'date-fns/locale';

export function formatShortDate(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy');
}

export function daysFromNow(iso: string): number {
  return differenceInDays(parseISO(iso), new Date());
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
