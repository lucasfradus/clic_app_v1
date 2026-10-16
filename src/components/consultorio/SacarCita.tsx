// "Sacar una cita" en 4 pasos: servicio → consulta → horario → confirmar.
// Lo elegido se guarda por id y se vuelve a buscar en `servicios` en cada
// render: si una recarga saca el servicio o deja la consulta sin forma de
// sacarse (p. ej. se usó la incluida), el asistente retrocede solo.
//
// En Android el botón atrás retrocede un paso antes de salir de la pantalla
// (BackHandler mientras la pantalla está enfocada y no se está en el paso 1).
// El que muestra el asistente lo remonta con otra `key` para volver al paso 1.
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, Text, View, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { TagLabel } from '@/components/ui/Text';
import ElegirHorario from './ElegirHorario';
import PasoConfirmar from './PasoConfirmar';
import PasoPrestacion from './PasoPrestacion';
import PasoServicio from './PasoServicio';
import { prestacionDisponible } from '@/lib/consultorio';
import type {
  HuecoConsultorio,
  PrestacionConsultorio,
  ServicioConsultorio,
} from '@/types';
import { colors, fonts, radius } from '@/theme';

const TITULOS = ['¿Qué servicio?', '¿Qué consulta?', '¿Cuándo?', 'Confirmar'];

type Eleccion = {
  servicio: string | null;
  prestacionId: number | null;
  hueco: HuecoConsultorio | null;
};

const NADA: Eleccion = { servicio: null, prestacionId: null, hueco: null };

/** El mismo servicio puede ofrecerse en dos sedes. */
const claveServicio = (s: ServicioConsultorio) => `${s.servicioId}-${s.sede.id}`;

export default function SacarCita({
  servicios,
  enviando,
  onCambioPaso,
  onReservar,
}: {
  servicios: ServicioConsultorio[];
  enviando: boolean;
  /** Para llevar el scroll al principio del asistente. */
  onCambioPaso: () => void;
  onReservar: (p: PrestacionConsultorio, h: HuecoConsultorio) => void;
}) {
  const [eleccion, setEleccion] = useState<Eleccion>(NADA);

  const servicio = servicios.find((s) => claveServicio(s) === eleccion.servicio);
  const prestacion = servicio?.prestaciones.find(
    (p) => p.id === eleccion.prestacionId && prestacionDisponible(servicio, p)
  );
  const hueco = prestacion ? eleccion.hueco : null;
  const paso = !servicio ? 1 : !prestacion ? 2 : !hueco ? 3 : 4;

  // Lo que dejó de valer se descarta, para que no reaparezca si vuelve a valer.
  useEffect(() => {
    if (eleccion.servicio && !servicio) setEleccion(NADA);
    else if (eleccion.prestacionId != null && !prestacion) {
      setEleccion({ servicio: eleccion.servicio, prestacionId: null, hueco: null });
    }
  }, [eleccion, servicio, prestacion]);

  const pasoAnterior = useRef(paso);
  useEffect(() => {
    if (pasoAnterior.current !== paso) onCambioPaso();
    pasoAnterior.current = paso;
  }, [paso, onCambioPaso]);

  const volver = useCallback(() => {
    setEleccion((e) =>
      e.hueco
        ? { ...e, hueco: null }
        : e.prestacionId != null
          ? { ...e, prestacionId: null }
          : NADA
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (paso === 1) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        // Mientras se envía la reserva, atrás no hace nada (ni sale).
        if (!enviando) volver();
        return true;
      });
      return () => sub.remove();
    }, [paso, enviando, volver])
  );

  const resumen = [
    servicio?.nombre,
    prestacion?.nombre,
    prestacion && `${prestacion.duracionMinutos} min`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View>
      <View style={styles.head}>
        <View style={styles.headText}>
          <TagLabel>Paso {paso} de 4</TagLabel>
          <Text style={styles.titulo}>{TITULOS[paso - 1]}</Text>
        </View>
        {paso > 1 && (
          <Pressable
            onPress={volver}
            disabled={enviando}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Volver al paso anterior"
            style={({ pressed }) => [styles.atras, pressed && styles.atrasPressed]}
          >
            <Text style={styles.atrasText}>← Volver</Text>
          </Pressable>
        )}
      </View>

      {paso > 1 && (
        <View style={styles.resumen}>
          <Text style={styles.resumenText}>{resumen} ·</Text>
          <Pressable
            onPress={() => setEleccion(NADA)}
            disabled={enviando}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cambiar de servicio"
          >
            <Text style={styles.cambiar}>cambiar</Text>
          </Pressable>
        </View>
      )}

      {paso === 1 && (
        <PasoServicio
          servicios={servicios}
          onElegir={(s) =>
            setEleccion({ servicio: claveServicio(s), prestacionId: null, hueco: null })
          }
        />
      )}

      {paso === 2 && servicio && (
        <PasoPrestacion
          servicio={servicio}
          onElegir={(p) => setEleccion({ ...eleccion, prestacionId: p.id, hueco: null })}
        />
      )}

      {paso === 3 && servicio && prestacion && (
        <Card>
          {servicio.meses[0]?.disponibles === 0 &&
            servicio.meses[1] &&
            servicio.meses[1].disponibles > 0 && (
              <Text style={styles.nota}>
                Podés sacar la de {servicio.meses[1].mes} eligiendo un día de ese mes.
              </Text>
            )}
          <ElegirHorario
            sedeId={servicio.sede.id}
            prestacionId={prestacion.id}
            diasAdelante={servicio.diasReservaAnticipada}
            sena={prestacion.precioParticular !== null ? prestacion.sena : undefined}
            onElegir={(h) => setEleccion({ ...eleccion, hueco: h })}
          />
        </Card>
      )}

      {paso === 4 && servicio && prestacion && hueco && (
        <PasoConfirmar
          servicio={servicio}
          prestacion={prestacion}
          hueco={hueco}
          enviando={enviando}
          onConfirmar={() => onReservar(prestacion, hueco)}
          onVolver={volver}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 14,
    marginHorizontal: 4,
  },
  headText: { flex: 1 },
  titulo: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 30,
    color: colors.ink,
    marginTop: 6,
  },
  atras: {
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  atrasPressed: { backgroundColor: colors.subtleSoft },
  atrasText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  resumen: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
    marginTop: -4,
    marginHorizontal: 4,
    marginBottom: 14,
  },
  resumenText: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
  },
  cambiar: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.ink,
    textDecorationLine: 'underline',
  },
  nota: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginBottom: 14,
  },
});
