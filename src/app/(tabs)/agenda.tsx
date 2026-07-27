// Agenda (port de pages/Agenda.tsx) — ⚠️ núcleo del negocio. La lógica de
// onClaseClick, los badges y la defensa contra carrera de cupo se portan
// literalmente. Recarga clases/turnos/plan al enfocar y al volver a foreground.
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Watermark from '@/components/brand/Watermark';
import { Card } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { getClases } from '@/api/clases';
import { getSuscripciones } from '@/api/suscripciones';
import { getTurnos } from '@/api/turnos';
import { getSalones } from '@/api/sedes';
import { reservar, cancelarReserva, salirListaEspera } from '@/api/reservas';
import { useSelectedSede } from '@/store/sede';
import type {
  Clase,
  Suscripcion,
  Turno,
  Salon,
  ReservaResult,
} from '@/types';
import {
  weekDays,
  sameDay,
  formatTime,
  durationMinutes,
  addDays,
  hoursUntil,
  formatDateLong,
} from '@/lib/date';
import { useReloadOnFocus } from '@/lib/useReloadOnFocus';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { colors, fonts, radius } from '@/theme';

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type ConfirmState =
  | { kind: 'reservar'; clase: Clase }
  | { kind: 'cancelar'; clase: Clase; reservaId: number }
  | { kind: 'lista-espera'; clase: Clase }
  | { kind: 'salir-lista'; clase: Clase }
  | null;

