// Componentes de formulario compartidos (port de Forms.css).
import {
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import { router } from 'expo-router';
import { TagLabel } from './Text';
import { colors, fonts, radius } from '../../theme';

/** .form-back — link de volver (← Perfil) */
export function FormBack({
  label = '← Perfil',
  onPress,
}: {
  label?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.back())}
      style={styles.backBtn}
    >
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

/** .form-field — label + input */
export function Field({
  label,
  disabled = false,
  style,
  ...inputProps
}: TextInputProps & { label: string; disabled?: boolean }) {
  return (
    <View style={styles.field}>
      <TagLabel>{label}</TagLabel>
      <TextInput
        editable={!disabled}
        style={[styles.input, disabled && styles.inputDisabled, style]}
        {...inputProps}
      />
    </View>
  );
}

/** .pills — selector de opciones tipo pill */
export function Pills<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: readonly { value: T; label: string }[];
  selected: T | '';
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.pills}>
      {options.map((o) => {
        const active = selected === o.value;
        return (
          <Pressable
            key={o.value}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(o.value)}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** .form-accept — checkbox de aceptación */
export function AcceptCheck({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Pressable style={styles.accept} onPress={onToggle}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.acceptLabel}>{label}</Text>
    </Pressable>
  );
}

/** .readonly-text — contenedor de texto legal */
export function LegalBox({ children }: { children: React.ReactNode }) {
  return <View style={styles.legal}>{children}</View>;
}

const styles = StyleSheet.create({
  backBtn: {
    paddingBottom: 12,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.taupeDark,
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.ink,
  },
  inputDisabled: {
    backgroundColor: colors.lineSoft,
    color: colors.inkMute,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  pillActive: {
    backgroundColor: colors.taupe,
    borderColor: colors.taupe,
  },
  pillText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.inkSoft,
  },
  pillTextActive: {
    fontFamily: fonts.semibold,
    color: colors.ink,
  },
  accept: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.taupe,
    borderColor: colors.taupe,
  },
  checkmark: {
    fontSize: 11,
    color: colors.ink,
    fontFamily: fonts.bold,
  },
  acceptLabel: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
  },
  legal: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
});
