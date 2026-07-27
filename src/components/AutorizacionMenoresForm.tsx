// Formulario de autorización de menores en doble modo (port de
// pages/AutorizacionMenoresForm.tsx):
// - Modo gate (/autorizacion-menores): standalone sin tabs, tag "Antes de
//   empezar", sin botón volver.
// - Modo reenvío (/perfil/autorizacion-menores-enviar): con navegación normal.
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAutorizacionMenoresTexto,
  getAutorizacionMenoresFirmado,
  enviarAutorizacionMenores,
} from '../api/autorizacionMenores';
import { useAuth } from '../store/auth';
import { toast } from '../store/toast';
import { ApiError } from '../api/client';
import { pickCompressedDataUri } from '../lib/image';
import type {
  AutorizacionMenoresTexto,
  AutorizacionMenoresFirmado,
  TutorRelacion,
} from '../types';
import { Card } from './ui/Card';
import { TagLabel, PageTitle } from './ui/Text';
import { Button } from './ui/Button';
import { FormBack, Field, Pills, AcceptCheck, LegalBox } from './ui/Form';
import HtmlContent from './ui/HtmlContent';
import { colors, fonts, radius } from '../theme';

const RELACIONES = [
  { value: 'MADRE', label: 'Madre' },
  { value: 'PADRE', label: 'Padre' },
  { value: 'TUTOR', label: 'Tutor/a' },
] as const;

