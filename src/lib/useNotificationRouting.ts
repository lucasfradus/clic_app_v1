// Al tocar una notificación push, rutea a la pantalla según el `data.tipo` que
// mandan los hooks del backend. Cubre dos casos: app abierta desde la notif
// (cold start) y notif tocada con la app ya abierta.
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';

function rutaPara(data: unknown): Href | null {
  const tipo = (data as { tipo?: string } | undefined)?.tipo;
  switch (tipo) {
    case 'lista_espera':
    case 'clase_cancelada':
      return '/agenda';
    case 'novedad':
      return '/novedades';
    case 'vencimiento':
      return '/cuenta';
    default:
      return null;
  }
}

export function useNotificationRouting() {
  useEffect(() => {
    let activo = true;

    // App abierta DESDE una notificación (arranque en frío).
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!activo || !response) return;
      const ruta = rutaPara(response.notification.request.content.data);
      if (ruta) router.push(ruta);
    });

    // Notificación tocada con la app ya abierta.
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const ruta = rutaPara(response.notification.request.content.data);
        if (ruta) router.push(ruta);
      }
    );

    return () => {
      activo = false;
      sub.remove();
    };
  }, []);
}
