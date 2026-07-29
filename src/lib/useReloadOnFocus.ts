// §9.4: Home y Agenda recargan al enfocar la pantalla y al volver la app a
// foreground (equivalente móvil del listener 'focus' de window en la web).
// Motivo de negocio: la promoción de lista de espera → reserva la hace el
// backend automáticamente y el cliente la refleja al refrescar.
import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useReloadOnFocus(load: () => void) {
  // Guardamos la última versión de `load` en un ref para que los efectos NO
  // dependan de su identidad. Si dependieran, cada recarga cambia las
  // suscripciones -> cambia `activa` (useMemo) -> cambia `loadClases` ->
  // cambia `load`, y useFocusEffect se re-dispararía en loop (las clases
  // parpadean: lista -> "Cargando…" -> lista -> …). Con el ref, el efecto
  // corre solo al enfocar de verdad / al volver a foreground.
  const loadRef = useRef(load);
  loadRef.current = load;

  useFocusEffect(
    useCallback(() => {
      loadRef.current();
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadRef.current();
    });
    return () => sub.remove();
  }, []);
}
