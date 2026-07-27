// Equivalente móvil de ProtectedRoute.tsx: cada layout/pantalla protegida
// consulta el guard y redirige según la cadena de gates.

import { useAuth } from '../store/auth';
import { faltaConsentimiento, faltaAutorizacionMenores } from '../lib/gates';

interface Options {
  requireConsent?: boolean;
  requireAutorizacionMenores?: boolean;
}

export type GuardResult =
  | { state: 'loading' }
  | { state: 'redirect'; href: '/login' | '/consentimiento' | '/autorizacion-menores' }
  | { state: 'ok' };

export function useGuard({
  requireConsent = true,
  requireAutorizacionMenores = true,
}: Options = {}): GuardResult {
  const token = useAuth((s) => s.token);
  const perfil = useAuth((s) => s.perfil);
  const bootstrapped = useAuth((s) => s.bootstrapped);
  const consentimientoNoRequerido = useAuth((s) => s.consentimientoNoRequerido);

  // Esperar la restauración de sesión antes de decidir (evita flash de login).
  if (!bootstrapped) return { state: 'loading' };

  if (!token) return { state: 'redirect', href: '/login' };

  // Esperar bootstrap del perfil
  if (!perfil) return { state: 'loading' };

  if (requireConsent && faltaConsentimiento(perfil, consentimientoNoRequerido)) {
    return { state: 'redirect', href: '/consentimiento' };
  }

  if (requireAutorizacionMenores && faltaAutorizacionMenores(perfil)) {
    return { state: 'redirect', href: '/autorizacion-menores' };
  }

  return { state: 'ok' };
}
