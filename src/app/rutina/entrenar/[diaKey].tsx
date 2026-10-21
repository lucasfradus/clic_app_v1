// Entrenar (port de pages/Entrenar.tsx): el día de la rutina bloque por
// bloque, anotando el peso de cada ejercicio. Pantalla completa, sin tabs.
// Todo se guarda en el servidor apenas se marca o se anota; la pantalla se
// actualiza antes de la respuesta.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import { useGuard } from '@/components/useGuard';
import { Card } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import VideoEjercicio from '@/components/musculacion/VideoEjercicio';
import {
  getMusculacion,
  iniciarEntrenamiento,
  registrarBloque,
  registrarPeso,
} from '@/api/musculacion';
import { ApiError } from '@/api/client';
import {
  clavePeso,
  diaMes,
  entrenamientoDeHoy,
  indicaciones,
  kg,
  parsePeso,
  textoPeso,
} from '@/lib/musculacion';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import type {
  BloqueRutina,
  EntrenamientoMusculacion,
  MusculacionEstado,
} from '@/types';
import { colors, fonts } from '@/theme';

type Carga = {
  estado: MusculacionEstado;
  registro: EntrenamientoMusculacion;
  diaNumero: number;
};
type Status = 'loading' | 'ok' | 'error' | 'no-existe';

/** Trae el entrenamiento de hoy para ese día; si todavía no existe, lo crea. */
async function cargarDia(diaKey: string): Promise<Carga | null> {
  let estado = await getMusculacion();
  const rutina = estado.rutina;
  const diaIndex = rutina ? rutina.dias.findIndex((d) => d.key === diaKey) : -1;
  if (!rutina || diaIndex === -1) return null;
  let registro = entrenamientoDeHoy(estado, diaKey);
  if (!registro) {
    await iniciarEntrenamiento(rutina.id, rutina.version, diaKey);
    estado = await getMusculacion();
    registro = entrenamientoDeHoy(estado, diaKey);
  }
  return registro ? { estado, registro, diaNumero: diaIndex + 1 } : null;
}

function volverARutina() {
  if (router.canGoBack()) router.back();
  else router.replace('/rutina');
}

