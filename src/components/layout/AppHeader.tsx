// Header sticky de la app (port de MobileHeader.tsx): logo CLIC negro +
// selector de sede + avatar. Se usa como header de los tabs.
import { Image, Pressable, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../store/auth';
import { brandAssets, colors } from '../../theme';
import Avatar from '../ui/Avatar';
import SedeSelector from './SedeSelector';

export default function AppHeader() {
  const perfil = useAuth((s) => s.perfil);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <Pressable
          onPress={() => router.navigate('/')}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Ir al inicio"
        >
          <Image
            source={brandAssets.logoBlack}
            style={styles.logo}
            resizeMode="contain"
          />
        </Pressable>
        <View style={styles.right}>
          <SedeSelector />
          <Pressable
            onPress={() => router.navigate('/perfil')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Ir al perfil"
          >
            <Avatar
              fotoUrl={perfil?.fotoUrl}
              nombre={perfil?.nombre}
              size={34}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  inner: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  logo: {
    width: 48,
    height: 22,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
