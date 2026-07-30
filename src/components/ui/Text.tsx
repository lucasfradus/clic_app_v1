// Helpers tipográficos reutilizables (port de los helpers de globals.css).
import { Text, type TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme';

/** .tag-label — label uppercase con letter-spacing amplio */
export function TagLabel({ style, children, ...rest }: TextProps) {
  return (
    <Text style={[styles.tagLabel, style]} {...rest}>
      {children}
    </Text>
  );
}

/** .page-title — título de página en display 300 */
export function PageTitle({ style, children, ...rest }: TextProps) {
  return (
    <Text style={[styles.pageTitle, style]} {...rest}>
      {children}
    </Text>
  );
}

/** Texto de cuerpo Poppins */
export function Body({ style, children, ...rest }: TextProps) {
  return (
    <Text style={[styles.body, style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  tagLabel: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: colors.neutralDark,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: -0.5,
    lineHeight: 36,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
  },
});