function EntrenarBody() {
  const { diaKey = '' } = useLocalSearchParams<{ diaKey: string }>();
  const perfil = useAuth((s) => s.perfil);
  const insets = useSafeAreaInsets();
  const [carga, setCarga] = useState<Carga | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  // Bloque en pantalla; bloques.length = pantalla de cierre.
  const [actual, setActual] = useState(0);
  const [textos, setTextos] = useState<Record<string, string>>({});
  // Espejo de `textos` y último kg mandado por ejercicio: guardarPeso puede
  // correr dos veces seguidas (guardarPendientes + onEndEditing del campo) y
  // la segunda tiene que ver lo que dejó la primera, no el estado del render.
  const textosRef = useRef<Record<string, string>>({});
  const guardados = useRef<Record<string, number>>({});
  const version = useRef(0);
  const cola = useRef<Promise<void>>(Promise.resolve());
  const scrollRef = useRef<ScrollView>(null);
  useKeepAwake();

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const c = await cargarDia(diaKey);
      if (!c) {
        setStatus('no-existe');
        return;
      }
      version.current = c.registro.version;
      guardados.current = { ...c.registro.pesos };
      textosRef.current = Object.fromEntries(
        Object.entries(c.registro.pesos).map(([k, v]) => [k, textoPeso(v)])
      );
      setCarga(c);
      setTextos(textosRef.current);
      const pendiente = c.registro.bloques.findIndex(
        (b) => !c.registro.completados.includes(b.key)
      );
      setActual(pendiente === -1 ? c.registro.bloques.length : pendiente);
      setStatus('ok');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
      setStatus('error');
    }
  }, [diaKey]);

  useEffect(() => {
    void load();
  }, [load]);

  // El peso se guarda al terminar de editar el campo, pero tocar un botón con
  // el teclado abierto no siempre lo dispara antes de que el campo se desmonte:
  // antes de cambiar de bloque o salir se guardan los del bloque en pantalla.
  function guardarPendientes() {
    Keyboard.dismiss();
    const b = carga?.registro.bloques[actual];
    if (b) b.ejercicios.forEach((_, i) => guardarPeso(b.key, i));
  }

  function irA(indice: number) {
    guardarPendientes();
    setActual(indice);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function salir() {
    guardarPendientes();
    volverARutina();
  }

  if (perfil && !perfil.musculacionDisponible) return <Redirect href="/" />;

  // Los cambios van en fila: cada PATCH necesita la versión que devolvió el anterior.
  // Un 409 (se modificó desde otro dispositivo) recarga para no pisar nada.
  function guardar(cambio: (v: number) => Promise<number>) {
    cola.current = cola.current.then(async () => {
      try {
        version.current = await cambio(version.current);
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : 'No se pudo guardar. Revisá la conexión.'
        );
        if (err instanceof ApiError && err.status === 409) await load();
      }
    });
  }

  function actualizar(fn: (r: EntrenamientoMusculacion) => EntrenamientoMusculacion) {
    setCarga((c) => (c ? { ...c, registro: fn(c.registro) } : c));
  }

  function escribir(clave: string, texto: string) {
    textosRef.current = { ...textosRef.current, [clave]: texto };
    setTextos(textosRef.current);
  }

  function guardarPeso(bloqueKey: string, index: number) {
    if (!carga) return;
    const clave = clavePeso(bloqueKey, index);
    const valor = parsePeso(textosRef.current[clave] ?? '');
    const previo = guardados.current[clave] ?? null;
    if (valor === undefined) {
      toast.error('Ingresá el peso en kg, por ejemplo 12,5');
      escribir(clave, previo === null ? '' : textoPeso(previo));
      return;
    }
    if (valor === previo) return;
    if (valor === null) delete guardados.current[clave];
    else guardados.current[clave] = valor;
    actualizar((r) => {
      const pesos = { ...r.pesos };
      if (valor === null) delete pesos[clave];
      else pesos[clave] = valor;
      return { ...r, pesos };
    });
    const id = carga.registro.id;
    guardar((v) => registrarPeso(id, v, bloqueKey, index, valor));
  }

  function marcarBloque(bloque: BloqueRutina, completado: boolean) {
    if (!carga) return;
    const { registro } = carga;
    const completados = completado
      ? [...new Set([...registro.completados, bloque.key])]
      : registro.completados.filter((k) => k !== bloque.key);
    actualizar((r) => ({ ...r, completados }));
    guardar((v) => registrarBloque(registro.id, v, bloque.key, completado));
    if (completado) {
      // Siguiente bloque sin terminar, o la pantalla de cierre si ya están todos.
      const siguiente = registro.bloques.findIndex(
        (b, i) => i > actual && !completados.includes(b.key)
      );
      const cualquiera = registro.bloques.findIndex((b) => !completados.includes(b.key));
      irA(
        siguiente !== -1
          ? siguiente
          : cualquiera !== -1
            ? cualquiera
            : registro.bloques.length
      );
    }
  }

  const cerrar = (
    <Pressable
      style={[styles.cerrar, { top: Math.max(12, insets.top) }]}
      onPress={salir}
      accessibilityLabel="Cerrar"
    >
      <Text style={styles.cerrarTexto}>✕</Text>
    </Pressable>
  );

  if (status === 'loading' && !carga) {
    return (
      <View style={styles.flex}>
        {cerrar}
        <Loader label="Preparando tu entrenamiento…" />
      </View>
    );
  }

  if (status === 'no-existe' || status === 'error' || !carga) {
    return (
      <View style={[styles.flex, styles.centro]}>
        {cerrar}
        <Text style={styles.msg}>
          {status === 'no-existe'
            ? 'Este día ya no está en tu rutina. Puede que tu profe la haya cambiado.'
            : error}
        </Text>
        {status === 'no-existe' ? (
          <Button title="Ver mi rutina" onPress={salir} />
        ) : (
          <Button title="Reintentar" onPress={() => void load()} />
        )}
      </View>
    );
  }

  const { registro, estado, diaNumero } = carga;
  const bloques = registro.bloques;
  const terminado = actual >= bloques.length;
  const bloque = bloques[actual];
  const bloqueHecho = !terminado && registro.completados.includes(bloque.key);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.head, { paddingTop: Math.max(12, insets.top) + 4 }]}>
        <View style={styles.headTexto}>
          <TagLabel numberOfLines={1}>{registro.rutinaNombre}</TagLabel>
          <Text style={styles.headTitulo}>Día {diaNumero}</Text>
        </View>
        <Pressable onPress={salir} accessibilityLabel="Cerrar" style={styles.cerrarHead}>
          <Text style={styles.cerrarTexto}>✕</Text>
        </Pressable>
      </View>
      <View
        style={styles.progreso}
        accessibilityLabel={`${registro.completados.length} de ${bloques.length} bloques terminados`}
      >
        {bloques.map((b, i) => (
          <Pressable
            key={b.key}
            onPress={() => irA(i)}
            hitSlop={8}
            accessibilityLabel={`Ir al bloque ${i + 1}`}
            style={[
              styles.punto,
              registro.completados.includes(b.key) && styles.puntoHecho,
              i === actual && styles.puntoActual,
            ]}
          />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.cuerpo}
        keyboardShouldPersistTaps="handled"
      >
        {terminado ? (
          <View style={styles.fin}>
            <Text style={styles.finIcono}>✓</Text>
            <PageTitle style={styles.finTitulo}>¡Día {diaNumero} completado!</PageTitle>
            <Text style={styles.finSub}>Buen trabajo. Esto es lo que anotaste hoy:</Text>
            <Card style={styles.resumen}>
              {bloques.flatMap((b) =>
                b.ejercicios.map((e, i) => {
                  const peso = registro.pesos[clavePeso(b.key, i)];
                  return (
                    <View key={clavePeso(b.key, i)} style={styles.resumenFila}>
                      <Text style={styles.resumenNombre}>{e.nombre}</Text>
                      <Text style={styles.resumenKg}>
                        {peso !== undefined ? kg(peso) : '—'}
                      </Text>
                    </View>
                  );
                })
              )}
            </Card>
            <Button title="Volver a mi rutina" onPress={salir} />
            <Pressable onPress={() => irA(0)} style={styles.link}>
              <Text style={styles.linkTexto}>Revisar los bloques</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <TagLabel>
              Bloque {actual + 1} de {bloques.length}
            </TagLabel>
            <Text style={styles.bloqueNombre}>{bloque.nombre}</Text>
            <Text style={styles.bloqueMeta}>
              {bloque.vueltas} {bloque.vueltas === 1 ? 'vuelta' : 'vueltas'}
            </Text>

            {bloque.ejercicios.map((e, i) => {
              const clave = clavePeso(bloque.key, i);
              const anterior = estado.pesosAnteriores[e.ejercicioId];
              const detalle = indicaciones(e);
              return (
                <Card key={clave} style={styles.ejercicio}>
                  <Text style={styles.ejercicioNombre}>
                    {i + 1}. {e.nombre}
                  </Text>
                  {!!detalle && <Text style={styles.ejercicioInd}>{detalle}</Text>}
                  <VideoEjercicio url={e.videoUrl} nombre={e.nombre} />
                  <View style={styles.peso}>
                    <TagLabel>Peso de hoy</TagLabel>
                    <View style={styles.pesoInput}>
                      <TextInput
                        style={styles.input}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                        placeholder={
                          anterior
                            ? textoPeso(anterior.kg)
                            : e.cargaKg !== null
                              ? textoPeso(e.cargaKg)
                              : '–'
                        }
                        placeholderTextColor={colors.neutral}
                        value={textos[clave] ?? ''}
                        onChangeText={(t) => escribir(clave, t)}
                        onEndEditing={() => guardarPeso(bloque.key, i)}
                        accessibilityLabel={`Peso de hoy para ${e.nombre}`}
                      />
                      <Text style={styles.pesoUnidad}>kg</Text>
                    </View>
                    <Text style={styles.pesoRef}>
                      {anterior
                        ? `La vez pasada ${kg(anterior.kg)} (${diaMes(anterior.fecha)})`
                        : e.cargaKg !== null
                          ? `Sugerido ${kg(e.cargaKg)}`
                          : 'Primera vez: anotá con cuánto lo hiciste'}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>

      {!terminado && (
        <View style={[styles.acciones, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <Button
            title="← Anterior"
            variant="secondary"
            disabled={actual === 0}
            onPress={() => irA(actual - 1)}
            style={styles.accion}
          />
          {bloqueHecho ? (
            <>
              <Button
                title="Desmarcar"
                variant="secondary"
                onPress={() => marcarBloque(bloque, false)}
                style={styles.accion}
              />
              <Button
                title="Siguiente →"
                onPress={() => irA(actual + 1)}
                style={styles.accion}
              />
            </>
          ) : (
            <Button
              title="✓ Terminé el bloque"
              onPress={() => marcarBloque(bloque, true)}
              style={styles.accionPrincipal}
            />
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

export default function Entrenar() {
  const guard = useGuard();
  if (guard.state === 'loading') return <Loader />;
  if (guard.state === 'redirect') return <Redirect href={guard.href} />;
  return <EntrenarBody />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  centro: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 },
  msg: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    textAlign: 'center',
  },
  cerrar: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cerrarHead: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cerrarTexto: { fontSize: 22, color: colors.ink },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headTexto: { flex: 1, gap: 2 },
  headTitulo: { fontFamily: fonts.semibold, fontSize: 20, color: colors.ink },
  progreso: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  punto: {
    width: 22,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.subtle,
  },
  puntoHecho: { backgroundColor: colors.sage },
  puntoActual: { backgroundColor: colors.ink },
  cuerpo: { padding: 20, paddingBottom: 32 },
  bloqueNombre: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
    color: colors.ink,
    marginTop: 6,
  },
  bloqueMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkMute,
    marginTop: 2,
    marginBottom: 18,
  },
  ejercicio: { marginBottom: 14 },
  ejercicioNombre: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  ejercicioInd: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
  },
  peso: { marginTop: 16, gap: 6 },
  pesoInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    width: 110,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.bg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.ink,
  },
  pesoUnidad: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkSoft },
  pesoRef: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkMute },
  acciones: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  accion: { flex: 1, paddingHorizontal: 8 },
  accionPrincipal: { flex: 2 },
  fin: { alignItems: 'stretch', gap: 14, paddingTop: 24 },
  finIcono: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    lineHeight: 64,
    borderRadius: 32,
    overflow: 'hidden',
    textAlign: 'center',
    fontSize: 30,
    color: colors.surface,
    backgroundColor: colors.sage,
  },
  finTitulo: { textAlign: 'center' },
  finSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  resumen: { paddingVertical: 8 },
  resumenFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  resumenNombre: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  resumenKg: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink },
  link: { alignSelf: 'center', padding: 8 },
  linkTexto: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.inkSoft,
    textDecorationLine: 'underline',
  },
});
