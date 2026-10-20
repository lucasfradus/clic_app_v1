// Mi rutina (port de pages/Rutina.tsx): la rutina de musculación que le armó
// su profe, día por día, con los videos de cada ejercicio y los pesos de la
// vez pasada. Para estos socios la pestaña News pasa a ser Rutina (ver
// ClicTabBar); las novedades quedan a mano desde Home.
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Card, DarkCard } from '@/components/ui/Card';
import { TagLabel } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import PageHeader from '@/components/layout/PageHeader';
import VideoEjercicio from '@/components/musculacion/VideoEjercicio';
import { getMusculacion } from '@/api/musculacion';
import { ApiError } from '@/api/client';
import {
  diaMes,
  diaTerminado,
  entrenamientoDeHoy,
  indicaciones,
  kg,
} from '@/lib/musculacion';
import { useReloadOnFocus } from '@/lib/useReloadOnFocus';
import { useAuth } from '@/store/auth';
import type { MusculacionEstado } from '@/types';
import { colors, fonts, radius } from '@/theme';

export default function Rutina() {
  const perfil = useAuth((s) => s.perfil);
  const [estado, setEstado] = useState<MusculacionEstado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diaKey, setDiaKey] = useState<string | null>(null);

  // Al enfocar (p. ej. al volver de entrenar) y al volver a foreground.
  const cargar = useCallback(async () => {
    try {
      const res = await getMusculacion();
      setEstado(res);
      setError(null);
      setDiaKey((actual) =>
        actual && res.rutina?.dias.some((d) => d.key === actual)
          ? actual
          : res.diaSugeridoKey
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
    }
  }, []);
  useReloadOnFocus(cargar);

  if (perfil && !perfil.musculacionDisponible) return <Redirect href="/" />;
  if (!estado && !error) return <Loader label="Cargando tu rutina…" />;

  const rutina = estado?.rutina ?? null;
  const diaIndex = rutina
    ? Math.max(0, rutina.dias.findIndex((d) => d.key === diaKey))
    : 0;
  const dia = rutina?.dias[diaIndex];
  const registroDia = estado && dia ? entrenamientoDeHoy(estado, dia.key) : undefined;
  const cta = registroDia
    ? diaTerminado(registroDia)
      ? `Ver el Día ${diaIndex + 1} de hoy`
      : `Seguir con el Día ${diaIndex + 1}`
    : `Empezar Día ${diaIndex + 1}`;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <TagLabel style={styles.preTitulo}>Musculación</TagLabel>
      <PageHeader title="Mi rutina" />
      {rutina && <Text style={styles.nombreRutina}>{rutina.nombre}</Text>}

      {!estado && error && (
        <Card style={styles.msg}>
          <Text style={styles.msgTexto}>{error}</Text>
          <Button title="Reintentar" onPress={() => void cargar()} />
        </Card>
      )}

      {estado && !rutina && (
        <DarkCard>
          <TagLabel style={styles.vaciaLabel}>Todavía no hay rutina</TagLabel>
          <Text style={styles.vaciaTitulo}>
            Tu profe todavía no te asignó una rutina.
          </Text>
          <Text style={styles.vaciaSub}>
            Cuando la cargue, la vas a ver acá con los videos de cada ejercicio.
          </Text>
        </DarkCard>
      )}

      {estado && rutina && dia && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dias}
          >
            {rutina.dias.map((d, i) => {
              const hoy = entrenamientoDeHoy(estado, d.key);
              const activo = d.key === dia.key;
              return (
                <Pressable
                  key={d.key}
                  style={[styles.dia, activo && styles.diaActivo]}
                  onPress={() => setDiaKey(d.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activo }}
                >
                  <Text style={[styles.diaTexto, activo && styles.diaTextoActivo]}>
                    Día {i + 1}
                  </Text>
                  {hoy && (
                    <Text style={[styles.diaHoy, activo && styles.diaHoyActivo]}>
                      {diaTerminado(hoy) ? 'Hecho hoy' : 'En curso'}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {dia.bloques.map((b, bi) => (
            <Card key={b.key} style={styles.bloque}>
              <TagLabel>Bloque {bi + 1}</TagLabel>
              <Text style={styles.bloqueNombre}>{b.nombre}</Text>
              <Text style={styles.bloqueMeta}>
                {b.vueltas} {b.vueltas === 1 ? 'vuelta' : 'vueltas'} ·{' '}
                {b.ejercicios.length}{' '}
                {b.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
              </Text>
              {b.ejercicios.map((e, ei) => {
                const anterior = estado.pesosAnteriores[e.ejercicioId];
                const detalle = indicaciones(e);
                return (
                  <View
                    key={`${ei}-${e.ejercicioId}`}
                    style={[styles.ejercicio, ei > 0 && styles.ejercicioBorde]}
                  >
                    <View style={styles.ejercicioFila}>
                      <Text style={styles.ejercicioNum}>{ei + 1}</Text>
                      <View style={styles.ejercicioTexto}>
                        <Text style={styles.ejercicioNombre}>{e.nombre}</Text>
                        {!!detalle && <Text style={styles.ejercicioInd}>{detalle}</Text>}
                        {e.cargaKg !== null && (
                          <Text style={styles.ejercicioPeso}>
                            Sugerido {kg(e.cargaKg)}
                          </Text>
                        )}
                        {anterior && (
                          <Text style={styles.ejercicioPeso}>
                            La vez pasada {kg(anterior.kg)} ({diaMes(anterior.fecha)})
                          </Text>
                        )}
                      </View>
                    </View>
                    <VideoEjercicio url={e.videoUrl} nombre={e.nombre} />
                  </View>
                );
              })}
            </Card>
          ))}

          <Button
            title={cta}
            onPress={() =>
              router.push({
                pathname: '/rutina/entrenar/[diaKey]',
                params: { diaKey: dia.key },
              })
            }
            style={styles.cta}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 32 },
  preTitulo: { paddingTop: 8, marginBottom: -4 },
  nombreRutina: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkSoft,
    marginTop: -16,
    marginBottom: 24,
  },
  msg: { gap: 14 },
  msgTexto: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  vaciaLabel: { color: 'rgba(253,251,250,0.5)' },
  vaciaTitulo: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    color: colors.surface,
    marginTop: 14,
  },
  vaciaSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(253,251,250,0.65)',
    marginTop: 10,
  },
  dias: { gap: 8, paddingBottom: 20 },
  dia: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  diaActivo: { backgroundColor: colors.ink, borderColor: colors.ink },
  diaTexto: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  diaTextoActivo: { color: colors.surface },
  diaHoy: {
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.sage,
    marginTop: 2,
  },
  diaHoyActivo: { color: colors.sageBg },
  bloque: { marginBottom: 16 },
  bloqueNombre: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.ink,
    marginTop: 6,
  },
  bloqueMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkMute,
    marginTop: 2,
    marginBottom: 6,
  },
  ejercicio: { paddingVertical: 14 },
  ejercicioBorde: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  ejercicioFila: { flexDirection: 'row', gap: 12 },
  ejercicioNum: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.neutral,
    width: 18,
  },
  ejercicioTexto: { flex: 1, gap: 2 },
  ejercicioNombre: { fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  ejercicioInd: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkSoft },
  ejercicioPeso: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkMute },
  cta: { marginTop: 8 },
});
