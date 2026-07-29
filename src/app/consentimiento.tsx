// Gate 1 — Consentimiento informado (port de pages/Consentimiento.tsx).
// Datos personales read-only + 2 contactos de emergencia + antecedentes de
// salud + texto legal + firma (react-native-signature-canvas → PNG base64,
// mismo contrato que la web) + checkbox. Si el backend responde
// requerido:false → flag de sesión (fuera de perfil) y entrar a la app.
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SignatureScreen, {
  type SignatureViewRef,
} from 'react-native-signature-canvas';
import {
  getConsentimientoTexto,
  firmarConsentimiento,
} from '@/api/consentimiento';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import { ApiError } from '@/api/client';
import { formatShortDate } from '@/lib/date';
import type {
  ConsentimientoTexto,
  ContactoEmergencia,
  DatosSalud,
} from '@/types';
import { useGuard } from '@/components/useGuard';
import Loader from '@/components/ui/Loader';
import { Card } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Field, AcceptCheck, LegalBox } from '@/components/ui/Form';
import HtmlContent from '@/components/ui/HtmlContent';
import { colors, fonts, radius } from '@/theme';

type ConsentData = Extract<ConsentimientoTexto, { requerido: true }>;

const SALUD_LABELS: { key: keyof DatosSalud; label: string }[] = [
  { key: 'cardiacas', label: 'Enfermedades cardíacas / circulatorias' },
  { key: 'oseas', label: 'Problemas óseos o articulares' },
  { key: 'tiroides', label: 'Trastornos de tiroides / hormonales' },
  { key: 'respiratorias', label: 'Problemas respiratorios (asma, EPOC)' },
  { key: 'cirugias', label: 'Cirugías recientes (menos de 1 año)' },
  { key: 'musculares', label: 'Lesiones musculares o tendinosas activas' },
  { key: 'hipertension', label: 'Hipertensión / Hipotensión' },
  { key: 'intoleranciaCalor', label: 'Intolerancia al calor / golpe de calor previo' },
  { key: 'embarazo', label: 'Embarazo' },
  { key: 'diabetes', label: 'Diabetes / trastornos metabólicos' },
  { key: 'mareos', label: 'Mareos, vértigo o pérdidas de conocimiento' },
  { key: 'otra', label: 'Otra condición' },
];

const INIT_EMERGENCIA: ContactoEmergencia = {
  nombre1: '', telefono1: '', vinculo1: '', telefonoAlt1: '',
  nombre2: '', telefono2: '', vinculo2: '', telefonoAlt2: '',
};

const INIT_SALUD: DatosSalud = {
  cardiacas: false, oseas: false, tiroides: false, respiratorias: false,
  cirugias: false, musculares: false, hipertension: false,
  intoleranciaCalor: false, embarazo: false, embarazoSemanas: null,
  diabetes: false, mareos: false, otra: false, detalle: '',
};

// Oculta el footer nativo del signature pad (usamos nuestros botones).
const SIG_WEB_STYLE = `
  .m-signature-pad { box-shadow: none; border: none; margin: 0; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; margin: 0; }
  body, html { background: #fdfbfa; }
`;

