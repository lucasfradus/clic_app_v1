import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';
export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  items: ToastItem[];
  show: (message: string, type?: ToastType) => void;
  hide: (id: number) => void;
}

let nextId = 1;

export const useToast = create<ToastState>((set, get) => ({
  items: [],
  show: (message, type = 'info') => {
    const id = nextId++;
    set((s) => ({ items: [...s.items, { id, message, type }] }));
    setTimeout(() => get().hide(id), 3500);
  },
  hide: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToast.getState().show(m, 'success'),
  error: (m: string) => useToast.getState().show(m, 'error'),
  info: (m: string) => useToast.getState().show(m, 'info'),
};
