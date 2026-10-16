// Paso 4 de "Sacar una cita": el resumen de lo elegido y qué pasa al confirmar.
// Va en la página y no en el ConfirmModal: es la última pantalla del asistente
// y el texto de la seña es largo para un modal.
import { Text, View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fechaLargaAR, horaAR } from '@/lib/consultorio';
import { formatARS } from '@/lib/date';
import type {
  HuecoConsultorio,
  PrestacionConsultorio,
  ServicioConsultorio,
} from '@/types';
import { colors, fonts } from '@/theme';

/** Precio, seña, resto, retención de 15 minutos y que la seña no se devuelve. */
function notaParticular(p: PrestacionConsultorio): string | null {
  if (p.precioParticular === null) return null;
  return (
    `Consulta particular de ${formatARS(p.precioParticular)}.` +
    (p.sena > 0
      ? ` Ahora pagás la seña de ${formatARS(p.sena)} con Mercado Pago y el resto (${formatARS(p.precioParticular - p.sena)}) se lo pagás al profesional el día de la consulta. Te guardamos el horario 15 minutos. La seña no se devuelve: si cancelás la perdés; si cambiás el horario, la conservás.`
      : ' Se la pagás al profesional el día de la consulta.')
  );
}

export default function PasoConfirmar({
  servicio,
  prestacion,
  hueco,
  enviando,
  onConfirmar,
  onVolver,
}: {
  servicio: ServicioConsultorio;
  prestacion: PrestacionConsultorio;
  hueco: HuecoConsultorio;
  enviando: boolean;
  onConfirmar: () => void;
  onVolver: () => void;
}) {
  const particular = hueco.modalidad === 'PARTICULAR';
  const conSena = particular && prestacion.sena > 0;
  const nota = particular ? notaParticular(prestacion) : 'Incluida en tu plan';
  const primario = conSena ? `Pagar seña ${formatARS(prestacion.sena)}` : 'Confirmar';

  return (
    <Card>
      <Text style={styles.titulo}>
        {servicio.nombre} · {prestacion.nombre}
      </Text>
      <Text style={styles.fecha}>{fechaLargaAR(hueco.inicio)}</Text>
      <Text style={styles.hora}>
        {horaAR(hueco.inicio)} a {horaAR(hueco.fin)}
      </Text>
      <Text style={styles.meta}>{hueco.profesional}</Text>
      <Text style={styles.meta}>
        {[servicio.sede.nombre, servicio.sede.direccion].filter(Boolean).join(' · ')}
      </Text>

      {nota && (
        <Text style={[styles.nota, particular ? styles.notaParticular : styles.notaIncluida]}>
          {nota}
        </Text>
      )}
      <Text style={styles.politica}>
        Podés cancelar o cambiar la cita hasta {servicio.horasCancelacion} h antes.
      </Text>

      <View style={styles.acciones}>
        <Button
          title="Volver"
          variant="secondary"
          onPress={onVolver}
          disabled={enviando}
          style={styles.accion}
        />
        <Button
          title={enviando ? 'Enviando…' : primario}
          onPress={onConfirmar}
          disabled={enviando}
          style={styles.accion}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  titulo: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
    marginBottom: 14,
  },
  fecha: {
    fontFamily: fonts.light,
    fontSize: 18,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  hora: {
    fontFamily: fonts.light,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 10,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 2,
  },
  nota: {
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    overflow: 'hidden',
  },
  notaIncluida: { backgroundColor: colors.sageBg, color: colors.ink },
  notaParticular: { backgroundColor: colors.amberBg, color: colors.amber },
  politica: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.inkMute,
    marginTop: 12,
  },
  acciones: { flexDirection: 'row', gap: 12, marginTop: 22 },
  accion: { flex: 1, paddingVertical: 15 },
});
