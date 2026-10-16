// Selector de día + horarios libres (port de ElegirHorario de la web). Lo usan
// "sacar una cita" y "reprogramar". Los días son hoy..hoy+diasReservaAnticipada
// en hora argentina, de a 7 con flechas: la tira de la Agenda navega semanas
// de lunes a domingo sin tope, y acá la ventana es corta y empieza hoy.
import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { getHuecos } from '@/api/consultorio';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import {
  diaLargo,
  diasReservables,
  horaAR,
  partesDia,
  ymdAR,
} from '@/lib/consultorio';
import { formatARS } from '@/lib/date';
import type { HuecoConsultorio, ModalidadCita } from '@/types';
import { colors, fonts, radius } from '@/theme';

const POR_TIRA = 7;

export default function ElegirHorario({
  sedeId,
  prestacionId,
  diasAdelante,
  citaId,
  modalidad,
  sena,
  onElegir,
}: {
  sedeId: number;
  prestacionId: number;
  diasAdelante: number;
  citaId?: number;
  /** Al reprogramar: una incluida solo pasa a otra incluida y una particular a otra particular. */
  modalidad?: ModalidadCita;
  /** Seña de los horarios particulares (para mostrarla en el horario). */
  sena?: number;
  onElegir: (h: HuecoConsultorio) => void;
}) {
  const dias = useMemo(
    () => diasReservables(ymdAR(new Date()), diasAdelante),
    [diasAdelante]
  );
  const [desde, setDesde] = useState(0);
  const [dia, setDia] = useState(dias[0]);
  const [huecos, setHuecos] = useState<HuecoConsultorio[] | null>(null);

  useEffect(() => {
    let vigente = true;
    setHuecos(null);
    getHuecos({ sedeId, prestacionId, fecha: dia, citaId })
      .then((h) => {
        if (vigente) setHuecos(h);
      })
      .catch((err) => {
        if (vigente) setHuecos([]);
        toast.error(err instanceof ApiError ? err.message : 'Error inesperado');
      });
    return () => {
      vigente = false;
    };
  }, [sedeId, prestacionId, dia, citaId]);

  const visibles = dias.slice(desde, desde + POR_TIRA);
  const libres = (huecos ?? []).filter(
    (h) => !modalidad || h.modalidad === modalidad
  );

  return (
    <View>
      <View style={styles.nav}>
        <Pressable
          style={[styles.navBtn, desde === 0 && styles.navBtnDisabled]}
          disabled={desde === 0}
          onPress={() => setDesde(Math.max(0, desde - POR_TIRA))}
          accessibilityLabel="Días anteriores"
        >
          <Text style={styles.navBtnText}>←</Text>
        </Pressable>
        <View style={styles.strip}>
          {visibles.map((d) => {
            const p = partesDia(d);
            const activo = d === dia;
            return (
              <Pressable
                key={d}
                onPress={() => setDia(d)}
                style={[styles.day, activo && styles.dayActive]}
              >
                <Text style={[styles.dayLetter, activo && styles.dayLetterActive]}>
                  {p.letra}
                </Text>
                <Text style={[styles.dayNum, activo && styles.dayNumActive]}>
                  {p.numero}
                </Text>
              </Pressable>
            );
          })}
          {/* Relleno: la última tira puede tener menos de 7 días. */}
          {Array.from({ length: POR_TIRA - visibles.length }, (_, i) => (
            <View key={`vacio-${i}`} style={styles.dayFiller} />
          ))}
        </View>
        <Pressable
          style={[
            styles.navBtn,
            desde + POR_TIRA >= dias.length && styles.navBtnDisabled,
          ]}
          disabled={desde + POR_TIRA >= dias.length}
          onPress={() => setDesde(desde + POR_TIRA)}
          accessibilityLabel="Días siguientes"
        >
          <Text style={styles.navBtnText}>→</Text>
        </Pressable>
      </View>

      <Text style={styles.diaTitulo}>{diaLargo(dia)}</Text>

      {huecos === null ? (
        <Text style={styles.empty}>Buscando horarios…</Text>
      ) : libres.length === 0 ? (
        <Text style={styles.empty}>No hay horarios libres este día.</Text>
      ) : (
        <View style={styles.lista}>
          {libres.map((h, idx) => (
            <Pressable
              key={`${h.franjaId}-${h.inicio}`}
              onPress={() => onElegir(h)}
              style={({ pressed }) => [
                styles.hueco,
                idx === libres.length - 1 && styles.huecoLast,
                pressed && styles.huecoPressed,
              ]}
            >
              <Text style={styles.hora}>{horaAR(h.inicio)}</Text>
              <View style={styles.huecoBody}>
                <Text style={styles.profe} numberOfLines={1}>
                  {h.profesional}
                </Text>
                <Badge
                  variant={h.modalidad === 'INCLUIDA' ? 'ok' : 'wait'}
                  style={styles.badge}
                >
                  {h.modalidad === 'INCLUIDA'
                    ? 'Incluida'
                    : sena
                      ? `Particular · seña ${formatARS(sena)}`
                      : 'Particular'}
                </Badge>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: { opacity: 0.35 },
  navBtnText: { fontSize: 13, color: colors.ink },
  strip: { flex: 1, flexDirection: 'row', gap: 4 },
  day: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  dayFiller: { flex: 1 },
  dayActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  dayLetter: {
    fontFamily: fonts.medium,
    fontSize: 8,
    color: colors.neutralDark,
    letterSpacing: 0.5,
  },
  dayLetterActive: { color: 'rgba(253, 251, 250, 0.6)' },
  dayNum: {
    fontFamily: fonts.light,
    fontSize: 17,
    color: colors.ink,
    marginTop: 2,
  },
  dayNumActive: { color: colors.surface },

  diaTitulo: {
    fontFamily: fonts.light,
    fontSize: 16,
    color: colors.ink,
    textTransform: 'capitalize',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkMute,
    textAlign: 'center',
    paddingVertical: 20,
  },

  lista: {
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radius.badge + 4,
    overflow: 'hidden',
  },
  hueco: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  huecoLast: { borderBottomWidth: 0 },
  huecoPressed: { backgroundColor: colors.subtleSoft },
  hora: {
    width: 62,
    fontFamily: fonts.light,
    fontSize: 20,
    color: colors.ink,
  },
  huecoBody: { flex: 1, gap: 6 },
  profe: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
  },
  badge: { paddingVertical: 4, paddingHorizontal: 10 },
});
