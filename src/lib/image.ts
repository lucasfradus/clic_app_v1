// Selección + compresión de imágenes (equivalente nativo de lib/image.ts de
// la web): máx 1600 px de lado mayor, JPEG ~0.82, salida como data URI.
// Se usa para la foto de perfil y la foto del DNI del tutor.

import * as ImagePicker from 'expo-image-picker';
import {
  manipulateAsync,
  SaveFormat,
  type Action,
} from 'expo-image-manipulator';

const MAX_DIM = 1600;
const QUALITY = 0.82;

async function toCompressedDataUri(asset: {
  uri: string;
  width: number;
  height: number;
}): Promise<string> {
  const actions: Action[] = [];
  const maxSide = Math.max(asset.width, asset.height);
  if (maxSide > MAX_DIM) {
    actions.push(
      asset.width >= asset.height
        ? { resize: { width: MAX_DIM } }
        : { resize: { height: MAX_DIM } }
    );
  }
  const result = await manipulateAsync(asset.uri, actions, {
    compress: QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!result.base64) {
    throw new Error('No pudimos procesar la imagen.');
  }
  return `data:image/jpeg;base64,${result.base64}`;
}

/**
 * Abre galería o cámara y devuelve la imagen elegida comprimida como data URI,
 * o null si el usuario canceló. Lanza Error con mensaje mostrable si falla
 * el permiso o el procesamiento.
 */
export async function pickCompressedDataUri(
  source: 'galeria' | 'camara'
): Promise<string | null> {
  if (source === 'camara') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      throw new Error('Necesitamos permiso de cámara para sacar la foto.');
    }
  }

  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
  };
  const res =
    source === 'camara'
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);

  if (res.canceled || res.assets.length === 0) return null;
  return toCompressedDataUri(res.assets[0]);
}