export default function AutorizacionMenoresForm({
  esGate,
}: {
  esGate: boolean;
}) {
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<AutorizacionMenoresTexto | null>(null);
  const [firmado, setFirmado] = useState<AutorizacionMenoresFirmado | null>(
    null
  );
  const [status, setStatus] = useState<'loading' | 'error' | 'ok'>('loading');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [contacto, setContacto] = useState('');
  const [relacion, setRelacion] = useState<TutorRelacion | null>(null);
  const [documento, setDocumento] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fotoSheet, setFotoSheet] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [texto, estado] = await Promise.all([
        getAutorizacionMenoresTexto(),
        getAutorizacionMenoresFirmado(),
      ]);
      // Guard con datos frescos del backend (no con el perfil cacheado del
      // store): solo se puede enviar si nunca se envió o fue rechazada.
      if (
        !estado.requerido ||
        estado.estado === 'PENDIENTE' ||
        estado.estado === 'APROBADA'
      ) {
        // Sincronizar el perfil antes de salir: el gate lee del store y con
        // datos viejos rebotaría de vuelta acá (loop).
        await fetchPerfil().catch(() => {});
        router.replace('/perfil/autorizacion-menores');
        return;
      }
      setFirmado(estado);
      setData(texto);
      setStatus('ok');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      setStatus('error');
    }
  }, [fetchPerfil]);

  useEffect(() => {
    load();
  }, [load]);

  async function pickDocumento(source: 'galeria' | 'camara') {
    try {
      const uri = await pickCompressedDataUri(source);
      if (uri) setDocumento(uri);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'No pudimos leer la imagen'
      );
    }
  }

  async function submit() {
    if (!data) return;
    if (!nombre.trim() || !apellido.trim() || !dni.trim() || !contacto.trim()) {
      toast.error('Completá todos los datos del tutor');
      return;
    }
    if (!relacion) {
      toast.error('Indicá la relación con el tutor');
      return;
    }
    if (!documento) {
      toast.error('Adjuntá una foto del documento del tutor');
      return;
    }
    setSubmitting(true);
    try {
      await enviarAutorizacionMenores({
        firma: 'Acepto los términos de la autorización',
        documento,
        version: data.version,
        tutorNombre: nombre.trim(),
        tutorApellido: apellido.trim(),
        tutorDni: dni.trim(),
        tutorContacto: contacto.trim(),
        tutorRelacion: relacion,
      });
      // Con await: el gate lee el estado del perfil en el store; navegar con
      // datos viejos rebotaría de vuelta al form (loop).
      await fetchPerfil();
      toast.success('Autorización enviada. Queda en revisión por el estudio.');
      router.replace('/perfil/autorizacion-menores');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.page,
        esGate && { paddingTop: insets.top + 40 },
      ]}
    >
      <View style={styles.head}>
        {!esGate && <FormBack label="← Autorización" />}
        <TagLabel>{esGate ? 'Antes de empezar' : 'Autogestión'}</TagLabel>
        <PageTitle style={styles.title}>
          {data?.titulo ?? 'Autorización de menores'}
        </PageTitle>
      </View>

      <Card style={styles.card}>
        {status === 'loading' ? (
          <TagLabel>Cargando…</TagLabel>
        ) : status === 'error' ? (
          <>
            <TagLabel>No se pudo cargar</TagLabel>
            <Button title="Reintentar" onPress={load} style={styles.selfStart} />
          </>
        ) : !data ? null : (
          <>
            {firmado?.estado === 'RECHAZADA' && (
              <Text style={[styles.note, styles.noteDanger]}>
                Tu autorización anterior fue rechazada
                {firmado.motivoRechazo ? `: ${firmado.motivoRechazo}` : ''}.
                Completá el formulario de nuevo.
              </Text>
            )}

            <Text style={styles.note}>
              Este formulario lo completa tu padre, madre o tutor/a. Tu sede lo
              pide para poder usar la app: al enviarlo queda en revisión del
              estudio y ya podés seguir.
            </Text>

            <LegalBox>
              <HtmlContent html={data.texto} horizontalPadding={136} />
            </LegalBox>

            <Field
              label="Nombre del tutor"
              value={nombre}
              onChangeText={setNombre}
            />
            <Field
              label="Apellido del tutor"
              value={apellido}
              onChangeText={setApellido}
            />
            <Field
              label="DNI del tutor"
              value={dni}
              onChangeText={setDni}
              keyboardType="number-pad"
            />
            <Field
              label="Contacto (tel. o email)"
              value={contacto}
              onChangeText={setContacto}
              placeholder="Ej: +54 11 5555 1234"
            />

            <View style={styles.field}>
              <TagLabel>Relación con el alumno</TagLabel>
              <Pills
                options={RELACIONES}
                selected={relacion ?? ''}
                onSelect={(v) => setRelacion(v)}
              />
            </View>

            <View style={styles.field}>
              <TagLabel>Foto del documento del tutor</TagLabel>
              <Pressable
                style={styles.photoDrop}
                onPress={() => setFotoSheet(true)}
              >
                {documento ? (
                  <>
                    <Image
                      source={{ uri: documento }}
                      style={styles.photoPreview}
                      resizeMode="contain"
                    />
                    <Text style={styles.photoDropText}>
                      Tocar para cambiar la foto
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.photoDropIcon}>⌗</Text>
                    <Text style={styles.photoDropText}>
                      Sacá o adjuntá una foto del DNI (frente)
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            <AcceptCheck
              checked={accepted}
              onToggle={() => setAccepted((v) => !v)}
              label="Soy el padre, madre o tutor/a y acepto los términos de la autorización"
            />

            <Button
              title={submitting ? 'Enviando…' : 'Enviar autorización'}
              onPress={submit}
              disabled={!accepted || !documento || submitting}
              style={styles.submit}
            />
          </>
        )}
      </Card>

      {/* Sheet cámara / galería */}
      <Modal
        visible={fotoSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setFotoSheet(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setFotoSheet(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TagLabel style={styles.sheetTitle}>Foto del documento</TagLabel>
            <Pressable
              style={styles.sheetItem}
              onPress={() => {
                setFotoSheet(false);
                pickDocumento('camara');
              }}
            >
              <Text style={styles.sheetItemText}>Sacar foto</Text>
            </Pressable>
            <Pressable
              style={styles.sheetItem}
              onPress={() => {
                setFotoSheet(false);
                pickDocumento('galeria');
              }}
            >
              <Text style={styles.sheetItemText}>Elegir de la galería</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40 },
  head: { marginBottom: 24 },
  title: { marginTop: 6 },
  card: { padding: 24, gap: 18 },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    color: colors.inkSoft,
  },
  noteDanger: { color: colors.terracotta },
  field: { gap: 8 },
  selfStart: { alignSelf: 'flex-start' },
  photoDrop: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    backgroundColor: colors.bg,
    borderRadius: 14,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  photoDropIcon: { fontSize: 22, color: colors.inkSoft },
  photoDropText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  submit: { marginTop: 12, paddingVertical: 14 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 47, 52, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sheetTitle: { marginBottom: 12, marginLeft: 12 },
  sheetItem: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  sheetItemText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
  },
});
