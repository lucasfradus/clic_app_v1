// Paso 1 de "Sacar una cita": qué servicio (nutrición, kinesio…), con la sede
// y las incluidas que le quedan en el mes. Se muestra aunque haya uno solo.
import { Text, StyleSheet } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import Opcion from './Opcion';
import { textoIncluidas } from '@/lib/consultorio';
import type { ServicioConsultorio } from '@/types';
import { colors, fonts } from '@/theme';

export default function PasoServicio({
  servicios,
  onElegir,
}: {
  servicios: ServicioConsultorio[];
  onElegir: (s: ServicioConsultorio) => void;
}) {
  return (
    <>
      {servicios.map((s) => {
        const incluidas = textoIncluidas(s);
        return (
          <Opcion
            key={`${s.servicioId}-${s.sede.id}`}
            onPress={() => onElegir(s)}
            accessibilityLabel={`${s.nombre}, ${s.sede.nombre}`}
          >
            <Text style={styles.nombre}>{s.nombre}</Text>
            <Text style={styles.meta}>{s.sede.nombre}</Text>
            {incluidas && (
              <Badge
                variant={s.meses[0].disponibles > 0 ? 'ok' : 'fu'}
                style={styles.badge}
              >
                {incluidas}
              </Badge>
            )}
          </Opcion>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
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
});
