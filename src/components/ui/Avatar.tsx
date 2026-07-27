// Avatar del cliente: muestra la foto de perfil si existe, o la inicial del
// nombre. `fotoUrl` puede ser URL (/api/storage/...) o data URI.
import { Image, Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme';
import { API_BASE_URL } from '../../config';

/** Resuelve URLs relativas del backend (/api/storage/...) contra el host de la API. */
export function resolveFotoUrl(fotoUrl: string): string {
  if (fotoUrl.startsWith('data:') || fotoUrl.startsWith('http')) return fotoUrl;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return origin + fotoUrl;
}

export default function Avatar({
  fotoUrl,
  nombre,
  size = 34,
}: {
  fotoUrl?: string | null;
  nombre?: string | null;
  size?: number;
}) {
  const initial = (nombre ?? '?').charAt(0).toUpperCase();
  const round = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  return (
    <View style={[styles.container, round]}>
      {fotoUrl ? (
        <Image source={{ uri: resolveFotoUrl(fotoUrl) }} style={round} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.47 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.taupe,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontFamily: fonts.accent,
    color: colors.ink,
  },
});
