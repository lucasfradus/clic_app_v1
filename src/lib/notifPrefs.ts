// Preferencias de notificaciones (por dispositivo). Se guardan aunque el push
// todavía no esté implementado; cuando exista, el registro de push las leerá
// para decidir qué mandar. Ver #8 (push) en tasks/todo.md.
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotifPrefs = {
  recordatorioClase: boolean;
  listaEspera: boolean;
  novedades: boolean;
  vencimiento: boolean;
};

export const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  recordatorioClase: true,
  listaEspera: true,
  novedades: true,
  vencimiento: true,
};

const KEY = 'clic.notifPrefs';

export async function getNotifPrefs(): Promise<NotifPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_NOTIF_PREFS };
    // Merge sobre defaults por si sumamos tipos nuevos más adelante.
    return { ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIF_PREFS };
  }
}

export async function setNotifPrefs(prefs: NotifPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // storage puede fallar — ignorar.
  }
}
