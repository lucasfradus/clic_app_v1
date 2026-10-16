// Cartel de la vuelta de Mercado Pago (port de CartelSena de la web): mismo
// texto por estado. Se puede cerrar cuando el estado es final o cuando se
// agotaron las consultas (sigue guardada y se reintenta al volver a la app).
import { Text, View, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';
import type { VueltaSena } from '@/lib/useVueltaDeSena';
import { colors, fonts, radius } from '@/theme';

export default function CartelSena({
  vuelta,
  onCerrar,
}: {
  vuelta: VueltaSena;
  onCerrar: () => void;
}) {
  const e = vuelta.estado?.estado;
  const texto =
    e === 'PROCESADA'
      ? '¡Listo! Recibimos la seña y tu cita quedó confirmada. Te mandamos un mail.'
      : e === 'SIN_LUGAR'
        ? 'Recibimos tu seña, pero el horario se ocupó mientras pagabas. Recepción te va a contactar para darte otro: la seña no se pierde.'
        : e === 'VENCIDA'
          ? 'No recibimos el pago de la seña a tiempo y el horario se liberó. Si te lo cobraron, avisá en recepción.'
          : vuelta.agotado
            ? 'Todavía no se acreditó el pago. Si te lo cobraron, en unos minutos la cita va a aparecer acá.'
            : 'Estamos confirmando el pago de la seña…';
  const final = e != null && e !== 'PENDIENTE';
  const alerta = e === 'SIN_LUGAR' || e === 'VENCIDA';

  return (
    <View
      style={[
        styles.cartel,
        e === 'PROCESADA' && styles.ok,
        alerta && styles.alerta,
      ]}
    >
      <Text
        style={[
          styles.texto,
          e === 'PROCESADA' && styles.textoOk,
          alerta && styles.textoAlerta,
        ]}
      >
        {texto}
      </Text>
      {(final || vuelta.agotado) && (
        <Button
          title="Cerrar"
          variant="secondary"
          onPress={onCerrar}
          style={styles.cerrar}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cartel: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: radius.card,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 14,
  },
  ok: { backgroundColor: colors.sageBg, borderColor: colors.sage },
  alerta: { backgroundColor: colors.terracottaBg, borderColor: colors.terracotta },
  texto: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  textoOk: { color: colors.ink },
  textoAlerta: { color: colors.ink },
  cerrar: { alignSelf: 'flex-start', paddingVertical: 10 },
});
