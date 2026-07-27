// Overlay de toasts (port de Toaster.tsx/.css): éxito=sage, error=terracotta,
// info=ink. Tap para descartar. Se monta una vez en el layout raíz.
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast, type ToastType } from '../../store/toast';
import { colors, fonts } from '../../theme';

const bgByType: Record<ToastType, string> = {
  success: colors.sage,
  error: colors.terracotta,
  info: colors.ink,
};

export default function Toaster() {
  const items = useToast((s) => s.items);
  const hide = useToast((s) => s.hide);
  const insets = useSafeAreaInsets();

  if (items.length === 0) return null;

  return (
    <View
      style={[styles.toaster, { top: insets.top + 12 }]}
      pointerEvents="box-none"
    >
      {items.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => hide(t.id)}
          style={[styles.toast, { backgroundColor: bgByType[t.type] }]}
        >
          <Text style={styles.text}>{t.message}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toaster: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 200,
    gap: 10,
  },
  toast: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: colors.ink,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.surface,
  },
});
