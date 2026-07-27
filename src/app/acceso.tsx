// Acceso — credencial QR del molinete (port de pages/Acceso.tsx).
// Fullscreen blanco para máximo contraste, sin tabs. La credencial es única
// por alumno; se cachea en SecureStore por ownerId para funcionar offline.
// expo-keep-awake mantiene la pantalla encendida mientras está montada y
// expo-brightness sube el brillo al máximo (mejora nativa, best-effort).
import { useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useKeepAwake } from 'expo-keep-awake';
import * as Brightness from 'expo-brightness';
import { useGuard } from '@/components/useGuard';
import Loader from '@/components/ui/Loader';
import { useAuth } from '@/store/auth';
import { getCredencialQr } from '@/api/controlAcceso';
import { getCachedQr, setCachedQr } from '@/lib/accessQr';
import { fonts } from '@/theme';

type Estado = 'cargando' | 'ok' | 'sin-conexion';

function AccesoBody() {
  const perfil = useAuth((s) => s.perfil);
  const ownerId = perfil?.id ?? null;
  const insets = useSafeAreaInsets();

  const [qrValue, setQrValue] = useState<string | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');

  useKeepAwake();

  // Brillo al máximo mientras la pantalla está montada; restaurar al salir.
  useEffect(() => {
    let anterior: number | null = null;
    (async () => {
      try {
        anterior = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(1);
      } catch {
        // Sin permiso / no soportado: no es crítico.
      }
    })();
    return () => {
      if (anterior != null) {
        Brightness.setBrightnessAsync(anterior).catch(() => {});
      }
    };
  }, []);

  // Mostrar primero el cache (si es del usuario actual) y refrescar de fondo.
  useEffect(() => {
    if (ownerId == null) return;
    let cancelado = false;

    getCachedQr(ownerId).then((cached) => {
      if (cancelado || !cached) return;
      // No pisar un valor fresco de la red si llegó antes.
      setQrValue((v) => v ?? cached);
    });

    getCredencialQr()
      .then((res) => {
        if (cancelado) return;
        setQrValue(res.qrValue);
        setCachedQr(ownerId, res.qrValue);
        setEstado('ok');
      })
      .catch(async () => {
        if (cancelado) return;
        // Offline / error: usamos lo cacheado si existe.
        const cached = await getCachedQr(ownerId);
        if (cancelado) return;
        setEstado(cached ? 'ok' : 'sin-conexion');
      });

    return () => {
      cancelado = true;
    };
  }, [ownerId]);

  return (
    <View style={styles.page}>
      <Pressable
        style={[styles.back, { top: Math.max(16, insets.top) }]}
        onPress={() => router.back()}
        accessibilityLabel="Volver"
      >
        <Text style={styles.backText}>✕</Text>
      </Pressable>

      {qrValue ? (
        <View style={styles.body}>
          <View style={styles.qrBox}>
            <QRCode value={qrValue} size={260} ecl="M" quietZone={16} />
          </View>
          <Text style={styles.nombre}>
            {perfil ? `${perfil.nombre} ${perfil.apellido}` : ''}
          </Text>
          <Text style={styles.hint}>Acercá este código al lector</Text>
        </View>
      ) : estado === 'sin-conexion' ? (
        <View style={styles.body}>
          <Text style={styles.msg}>
            Conectate una vez para habilitar tu QR de acceso.
          </Text>
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={[styles.msg, styles.subtle]}>
            Generando tu credencial…
          </Text>
        </View>
      )}
    </View>
  );
}

export default function Acceso() {
  const guard = useGuard();
  if (guard.state === 'loading') return <Loader />;
  if (guard.state === 'redirect') return <Redirect href={guard.href} />;
  return <AccesoBody />;
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  back: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backText: {
    fontSize: 24,
    color: '#111111',
  },
  body: {
    alignItems: 'center',
    gap: 20,
  },
  qrBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  nombre: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: '#111111',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#888888',
  },
  msg: {
    fontFamily: fonts.regular,
    maxWidth: 280,
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    textAlign: 'center',
  },
  subtle: {
    color: '#999999',
  },
});
