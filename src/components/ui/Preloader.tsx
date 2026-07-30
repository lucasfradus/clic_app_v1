// Pantalla de carga de marca: el iso de CLIC centrado con un pulso sutil.
// Se usa mientras la app bootstrapea (fuentes/token/sede/sesión), en vez del
// spinner genérico. Usa reanimated (montado en el root).
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { brandAssets, colors } from '../../theme';

export default function Preloader() {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [opacity]);

  const isoStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={brandAssets.isoBlack}
        style={[styles.iso, isoStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iso: { width: 60, height: 60 },
});
