// Mi cuenta (port de pages/Cuenta.tsx): card oscura de plan, stats de accesos
// (por grupo si hay multi-sala), accesos extra e historial de pagos filtrado
// por la sede seleccionada.
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card, DarkCard } from '@/components/ui/Card';
import { TagLabel } from '@/components/ui/Text';
import PageHeader from '@/components/layout/PageHeader';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import Watermark from '@/components/brand/Watermark';
import { getSuscripciones } from '@/api/suscripciones';
import { useAuth } from '@/store/auth';
import { useSelectedSede } from '@/store/sede';
import type { Suscripcion, SuscripcionEstado } from '@/types';
import { formatShortDate, daysFromNow, formatARS } from '@/lib/date';
import { accesosReservables, accesosReservablesGrupo } from '@/lib/accesos';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { colors, fonts } from '@/theme';

const estadoLabel: Record<SuscripcionEstado, string> = {
  ACTIVA: 'Activo',
  VENCIDA: 'Vencido',
  CANCELADA: 'Cancelado',
  PAUSADA: 'Pausado',
  CAMBIO_PLAN: 'Cambio de plan',
};

function badgeVariant(estado: SuscripcionEstado): BadgeVariant {
  if (estado === 'ACTIVA') return 'ok';
  if (estado === 'VENCIDA') return 'lw';
  return 'fu';
}

const dimLabel = { color: 'rgba(253,251,250,0.5)' };