function ConsentimientoBody() {
  const perfil = useAuth((s) => s.perfil);
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const setConsentimientoNoRequerido = useAuth(
    (s) => s.setConsentimientoNoRequerido
  );
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<ConsentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [emergencia, setEmergencia] =
    useState<ContactoEmergencia>(INIT_EMERGENCIA);
  const [salud, setSalud] = useState<DatosSalud>(INIT_SALUD);
  const [accepted, setAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const sigRef = useRef<SignatureViewRef>(null);

  useEffect(() => {
    getConsentimientoTexto()
      .then((res) => {
        if (!res.requerido) {
          // Sede sin consentimiento: flag de sesión fuera de perfil, así un
          // fetchPerfil posterior no lo pisa (evita loop / ↔ /consentimiento)
          setConsentimientoNoRequerido(true);
          router.replace('/');
          return;
        }
        setData(res);
      })
      .catch((e: ApiError) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [setConsentimientoNoRequerido]);

  function setEm(field: keyof ContactoEmergencia, value: string) {
    setEmergencia((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSalud(field: keyof DatosSalud) {
    setSalud((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function clearSig() {
    sigRef.current?.clearSignature();
    setHasSignature(false);
  }

  function submit() {
    if (!data) return;
    if (!hasSignature) {
      toast.error('Por favor firmá antes de continuar');
      return;
    }
    if (!emergencia.nombre1.trim() || !emergencia.telefono1.trim()) {
      toast.error(
        'Completá al menos el nombre y teléfono del contacto de emergencia 1'
      );
      return;
    }
    // readSignature dispara onOK con el PNG base64 (o onEmpty si no hay firma).
    setSubmitting(true);
    sigRef.current?.readSignature();
  }

  async function onSignatureReady(firma: string) {
    if (!data) return;
    try {
      await firmarConsentimiento({
        firma,
        version: data.version,
        consentimientoId: data.id,
        emergencia,
        salud,
      });
      await fetchPerfil();
      toast.success('Consentimiento firmado');
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function onSignatureEmpty() {
    setSubmitting(false);
    toast.error('Por favor firmá antes de continuar');
  }

  if (loading) return <Loader />;
  if (!data) return <Loader label="No se pudo cargar" />;

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 40 }]}
      scrollEnabled={scrollEnabled}
      keyboardShouldPersistTaps="handled"
    >
      <Card style={styles.card}>
        <TagLabel>Antes de empezar</TagLabel>
        <PageTitle style={styles.title}>{data.titulo}</PageTitle>

        {/* Datos personales (read-only) */}
        {perfil && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos personales</Text>
            <Field label="Nombre" value={perfil.nombre} disabled />
            <Field label="Apellido" value={perfil.apellido} disabled />
            <Field label="Email" value={perfil.email} disabled />
            <Field label="Teléfono" value={perfil.telefono ?? '—'} disabled />
            <Field label="DNI" value={perfil.dni ?? '—'} disabled />
            <Field
              label="Nacimiento"
              value={
                perfil.fechaNacimiento
                  ? formatShortDate(perfil.fechaNacimiento)
                  : '—'
              }
              disabled
            />
          </View>
        )}

        {/* Contactos de emergencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto de emergencia 1</Text>
          <Field
            label="Nombre completo"
            value={emergencia.nombre1}
            onChangeText={(v) => setEm('nombre1', v)}
          />
          <Field
            label="Teléfono"
            value={emergencia.telefono1}
            onChangeText={(v) => setEm('telefono1', v)}
            keyboardType="phone-pad"
          />
          <Field
            label="Vínculo"
            value={emergencia.vinculo1}
            onChangeText={(v) => setEm('vinculo1', v)}
            placeholder="Ej: madre, pareja"
          />
          <Field
            label="Teléfono alternativo"
            value={emergencia.telefonoAlt1}
            onChangeText={(v) => setEm('telefonoAlt1', v)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto de emergencia 2</Text>
          <Field
            label="Nombre completo"
            value={emergencia.nombre2}
            onChangeText={(v) => setEm('nombre2', v)}
          />
          <Field
            label="Teléfono"
            value={emergencia.telefono2}
            onChangeText={(v) => setEm('telefono2', v)}
            keyboardType="phone-pad"
          />
          <Field
            label="Vínculo"
            value={emergencia.vinculo2}
            onChangeText={(v) => setEm('vinculo2', v)}
            placeholder="Ej: hermano/a, amigo/a"
          />
          <Field
            label="Teléfono alternativo"
            value={emergencia.telefonoAlt2}
            onChangeText={(v) => setEm('telefonoAlt2', v)}
            keyboardType="phone-pad"
          />
        </View>

        {/* Antecedentes de salud */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Antecedentes de salud</Text>
          <Text style={styles.saludDesc}>
            Marcá las condiciones que apliquen a tu situación actual o pasada.
          </Text>
          <View style={styles.pills}>
            {SALUD_LABELS.map(({ key, label }) => {
              const active = salud[key] as boolean;
              return (
                <Pressable
                  key={key}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => toggleSalud(key)}
                >
                  <Text
                    style={[styles.pillText, active && styles.pillTextActive]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {salud.embarazo && (
            <Field
              label="Semanas de embarazo"
              value={salud.embarazoSemanas != null ? String(salud.embarazoSemanas) : ''}
              onChangeText={(v) =>
                setSalud((prev) => ({
                  ...prev,
                  embarazoSemanas: v ? Number(v.replace(/[^0-9]/g, '')) : null,
                }))
              }
              keyboardType="number-pad"
              placeholder="Ej: 16"
            />
          )}

          {salud.otra ? (
            <Field
              label="¿Cuál?"
              value={salud.detalle}
              onChangeText={(v) =>
                setSalud((prev) => ({ ...prev, detalle: v }))
              }
              placeholder="Describí brevemente"
            />
          ) : (
            <View style={styles.fieldWrap}>
              <TagLabel>Comentarios adicionales</TagLabel>
              <TextInput
                style={styles.textarea}
                multiline
                numberOfLines={3}
                placeholder="Algo más que quieras que sepamos"
                placeholderTextColor={colors.inkMute}
                value={salud.detalle}
                onChangeText={(v) =>
                  setSalud((prev) => ({ ...prev, detalle: v }))
                }
              />
            </View>
          )}
        </View>

        {/* Texto del consentimiento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consentimiento informado</Text>
          <LegalBox>
            <HtmlContent html={data.texto} horizontalPadding={136} />
          </LegalBox>
        </View>

        {/* Firma */}
        <View style={styles.section}>
          <TagLabel>Firmá aquí</TagLabel>
          <View style={styles.canvas}>
            <SignatureScreen
              ref={sigRef}
              penColor={colors.ink}
              backgroundColor={colors.surface}
              webStyle={SIG_WEB_STYLE}
              onOK={onSignatureReady}
              onEmpty={onSignatureEmpty}
              onBegin={() => {
                setScrollEnabled(false);
                setHasSignature(true);
              }}
              onEnd={() => setScrollEnabled(true)}
            />
          </View>
          <Pressable onPress={clearSig}>
            <Text style={styles.clearText}>Limpiar firma</Text>
          </Pressable>
        </View>

        <AcceptCheck
          checked={accepted}
          onToggle={() => setAccepted((v) => !v)}
          label="Leí y acepto el consentimiento informado"
        />

        <Button
          title={submitting ? 'Enviando…' : 'Firmar y continuar'}
          onPress={submit}
          disabled={!accepted || !hasSignature || submitting}
          style={styles.submit}
        />
      </Card>
    </ScrollView>
  );
}

export default function Consentimiento() {
  // Requiere token, pero no consentimiento ni autorización (es el gate 1).
  const guard = useGuard({
    requireConsent: false,
    requireAutorizacionMenores: false,
  });
  if (guard.state === 'loading') return <Loader />;
  if (guard.state === 'redirect') return <Redirect href={guard.href} />;
  return <ConsentimientoBody />;
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40 },
  card: { padding: 24, gap: 24 },
  title: { marginTop: 6 },
  section: { gap: 14 },
  sectionTitle: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 0.2,
  },
  saludDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  pillActive: { backgroundColor: colors.neutral, borderColor: colors.neutral },
  pillText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 0.3,
    color: colors.inkSoft,
  },
  pillTextActive: { fontFamily: fonts.semibold, color: colors.ink },
  fieldWrap: { gap: 8 },
  textarea: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.ink,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  canvas: {
    height: 200,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  clearText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.neutralDark,
  },
  submit: { paddingVertical: 14 },
});
