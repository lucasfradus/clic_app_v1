// Área protegida: bottom tabs con header CLIC. El guard replica la cadena
// completa de ProtectedRoute (token → consentimiento → menores → tabs).
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useGuard } from '@/components/useGuard';
import AppHeader from '@/components/layout/AppHeader';
import ClicTabBar from '@/components/layout/ClicTabBar';
import Preloader from '@/components/ui/Preloader';
import { getNovedades } from '@/api/novedades';
import { getLastSeenNovedadId } from '@/lib/novedadesLeidas';
import { useAuth } from '@/store/auth';
import { useNovedades } from '@/store/novedades';
import { usePush } from '@/store/push';
import { registerForPushNotificationsAsync } from '@/lib/push';
import { registerPushToken } from '@/api/push';
import { useNotificationRouting } from '@/lib/useNotificationRouting';
import { colors } from '@/theme';

export default function TabsLayout() {
  const guard = useGuard();
  const alumnoId = useAuth((s) => s.alumnoId);
  const checkedRef = useRef(false);
  const pushRef = useRef(false);

  // Deep-link: al tocar una notificación, rutea según su tipo.
  useNotificationRouting();

  // Registro de push (una vez por sesión, tras pasar el guard): saca el
  // ExpoPushToken y lo manda a Clicnet (POST /push/register). Best-effort.
  useEffect(() => {
    if (guard.state !== 'ok' || pushRef.current) return;
    pushRef.current = true;
    registerForPushNotificationsAsync().then((token) => {
      usePush.getState().setToken(token);
      console.log('[PUSH TOKEN]', token ?? 'no disponible');
      if (token) {
        registerPushToken(token, Platform.OS).catch(() => {
          // best-effort: se reintenta en el próximo ingreso
        });
      }
    });
  }, [guard.state]);

  // Chequeo de novedades no leídas al entrar a la app (una vez por sesión).
  // Adaptación móvil de AppLayout.tsx: badge numérico en el tab en vez de
  // forzar la navegación (el push ya cumple el rol de avisar).
  useEffect(() => {
    if (guard.state !== 'ok' || checkedRef.current || !alumnoId) return;
    checkedRef.current = true;
    (async () => {
      try {
        const novedades = await getNovedades();
        if (novedades.length === 0) return;
        const lastSeen = await getLastSeenNovedadId(alumnoId);
        const noLeidas = novedades.filter((n) => n.id > lastSeen).length;
        useNovedades.getState().setNoLeidas(noLeidas);
      } catch {
        // No bloquear la UX si falla la API — el alumno entra normal.
      }
    })();
  }, [guard.state, alumnoId]);

  if (guard.state === 'loading') return <Preloader />;
  if (guard.state === 'redirect') return <Redirect href={guard.href} />;

  return (
    <Tabs
      tabBar={() => <ClicTabBar />}
      screenOptions={{
        header: () => <AppHeader />,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="cuenta" />
      <Tabs.Screen name="novedades" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
