// Fila de "Tus citas": horario, profesional, lo que queda por pagar si es
// particular y las acciones (cambiar horario / cancelar) mientras se pueda.
import { Text, View, StyleSheet } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { horaAR, partesDia, puedeModificar, ymdAR } from '@/lib/consultorio';
import { formatARS } from '@/lib/date';
import type { CitaConsultorio } from '@/types';
import { colors, fonts } from '@/theme';

export default function CitaRow({
  cita,
  ultima,
  horasCancelacion,
  puedeReprogramar,
  onReprogramar,
  onCancelar,
}: {
  cita: CitaConsultorio;
  ultima: boolean;
  /** Del servicio de la cita; sin servicio (ya no lo ofrece su plan) cae a 4 como la web. */
  horasCancelacion?: number;
  puedeReprogramar: boolean;
  onReprogramar: () => void;
  onCancelar: () => void;
}) {
  const modificable = puedeModificar(cita.cancelableHasta);
  const dia = partesDia(ymdAR(new Date(cita.inicio)));

  return (
    <View style={[styles.row, ultima && styles.rowLast]}>
      <View style={styles.time}>
        <Text style={styles.timeH}>{horaAR(cita.inicio)}</Text>
        <Text style={styles.timeP}>
          {dia.numero} {dia.mes}
        </Text>
      </View>
      <View style={styles.body}>
        <Badge variant="tuya" style={styles.badge}>
          Confirmada
        </Badge>
        <Text style={styles.name}>
          {cita.servicio} · {cita.prestacion.nombre}
        </Text>
        <Text style={styles.meta}>
          {[cita.profesional, cita.sede.nombre, cita.consultorio]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {cita.modalidad === 'PARTICULAR' && cita.precio !== null && (
          <Text style={styles.meta}>
            {cita.sena
              ? `Seña pagada ${formatARS(cita.sena)} · al profesional ${formatARS(cita.precio - cita.sena)}`
              : `Particular · al profesional ${formatARS(cita.precio)}`}
          </Text>
        )}
        {modificable ? (
          <View style={styles.acciones}>
            {puedeReprogramar && (
              <Button
                title="Cambiar horario"
                variant="secondary"
                onPress={onReprogramar}
                style={styles.accion}
              />
            )}
            <Button
              title="Cancelar"
              variant="secondary"
              onPress={onCancelar}
              style={styles.accion}
            />
          </View>
        ) : (
          <Text style={styles.nota}>
            Ya no se puede cancelar ni cambiar ({horasCancelacion ?? 4} h antes).
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  rowLast: { borderBottomWidth: 0 },
  time: { width: 64 },
  timeH: {
    fontFamily: fonts.light,
    fontSize: 22,
    lineHeight: 24,
    color: colors.ink,
  },
  timeP: {
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.neutralDark,
    marginTop: 4,
  },
  body: { flex: 1, paddingLeft: 12 },
  badge: { marginBottom: 8 },
  name: {
    fontFamily: fonts.light,
    fontSize: 18,
    lineHeight: 21,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.inkMute,
    marginTop: 6,
  },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  accion: { paddingVertical: 9, paddingHorizontal: 14 },
  nota: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.inkMute,
    marginTop: 12,
  },
});
