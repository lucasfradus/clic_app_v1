// §9.4: Home y Agenda recargan al enfocar la pantalla y al volver la app a
// foreground (equivalente móvil del listener 'focus' de window en la web).
// Motivo de negocio: la promoción de lista de espera → reserva la hace el
// backend automáticamente y el cliente la refleja al refrescar.
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useReloadOnFocus(load: () => void) {
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => sub.remove();
  }, [load]);
}