export default function Cuenta() {
  const perfil = useAuth((s) => s.perfil);
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const selectedSede = useSelectedSede();
  const sedeId = selectedSede?.id;

  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchPerfil(), getSuscripciones()])
        .then(([, subs]) => setSuscripciones(subs))
        .catch((e: ApiError) => toast.error(e.message))
        .finally(() => setLoading(false));
    }, [fetchPerfil])
  );

  // Sub que aplica a la sede seleccionada (local > multisede > primera).
  const stats = useMemo(() => {
    const activas = suscripciones.filter((s) => s.estado === 'ACTIVA');
    if (sedeId === undefined) return activas[0];
    return (
      activas.find((s) => s.sedeId === sedeId) ??
      activas.find((s) => s.accesoMultisede)
    );
  }, [suscripciones, sedeId]);

  // Pagos filtrados por la sede seleccionada (todo si no hay sede).
  const pagos = useMemo(() => {
    const list = perfil?.ultimosPagos ?? [];
    return sedeId === undefined ? list : list.filter((p) => p.sedeId === sedeId);
  }, [perfil, sedeId]);

  // Para la card de plan, derivamos del stats (sub) + el ultimo pago de esa sede.
  const plan = stats
    ? {
        plan: stats.plan,
        estado: stats.estado,
        vigenciaHasta: stats.fin,
        fechaPago: pagos[0]?.fechaPago ?? null,
      }
    : null;

  const diasRestantes = plan?.vigenciaHasta
    ? daysFromNow(plan.vigenciaHasta)
    : null;
  const vencido = diasRestantes !== null && diasRestantes < 0;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageHeader title="Tu plan" />

      {loading && !plan ? (
        <Card>
          <Text style={styles.bodyText}>Cargando…</Text>
        </Card>
      ) : !plan ? (
        <Card style={styles.empty}>
          <TagLabel>Sin plan</TagLabel>
          <Text style={styles.emptyMsg}>Todavía no tenés un plan activo.</Text>
          <Text style={styles.statSub}>Consultá con tu sede para empezar.</Text>
        </Card>
      ) : (
        <>
          {/* Plan card */}
          <DarkCard style={styles.balanceCard}>
            <Watermark
              color="accent"
              size={26}
              opacity={0.9}
              position={{ top: 26, right: 28 }}
            />
            <TagLabel style={dimLabel}>Mi plan</TagLabel>
            <Text style={styles.planName}>{plan.plan}</Text>

            <View style={styles.planDates}>
              {plan.fechaPago && (
                <View style={styles.planDateCol}>
                  <TagLabel style={dimLabel}>Pagaste</TagLabel>
                  <Text style={styles.planDateValue}>
                    {formatShortDate(plan.fechaPago)}
                  </Text>
                </View>
              )}
              {plan.fechaPago && <View style={styles.planDateDivider} />}
              <View style={styles.planDateCol}>
                <TagLabel style={dimLabel}>
                  {vencido ? 'Venció' : 'Vence'}
                </TagLabel>
                {plan.vigenciaHasta ? (
                  <Text
                    style={[styles.planDateValue, vencido && styles.vencido]}
                  >
                    {formatShortDate(plan.vigenciaHasta)}
                  </Text>
                ) : (
                  <Text style={styles.planDateValue}>Sin vencimiento fijo</Text>
                )}
                {vencido && diasRestantes !== null && (
                  <Text style={styles.vencidoExtra}>
                    hace {Math.abs(diasRestantes)}{' '}
                    {Math.abs(diasRestantes) === 1 ? 'día' : 'días'}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.balanceStatus}>
              <Badge variant={badgeVariant(plan.estado)}>
                {estadoLabel[plan.estado] ?? plan.estado}
              </Badge>
            </View>
          </DarkCard>

          {/* Stats de accesos (vienen de /suscripciones) */}
          {stats && (
            <View style={styles.statsGrid}>
              {stats.grupos && stats.grupos.length > 0 ? (
                stats.grupos.map((g) => (
                  <Card key={g.id} style={styles.statCard}>
                    <TagLabel>{g.nombre}</TagLabel>
                    <Text style={styles.statBig}>
                      {g.accesosUsados} / {g.accesos}
                    </Text>
                    <Text style={styles.statSub}>
                      {Math.max(0, accesosReservablesGrupo(g))} restantes
                    </Text>
                  </Card>
                ))
              ) : (
                <Card style={styles.statCard}>
                  <TagLabel>Clases</TagLabel>
                  <Text style={styles.statBig}>
                    {stats.accesosUsados} / {stats.accesos}
                  </Text>
                  <Text style={styles.statSub}>
                    {Math.max(0, accesosReservables(stats))} restantes
                  </Text>
                  <Badge variant="ok" style={styles.statBadge}>
                    En curso
                  </Badge>
                </Card>
              )}
              <Card style={styles.statCard}>
                <TagLabel>Cancelaciones</TagLabel>
                <Text style={styles.statBig}>
                  {stats.cancelacionesUsadas} / {stats.cancelaciones}
                </Text>
                <Text style={styles.statSub}>
                  {Math.max(0, stats.cancelaciones - stats.cancelacionesUsadas)}{' '}
                  restantes
                </Text>
                <Badge variant="tuya" style={styles.statBadge}>
                  Este mes
                </Badge>
              </Card>
            </View>
          )}

          {stats && stats.accesosExtra > 0 && (
            <Card style={styles.extra}>
              <TagLabel>Accesos extra</TagLabel>
              <Text style={styles.extraNum}>+{stats.accesosExtra}</Text>
              <Text style={styles.statSub}>Cortesía incluida en tu plan</Text>
            </Card>
          )}
        </>
      )}

      {/* Historial de pagos */}
      <View style={styles.sectionHead}>
        <TagLabel>Historial de pagos</TagLabel>
      </View>

      {pagos.length === 0 ? (
        <Card style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>No hay pagos registrados</Text>
          <Text style={[styles.statSub, styles.placeholderSub]}>
            Cuando tu sede registre un pago, lo vas a ver acá.
          </Text>
        </Card>
      ) : (
        <Card style={styles.pagosList}>
          {pagos.map((p, i) => (
            <View
              key={p.id}
              style={[styles.pagoRow, i === pagos.length - 1 && styles.pagoLast]}
            >
              <Text style={styles.pagoDate}>{formatShortDate(p.fechaPago)}</Text>
              <View style={styles.pagoBody}>
                <Text style={styles.pagoPlan}>{p.plan}</Text>
              </View>
              <Text style={styles.pagoMonto}>{formatARS(p.monto)}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 32 },
  bodyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink },

  balanceCard: { marginBottom: 24 },
  planName: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 27,
    color: colors.surface,
    marginTop: 10,
    marginBottom: 20,
    zIndex: 1,
  },
  planDates: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 4,
    marginBottom: 18,
    zIndex: 1,
  },
  planDateCol: { flex: 1, gap: 7 },
  planDateDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(253, 251, 250, 0.12)',
    marginHorizontal: 16,
  },
  planDateValue: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.surface,
  },
  vencido: { color: colors.terracotta, fontFamily: fonts.semibold },
  vencidoExtra: {
    color: colors.terracotta,
    fontSize: 11,
    fontFamily: fonts.medium,
  },
  balanceStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },

  statsGrid: { gap: 16, marginBottom: 36 },
  statCard: {},
  statBig: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 30,
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

  extra: {
    marginBottom: 36,
    backgroundColor: colors.beigeSoft,
    borderColor: colors.beige,
  },
  extraNum: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 40,
    color: colors.taupeDark,
    marginTop: 8,
    marginBottom: 4,
  },

  sectionHead: { marginBottom: 12, marginTop: 16 },
  placeholder: {
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 24,
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    fontFamily: fonts.light,
    fontSize: 20,
    color: colors.ink,
  },
  placeholderSub: { textAlign: 'center' },

  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyMsg: {
    fontFamily: fonts.light,
    fontSize: 22,
    color: colors.ink,
    marginTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },

  pagosList: { padding: 0 },
  pagoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  pagoLast: { borderBottomWidth: 0 },
  pagoDate: {
    fontFamily: fonts.light,
    fontSize: 12,
    width: 76,
    color: colors.ink,
  },
  pagoBody: { flex: 1, minWidth: 0 },
  pagoPlan: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 17,
    color: colors.ink,
  },
  pagoMonto: {
    fontFamily: fonts.light,
    fontSize: 16,
    color: colors.ink,
  },
});
