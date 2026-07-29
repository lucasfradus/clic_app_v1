// .badge — badges de estado. Variantes de globals.css:
// ok=sage · lw=terracotta (alerta) · fu=gris (finalizada/no disponible) ·
// tuya=taupe (reservada) · wait=ámbar (lista de espera)
import { Text, View, type ViewStyle, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../../theme';

export type BadgeVariant = 'ok' | 'lw' | 'fu' | 'tuya' | 'wait';

const variantStyles: Record<BadgeVariant, { bg: string; fg: string }> = {
  ok: { bg: colors.sageBg, fg: colors.sage },
  lw: { bg: colors.terracottaBg, fg: colors.terracotta },
  fu: { bg: colors.line, fg: colors.inkMute },
  tuya: { bg: colors.neutral, fg: colors.ink },
  wait: { bg: colors.amberBg, fg: colors.amber },
};

export function Badge({
  variant = 'fu',
  children,
  style,
}: {
  variant?: BadgeVariant;
  children: string;
  style?: ViewStyle;
}) {
  const v = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.badge,
  },
  text: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
