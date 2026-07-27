// Tracking local (por dispositivo) del id maximo de novedad que el alumno vio.
// Cualquier novedad con id mayor cuenta como "no leida".

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'clic_novedades_lastSeenId_';

function key(alumnoId: number): string {
  return `${KEY_PREFIX}${alumnoId}`;
}

export async function getLastSeenNovedadId(alumnoId: number): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key(alumnoId));
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function setLastSeenNovedadId(
  alumnoId: number,
  novedadId: number
): Promise<void> {
  try {
    const current = await getLastSeenNovedadId(alumnoId);
    if (novedadId > current) {
      await AsyncStorage.setItem(key(alumnoId), String(novedadId));
    }
  } catch {
    // storage puede fallar — ignorar.
  }
}
