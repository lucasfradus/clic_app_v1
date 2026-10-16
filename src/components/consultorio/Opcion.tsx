// Tarjeta tocable de los pasos de "Sacar una cita" (servicio y consulta): toda
// la tarjeta es el blanco del toque, con una flecha que dice que avanza.
import type { ReactNode } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '@/theme';

export default function Opcion({
  onPress,
  disabled = false,
  accessibilityLabel,
  children,
}: {
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.card,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.body}>{children}</View>
      {!disabled && <Text style={styles.flecha}>→</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderColor: colors.lineSoft,
    borderWidth: 1,
    borderRadius: radius.card,
    paddingVertical: 20,
    paddingHorizontal: 22,
    marginBottom: 12,
  },
  disabled: { opacity: 0.55 },
  pressed: { backgroundColor: colors.subtleSoft },
  body: { flex: 1 },
  flecha: { fontFamily: fonts.light, fontSize: 20, color: colors.neutralDark },
});
