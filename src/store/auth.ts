import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import * as perfilApi from '../api/perfil';
import { setToken, clearToken, loadToken } from '../api/client';
import { clearCachedQr } from '../lib/accessQr';
import { useSede } from './sede';
import { trackEvent } from '../lib/analytics';
import { usePush } from './push';
import { unregisterPushToken } from '../api/push';
import type { AuthUser, Perfil } from '../types';

// En la web `user.alumnoId` vive solo en memoria (se pierde al recargar). En
// móvil la app se reinicia seguido, así que lo persistimos para que el
// tracking de novedades leídas (clave por alumno) funcione entre sesiones.
const ALUMNO_ID_KEY = 'clic_alumnoId';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  alumnoId: number | null;
  perfil: Perfil | null;
  // La sede del alumno no exige consentimiento (lo confirmó /consentimiento/texto).
  // Vive fuera de perfil para que un fetchPerfil no lo pise.
  consentimientoNoRequerido: boolean;
  // true cuando ya se intentó restaurar la sesión guardada (haya o no token).
  // Hasta entonces la UI muestra splash/loader, nunca el login.
  bootstrapped: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchPerfil: () => Promise<Perfil>;
  bootstrap: () => Promise<void>;
  setConsentimientoNoRequerido: (v: boolean) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  alumnoId: null,
  perfil: null,
  consentimientoNoRequerido: false,
  bootstrapped: false,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await authApi.login(email, password);
      setToken(res.token);
      set({
        token: res.token,
        user: res.user,
        alumnoId: res.user.alumnoId,
        consentimientoNoRequerido: false,
      });
      AsyncStorage.setItem(ALUMNO_ID_KEY, String(res.user.alumnoId)).catch(
        () => {}
      );
      trackEvent('login', { method: 'email' });
      await get().fetchPerfil();
      // Sedes solo si hay suscripcion activa (404 si no). Best-effort.
      await useSede.getState().bootstrap().catch(() => {});
    } catch (err) {
      // Si fetchPerfil falla, limpiar estado para no quedar en "Cargando…"
      clearToken();
      set({ token: null, user: null, perfil: null });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    // Dar de baja el push token ANTES de limpiar el token de auth (el DELETE
    // necesita ir autenticado). Best-effort; el header se captura al llamar.
    const pushToken = usePush.getState().token;
    if (pushToken) unregisterPushToken(pushToken).catch(() => {});
    usePush.getState().setToken(null);
    trackEvent('logout');
    clearToken();
    clearCachedQr();
    useSede.getState().reset();
    AsyncStorage.removeItem(ALUMNO_ID_KEY).catch(() => {});
    set({
      token: null,
      user: null,
      alumnoId: null,
      perfil: null,
      consentimientoNoRequerido: false,
      bootstrapped: true,
    });
  },

  fetchPerfil: async () => {
    const perfil = await perfilApi.getPerfil();
    set({ perfil });
    return perfil;
  },

  bootstrap: async () => {
    const token = await loadToken();
    if (!token) {
      set({ bootstrapped: true });
      return;
    }
    const storedAlumnoId = await AsyncStorage.getItem(ALUMNO_ID_KEY).catch(
      () => null
    );
    set({
      token,
      alumnoId: storedAlumnoId ? parseInt(storedAlumnoId, 10) : null,
    });
    try {
      await get().fetchPerfil();
      await useSede.getState().bootstrap().catch(() => {});
      set({ bootstrapped: true });
    } catch {
      // Si falla (401, 500, etc.) limpiar estado para no quedar en "Cargando…"
      get().logout();
    }
  },

  setConsentimientoNoRequerido: (v) => set({ consentimientoNoRequerido: v }),
}));
