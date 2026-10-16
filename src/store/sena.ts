// Seña del consultorio en curso: la solicitud que el socio fue a pagar a
// Mercado Pago. Equivale al sessionStorage de la web; acá alcanza con memoria
// porque la vuelta es a la misma app (se cierra el navegador interno), no una
// recarga de la página. Si la app se mata en el medio, la cita igual aparece
// en "Tus citas" cuando el pago se acredita.
import { create } from 'zustand';

interface SenaState {
  solicitudId: number | null;
  setSolicitudId: (id: number) => void;
  olvidar: () => void;
}

export const useSenaEnCurso = create<SenaState>((set) => ({
  solicitudId: null,
  setSolicitudId: (id) => set({ solicitudId: id }),
  olvidar: () => set({ solicitudId: null }),
}));
