// Bottom tab bar custom (port de MobileTabBar.tsx): labels uppercase con
// borde superior taupe en el tab activo, sin iconos — igual que la web.
// Orden móvil según spec §3: Home · Agenda · Cuenta · News · Perfil.
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { useNovedades } from '../../store/novedades';
import { colors, fonts } from '../../theme';

const tabs = [
  { href: '/', label: 'Home', exact: true },
  { href: '/agenda', label: 'Agenda', exact: false },
  { href: '/cuenta', label: 'Cuenta', exact: false },
  { href: '/novedades', label: 'News', exact: false },
  { href: '/perfil', label: 'Perfil', exact: false },
] as const;

export default function ClicTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const noLeidas = useNovedades((s) => s.noLeidas);
  const badges: Record<string, number> = { '/novedades': noLeidas };

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {tabs.map((t) => {
        const active = t.exact
          ? pathname === t.href
          : pathname.startsWith(t.href);
        const badge = badges[t.href] ?? 0;
        const highlight = badge > 0 && !active;
        return (
          <Pressable
            key={t.href}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => router.navigate(t.href)}
          >
            <View style={styles.labelWrap}>
              <Text
                style={[
                  styles.label,
                  active && styles.labelActive,
                  highlight && styles.labelHighlight,
                ]}
              >
                {t.label}
              </Text>
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badge > 9 ? '9+' : badge}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  tab: {
    flex: 1,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderTopColor: 'transparent',
    marginTop: -1,
  },
  tabActive: {
    borderTopColor: colors.taupe,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.inkMute,
  },
  labelActive: {
    color: colors.ink,
  },
  labelHighlight: {
    color: colors.ink,
    fontFamily: fonts.semibold,
  },
  badge: {
    backgroundColor: colors.terracotta,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: fonts.semibold,
    fontSize: 9,
    color: colors.surface,
  },
});
