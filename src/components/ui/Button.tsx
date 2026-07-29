// .btn-taupe (primary) y .modal-secondary (secondary) de la web.
import {
  Pressable,
  Text,
  type StyleProp,
  type ViewStyle,
  StyleSheet,
} from 'react-native';
import { colors, fonts, radius } from '../../theme';

export function Button({
  title,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === 'primary' ? styles.textPrimary : styles.textSecondary,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Primario = fondo carbón (`ink`) + texto claro: acento monocromo, alto
  // contraste. Con el tema neutro un fondo gris medio no se leía como tocable.
  primary: {
    backgroundColor: colors.ink,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.neutral,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  textPrimary: {
    color: colors.surface,
  },
  textSecondary: {
    color: colors.ink,
  },
});
