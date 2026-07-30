// Login (port de pages/Login.tsx + Login.css).
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
import { Redirect, router } from 'expo-router';
import { useAuth } from '@/store/auth';
import { ApiError } from '@/api/client';
import { brandAssets, brandText, colors, fonts, radius } from '@/theme';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

export default function Login() {
  const login = useAuth((s) => s.login);
  const loading = useAuth((s) => s.loading);
  const token = useAuth((s) => s.token);
  const perfil = useAuth((s) => s.perfil);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sesión ya activa: entrar directo (los guards de tabs derivan al gate si falta).
  if (token && perfil) {
    return <Redirect href="/" />;
  }

  async function onSubmit() {
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace('/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) setError('Credenciales inválidas');
        else if (err.status === 403) setError('Esta cuenta no es de alumno');
        else if (err.status === 429)
          setError('Demasiados intentos. Esperá unos minutos.');
        else setError(err.message);
      } else {
        setError('Error inesperado');
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.page}
      // iOS: 'padding'. Android: 'height' — sin behavior el teclado tapaba los
      // campos (la card está centrada y no subía). Con ScrollView +
      // keyboardShouldPersistTaps el input queda visible y navegable.
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

          <PageTitle style={styles.title}>{brandText.loginWelcome}</PageTitle>
          <TagLabel>{brandText.loginSubtitle}</TagLabel>

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
              />
            </View>
            <View style={styles.field}>
              <TagLabel>Contraseña</TagLabel>
              <View style={styles.pwWrap}>
                <TextInput
                  style={[styles.input, styles.pwInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                  autoComplete="current-password"
                  textContentType="password"
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
              title={loading ? 'Ingresando…' : 'Ingresar'}
              onPress={onSubmit}
              disabled={loading}
              style={styles.submit}
            />

            <Pressable onPress={() => router.push('/forgot')}>
              <Text style={styles.forgotLink}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </View>
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
  forgotLink: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.neutralDark,
    textAlign: 'center',
    paddingVertical: 4,
  },
});
