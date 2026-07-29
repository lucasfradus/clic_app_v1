// Registro de push (Expo Notifications). Pide permiso, arma el canal Android y
// devuelve el ExpoPushToken (o null si no se puede: emulador/web, permiso
// denegado, sin projectId). El envío del token a Clicnet y los listeners de
// "notificación tocada" se enganchan aparte (Fase 1).
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Cómo se muestran las notificaciones con la app en primer plano.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  // El push remoto no funciona en emulador/web, solo en dispositivo físico.
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#26282b',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Constants as any).easConfig?.projectId;
  if (!projectId) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch {
    return null;
  }
}
