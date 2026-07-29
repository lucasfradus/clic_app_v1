// Novedades (port de pages/Novedades.tsx). Estados: loading / error con
// Reintentar / vacío ("Todo tranquilo") / lista. Al cargar OK marca leídas
// (maxId por alumno) y limpia el badge del tab.
import { useCallback, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card, DarkCard } from '@/components/ui/Card';
import { TagLabel } from '@/components/ui/Text';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import Watermark from '@/components/brand/Watermark';
import HtmlContent from '@/components/ui/HtmlContent';
import { getNovedades } from '@/api/novedades';
import type { Novedad } from '@/types';
import { relativeFromNow } from '@/lib/date';
import { ApiError } from '@/api/client';
import { setLastSeenNovedadId } from '@/lib/novedadesLeidas';
import { useAuth } from '@/store/auth';
import { useNovedades } from '@/store/novedades';
import { colors, fonts } from '@/theme';

type Status = 'loading' | 'ok' | 'error';

export default function Novedades() {
  const [status, setStatus] = useState<Status>('loading');
  const [items, setItems] = useState<Novedad[]>([]);
  const [error, setError] = useState<string | null>(null);
  const alumnoId = useAuth((s) => s.alumnoId);
  const setNoLeidas = useNovedades((s) => s.setNoLeidas);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await getNovedades();
      setItems(data);
      setStatus('ok');
      if (alumnoId && data.length > 0) {
        const maxId = data.reduce((m, n) => (n.id > m ? n.id : m), 0);
        setLastSeenNovedadId(alumnoId, maxId);
      }
      setNoLeidas(0);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error inesperado');
      }
      setStatus('error');
    }
  }, [alumnoId, setNoLeidas]);

  // Recarga al enfocar el tab (equivale al remount por navegación de la web).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageHeader title="Novedades" />

      {status === 'loading' && (
        <Card style={styles.center}>
          <TagLabel>Cargando novedades…</TagLabel>
        </Card>
      )}

      {status === 'error' && (
        <Card style={styles.center}>
          <TagLabel>No pudimos cargar</TagLabel>
          <Text style={styles.errorTitle}>{error ?? 'Algo salió mal'}</Text>
          <Button title="Reintentar" onPress={load} />
        </Card>
      )}

      {status === 'ok' && items.length === 0 && (
        <DarkCard style={styles.empty}>
          <Watermark color="white" size={200} opacity={0.07} />
          <TagLabel style={styles.emptyTag}>Todo tranquilo</TagLabel>
          <Text style={styles.emptyTitle}>No hay avisos nuevos.</Text>
          <Text style={styles.emptyDesc}>
            Cuando tu sede publique algo importante, lo vas a ver acá.
          </Text>
        </DarkCard>
      )}

      {status === 'ok' &&
        items.map((n) => (
          <Card key={n.id} style={styles.novCard}>
            <View style={styles.novHead}>
              <Text style={styles.novTitle}>{n.titulo}</Text>
              <TagLabel>{relativeFromNow(n.publicadaEn)}</TagLabel>
            </View>

            {n.imagenUrl && (
              <Image
                source={{ uri: n.imagenUrl }}
                style={styles.novImage}
                resizeMode="cover"
              />
            )}

            <HtmlContent html={n.contenido} horizontalPadding={80} />
          </Card>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    gap: 18,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  errorTitle: {
    fontFamily: fonts.light,
    fontSize: 18,
    color: colors.inkSoft,
    marginTop: 4,
    marginBottom: 12,
  },
  empty: {
    paddingVertical: 36,
    paddingHorizontal: 28,
    minHeight: 220,
    justifyContent: 'center',
  },
  emptyTag: {
    color: 'rgba(253, 251, 250, 0.5)',
    zIndex: 1,
  },
  emptyTitle: {
    fontFamily: fonts.light,
    fontSize: 22,
    lineHeight: 26,
    color: colors.surface,
    marginTop: 12,
    zIndex: 1,
  },
  emptyDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: 'rgba(253, 251, 250, 0.6)',
    marginTop: 16,
    zIndex: 1,
  },
  novCard: {
    padding: 20,
  },
  novHead: {
    gap: 6,
    marginBottom: 14,
  },
  novTitle: {
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 22,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  novImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 16,
    backgroundColor: colors.lineSoft,
  },
});
