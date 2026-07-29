// Home (port de pages/Home.tsx): botón QR condicionado a controlAcceso,
// hero de próxima clase, plan, reservas, lista de espera e historial.
// Recarga al enfocar y al volver a foreground (§9.4).
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import Watermark from '@/components/brand/Watermark';
import { Card, DarkCard } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAuth } from '@/store/auth';
import { useSelectedSede } from '@/store/sede';
import { getSuscripciones } from '@/api/suscripciones';
import { getTurnos } from '@/api/turnos';
import { salirListaEspera } from '@/api/reservas';
import type { Suscripcion, Turno } from '@/types';
import {
  greeting,
  formatTime,
  formatDate,
  formatDateLong,
  durationMinutes,
} from '@/lib/date';
import { useReloadOnFocus } from '@/lib/useReloadOnFocus';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { colors, fonts, radius } from '@/theme';

const dimLabel = { color: 'rgba(253,251,250,0.5)' };

export default function Home() {
  const perfil = useAuth((s) => s.perfil);
  const selectedSede = useSelectedSede();
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [historial, setHistorial] = useState<Turno[]>([]);
  const [cancelados, setCancelados] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState<Turno | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchPerfil = useAuth((s) => s.fetchPerfil);

  const load = useCallback(async () => {
    setLoading(true);
    // Refresca el perfil (best-effort) para mantener al día el gate de
    // autorización de menores cuando recepción la aprueba/rechaza.
    fetchPerfil().catch(() => {});
    try {
      const [subs, t, hist, canc] = await Promise.all([
        getSuscripciones(),
        getTurnos('proximos'),
        getTurnos('historial'),
        getTurnos('cancelados'),
      ]);
      setSuscripciones(subs);
      setTurnos(t);
      setHistorial(hist);
      setCancelados(canc);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchPerfil]);

  useReloadOnFocus(load);

  const sedeId = selectedSede?.id;
  // Sub que aplica a la sede seleccionada: local primero, multisede como fallback.
  const active = useMemo(() => {
    const activas = suscripciones.filter((s) => s.estado === 'ACTIVA');
    if (sedeId === undefined) return activas[0];
    return (
      activas.find((s) => s.sedeId === sedeId) ??
      activas.find((s) => s.accesoMultisede)
    );
  }, [suscripciones, sedeId]);
  const fallback = useMemo(
    () =>
      !active
        ? suscripciones.find(
            (s) => sedeId === undefined || s.sedeId === sedeId
          ) ?? suscripciones[0]
        : null,
    [active, suscripciones, sedeId]
  );
  const turnosSede = useMemo(
    () =>
      sedeId === undefined ? turnos : turnos.filter((t) => t.sede.id === sedeId),
    [turnos, sedeId]
  );
  const proxima = turnosSede.find(
    (t) => t.tipo === 'RESERVA' && t.estado === 'CONFIRMADA'
  );
  const reservas = turnosSede
    .filter((t) => t.tipo === 'RESERVA' && t.estado === 'CONFIRMADA')
    .slice(0, 5);
  const listaEspera = useMemo(
    () => turnosSede.filter((t) => t.tipo === 'LISTA_ESPERA'),
    [turnosSede]
  );

  async function confirmLeave() {
    if (!leaving) return;
    setBusy(true);
    try {
      await salirListaEspera(leaving.claseId);
      toast.success('Saliste de la lista de espera');
      setLeaving(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const historialItems = useMemo(() => {
    const items =
      sedeId === undefined
        ? [...historial, ...cancelados]
        : [...historial, ...cancelados].filter((t) => t.sede.id === sedeId);
    return items
      .sort(
        (a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
      )
      .slice(0, 10);
  }, [historial, cancelados, sedeId]);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {/* Header: saludo personal. Sin iso (el logo ya está en el AppHeader) ni
          fecha. */}
      <View style={styles.head}>
        <Text style={styles.greeting}>{greeting()}</Text>
        <PageTitle style={styles.name}>{perfil?.nombre ?? ''}</PageTitle>
      </View>

      {/* Acceso: solo si la sede seleccionada tiene control de acceso (molinete
          propio o anfitrión). No inferir de esHome ni del plan. */}
      {selectedSede?.controlAcceso?.disponible && (
        <Pressable style={styles.qrBtn} onPress={() => router.push('/acceso')}>
          <Text style={styles.qrIcon}>▦</Text>
          <View style={styles.qrText}>
            <Text style={styles.qrTitle}>Mostrar mi QR</Text>
            <Text style={styles.qrSub}>
              Acceso a {selectedSede.nombre}
            </Text>
          </View>
          <Text style={styles.qrCaret}>→</Text>
        </Pressable>
      )}

      {/* Hero: próxima clase */}
      {proxima ? (
        <Pressable onPress={() => router.navigate('/agenda')}>
          <DarkCard style={styles.hero}>
            <TagLabel style={dimLabel}>Tu próxima clase</TagLabel>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroName}>{proxima.actividad}</Text>
                {proxima.instructor && (
                  <Text style={styles.heroMeta}>{proxima.instructor}</Text>
                )}
                <Text style={[styles.heroMeta, styles.heroMetaSubtle]}>
                  {proxima.sede.nombre} ·{' '}
                  {durationMinutes(proxima.inicio, proxima.fin)} min
                </Text>
              </View>
              <View>
                <Text style={styles.heroTime}>{formatTime(proxima.inicio)}</Text>
                <TagLabel style={{ color: colors.neutral }}>
                  {formatDate(proxima.inicio)}
                </TagLabel>
              </View>
            </View>
            <Watermark color="white" size={220} opacity={0.07} />
          </DarkCard>
        </Pressable>
      ) : (
        <Pressable
          style={styles.emptyHero}
          onPress={() => router.navigate('/agenda')}
        >
          <TagLabel>Tu próxima clase</TagLabel>
          <Text style={styles.emptyHeroMsg}>Reservá una clase →</Text>
        </Pressable>
      )}

      {/* Plan */}
      {active && (
        <>
          <View style={styles.sectionHead}>
            <TagLabel>Tu plan</TagLabel>
            <Pressable onPress={() => router.navigate('/cuenta')}>
              <TagLabel>Ver todo →</TagLabel>
            </Pressable>
          </View>
          <View style={styles.stats}>
            {active.grupos && active.grupos.length > 0 ? (
              active.grupos.map((g) => (
                <Card key={g.id}>
                  <TagLabel>{g.nombre}</TagLabel>
                  <Text style={styles.statBig}>
                    {g.accesosUsados} / {g.accesos}
                  </Text>
                  <Text style={styles.statSub}>
                    {Math.max(0, g.accesos - g.accesosUsados)} restantes
                  </Text>
                </Card>
              ))
            ) : (
              <Card>
                <TagLabel>Clases</TagLabel>
                <Text style={styles.statBig}>
                  {active.accesosUsados} / {active.accesos}
                </Text>
                <Text style={styles.statSub}>
                  {Math.max(
                    0,
                    active.accesos + active.accesosExtra - active.accesosUsados
                  )}{' '}
                  restantes
                </Text>
                <Badge variant="ok" style={styles.statBadge}>
                  {active.modalidad === 'HORARIO_FIJO'
                    ? 'Horario fijo'
                    : 'Pack'}
                </Badge>
              </Card>
            )}
            <Card>
              <TagLabel>Cancelaciones</TagLabel>
              <Text style={styles.statBig}>
                {active.cancelacionesUsadas} / {active.cancelaciones}
              </Text>
              <Text style={styles.statSub}>
                {Math.max(0, active.cancelaciones - active.cancelacionesUsadas)}{' '}
                restantes
              </Text>
              <Badge variant="tuya" style={styles.statBadge}>
                {active.plan}
              </Badge>
            </Card>
          </View>
        </>
      )}

      {!active && fallback && (
        <Card style={styles.planInactive}>
          <TagLabel>Tu plan</TagLabel>
          <Text style={styles.planInactiveName}>{fallback.plan}</Text>
          <Badge variant="fu" style={{ marginTop: 10 }}>
            {fallback.estado}
          </Badge>
        </Card>
      )}

      {/* Reservas */}
      {reservas.length > 0 && (
        <>
          <View style={styles.sectionHead}>
            <TagLabel>Mis reservas</TagLabel>
            <Pressable onPress={() => router.navigate('/agenda')}>
              <TagLabel>Ver todas →</TagLabel>
            </Pressable>
          </View>
          <Card style={styles.rows}>
            {reservas.map((r, i) => (
              <View
                key={r.reservaId}
                style={[
                  styles.row,
                  i === reservas.length - 1 && styles.rowLast,
                ]}
              >
                <Text style={styles.rowTime}>{formatTime(r.inicio)}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{r.actividad}</Text>
                  <Text style={styles.rowMeta}>
                    {formatDate(r.inicio)}
                    {r.instructor ? ' · ' + r.instructor : ''}
                  </Text>
                </View>
                <Badge variant="ok">Confirmada</Badge>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Lista de espera */}
      {listaEspera.length > 0 && (
        <>
          <View style={styles.sectionHead}>
            <TagLabel>En lista de espera</TagLabel>
          </View>
          <Text style={styles.waitNote}>
            Todavía no tenés el lugar. Si se libera un cupo, confirmamos tu
            reserva automáticamente y te avisamos por email.
          </Text>
          <Card style={styles.rows}>
            {listaEspera.map((w, i) => (
              <View
                key={`we-${w.claseId}`}
                style={[
                  styles.row,
                  i === listaEspera.length - 1 && styles.rowLast,
                ]}
              >
                <Text style={styles.rowTime}>{formatTime(w.inicio)}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{w.actividad}</Text>
                  <Text style={styles.rowMeta}>
                    {formatDate(w.inicio)}
                    {w.instructor ? ' · ' + w.instructor : ''}
                  </Text>
                </View>
                <View style={styles.waitActions}>
                  <Badge variant="wait">
                    {`En espera${w.posicion != null ? ` · N°${w.posicion}` : ''}`}
                  </Badge>
                  <Pressable
                    style={styles.waitLeave}
                    onPress={() => setLeaving(w)}
                  >
                    <Text style={styles.waitLeaveText}>Salir</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Historial */}
      {(historial.length > 0 || cancelados.length > 0) && (
        <>
          <View style={styles.sectionHead}>
            <TagLabel>Historial</TagLabel>
          </View>
          <Card style={styles.rows}>
            {historialItems.map((r, i) => (
              <View
                key={`${r.reservaId ?? r.claseId}-${r.inicio}`}
                style={[
                  styles.row,
                  i === historialItems.length - 1 && styles.rowLast,
                ]}
              >
                <Text style={styles.rowTime}>{formatTime(r.inicio)}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{r.actividad}</Text>
                  <Text style={styles.rowMeta}>
                    {formatDate(r.inicio)}
                    {r.instructor ? ' · ' + r.instructor : ''}
                  </Text>
                </View>
                {r.estado === 'ASISTIO' && <Badge variant="ok">Asistió</Badge>}
                {r.estado === 'AUSENTE' && <Badge variant="lw">Ausente</Badge>}
                {r.estado === 'CANCELADA_ALUMNO' && (
                  <Badge variant="fu">Canceló alumno</Badge>
                )}
                {r.estado === 'CANCELADA_SEDE' && (
                  <Badge variant="lw">Canceló sede</Badge>
                )}
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Empty state global */}
      {!loading && !active && !fallback && reservas.length === 0 && (
        <Card style={styles.quote}>
          <Watermark color="accent" size={32} inline />
          <View style={styles.quoteBody}>
            <Text style={styles.quoteText}>Tu pilates empieza acá.</Text>
            <TagLabel>Consultá con tu sede</TagLabel>
          </View>
        </Card>
      )}

      {/* Modal: salir de la lista de espera */}
      <ConfirmModal
        visible={leaving != null}
        tag="Salir de la lista"
        title={leaving?.actividad ?? ''}
        meta={[
          leaving
            ? `${formatDateLong(leaving.inicio)} · ${formatTime(leaving.inicio)}`
            : null,
          leaving?.sede.nombre,
        ]}
        waitNote={
          leaving
            ? leaving.posicion != null
              ? `Estás en lista de espera (puesto N°${leaving.posicion}). Si salís, perdés tu lugar en la fila.`
              : 'Si salís, perdés tu lugar en la lista de espera.'
            : null
        }
        primaryLabel="Salir de la lista"
        busy={busy}
        onClose={() => setLeaving(null)}
        onConfirm={confirmLeave}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 32 },
  head: { paddingTop: 8, marginBottom: 28 },
  greeting: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkMute,
    marginBottom: 6,
  },
  name: { fontSize: 40, lineHeight: 44 },

  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.ink,
    borderRadius: radius.card,
    paddingVertical: 18,
    paddingHorizontal: 22,
    marginBottom: 20,
  },
  qrIcon: { fontSize: 30, lineHeight: 32, color: colors.surface },
  qrText: { flex: 1, gap: 3 },
  qrTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.surface,
  },
  qrSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(253, 251, 250, 0.55)',
  },
  qrCaret: { fontSize: 18, color: colors.neutral },

  hero: { marginBottom: 36 },
  heroRow: { marginTop: 18, gap: 18, zIndex: 1 },
  heroName: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 34,
    color: colors.surface,
    marginBottom: 6,
  },
  heroMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: 'rgba(253, 251, 250, 0.75)',
  },
  heroMetaSubtle: { color: 'rgba(253, 251, 250, 0.5)', marginTop: 4 },
  heroTime: {
    fontFamily: fonts.display,
    fontSize: 44,
    lineHeight: 46,
    color: colors.surface,
    marginBottom: 14,
  },

  emptyHero: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    borderRadius: radius.card,
    paddingVertical: 32,
    paddingHorizontal: 28,
    marginBottom: 36,
  },
  emptyHeroMsg: {
    fontFamily: fonts.light,
    fontSize: 22,
    color: colors.neutralDark,
    marginTop: 10,
  },

  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  stats: { gap: 16, marginBottom: 36 },
  statBig: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    color: colors.ink,
    marginTop: 10,
  },
  statSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.inkMute,
    marginTop: 6,
  },
  statBadge: { marginTop: 12 },

  planInactive: { marginBottom: 36 },
  planInactiveName: {
    fontFamily: fonts.light,
    fontSize: 22,
    color: colors.ink,
    marginTop: 8,
  },

  rows: { padding: 0, marginBottom: 36 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  rowLast: { borderBottomWidth: 0 },
  rowTime: {
    fontFamily: fonts.light,
    fontSize: 18,
    width: 60,
    color: colors.ink,
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontFamily: fonts.light,
    fontSize: 15,
    lineHeight: 17,
    color: colors.ink,
  },
  rowMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.inkMute,
    marginTop: 4,
  },

  waitNote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.inkMute,
    marginTop: -4,
    marginBottom: 14,
  },
  waitActions: { alignItems: 'flex-end', gap: 8 },
  waitLeave: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  waitLeaveText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.inkSoft,
  },

  quote: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  quoteBody: { flex: 1, gap: 4 },
  quoteText: {
    fontFamily: fonts.light,
    fontSize: 22,
    lineHeight: 25,
    color: colors.ink,
  },
});
