// Editar perfil (port de pages/EditarPerfil.tsx): editor de foto arriba,
// form de datos personales, sexo con pills, fecha con date picker nativo.
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/store/auth';
import { updatePerfil } from '@/api/perfil';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import Avatar from '@/components/ui/Avatar';
import { useFotoPerfil } from '@/lib/useFotoPerfil';
import { Card } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { FormBack, Field, Pills } from '@/components/ui/Form';
import { formatShortDate } from '@/lib/date';
import { colors, fonts, radius } from '@/theme';

const SEXOS = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'OTRO', label: 'Otro' },
] as const;

export default function EditarPerfil() {
  const perfil = useAuth((s) => s.perfil);
  const fetchPerfil = useAuth((s) => s.fetchPerfil);
  const { fotoUrl, subiendo, subir, quitar } = useFotoPerfil();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [dni, setDni] = useState('');
  const [direccion, setDireccion] = useState('');
  const [sexo, setSexo] = useState<string>('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre ?? '');
    setApellido(perfil.apellido ?? '');
    setTelefono(perfil.telefono ?? '');
    setDni(perfil.dni ?? '');
    setDireccion(perfil.direccion ?? '');
    setSexo(perfil.sexo ?? '');
    setFechaNacimiento(perfil.fechaNacimiento?.slice(0, 10) ?? '');
  }, [perfil]);

  async function onSubmit() {
    if (!nombre.trim() || !apellido.trim()) {
      toast.error('Nombre y apellido son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await updatePerfil({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        telefono: telefono.trim() || null,
        dni: dni.trim() || null,
        sexo: sexo || null,
        direccion: direccion.trim() || null,
        fechaNacimiento: fechaNacimiento || null,
      });
      await fetchPerfil();
      toast.success('Perfil actualizado');
      router.back();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <FormBack />
        <TagLabel>Datos personales</TagLabel>
        <PageTitle style={styles.title}>Editar</PageTitle>
      </View>

      <Card style={styles.card}>
        {/* Editor de foto de perfil */}
        <View style={styles.fotoEditor}>
          <Avatar fotoUrl={fotoUrl} nombre={perfil?.nombre} size={72} />
          <View style={styles.fotoActions}>
            <Pressable
              style={[styles.fotoBtn, subiendo && styles.disabled]}
              onPress={() => subir('galeria')}
              disabled={subiendo}
            >
              <Text style={styles.fotoBtnText}>
                {subiendo ? 'Subiendo…' : fotoUrl ? 'Cambiar foto' : 'Subir foto'}
              </Text>
            </Pressable>
            {fotoUrl && (
              <Pressable
                onPress={quitar}
                disabled={subiendo}
                style={subiendo ? styles.disabled : undefined}
              >
                <Text style={styles.fotoRemoveText}>Quitar foto</Text>
              </Pressable>
            )}
          </View>
        </View>

        <Field label="Email" value={perfil?.email ?? ''} disabled />
        <Field label="Nombre *" value={nombre} onChangeText={setNombre} />
        <Field label="Apellido *" value={apellido} onChangeText={setApellido} />
        <Field
          label="Teléfono"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />
        <Field
          label="DNI"
          value={dni}
          onChangeText={setDni}
          keyboardType="number-pad"
        />
        <Field label="Dirección" value={direccion} onChangeText={setDireccion} />

        {/* Fecha de nacimiento — date picker nativo */}
        <View style={styles.field}>
          <TagLabel>Fecha de nacimiento</TagLabel>
          <Pressable
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text
              style={[
                styles.dateText,
                !fechaNacimiento && styles.datePlaceholder,
              ]}
            >
              {fechaNacimiento
                ? formatShortDate(fechaNacimiento)
                : 'Elegir fecha'}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={
                fechaNacimiento
                  ? new Date(fechaNacimiento)
                  : new Date(1990, 0, 1)
              }
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (event.type !== 'dismissed' && date) {
                  setFechaNacimiento(date.toISOString().slice(0, 10));
                }
              }}
            />
          )}
        </View>

        <View style={styles.field}>
          <TagLabel>Sexo</TagLabel>
          <Pills
            options={SEXOS}
            selected={sexo as (typeof SEXOS)[number]['value'] | ''}
            onSelect={(v) => setSexo(v)}
          />
        </View>

        <Button
          title={saving ? 'Guardando…' : 'Guardar cambios'}
          onPress={onSubmit}
          disabled={saving}
          style={styles.submit}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 32 },
  head: { marginBottom: 24 },
  title: { marginTop: 6 },
  card: { padding: 24, gap: 18 },
  fotoEditor: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  fotoActions: { gap: 8, alignItems: 'flex-start' },
  fotoBtn: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  fotoBtnText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.inkSoft,
  },
  fotoRemoveText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.terracotta,
  },
  disabled: { opacity: 0.5 },
  field: { gap: 8 },
  dateInput: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  dateText: { fontFamily: fonts.regular, fontSize: 13, color: colors.ink },
  datePlaceholder: { color: colors.inkMute },
  submit: { marginTop: 12, paddingVertical: 14 },
});
