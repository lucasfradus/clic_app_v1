// Video de referencia de un ejercicio (port de VideoEjercicio.tsx de la web).
// Arranca como botón y recién al tocarlo crea el reproductor: una rutina puede
// tener decenas de ejercicios y no hace falta bajar todos los videos.
import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { urlVideo } from '@/api/musculacion';
import { colors, fonts, radius } from '@/theme';

function Reproductor({ url, nombre }: { url: string; nombre: string }) {
  const player = useVideoPlayer(urlVideo(url), (p) => {
    p.play();
  });
  return (
    <View style={styles.marco}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
        accessibilityLabel={`Video de ${nombre}`}
      />
    </View>
  );
}

export default function VideoEjercicio({
  url,
  nombre,
}: {
  url: string | null;
  nombre: string;
}) {
  const [abierto, setAbierto] = useState(false);
  // null = el ejercicio no tiene video; "" = el backend no pudo firmarlo.
  if (!url) return null;
  if (!abierto) {
    return (
      <Pressable
        style={({ pressed }) => [styles.boton, pressed && styles.presionado]}
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        accessibilityLabel={`Ver video de ${nombre}`}
      >
        <Text style={styles.botonTexto}>▶ Ver video</Text>
      </Pressable>
    );
  }
  return <Reproductor url={url} nombre={nombre} />;
}

const styles = StyleSheet.create({
  boton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  presionado: { opacity: 0.7 },
  botonTexto: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.ink,
  },
  // Los videos se graban verticales: marco 3:4 con fondo oscuro (contain).
  marco: {
    marginTop: 12,
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.ink,
  },
  video: { width: '100%', height: '100%' },
});
