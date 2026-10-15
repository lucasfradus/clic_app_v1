// Vuelta del pago de la seña del consultorio (port de useVueltaDeSena de la
// web). En la web MP redirige a la página y la URL dice qué seña mirar; acá el
// pago se hace en un navegador dentro de la app y la seña en curso vive en
// `useSenaEnCurso`. Mientras siga PENDIENTE se consulta cada 3 s, hasta 20
// veces: el webhook de MP (o el backend, que le pregunta a MP) la confirma.
//
// Cuándo arranca a consultar:
//  - iOS: openBrowserAsync resuelve al cerrar el navegador → el caller llama a
//    `seguir()`.
//  - Android: openBrowserAsync puede resolver apenas abre la Custom Tab
//    ('opened'), así que la señal es la app volviendo a primer plano (AppState).
//  - Al enfocar la pantalla, por si se fue y volvió con una seña sin resolver.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getEstadoSena } from '@/api/consultorio';
import { useSenaEnCurso } from '@/store/sena';
import type { EstadoSena } from '@/types';

const INTERVALO_MS = 3000;
const MAX_INTENTOS = 20;

export type VueltaSena = { estado: EstadoSena | null; agotado: boolean };

export function useVueltaDeSena(onConfirmada: () => void) {
  const [seguida, setSeguida] = useState<number | null>(null);
  const [estado, setEstado] = useState<EstadoSena | null>(null);
  const [agotado, setAgotado] = useState(false);
  const [cerrado, setCerrado] = useState(false);

  const seguidaRef = useRef<number | null>(null);
  const consultando = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const montado = useRef(true);
  // Igual que useReloadOnFocus: la última versión del callback en un ref, para
  // que `seguir` sea estable y los listeners no se re-suscriban en cada render.
  const onConfirmadaRef = useRef(onConfirmada);
  onConfirmadaRef.current = onConfirmada;

  const detener = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    consultando.current = false;
  }, []);

  /** Empieza a consultar la seña en curso. No hace nada si no hay o si ya se está consultando. */
  const seguir = useCallback(() => {
    const id = useSenaEnCurso.getState().solicitudId;
    if (id == null || consultando.current) return;
    consultando.current = true;
    if (seguidaRef.current !== id) {
      // Otra seña: el cartel arranca de cero.
      seguidaRef.current = id;
      setSeguida(id);
      setEstado(null);
      setCerrado(false);
    }
    setAgotado(false);

    let intentos = 0;
    const consultar = async () => {
      try {
        const e = await getEstadoSena(id);
        if (!montado.current || !consultando.current) return;
        setEstado(e);
        if (e.estado !== 'PENDIENTE') {
          detener();
          useSenaEnCurso.getState().olvidar();
          if (e.estado === 'PROCESADA') onConfirmadaRef.current();
          return;
        }
      } catch {
        /* reintenta */
      }
      if (!montado.current || !consultando.current) return;
      if (++intentos >= MAX_INTENTOS) {
        // Queda guardada: la próxima vez que la app vuelva a primer plano se
        // vuelve a consultar.
        setAgotado(true);
        detener();
      } else {
        timer.current = setTimeout(consultar, INTERVALO_MS);
      }
    };
    void consultar();
  }, [detener]);

  useEffect(() => {
    montado.current = true;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') seguir();
    });
    return () => {
      sub.remove();
      montado.current = false;
      detener();
    };
  }, [seguir, detener]);

  useFocusEffect(
    useCallback(() => {
      seguir();
    }, [seguir])
  );

  const cerrar = useCallback(() => setCerrado(true), []);

  const vuelta: VueltaSena | null =
    seguida != null && !cerrado ? { estado, agotado } : null;

  return { vuelta, seguir, cerrar };
}
