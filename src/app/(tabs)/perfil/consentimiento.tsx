// Consentimiento firmado — consulta desde Perfil (port de
// pages/ConsentimientoFirmado.tsx): no requerido / pendiente / firmado.
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getConsentimientoFirmado } from '@/api/consentimiento';
import type { ConsentimientoFirmado as CF } from '@/types';
import { formatDateLong } from '@/lib/date';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { Card } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormBack } from '@/components/ui/Form';
import { colors, fonts } from '@/theme';

export default function ConsentimientoFirmado() {
  const [data, setData] = useState<CF | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConsentimientoFirmado()
      .then(setData)
      .catch((e: ApiError) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <FormBack />
        <TagLabel>Documento</TagLabel>
        <PageTitle style={styles.title}>Consentimiento</PageTitle>
      </View>

      <Card style={styles.card}>
        {loading ? (
          <TagLabel>Cargando…</TagLabel>
        ) : !data ? (
          <TagLabel>Sin datos</TagLabel>
        ) : !data.requerido ? (
          <TagLabel style={styles.centered}>
            Esta sede no requiere consentimiento informado.
          </TagLabel>
        ) : !data.firmado ? (
          <>
            <View style={styles.statusRow}>
              <Badge variant="lw">Pendiente</Badge>
              <TagLabel>Versión requerida: {data.versionRequerida}</TagLabel>
            </View>
            <Button
              title="Firmar ahora"
              onPress={() => router.push('/consentimiento')}
              style={styles.firmarBtn}
            />
          </>
        ) : (
          <>
            <View style={styles.statusRow}>
              <Badge variant="ok">Firmado</Badge>
              <TagLabel>Versión {data.version}</TagLabel>
            </View>
            <View style={styles.field}>
              <TagLabel>Fecha</TagLabel>
              <Text style={styles.fecha}>{formatDateLong(data.fecha)}</Text>
            </View>
            {data.firma && (
              <View style={styles.field}>
                <TagLabel>Firma</TagLabel>
                <Image
                  source={{ uri: data.firma }}
                  style={styles.firma}
                  resizeMode="contain"
                />
              </View>
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  firmarBtn: { alignSelf: 'flex-start' },
  field: { gap: 8 },
  fecha: { fontFamily: fonts.regular, fontSize: 14, color: colors.ink },
  firma: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 14,
    width: '100%',
    height: 180,
  },
});
