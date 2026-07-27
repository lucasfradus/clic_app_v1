// Cambiar contraseña (port de pages/CambiarPassword.tsx). Validación
// client-side: mínimo 6 caracteres, nueva === confirmación. No cierra sesión.
import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { changePassword } from '@/api/auth';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { Card } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { FormBack, Field } from '@/components/ui/Form';

export default function CambiarPassword() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    if (nueva.length < 6) {
      toast.error('La contraseña nueva debe tener al menos 6 caracteres');
      return;
    }
    if (nueva !== confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setSaving(true);
    try {
      await changePassword(actual, nueva);
      toast.success('Contraseña actualizada');
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
        <TagLabel>Seguridad</TagLabel>
        <PageTitle style={styles.title}>Cambiar contraseña</PageTitle>
      </View>

      <Card style={styles.card}>
        <Field
          label="Contraseña actual"
          value={actual}
          onChangeText={setActual}
          secureTextEntry
          autoCapitalize="none"
        />
        <Field
          label="Nueva contraseña"
          value={nueva}
          onChangeText={setNueva}
          secureTextEntry
          autoCapitalize="none"
        />
        <Field
          label="Confirmar nueva contraseña"
          value={confirmar}
          onChangeText={setConfirmar}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button
          title={saving ? 'Guardando…' : 'Actualizar contraseña'}
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
  submit: { marginTop: 12, paddingVertical: 14 },
});
