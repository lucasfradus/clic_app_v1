import type { Suscripcion, SuscripcionGrupo } from '@/types';

/**
 * Fuente unica de "cuantas clases mas puede reservar".
 *
 * Antes cada pantalla hacia `accesos + accesosExtra - accesosUsados` a mano, y
 * esa cuenta esta mal por dos motivos:
 *
 * 1. `accesos` que devuelve `/suscripciones` YA incluye `accesosExtra`, asi que
 *    volver a sumarlo duplicaba los accesos regalados.
 * 2. El backend descuenta el acceso recien en el check-in. Una reserva
 *    confirmada a futuro no mueve `accesosUsados` pero ya tiene el acceso
 *    apalabrado, asi que la pantalla mostraba saldo que al reservar rebotaba.
 *
 * El backend ahora manda `reservables` ya resuelto (contempla planes por grupo
 * y no aplica el descuento a los planes de horario fijo). El fallback existe
 * solo para no romper contra un backend viejo.
 */
export function accesosReservables(s: Suscripcion | undefined | null): number {
  if (!s) return 0;
  if (typeof s.reservables === 'number') return s.reservables;
  return s.accesos - s.accesosUsados;
}

/** Idem por grupo, para los planes multi-sala. */
export function accesosReservablesGrupo(g: SuscripcionGrupo): number {
  if (typeof g.reservables === 'number') return g.reservables;
  return g.accesos - g.accesosUsados;
}
