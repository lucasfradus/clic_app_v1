import { View, type ViewProps, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, radius } from '../../theme';

/** .card — card clara genérica */
export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

/**
 * .card-dark — card hero oscura con glow radial taupe (el ::before de la web).
 * El watermark del isotipo se agrega aparte con <Watermark />.
 */
export function DarkCard({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.darkCard, style]} {...rest}>
      <Svg
        style={styles.glow}
        width={300}
        height={300}
        pointerEvents="none"
      >
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.taupe} stopOpacity={0.2} />
            <Stop offset="65%" stopColor={colors.taupe} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={150} cy={150} r={150} fill="url(#glow)" />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.lineSoft,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 22,
  },
  darkCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.hero,
    padding: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -60,
    right: -80,
  },
});
