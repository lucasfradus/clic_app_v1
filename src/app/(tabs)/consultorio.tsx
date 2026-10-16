// Consultorio (port de pages/Consultorio.tsx): citas con profesionales
// (nutrición, kinesio). Vive en el grupo de tabs para conservar el header y la
// tab bar, pero no tiene tab propio: se entra desde la tarjeta de Home.
//
// Los horarios particulares se reservan pagando una seña en Mercado Pago, en
// un navegador dentro de la app. MP vuelve a la web del socio (el backend no
// acepta otro destino); al cerrar el navegador o volver a la app se consulta
// el estado de la seña y se muestra el cartel (ver useVueltaDeSena).
import { useCallback, useState } from 'react';
import { Linking, ScrollView, Text, View, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Card } from '@/components/ui/Card';
import { TagLabel } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import ConfirmModal from '@/components/ui/ConfirmModal';
import PageHeader from '@/components/layout/PageHeader';
import CartelSena from '@/components/consultorio/CartelSena';
import CitaRow from '@/components/consultorio/CitaRow';
import ElegirHorario from '@/components/consultorio/ElegirHorario';
import ServicioCard from '@/components/consultorio/ServicioCard';
import {
  cancelarCita,
  getCitas,
  getServiciosConsultorio,
  iniciarSena,
  reprogramarCita,
  reservarCita,
} from '@/api/consultorio';
import { ApiError } from '@/api/client';
import { WEB_SOCIO_URL } from '@/config';
import { fechaLargaAR, horaAR } from '@/lib/consultorio';
import { formatARS } from '@/lib/date';
import { useReloadOnFocus } from '@/lib/useReloadOnFocus';
import { useVueltaDeSena } from '@/lib/useVueltaDeSena';
import { useSenaEnCurso } from '@/store/sena';
import { toast } from '@/store/toast';
import type {
  CitaConsultorio,
  HuecoConsultorio,
  PrestacionConsultorio,
  ServicioConsultorio,
} from '@/types';
import { colors, fonts, radius } from '@/theme';

type Confirmacion =
  | {
      kind: 'reservar';
      servicio: ServicioConsultorio;
      prestacion: PrestacionConsultorio;
      hueco: HuecoConsultorio;
    }
  | { kind: 'reprogramar'; cita: CitaConsultorio; hueco: HuecoConsultorio }
  | { kind: 'cancelar'; cita: CitaConsultorio };

function mensajeError(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Error inesperado';
}

/**
 * Abre el checkout de MP en el navegador de la app. Devuelve true si ya volvió
 * (iOS: resuelve al cerrarlo) y false si quedó abierto (Android resuelve con
 * 'opened' al abrir la Custom Tab; la vuelta la detecta AppState).
 */
async function abrirPago(url: string): Promise<boolean> {
  try {
    const r = await WebBrowser.openBrowserAsync(url);
    return r.type !== WebBrowser.WebBrowserResultType.OPENED;
  } catch {
    // Sin navegador compatible: el del sistema. La vuelta es por AppState.
    await Linking.openURL(url);
    return false;
  }
}

