// Cadena de gates de acceso — port literal de las condiciones de
// clic-webapp-clientes/src/components/ProtectedRoute.tsx. El orden importa:
// token → consentimiento → autorización de menores → app.

import type { Perfil } from '../types';

// consentimientoRequerido !== false: backends viejos no mandan el campo
export function faltaConsentimiento(
  perfil: Perfil,
  consentimientoNoRequerido: boolean
): boolean {
  return (
    perfil.consentimientoRequerido !== false &&
    !perfil.consentimientoFirmado &&
    !consentimientoNoRequerido
  );
}

// Menores: obligatorio después del consentimiento. Bloquea si nunca se envió
// o fue rechazada; PENDIENTE y APROBADA no bloquean (la revisión es del
// estudio). Legacy: firmado del flujo viejo sin estado tampoco bloquea.
export function faltaAutorizacionMenores(perfil: Perfil): boolean {
  return (
    perfil.autorizacionMenoresRequerido === true &&
    (perfil.autorizacionMenoresEstado === 'RECHAZADA' ||
      (perfil.autorizacionMenoresEstado == null &&
        !perfil.autorizacionMenoresFirmado))
  );
}
