// Autorización de menores — estado (port de pages/AutorizacionMenores.tsx).
// Consulta y reenvío cuando la autorización ya está al día; el gate
// obligatorio vive en /autorizacion-menores (root).
import { useCallback, useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { getAutorizacionMenoresFirmado } from '@/api/autorizacionMenores';
import { useAuth } from '@/store/auth';
import type {
  AutorizacionMenoresFirmado as AMF,
  TutorRelacion,
} from '@/types';
import { formatDateLong } from '@/lib/date';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { Card } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormBack } from '@/components/ui/Form';
import { resolveFotoUrl } from '@/components/ui/Avatar';
import { colors, fonts } from '@/theme';

const RELACION_LABEL: Record<TutorRelacion, string> = {
  PADRE: 'Padre',
  MADRE: 'Madre',
  TUTOR: 'Tutor/a',
};

export default function AutorizacionMenores() {
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const [data, setData] = useState<AMF | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');

  const load = useCallback(() => {
    setStatus('loading');
    getAutorizacionMenoresFirmado()
      .then((d) => {
        setData(d);
        setStatus('ok');
      })
      .catch((e: ApiError) => {
        toast.error(e.message);
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    load();
    // Best-effort: sincroniza el perfil del store para que el gate refleje
    // el estado real (aprobación/rechazo hechos desde recepción).
    fetchPerfil().catch(() => {});
  }, [load, fetchPerfil]);

  // Reenviar solo cuando nunca se envió o fue rechazada.
  const puedeEnviar =
    data?.requerido && (data.estado == null || data.estado === 'RECHAZADA');

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <FormBack />
        <TagLabel>Documento</TagLabel>
        <PageTitle style={styles.title}>Autorización de menores</PageTitle>
      </View>

      <Card style={styles.card}>
        {status === 'loading' ? (
          <TagLabel>Cargando…</TagLabel>
        ) : status === 'error' || !data ? (
          <>
            <TagLabel>No se pudo cargar</TagLabel>
            <Button title="Reintentar" onPress={load} style={styles.selfStart} />
          </>
        ) : !data.requerido ? (
          <TagLabel style={styles.centered}>
            Tu sede no requiere autorización de menores.
          </TagLabel>
        ) : (
          <>
            <View style={styles.statusRow}>
              {data.estado === 'APROBADA' && (
                <Badge variant="ok">Aprobada</Badge>
              )}
              {data.estado === 'PENDIENTE' && (
                <Badge variant="wait">En revisión</Badge>
              )}
              {data.estado === 'RECHAZADA' && (
                <Badge variant="lw">Rechazada</Badge>
              )}
              {!data.firmado && !data.estado && (
                <Badge variant="fu">No enviada</Badge>
              )}
              {data.version && <TagLabel>Versión {data.version}</TagLabel>}
            </View>

            {data.estado === 'PENDIENTE' && (
              <Text style={styles.note}>
                La autorización fue enviada y está en revisión por el estudio.
                Te avisamos cuando la aprueben.
              </Text>
            )}
            {data.estado === 'APROBADA' && (
              <Text style={styles.note}>
                La autorización de tu tutor fue aprobada. No tenés nada más que
                hacer.
              </Text>
            )}
            {data.estado === 'RECHAZADA' && (
              <Text style={[styles.note, styles.noteDanger]}>
                Fue rechazada
                {data.motivoRechazo ? `: ${data.motivoRechazo}` : ''}. Volvé a
                enviarla.
              </Text>
            )}
            {!data.firmado && !data.estado && (
              <Text style={styles.note}>
                Como sos menor de edad, tu sede pide una autorización de tu
                padre, madre o tutor/a con una foto de su documento. Necesitás
                enviarla para usar la app.
              </Text>
            )}

            {data.firmado && data.tutor && (
              <View style={styles.field}>
                <TagLabel>Tutor</TagLabel>
                <Text style={styles.fieldMain}>
                  {data.tutor.nombre} {data.tutor.apellido} ·{' '}
                  {RELACION_LABEL[data.tutor.relacion] ?? data.tutor.relacion}
                </Text>
                <Text style={styles.fieldSub}>
                  DNI {data.tutor.dni} · {data.tutor.contacto}
                </Text>
              </View>
            )}

            {data.firmado && data.fecha && (
              <View style={styles.field}>
                <TagLabel>Fecha de envío</TagLabel>
                <Text style={styles.fieldMain}>
                  {formatDateLong(data.fecha)}
                </Text>
              </View>
            )}

            {data.firmado && data.documentoUrl && (
              <View style={styles.field}>
                <TagLabel>Documento del tutor</TagLabel>
                <Pressable
                  onPress={() =>
                    Linking.openURL(resolveFotoUrl(data.documentoUrl!)).catch(
                      () => {}
                    )
                  }
                >
                  <Text style={styles.docLink}>Ver foto del documento ↗</Text>
                </Pressable>
              </View>
            )}

            {puedeEnviar && (
              <Button
                title={
                  data.estado === 'RECHAZADA'
                    ? 'Volver a enviar'
                    : 'Completar autorización'
                }
                onPress={() =>
                  router.push('/perfil/autorizacion-menores-enviar')
                }
                style={styles.selfStart}
              />
            )}
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 32 },
  head: { marginBottom: 24 },
  title: { marginTop: 6 },
  card: { padding: 24, gap: 18 },
  centered: { textAlign: 'center', paddingVertical: 20 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.inkSoft,
  },
  noteDanger: { color: colors.terracotta },
  field: { gap: 6 },
  fieldMain: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  fieldSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSoft },
  docLink: { fontFamily: fonts.regular, fontSize: 13, color: colors.neutralDark },
  selfStart: { alignSelf: 'flex-start' },
});
