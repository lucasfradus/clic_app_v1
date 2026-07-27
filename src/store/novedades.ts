// Contador de novedades no leídas para el badge del tab (adaptación móvil:
// la web fuerza una redirección a /novedades al abrir; acá es un badge, §3).
import { create } from 'zustand';

interface NovedadesState {
  noLeidas: number;
  setNoLeidas: (n: number) => void;
}

export const useNovedades = create<NovedadesState>((set) => ({
  noLeidas: 0,
  setNoLeidas: (n) => set({ noLeidas: n }),
}));
