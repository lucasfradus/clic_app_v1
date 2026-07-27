import { apiFetch } from './client';
import type { Perfil } from '../types';

export function getPerfil() {
  return apiFetch<Perfil>('/perfil');
}

export function updatePerfil(body: {
  nombre: string;
  apellido: string;
  telefono: string | null;
  dni: string | null;
  sexo: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
}) {
  return apiFetch<{ message: string }>('/perfil', { method: 'PUT', body });
}

/** Sube o reemplaza la foto de perfil. `foto` debe ser un data URI (png/jpg/webp), máx 10 MB. */
export function uploadFotoPerfil(foto: string) {
  return apiFetch<{ message: string; fotoUrl: string }>('/perfil/foto', {
    method: 'PUT',
    body: { foto },
  });
}

export function deleteFotoPerfil() {
  return apiFetch<{ message: string }>('/perfil/foto', { method: 'DELETE' });
}