export default function Consultorio() {
  const [servicios, setServicios] = useState<ServicioConsultorio[] | null>(null);
  const [citas, setCitas] = useState<CitaConsultorio[]>([]);
  const [reprogramando, setReprogramando] = useState<CitaConsultorio | null>(null);
  const [confirm, setConfirm] = useState<Confirmacion | null>(null);
  const [busy, setBusy] = useState(false);
  // Cambia después de cada reserva/cambio/cancelación: remonta las tarjetas para
  // que el selector no quede mostrando horarios viejos (p. ej. incluidas ya usadas).
  const [version, setVersion] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        getServiciosConsultorio(),
        getCitas('proximas'),
      ]);
      setServicios(s);
      setCitas(c);
    } catch (err) {
      toast.error(mensajeError(err));
      setServicios((prev) => prev ?? []);
    }
  }, []);

  // Al enfocar y al volver a foreground (p. ej. de pagar la seña).
  useReloadOnFocus(cargar);

  const onSenaConfirmada = useCallback(() => {
    void cargar();
    setVersion((v) => v + 1);
  }, [cargar]);
  const { vuelta, seguir, cerrar } = useVueltaDeSena(onSenaConfirmada);

  const servicioDeCita = (c: CitaConsultorio) =>
    servicios?.find((s) => s.prestaciones.some((p) => p.id === c.prestacion.id));

  async function confirmar() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'reservar' && confirm.hueco.modalidad === 'PARTICULAR') {
        const r = await iniciarSena({
          prestacionId: confirm.prestacion.id,
          franjaId: confirm.hueco.franjaId,
          inicio: confirm.hueco.inicio,
          volverA: `${WEB_SOCIO_URL.replace(/\/$/, '')}/consultorio`,
        });
        if ('initPoint' in r) {
          useSenaEnCurso.getState().setSolicitudId(r.solicitudId);
          // El modal queda en "Enviando…" debajo del navegador (en iOS se
          // presenta encima) y se cierra al volver.
          const volvio = await abrirPago(r.initPoint);
          setConfirm(null);
          if (volvio) seguir();
          return;
        }
        toast.success('¡Listo! Tu cita quedó confirmada. Te mandamos un mail.');
      } else if (confirm.kind === 'reservar') {
        await reservarCita({
          prestacionId: confirm.prestacion.id,
          franjaId: confirm.hueco.franjaId,
          inicio: confirm.hueco.inicio,
        });
        toast.success('¡Listo! Tu cita quedó confirmada. Te mandamos un mail.');
      } else if (confirm.kind === 'reprogramar') {
        await reprogramarCita({
          citaId: confirm.cita.id,
          franjaId: confirm.hueco.franjaId,
          inicio: confirm.hueco.inicio,
        });
        toast.success('Cita reprogramada');
        setReprogramando(null);
      } else {
        await cancelarCita(confirm.cita.id);
        toast.success('Cita cancelada');
      }
      setConfirm(null);
      await cargar();
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setBusy(false);
    }
  }

  if (servicios === null) return <Loader />;

  const servicioReprogramando = reprogramando ? servicioDeCita(reprogramando) : undefined;

  // ── Contenido del modal de confirmación ──
  const confirmTag =
    confirm?.kind === 'reservar'
      ? 'Confirmar cita'
      : confirm?.kind === 'reprogramar'
        ? 'Cambiar horario'
        : 'Cancelar cita';
  const confirmTitle = !confirm
    ? ''
    : confirm.kind === 'reservar'
      ? `${confirm.servicio.nombre} · ${confirm.prestacion.nombre}`
      : `${confirm.cita.servicio} · ${confirm.cita.prestacion.nombre}`;
  const confirmMeta: (string | null | undefined)[] = !confirm
    ? []
    : confirm.kind === 'cancelar'
      ? [
          `${fechaLargaAR(confirm.cita.inicio)} · ${horaAR(confirm.cita.inicio)}`,
          confirm.cita.profesional,
        ]
      : [
          `${fechaLargaAR(confirm.hueco.inicio)} · ${horaAR(confirm.hueco.inicio)}`,
          confirm.hueco.profesional,
          confirm.kind === 'reservar'
            ? confirm.servicio.sede.nombre
            : confirm.cita.sede.nombre,
          confirm.kind === 'reservar' ? confirm.prestacion.descripcion : null,
        ];
  let confirmNota: string | null = null;
  if (confirm?.kind === 'cancelar') {
    confirmNota =
      confirm.cita.modalidad === 'PARTICULAR'
        ? 'El horario queda libre. La seña no se devuelve: si querés conservarla, cambiá el horario en lugar de cancelar.'
        : 'El horario queda libre y, si era tu consulta incluida, la recuperás para ese mes.';
  } else if (
    confirm?.kind === 'reservar' &&
    confirm.hueco.modalidad === 'PARTICULAR' &&
    confirm.prestacion.precioParticular !== null
  ) {
    const { precioParticular, sena } = confirm.prestacion;
    confirmNota =
      `Consulta particular de ${formatARS(precioParticular)}.` +
      (sena > 0
        ? ` Ahora pagás la seña de ${formatARS(sena)} con Mercado Pago y el resto (${formatARS(precioParticular - sena)}) se lo pagás al profesional el día de la consulta. Te guardamos el horario 15 minutos. La seña no se devuelve: si cancelás la perdés; si cambiás el horario, la conservás.`
        : ' Se la pagás al profesional el día de la consulta.');
  }
  const confirmPrimary =
    confirm?.kind === 'cancelar'
      ? 'Cancelar cita'
      : confirm?.kind === 'reservar' &&
          confirm.hueco.modalidad === 'PARTICULAR' &&
          confirm.prestacion.sena > 0
        ? `Pagar seña ${formatARS(confirm.prestacion.sena)}`
        : 'Confirmar';

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageHeader title="Consultorio" />

      {vuelta && <CartelSena vuelta={vuelta} onCerrar={cerrar} />}

      {citas.length > 0 && (
        <View style={styles.section}>
          <TagLabel style={styles.sectionLabel}>Tus citas</TagLabel>
          <View style={styles.lista}>
            {citas.map((c, idx) => {
              const servicio = servicioDeCita(c);
              return (
                <CitaRow
                  key={c.id}
                  cita={c}
                  ultima={idx === citas.length - 1}
                  horasCancelacion={servicio?.horasCancelacion}
                  puedeReprogramar={!!servicio}
                  onReprogramar={() => setReprogramando(c)}
                  onCancelar={() => setConfirm({ kind: 'cancelar', cita: c })}
                />
              );
            })}
          </View>
        </View>
      )}

      {reprogramando && servicioReprogramando && (
        <View style={styles.section}>
          <Card>
            <View style={styles.reprogramarHead}>
              <TagLabel style={styles.reprogramarLabel}>
                Elegí el nuevo horario para {reprogramando.prestacion.nombre}
              </TagLabel>
              <Button
                title="Volver"
                variant="secondary"
                onPress={() => setReprogramando(null)}
                style={styles.volver}
              />
            </View>
            <ElegirHorario
              key={reprogramando.id}
              sedeId={reprogramando.sede.id}
              prestacionId={reprogramando.prestacion.id}
              diasAdelante={servicioReprogramando.diasReservaAnticipada}
              citaId={reprogramando.id}
              modalidad={reprogramando.modalidad}
              onElegir={(h) =>
                setConfirm({ kind: 'reprogramar', cita: reprogramando, hueco: h })
              }
            />
          </Card>
        </View>
      )}

      <View style={styles.section}>
        <TagLabel style={styles.sectionLabel}>Sacar una cita</TagLabel>
        {servicios.length === 0 ? (
          <Card style={styles.empty}>
            <Text style={styles.emptyMsg}>
              Tu plan no incluye servicios de consultorio.
            </Text>
          </Card>
        ) : (
          servicios.map((s) => (
            <ServicioCard
              key={`${s.servicioId}-${s.sede.id}-${version}`}
              servicio={s}
              onElegir={(prestacion, hueco) =>
                setConfirm({ kind: 'reservar', servicio: s, prestacion, hueco })
              }
            />
          ))
        )}
      </View>

      <ConfirmModal
        visible={confirm != null}
        tag={confirmTag}
        title={confirmTitle}
        meta={confirmMeta}
        waitNote={confirmNota}
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
  section: { marginBottom: 28 },
  sectionLabel: { marginBottom: 12, marginLeft: 4 },
  lista: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  reprogramarHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  reprogramarLabel: { flex: 1, lineHeight: 14 },
  volver: { paddingVertical: 9, paddingHorizontal: 14 },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 22 },
  emptyMsg: {
    fontFamily: fonts.light,
    fontSize: 18,
    color: colors.neutralDark,
    textAlign: 'center',
  },
});
