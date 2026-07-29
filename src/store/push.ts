// Estado del push token del dispositivo (en memoria). Se setea al registrar
// tras el login. Por ahora solo se usa para mostrarlo/loguearlo (Fase 1);
// después se manda a Clicnet.
import { create } from 'zustand';

interface PushState {
  token: string | null;
  setToken: (t: string | null) => void;
}

export const usePush = create<PushState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}));