export default function Agenda() {
  const [weekRef, setWeekRef] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const selectedSede = useSelectedSede();
  const selectedSedeId = selectedSede?.id;
  const [salones, setSalones] = useState<Salon[]>([]);
  const [selectedSalonId, setSelectedSalonId] = useState<number | undefined>();

  const [clases, setClases] = useState<Clase[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [loading, setLoading] = useState(false);

  const [salonSheet, setSalonSheet] = useState(false);
  const insets = useSafeAreaInsets();

  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => weekDays(weekRef), [weekRef]);
  // Sub que aplica a la sede seleccionada (politica A1: local gana sobre multisede).
  // Si todavia no resolvimos la sede, caemos a la primera activa para no romper la UI inicial.
  const activa = useMemo(() => {
    const activas = suscripciones.filter((s) => s.estado === 'ACTIVA');
    if (selectedSedeId === undefined) return activas[0];
    return (
      activas.find((s) => s.sedeId === selectedSedeId) ??
      activas.find((s) => s.accesoMultisede)
    );
  }, [suscripciones, selectedSedeId]);
  const accesosRestantes = activa
    ? activa.accesos + activa.accesosExtra - activa.accesosUsados
    : 0;

  const isVisitor = selectedSede && !selectedSede.esHome;
  const showSalonPill = salones.length > 1;

  // 1. Load suscripciones
  useEffect(() => {
    getSuscripciones()
      .then(setSuscripciones)
      .catch((e: ApiError) => toast.error(e.message));
  }, []);

  // 2. Reset salon y cargar salones cuando cambia la sede
  useEffect(() => {
    setSelectedSalonId(undefined);
    if (selectedSedeId === undefined) {
      setSalones([]);
      return;
    }
    getSalones(selectedSedeId)
      .then(setSalones)
      .catch((e: ApiError) => {
        toast.error(e.message);
        setSalones([]);
      });
  }, [selectedSedeId]);

  const loadSubs = useCallback(async () => {
    try {
      setSuscripciones(await getSuscripciones());
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }, []);

  // Turnos próximos: reservas confirmadas + entradas en lista de espera.
  const loadTurnos = useCallback(async () => {
    try {
      setTurnos(await getTurnos('proximos'));
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    }
  }, []);

  // claseId -> reservaId (para cancelar sin re-fetch)
  const reservaByClase = useMemo(() => {
    const m = new Map<number, number>();
    for (const t of turnos) {
      if (
        t.tipo === 'RESERVA' &&
        t.estado === 'CONFIRMADA' &&
        t.reservaId != null
      ) {
        m.set(t.claseId, t.reservaId);
      }
    }
    return m;
  }, [turnos]);

  // claseId -> posición en lista de espera
  const waitlistByClase = useMemo(() => {
    const m = new Map<number, number | undefined>();
    for (const t of turnos) {
      if (t.tipo === 'LISTA_ESPERA') {
        m.set(t.claseId, t.posicion);
      }
    }
    return m;
  }, [turnos]);

  // 3. Load clases cuando cambia sede, salón o semana
  const loadClases = useCallback(async () => {
    if (!activa || selectedSedeId === undefined) {
      setClases([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getClases({
        sedeId: selectedSedeId,
        salonId: selectedSalonId,
        desde: days[0].toISOString(),
        dias: 7,
      });
      setClases(data);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      setClases([]);
    } finally {
      setLoading(false);
    }
  }, [activa, selectedSedeId, selectedSalonId, days]);

  useEffect(() => {
    loadClases();
  }, [loadClases]);

  useEffect(() => {
    loadTurnos();
  }, [loadTurnos]);

  // Al enfocar / volver a foreground refrescamos clases/turnos/plan. Clave
  // para reflejar la promoción automática (espera -> reserva confirmada).
  const reloadAll = useCallback(() => {
    loadClases();
    loadTurnos();
    loadSubs();
  }, [loadClases, loadTurnos, loadSubs]);
  useReloadOnFocus(reloadAll);

  const clasesDelDia = useMemo(
    () =>
      clases
        .filter((c) => sameDay(c.inicio, selectedDay))
        .sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [clases, selectedDay]
  );

  const reservadasDelDia = clasesDelDia.filter((c) => c.yaReservada).length;

  function handleSalonChange(newId: number | undefined) {
    setSelectedSalonId(newId);
    setSalonSheet(false);
  }

  function isPast(c: Clase) {
    return (
      c.motivoNoDisponible === 'YA_COMENZO' ||
      new Date(c.inicio).getTime() <= Date.now()
    );
  }

  function isFull(c: Clase) {
    return c.motivoNoDisponible === 'LLENO' || c.cupo - c.reservas <= 0;
  }

  function statusBadge(c: Clase): { variant: BadgeVariant; label: string } {
    if (c.yaReservada) return { variant: 'tuya', label: 'Reservada' };
    if (waitlistByClase.has(c.id)) {
      const pos = waitlistByClase.get(c.id);
      return {
        variant: 'wait',
        label: `En lista${pos != null ? ` · N°${pos}` : ''}`,
      };
    }
    if (isPast(c)) return { variant: 'fu', label: 'Ya comenzó' };
    if (c.motivoNoDisponible === 'FUERA_DE_VENTANA')
      return { variant: 'fu', label: 'No disponible' };
    if (c.motivoNoDisponible === 'SIN_ACCESOS')
      return { variant: 'lw', label: 'Sin accesos' };
    const libres = c.cupo - c.reservas;
    if (libres <= 0) return { variant: 'wait', label: 'Lista de espera' };
    if (libres <= 3) return { variant: 'lw', label: 'Baja disponibilidad' };
    return { variant: 'ok', label: 'Disponible' };
  }

  function onClaseClick(c: Clase) {
    // Ya estás en lista de espera de esta clase -> ofrecer salir.
    if (waitlistByClase.has(c.id)) {
      setConfirm({ kind: 'salir-lista', clase: c });
      return;
    }

    if (!c.yaReservada && isPast(c)) {
      toast.error('Esta clase ya comenzó, no podés reservarla');
      return;
    }
    if (c.yaReservada) {
      const tol = selectedSede?.toleranciaCancelacionHoras ?? 2;
      if (activa && activa.cancelacionesUsadas >= activa.cancelaciones) {
        toast.error('Ya usaste todas tus cancelaciones del mes');
        return;
      }
      if (hoursUntil(c.inicio) < tol) {
        toast.error(
          `No podés cancelar con menos de ${tol} horas de anticipación`
        );
        return;
      }
      const reservaId = reservaByClase.get(c.id);
      if (reservaId != null) {
        setConfirm({ kind: 'cancelar', clase: c, reservaId });
        return;
      }
      // Fallback: buscar la reserva por horario si no la tenemos mapeada.
      getTurnos('proximos')
        .then((ts: Turno[]) => {
          const t = ts.find(
            (x) =>
              x.tipo === 'RESERVA' &&
              x.inicio === c.inicio &&
              x.estado === 'CONFIRMADA'
          );
          if (!t || t.reservaId == null) {
            toast.error('No se encontró la reserva');
            return;
          }
          setConfirm({ kind: 'cancelar', clase: c, reservaId: t.reservaId });
        })
        .catch((e: ApiError) => toast.error(e.message));
      return;
    }

    if (!activa || accesosRestantes <= 0) {
      toast.error('No te quedan clases disponibles con tu plan actual');
      return;
    }

    // Antelación mínima para reservar (default 30 min)
    const antelacion = selectedSede?.antelacionReservaMinutos ?? 30;
    const minutosRestantes =
      (new Date(c.inicio).getTime() - Date.now()) / 60_000;
    if (minutosRestantes <= antelacion) {
      toast.error(
        `Esta clase comienza en menos de ${antelacion} minutos. Las reservas cierran ${antelacion} minutos antes del inicio.`
      );
      return;
    }

    if (c.motivoNoDisponible === 'FUERA_DE_VENTANA') {
      toast.error('Esta clase aún no está disponible para reservar');
      return;
    }
    // Clase llena -> ofrecer lista de espera en vez de bloquear.
    if (isFull(c)) {
      setConfirm({ kind: 'lista-espera', clase: c });
      return;
    }
    setConfirm({ kind: 'reservar', clase: c });
  }

  function notifyWaitlist(res: ReservaResult) {
    const pos = res.posicion;
    if (res.yaEstaba) {
      toast.info(
        pos != null
          ? `Ya estabas en la lista de espera (puesto N°${pos}). Te avisamos si se libera un cupo.`
          : 'Ya estabas en la lista de espera de esta clase.'
      );
    } else {
      toast.info(
        pos != null
          ? `La clase está completa. Quedaste en lista de espera (puesto N°${pos}). Si se libera un cupo, confirmamos tu lugar automáticamente y te avisamos.`
          : 'La clase está completa. Quedaste en lista de espera. Si se libera un cupo, confirmamos tu lugar y te avisamos.'
      );
    }
  }

  async function confirmar() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'reservar') {
        const res = await reservar(confirm.clase.id);
        // Defensa: si el cupo se agotó entre el render y el click, el backend
        // puede devolver lista de espera igual.
        if (res.enListaEspera) notifyWaitlist(res);
        else toast.success('Reserva confirmada');
      } else if (confirm.kind === 'lista-espera') {
        const res = await reservar(confirm.clase.id);
        if (res.enListaEspera) notifyWaitlist(res);
        else toast.success('Reserva confirmada');
      } else if (confirm.kind === 'cancelar') {
        await cancelarReserva(confirm.reservaId);
        toast.success('Reserva cancelada');
      } else if (confirm.kind === 'salir-lista') {
        await salirListaEspera(confirm.clase.id);
        toast.success('Saliste de la lista de espera');
      }
      setConfirm(null);
      await Promise.all([loadClases(), loadSubs(), loadTurnos()]);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const selectedSalon = salones.find((s) => s.id === selectedSalonId);

  const confirmTag =
    confirm?.kind === 'reservar'
      ? 'Reservar clase'
      : confirm?.kind === 'lista-espera'
        ? 'Lista de espera'
        : confirm?.kind === 'salir-lista'
          ? 'Salir de la lista'
          : 'Cancelar reserva';

  const confirmPrimary =
    confirm?.kind === 'reservar'
      ? 'Confirmar'
      : confirm?.kind === 'lista-espera'
        ? 'Anotarme en lista de espera'
        : confirm?.kind === 'salir-lista'
          ? 'Salir de la lista'
          : 'Cancelar reserva';

  const confirmWaitNote =
    confirm?.kind === 'lista-espera'
      ? 'Esta clase está completa. Si te anotás, quedás en lista de espera. Si se libera un cupo, confirmamos tu lugar automáticamente y te avisamos por email.'
      : confirm?.kind === 'salir-lista'
        ? waitlistByClase.get(confirm.clase.id) != null
          ? `Estás en lista de espera (puesto N°${waitlistByClase.get(confirm.clase.id)}). Si salís, perdés tu lugar en la fila.`
          : 'Si salís, perdés tu lugar en la lista de espera.'
        : null;

  const confirmVisitorNote =
    (confirm?.kind === 'reservar' || confirm?.kind === 'lista-espera') &&
    isVisitor
      ? `Vas a ${confirm.kind === 'lista-espera' ? 'anotarte' : 'reservar'} en ${selectedSede?.nombre} (visitante)`
      : null;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <TagLabel>Clases disponibles</TagLabel>
        <PageTitle style={styles.title}>Agenda</PageTitle>
      </View>

      {/* Pill de salón (sede vive en el header global) */}
      {showSalonPill && (
        <View style={styles.pillsRow}>
          <Pressable style={styles.pill} onPress={() => setSalonSheet(true)}>
            <Text style={styles.pillIcon}>▦</Text>
            <Text style={styles.pillText}>
              {selectedSalon ? selectedSalon.nombre : 'Todos'}
            </Text>
            <Text style={styles.pillCaret}>⌄</Text>
          </Pressable>
        </View>
      )}

      {/* Banner visitante */}
      {isVisitor && selectedSede && (
        <View style={styles.visitorBanner}>
          <View style={styles.visitorIcon}>
            <Text style={styles.visitorIconText}>ℹ</Text>
          </View>
          <Text style={styles.visitorText}>
            Estás viendo clases en{' '}
            <Text style={styles.visitorStrong}>{selectedSede.nombre}</Text>. Tu
            plan permite reservar en otras sedes.
          </Text>
        </View>
      )}

      {/* Semana */}
      <View style={styles.weekNav}>
        <Pressable
          style={styles.weekNavBtn}
          onPress={() => setWeekRef(addDays(weekRef, -7))}
        >
          <Text style={styles.weekNavBtnText}>←</Text>
        </Pressable>
        <View style={styles.weekStrip}>
          {days.map((d, i) => {
            const active = sameDay(d.toISOString(), selectedDay);
            return (
              <Pressable
                key={i}
                onPress={() => setSelectedDay(d)}
                style={[styles.weekDay, active && styles.weekDayActive]}
              >
                <Text
                  style={[
                    styles.weekDayLetter,
                    active && styles.weekDayLetterActive,
                  ]}
                >
                  {DAY_LETTERS[i]}
                </Text>
                <Text
                  style={[
                    styles.weekDayNum,
                    active && styles.weekDayNumActive,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          style={styles.weekNavBtn}
          onPress={() => setWeekRef(addDays(weekRef, 7))}
        >
          <Text style={styles.weekNavBtnText}>→</Text>
        </Pressable>
      </View>

      {/* Sub-header del día */}
      {activa && (
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderTitle}>
            {formatDateLong(selectedDay.toISOString())}
          </Text>
          <TagLabel>
            {clasesDelDia.length} clases
            {reservadasDelDia > 0
              ? ` · ${reservadasDelDia} reservada${reservadasDelDia === 1 ? '' : 's'}`
              : ''}
          </TagLabel>
        </View>
      )}

      {!activa ? (
        <Card style={styles.empty}>
          <TagLabel>Sin plan activo</TagLabel>
          <Text style={styles.emptyMsg}>
            Necesitás un plan activo para ver la agenda.
          </Text>
        </Card>
      ) : loading ? (
        <Card style={styles.empty}>
          <TagLabel>Cargando…</TagLabel>
        </Card>
      ) : clasesDelDia.length === 0 ? (
        <Card style={styles.empty}>
          <TagLabel>Sin clases</TagLabel>
          <Text style={styles.emptyMsg}>No hay clases este día.</Text>
        </Card>
      ) : (
        <View style={styles.classList}>
          {clasesDelDia.map((c, idx) => {
            const badge = statusBadge(c);
            const booked = c.yaReservada;
            const waitlisted = waitlistByClase.has(c.id);
            const past = !booked && isPast(c);
            return (
              <Pressable
                key={c.id}
                onPress={() => onClaseClick(c)}
                style={[
                  styles.classRow,
                  idx === clasesDelDia.length - 1 && styles.classRowLast,
                  booked && styles.classRowBooked,
                  waitlisted && styles.classRowWaitlisted,
                  past && styles.classRowPast,
                ]}
              >
                <View style={styles.classTime}>
                  <Text
                    style={[styles.classTimeH, booked && styles.textOnDark]}
                  >
                    {formatTime(c.inicio)}
                  </Text>
                  <Text
                    style={[
                      styles.classTimeP,
                      booked && styles.classTimePBooked,
                    ]}
                  >
                    {durationMinutes(c.inicio, c.fin)} min
                  </Text>
                </View>
                <View style={styles.classBody}>
                  <Text
                    style={[styles.className, booked && styles.textOnDark]}
                  >
                    {c.actividad}
                  </Text>
                  <Text
                    style={[
                      styles.classMeta,
                      booked && styles.classMetaBooked,
                    ]}
                  >
                    {[
                      c.instructor,
                      `${durationMinutes(c.inicio, c.fin)} min`,
                      showSalonPill && c.salon ? c.salon.nombre : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Badge variant={badge.variant}>{badge.label}</Badge>
                {booked && (
                  <Watermark
                    color="white"
                    size={140}
                    opacity={0.07}
                    position={{ bottom: -20, right: -20 }}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Sheet selector de salón */}
      <Modal
        visible={salonSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setSalonSheet(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSalonSheet(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TagLabel style={styles.sheetTitle}>Salón</TagLabel>
            <Pressable
              style={[
                styles.sheetItem,
                selectedSalonId === undefined && styles.sheetItemActive,
              ]}
              onPress={() => handleSalonChange(undefined)}
            >
              <Text
                style={[
                  styles.sheetItemText,
                  selectedSalonId === undefined && styles.sheetItemTextActive,
                ]}
              >
                Todos los salones
              </Text>
            </Pressable>
            {salones.map((s) => (
              <Pressable
                key={s.id}
                style={[
                  styles.sheetItem,
                  s.id === selectedSalonId && styles.sheetItemActive,
                ]}
                onPress={() => handleSalonChange(s.id)}
              >
                <Text
                  style={[
                    styles.sheetItemText,
                    s.id === selectedSalonId && styles.sheetItemTextActive,
                  ]}
                >
                  {s.nombre}
                </Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de confirmación */}
      <ConfirmModal
        visible={confirm != null}
        tag={confirmTag}
        title={confirm?.clase.actividad ?? ''}
        meta={[
          confirm
            ? `${formatDateLong(confirm.clase.inicio)} · ${formatTime(confirm.clase.inicio)}`
            : null,
          confirm?.clase.instructor,
          confirm
            ? `${confirm.clase.sede.nombre}${confirm.clase.salon ? ` · ${confirm.clase.salon.nombre}` : ''}`
            : null,
        ]}
        waitNote={confirmWaitNote}
        visitorNote={confirmVisitorNote}
        primaryLabel={confirmPrimary}
        busy={busy}
        onClose={() => setConfirm(null)}
        onConfirm={confirmar}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 32 },
  head: { marginBottom: 20 },
  title: { marginTop: 8 },

  pillsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  pillIcon: { fontSize: 12, opacity: 0.75, color: colors.ink },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  pillCaret: { fontSize: 10, opacity: 0.6, color: colors.ink },

  visitorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.beigeSoft,
    borderWidth: 1,
    borderColor: colors.beige,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  visitorIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.taupe,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitorIconText: { fontSize: 12, color: colors.ink },
  visitorText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.inkSoft,
  },
  visitorStrong: { fontFamily: fonts.semibold },

  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  weekNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavBtnText: { fontSize: 14, color: colors.ink },
  weekStrip: { flex: 1, flexDirection: 'row', gap: 6 },
  weekDay: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  weekDayActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  weekDayLetter: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: colors.taupeDark,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  weekDayLetterActive: { color: 'rgba(253, 251, 250, 0.6)' },
  weekDayNum: {
    fontFamily: fonts.light,
    fontSize: 20,
    color: colors.ink,
    marginTop: 4,
  },
  weekDayNumActive: { color: colors.surface },

  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  dayHeaderTitle: {
    fontFamily: fonts.light,
    fontSize: 18,
    color: colors.ink,
    textTransform: 'capitalize',
    flexShrink: 1,
  },

  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 22 },
  emptyMsg: {
    fontFamily: fonts.light,
    fontSize: 18,
    color: colors.taupeDark,
    marginTop: 8,
    textAlign: 'center',
  },

  classList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    position: 'relative',
    overflow: 'hidden',
  },
  classRowLast: { borderBottomWidth: 0 },
  classRowBooked: { backgroundColor: colors.ink },
  classRowWaitlisted: {
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  classRowPast: { opacity: 0.5 },
  classTime: { width: 64, zIndex: 1 },
  classTimeH: {
    fontFamily: fonts.light,
    fontSize: 22,
    lineHeight: 24,
    color: colors.ink,
  },
  classTimeP: {
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 2,
    color: colors.taupeDark,
    marginTop: 4,
  },
  classTimePBooked: { color: 'rgba(253, 251, 250, 0.5)' },
  classBody: { flex: 1, paddingHorizontal: 16, zIndex: 1 },
  className: {
    fontFamily: fonts.light,
    fontSize: 18,
    lineHeight: 20,
    color: colors.ink,
  },
  classMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.inkMute,
    marginTop: 6,
  },
  classMetaBooked: { color: 'rgba(253, 251, 250, 0.6)' },
  textOnDark: { color: colors.surface },

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
  sheetItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sheetItemActive: { backgroundColor: colors.beigeSoft },
  sheetItemText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
  },
  sheetItemTextActive: { fontFamily: fonts.semibold },
});
