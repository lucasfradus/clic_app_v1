// Eliminar cuenta (irreversible). Requisito de Google Play para apps con login.
// Anonimiza los datos personales en el server y desactiva el ingreso; el
// historial de pagos se conserva por obligación legal. Pide confirmar la
// contraseña como recaudo.
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { FormBack } from '@/components/ui/Form';
import { Card } from '@/components/ui/Card';
import { PageTitle, TagLabel } from '@/components/ui/Text';
import { deleteAccount } from '@/api/auth';
import { useAuth } from '@/store/auth';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { colors, fonts } from '@/theme';

export default function EliminarCuenta() {
  const logout = useAuth((s) => s.logout);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setError(null);
    setLoading(true);
    try {
      await deleteAccount(password);
      logout();
      toast.success('Tu cuenta fue eliminada.');
      router.replace('/login');
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('No pudimos eliminar la cuenta. Intentá de nuevo.');
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <FormBack />
        <PageTitle style={styles.title}>Eliminar cuenta</PageTitle>
      </View>

      <Card style={styles.warnCard}>
        <Text style={styles.warnTitle}>Esta acción es irreversible</Text>
        <Text style={styles.warnText}>
          Vamos a eliminar tus datos personales (nombre, contacto, documento,
          datos de salud y de emergencia) y no vas a poder volver a ingresar con
          esta cuenta.
        </Text>
        <Text style={styles.warnText}>
          Por obligación legal, conservamos tu historial de pagos de forma
          de-identificada.
        </Text>
      </Card>

      <TagLabel style={styles.section}>Confirmá tu contraseña</TagLabel>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        placeholder="Tu contraseña"
        placeholderTextColor={colors.inkMute}
      />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Pressable
        style={[styles.deleteBtn, loading && styles.deleteBtnDisabled]}
        onPress={onDelete}
        disabled={loading}
      >
        <Text style={styles.deleteBtnText}>
          {loading ? 'Eliminando…' : 'Eliminar mi cuenta'}
        </Text>
      </Pressable>

      <Pressable style={styles.cancel} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40 },
  head: { marginBottom: 24 },
  title: { marginTop: 6 },

  warnCard: {
    backgroundColor: colors.terracottaBg,
    padding: 18,
    gap: 10,
  },
  warnTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.terracotta,
  },
  warnText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
  },

  section: { marginTop: 24, marginBottom: 10, marginLeft: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.ink,
  },

  errorBox: {
    backgroundColor: colors.terracottaBg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 14,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.terracotta,
  },

  deleteBtn: {
    marginTop: 24,
    backgroundColor: colors.terracotta,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  deleteBtnDisabled: { opacity: 0.55 },
  deleteBtnText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.surface,
  },

  cancel: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  cancelText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.neutralDark,
  },
});
