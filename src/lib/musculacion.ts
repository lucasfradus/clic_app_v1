// Helpers de "Mi rutina" (port de lib/musculacion.ts de la web).
import type {
  EjercicioRutina,
  EntrenamientoMusculacion,
  MusculacionEstado,
} from '../types';

/** "3 × 10–12 · 30 seg · descanso 60 s · RIR 2". Vacío si el profe no cargó indicaciones. */
export function indicaciones(e: EjercicioRutina): string {
  const partes: string[] = [];
  if (e.series && e.repeticiones) partes.push(`${e.series} × ${e.repeticiones}`);
  else if (e.series) partes.push(`${e.series} ${e.series === 1 ? 'serie' : 'series'}`);
  else if (e.repeticiones) partes.push(`${e.repeticiones} rep.`);
  if (e.tiempoSegundos) partes.push(`${e.tiempoSegundos} seg`);
  if (e.descansoSegundos) partes.push(`descanso ${e.descansoSegundos} s`);
  if (e.rir) partes.push(`RIR ${e.rir}`);
  return partes.join(' · ');
}

/** 12.5 → "12,5". */
export function textoPeso(valor: number): string {
  return String(valor).replace('.', ',');
}

/** 12.5 → "12,5 kg". */
export function kg(valor: number): string {
  return `${textoPeso(valor)} kg`;
}

/** "2026-10-03" → "03/10". */
export function diaMes(fecha: string): string {
  const [, mes, dia] = fecha.split('-');
  return `${dia}/${mes}`;
}

/** Clave con la que el backend guarda el peso de un ejercicio dentro de un entrenamiento. */
export function clavePeso(bloqueKey: string, ejercicioIndex: number): string {
  return `${bloqueKey}:${ejercicioIndex}`;
}

/** Interpreta lo que escribe el alumno ("12,5", "12.5", ""): null = borrar, undefined = inválido. */
export function parsePeso(texto: string): number | null | undefined {
  const limpio = texto.trim().replace(',', '.');
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 && n <= 2000 ? Math.round(n * 100) / 100 : undefined;
}

/** El entrenamiento de hoy para ese día de la rutina asignada, si ya se empezó. */
export function entrenamientoDeHoy(
  estado: MusculacionEstado,
  diaKey: string
): EntrenamientoMusculacion | undefined {
  const rutina = estado.rutina;
  if (!rutina) return undefined;
  return estado.entrenamientos.find(
    (e) => e.asignacionId === rutina.id && e.diaKey === diaKey && e.fecha === estado.hoy
  );
}

/** Todos los bloques del entrenamiento están marcados como terminados. */
export function diaTerminado(e: EntrenamientoMusculacion): boolean {
  return e.completados.length >= e.bloques.length;
}
