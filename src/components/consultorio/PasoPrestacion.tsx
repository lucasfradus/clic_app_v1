// Paso 2 de "Sacar una cita": qué consulta del servicio, con su duración, la
// descripción y cómo se puede sacar (incluida en el plan y/o particular). La
// que no entra de ninguna de las dos formas queda deshabilitada.
import { Text, View, StyleSheet } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import Opcion from './Opcion';
import { entraComoIncluida, prestacionDisponible } from '@/lib/consultorio';
import { formatARS } from '@/lib/date';
import type { PrestacionConsultorio, ServicioConsultorio } from '@/types';
import { colors, fonts } from '@/theme';

function textoParticular(p: PrestacionConsultorio): string | null {
  if (p.precioParticular === null) return null;
  return p.sena > 0
    ? `Particular ${formatARS(p.precioParticular)} · seña ${formatARS(p.sena)}`
    : `Particular ${formatARS(p.precioParticular)}`;
}

export default function PasoPrestacion({
  servicio,
  onElegir,
}: {
  servicio: ServicioConsultorio;
  onElegir: (p: PrestacionConsultorio) => void;
}) {
  const ninguna = !servicio.prestaciones.some((p) =>
    prestacionDisponible(servicio, p)
  );

  return (
    <>
      {servicio.prestaciones.map((p) => {
        const disponible = prestacionDisponible(servicio, p);
        const particular = textoParticular(p);
        const incluida = entraComoIncluida(servicio, p);
        return (
          <Opcion
            key={p.id}
            onPress={() => onElegir(p)}
            disabled={!disponible}
            accessibilityLabel={`${p.nombre}, ${p.duracionMinutos} minutos`}
          >
            <Text style={styles.nombre}>{p.nombre}</Text>
            <Text style={styles.duracion}>{p.duracionMinutos} min</Text>
            {p.descripcion ? (
              <Text style={styles.descripcion}>{p.descripcion}</Text>
            ) : null}
            <View style={styles.tags}>
              {!disponible ? (
                <Badge variant="fu">No disponible por ahora</Badge>
              ) : (
                <>
                  {incluida && <Badge variant="ok">Incluida en tu plan</Badge>}
                  {particular && <Badge variant="wait">{particular}</Badge>}
                </>
              )}
            </View>
          </Opcion>
        );
      })}
      {ninguna && (
        <Text style={styles.nota}>
          Tu plan no incluye consultas de {servicio.nombre.toLowerCase()}.
          Consultá en recepción.
        </Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  nombre: {
    fontFamily: fonts.light,
    fontSize: 20,
    lineHeight: 24,
    color: colors.ink,
  },
  duracion: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.neutralDark,
    marginTop: 4,
  },
  descripcion: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 10,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  nota: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 4,
    marginHorizontal: 4,
  },
});
