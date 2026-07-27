// Políticas del establecimiento (port de pages/Politicas.tsx).
import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { getPoliticasTexto } from '@/api/politicas';
import type { PoliticasTexto } from '@/types';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { Card } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { FormBack, LegalBox } from '@/components/ui/Form';
import HtmlContent from '@/components/ui/HtmlContent';

export default function Politicas() {
  const [data, setData] = useState<PoliticasTexto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPoliticasTexto()
      .then(setData)
      .catch((e: ApiError) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <FormBack />
        <TagLabel>Establecimiento</TagLabel>
        <PageTitle style={styles.title}>
          {data?.titulo ?? 'Políticas'}
        </PageTitle>
      </View>

      <Card style={styles.card}>
        {loading ? (
          <TagLabel>Cargando…</TagLabel>
        ) : !data ? (
          <TagLabel>Sin datos</TagLabel>
        ) : (
          <>
            <TagLabel>Versión {data.version}</TagLabel>
            <LegalBox>
              <HtmlContent html={data.texto} horizontalPadding={136} />
            </LegalBox>
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
});
