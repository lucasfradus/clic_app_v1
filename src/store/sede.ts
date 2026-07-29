import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSedesAccesibles } from '../api/sedes';
import type { SedeAccesible } from '../types';

// Última sede usada (transitoria, la setea el selector del header) vs. sede por
// defecto fijada por el usuario en Configuración. El default, si está seteado y
// es válido, gana en el arranque; si no, se cae a la última usada / home.
const STORAGE_KEY = 'clic.selectedSedeId';
const DEFAULT_KEY = 'clic.defaultSedeId';

async function readStored(key: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function persist(key: string, id: number | null) {
  const op =
    id === null
      ? AsyncStorage.removeItem(key)
      : AsyncStorage.setItem(key, String(id));
  op.catch(() => {});
}

interface SedeState {
  sedes: SedeAccesible[];
  selectedSedeId: number | null;
  /** Sede por defecto fijada por el usuario (null = sin fija → última usada). */
  defaultSedeId: number | null;
  loaded: boolean;
  bootstrap: () => Promise<void>;
  setSelectedSedeId: (id: number) => void;
  setDefaultSedeId: (id: number | null) => void;
  reset: () => void;
}

export const useSede = create<SedeState>((set, get) => ({
  sedes: [],
  selectedSedeId: null,
  defaultSedeId: null,
  loaded: false,

  bootstrap: async () => {
    const [sedes, stored, storedDefault] = await Promise.all([
      getSedesAccesibles(),
      readStored(STORAGE_KEY),
      readStored(DEFAULT_KEY),
    ]);
    const isValid = (id: number | null) =>
      id !== null && sedes.some((s) => s.id === id);
    const validDefault = isValid(storedDefault) ? storedDefault : null;
    const validStored = isValid(stored) ? stored : null;
    const fallback =
      sedes.find((s) => s.esHome)?.id ?? sedes[0]?.id ?? null;
    const selectedSedeId = validDefault ?? validStored ?? fallback;
    if (selectedSedeId !== null) persist(STORAGE_KEY, selectedSedeId);
    set({ sedes, selectedSedeId, defaultSedeId: validDefault, loaded: true });
  },

  setSelectedSedeId: (id) => {
    if (id === get().selectedSedeId) return;
    persist(STORAGE_KEY, id);
    set({ selectedSedeId: id });
  },

  setDefaultSedeId: (id) => {
    persist(DEFAULT_KEY, id);
    set({ defaultSedeId: id });
    // Fijar un default también cambia la sede actual a esa.
    if (id !== null) {
      persist(STORAGE_KEY, id);
      set({ selectedSedeId: id });
    }
  },

  reset: () => {
    persist(STORAGE_KEY, null);
    persist(DEFAULT_KEY, null);
    set({ sedes: [], selectedSedeId: null, defaultSedeId: null, loaded: false });
  },
}));

/** Devuelve la SedeAccesible seleccionada, o undefined si no hay. */
export function useSelectedSede(): SedeAccesible | undefined {
  return useSede((s) =>
    s.selectedSedeId === null
      ? undefined
      : s.sedes.find((x) => x.id === s.selectedSedeId)
  );
}
