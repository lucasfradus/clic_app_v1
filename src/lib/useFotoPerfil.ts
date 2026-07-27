import { useState } from 'react';
import { useAuth } from '../store/auth';
import { uploadFotoPerfil, deleteFotoPerfil } from '../api/perfil';
import { ApiError } from '../api/client';
import { toast } from '../store/toast';
import { pickCompressedDataUri } from './image';

// Lógica compartida de la foto de perfil (subir / quitar), usada en Perfil y
// EditarPerfil. Comprime en el cliente antes de subir y re-hidrata el perfil
// para refrescar todos los avatares.
export function useFotoPerfil() {
  const fotoUrl = useAuth((s) => s.perfil?.fotoUrl ?? null);
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const [subiendo, setSubiendo] = useState(false);

  async function subir(source: 'galeria' | 'camara' = 'galeria') {
    if (subiendo) return;
    setSubiendo(true);
    try {
      const dataUri = await pickCompressedDataUri(source);
      if (!dataUri) return; // canceló el picker
      await uploadFotoPerfil(dataUri);
      await fetchPerfil();
      toast.success('Foto actualizada');
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'No pudimos subir la foto';
      toast.error(msg);
    } finally {
      setSubiendo(false);
    }
  }

  async function quitar() {
    if (subiendo) return;
    setSubiendo(true);
    try {
      await deleteFotoPerfil();
      await fetchPerfil();
      toast.success('Foto eliminada');
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'No pudimos eliminar la foto'
      );
    } finally {
      setSubiendo(false);
    }
  }

  return { fotoUrl, subiendo, subir, quitar };
}
