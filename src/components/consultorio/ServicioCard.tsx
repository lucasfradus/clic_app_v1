// Tarjeta de un servicio del consultorio (port de ServicioCard de la web):
// incluidas que le quedan en el mes, prestaciones con su descripción y el
// selector de horario, que se abre con "Sacar una cita".
import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import ElegirHorario from './ElegirHorario';
import { formatARS } from '@/lib/date';
import type {
  HuecoConsultorio,
  PrestacionConsultorio,
  ServicioConsultorio,
} from '@/types';
import { colors, fonts, radius } from '@/theme';

export default function ServicioCard({
  servicio,
  onElegir,
}: {
  servicio: ServicioConsultorio;
  onElegir: (p: PrestacionConsultorio, h: HuecoConsultorio) => void;
}) {
  const [prestacionId, setPrestacionId] = useState(servicio.prestaciones[0]?.id);
  const [abierto, setAbierto] = useState(false);
  const mesActual = servicio.meses[0];
  const mesSiguiente = servicio.meses[1];
  const prestacion = servicio.prestaciones.find((p) => p.id === prestacionId);
  const conParticulares = servicio.prestaciones.some(
    (p) => p.precioParticular !== null
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.nombre}>{servicio.nombre}</Text>
      <Text style={styles.meta}>{servicio.sede.nombre}</Text>
      {servicio.incluidasPorMes > 0 && mesActual && (
        <Badge
          variant={mesActual.disponibles > 0 ? 'ok' : 'fu'}
          style={styles.badge}
        >
          {mesActual.disponibles > 0
            ? `Te queda ${mesActual.disponibles === 1 ? '1 consulta incluida' : `${mesActual.disponibles} incluidas`} en ${mesActual.mes}`
            : `Ya usaste la de ${mesActual.mes}`}
        </Badge>
      )}

      {servicio.incluidasPorMes === 0 && !conParticulares ? (
        <Text style={styles.nota}>
          Tu plan no incluye consultas de {servicio.nombre.toLowerCase()}.
          Consultá en recepción.
        </Text>
      ) : (
        <>
          {mesActual?.disponibles === 0 &&
            mesSiguiente &&
            mesSiguiente.disponibles > 0 && (
              <Text style={styles.nota}>
                Podés sacar la de {mesSiguiente.mes} eligiendo un día de ese mes.
              </Text>
            )}
          {servicio.prestaciones.length > 1 && (
            <View style={styles.prestaciones}>
              {servicio.prestaciones.map((p) => {
                const activa = p.id === prestacionId;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPrestacionId(p.id)}
                    style={[styles.prestacion, activa && styles.prestacionActiva]}
                  >
                    <Text
                      style={[
                        styles.prestacionText,
                        activa && styles.prestacionTextActiva,
                      ]}
                    >
                      {p.nombre} · {p.duracionMinutos} min
                      {p.precioParticular !== null && servicio.incluidasPorMes === 0
                        ? ` · ${formatARS(p.precioParticular)}`
                        : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {prestacion?.descripcion ? (
            <Text style={styles.nota}>{prestacion.descripcion}</Text>
          ) : null}
          <View style={styles.picker}>
            {abierto && prestacion ? (
              <ElegirHorario
                sedeId={servicio.sede.id}
                prestacionId={prestacion.id}
                diasAdelante={servicio.diasReservaAnticipada}
                sena={prestacion.sena}
                onElegir={(h) => onElegir(prestacion, h)}
              />
            ) : (
              <Button title="Sacar una cita" onPress={() => setAbierto(true)} />
            )}
          </View>
          <Text style={[styles.nota, styles.subtle]}>
            Podés cancelar o cambiar la cita hasta {servicio.horasCancelacion} h
            antes.
            {conParticulares &&
              ' Los horarios particulares se pagan aparte: una seña online a Clic y el resto al profesional el día de la consulta.'}
          </Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16 },
  nombre: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 28,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.inkMute,
    marginTop: 4,
  },
  badge: { marginTop: 12 },
  nota: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 12,
  },
  subtle: { color: colors.inkMute, fontSize: 11, lineHeight: 16 },
  prestaciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  prestacion: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  prestacionActiva: { backgroundColor: colors.ink, borderColor: colors.ink },
  prestacionText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  prestacionTextActiva: { color: colors.surface },
  picker: { marginTop: 18 },
});
