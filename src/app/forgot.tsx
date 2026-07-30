// Reset de contraseña — dos pasos en una pantalla: (1) pedir email → llega un
// código de 6 dígitos por mail; (2) ingresar el código + la nueva contraseña.
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { forgotPassword, resetPassword } from '@/api/auth';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { brandAssets, colors, fonts, radius } from '@/theme';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

type Paso = 'email' | 'codigo';

export default function Forgot() {
  const [paso, setPaso] = useState<Paso>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pedirCodigo() {
    setError(null);
    const mail = email.trim();
    if (!mail) {
      setError('Ingresá tu email');
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(mail);
      // Respuesta genérica (anti-enumeración): pase lo que pase, avanzamos.
      setPaso('codigo');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  async function confirmar() {
    setError(null);
    if (code.trim().length !== 6) {
      setError('El código tiene 6 dígitos');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim(), code.trim(), password);
      toast.success('Contraseña actualizada. Iniciá sesión.');
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Image
            source={brandAssets.logoBlack}
            style={styles.logo}
            resizeMode="contain"
          />

          {paso === 'email' ? (
            <>
              <PageTitle style={styles.title}>Recuperar contraseña</PageTitle>
              <TagLabel>Te enviamos un código a tu email</TagLabel>

              <View style={styles.form}>
                <View style={styles.field}>
                  <TagLabel>Email</TagLabel>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoFocus
                  />
                </View>

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Button
                  title={loading ? 'Enviando…' : 'Enviar código'}
                  onPress={pedirCodigo}
                  disabled={loading}
                  style={styles.submit}
                />
              </View>
            </>
          ) : (
            <>
              <PageTitle style={styles.title}>Nueva contraseña</PageTitle>
              <TagLabel>Revisá tu email: {email.trim()}</TagLabel>

              <View style={styles.form}>
                <View style={styles.field}>
                  <TagLabel>Código de 6 dígitos</TagLabel>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>
                <View style={styles.field}>
                  <TagLabel>Nueva contraseña</TagLabel>
                  <View style={styles.pwWrap}>
                    <TextInput
                      style={[styles.input, styles.pwInput]}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPw}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      textContentType="newPassword"
                    />
                    <Pressable
                      style={styles.pwToggle}
                      onPress={() => setShowPw((v) => !v)}
                      accessibilityLabel={
                        showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'
                      }
                    >
                      <Text style={styles.pwToggleText}>{showPw ? '🙈' : '👁'}</Text>
                    </Pressable>
                  </View>
                </View>

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Button
                  title={loading ? 'Guardando…' : 'Guardar contraseña'}
                  onPress={confirmar}
                  disabled={loading}
                  style={styles.submit}
                />
                <Pressable onPress={pedirCodigo} disabled={loading}>
                  <Text style={styles.link}>Reenviar código</Text>
                </Pressable>
              </View>
            </>
          )}

          <Pressable
            onPress={() => router.replace('/login')}
            style={styles.backWrap}
          >
            <Text style={styles.link}>Volver a iniciar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.lineSoft,
    borderWidth: 1,
    borderRadius: radius.hero,
    paddingVertical: 44,
    paddingHorizontal: 40,
  },
  logo: {
    width: 104,
    height: 46,
    marginBottom: 30,
  },
  title: {
    marginBottom: 6,
  },
  form: {
    marginTop: 28,
    gap: 18,
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.ink,
  },
  codeInput: {
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    fontFamily: fonts.semibold,
  },
  pwWrap: {
    position: 'relative',
  },
  pwInput: {
    paddingRight: 44,
  },
  pwToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 4,
  },
  pwToggleText: {
    fontSize: 16,
    opacity: 0.55,
  },
  errorBox: {
    backgroundColor: colors.terracottaBg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.terracotta,
  },
  submit: {
    marginTop: 8,
    paddingVertical: 14,
  },
  link: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralDark,
    textAlign: 'center',
    paddingVertical: 6,
  },
  backWrap: {
    marginTop: 20,
  },
});
