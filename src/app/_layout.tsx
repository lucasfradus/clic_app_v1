import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Italiana_400Regular } from '@expo-google-fonts/italiana';
import { setUnauthorizedHandler } from '@/api/client';
import { useAuth } from '@/store/auth';
import { toast } from '@/store/toast';
import Toaster from '@/components/ui/Toaster';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Italiana_400Regular,
  });

  useEffect(() => {
    // 401 global: limpiar sesión + toast. La redirección a /login la hacen
    // los guards al ver token=null (no hace falta navegar a mano).
    setUnauthorizedHandler(() => {
      useAuth.getState().logout();
      toast.error('Tu sesión expiró. Iniciá sesión de nuevo.');
    });
    // Restaurar sesión guardada (SecureStore) al abrir la app.
    useAuth.getState().bootstrap();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
      <Toaster />
    </>
  );
}
