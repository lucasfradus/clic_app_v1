// Render de HTML del backend (novedades, textos legales) — reemplazo nativo
// de dangerouslySetInnerHTML + DOMPurify. react-native-render-html no ejecuta
// scripts (renderiza a componentes nativos), así que el HTML queda inerte.
// Estilos prose portados de .nov-contenido (Novedades.css).
import { Linking, useWindowDimensions } from 'react-native';
import RenderHTML, {
  defaultSystemFonts,
  type MixedStyleDeclaration,
} from 'react-native-render-html';
import { colors, fonts } from '../../theme';

const systemFonts = [
  ...defaultSystemFonts,
  fonts.regular,
  fonts.medium,
  fonts.semibold,
];

const baseStyle: MixedStyleDeclaration = {
  fontFamily: fonts.regular,
  fontSize: 13,
  lineHeight: 21,
  color: colors.inkSoft,
};

const tagsStyles: Record<string, MixedStyleDeclaration> = {
  p: { marginTop: 0, marginBottom: 10 },
  strong: { fontFamily: fonts.semibold, color: colors.ink },
  em: { fontStyle: 'italic' },
  h1: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 18,
    marginBottom: 8,
  },
  h2: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
    marginTop: 14,
    marginBottom: 6,
  },
  ul: { marginTop: 6, marginBottom: 12, paddingLeft: 22 },
  ol: { marginTop: 6, marginBottom: 12, paddingLeft: 22 },
  li: { marginBottom: 6 },
  a: {
    color: colors.neutralDark,
    textDecorationLine: 'underline',
  },
};

export default function HtmlContent({
  html,
  horizontalPadding = 40,
}: {
  html: string;
  /** Padding total (izq+der) que rodea al contenido, para calcular el ancho. */
  horizontalPadding?: number;
}) {
  const { width } = useWindowDimensions();
  return (
    <RenderHTML
      contentWidth={width - horizontalPadding}
      source={{ html }}
      baseStyle={baseStyle}
      tagsStyles={tagsStyles}
      systemFonts={systemFonts}
      renderersProps={{
        a: {
          onPress: (_evt, href) => {
            Linking.openURL(href).catch(() => {});
          },
        },
      }}
    />
  );
}
