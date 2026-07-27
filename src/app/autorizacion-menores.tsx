// Gate 2 — Autorización de menores en modo gate: pantalla standalone sin
// tabs, tag "Antes de empezar", sin botón volver. Corre después del
// consentimiento (§3).
import { Redirect } from 'expo-router';
import { useGuard } from '@/components/useGuard';
import Loader from '@/components/ui/Loader';
import AutorizacionMenoresForm from '@/components/AutorizacionMenoresForm';

export default function AutorizacionMenoresGate() {
  // Requiere token + consentimiento; no exige la autorización (es este gate).
  const guard = useGuard({ requireAutorizacionMenores: false });
  if (guard.state === 'loading') return <Loader />;
  if (guard.state === 'redirect') return <Redirect href={guard.href} />;

  return <AutorizacionMenoresForm esGate />;
}
