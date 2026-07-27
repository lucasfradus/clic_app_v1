// Caché local del qrValue de acceso, para poder mostrarlo sin conexión.
// El valor es único por alumno, así que guardamos el ownerId (perfil.id) para
// no mostrar la credencial de otra cuenta si alguien cambia de usuario.
// En móvil va en SecureStore: es una credencial de acceso físico.

import * as SecureStore from 'expo-secure-store';

const KEY = 'clic_access_qr';

interface Cached {
  ownerId: number;
  qrValue: string;
}

/** Devuelve el qrValue cacheado si pertenece a `ownerId`, o null. */
export async function getCachedQr(ownerId: number): Promise<string | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Cached;
    return data.ownerId === ownerId && typeof data.qrValue === 'string'
      ? data.qrValue
      : null;
  } catch {
    return null;
  }
}

export function setCachedQr(ownerId: number, qrValue: string): void {
  SecureStore.setItemAsync(KEY, JSON.stringify({ ownerId, qrValue })).catch(
    () => {}
  );
}

/** Borra la credencial cacheada. Llamar al cerrar sesión / cambiar de cuenta. */
export function clearCachedQr(): void {
  SecureStore.deleteItemAsync(KEY).catch(() => {});
}
