// Tokens del tema CLIC (manual de marca 2024). Fuente: clic-webapp-clientes
// src/brand/theme-clic.ts + src/styles/globals.css. Un solo tema en v1, pero
// centralizado acá para poder evolucionarlo.

export const colors = {
  bg: '#edece7',
  surface: '#fdfbfa',
  beige: '#dfd4ca',
  beigeSoft: '#e8e0d6',
  taupe: '#bcac9e',
  taupeDark: '#9a8a7c',
  ink: '#2c2f34',
  inkSoft: '#5a5d62',
  inkMute: '#9a9da2',
  line: '#e0d8cd',
  lineSoft: '#ebe5db',
  // Acentos funcionales (no son de marca, solo UI)
  sage: '#8a9a82',
  sageBg: '#e6ebe2',
  terracotta: '#b87560',
  terracottaBg: '#f0e0d8',
  // Lista de espera: ámbar, distinto del verde "confirmada"
  amber: '#8a6209',
  amberBg: '#f3e7cd',
} as const;

export const radius = {
  card: 20,
  hero: 24,
  modal: 22,
  badge: 10,
  pill: 100,
} as const;

// En React Native cada peso es una familia distinta.
// Ojo: el tema CLIC real de la webapp usa Poppins también para display/accent
// (títulos en peso 300); Italiana queda empaquetada pero sin uso, igual que
// en la web, por si la marca la reactiva.
export const fonts = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  display: 'Poppins_300Light',
  accent: 'Poppins_400Regular',
  italiana: 'Italiana_400Regular',
} as const;

export const brandText = {
  name: 'CLIC',
  tagline: 'studio pilates',
  fullName: 'CLIC studio pilates',
  loginWelcome: 'Bienvenida',
  loginSubtitle: 'Tu espacio de práctica',
  fallbackQuote: 'Tu pilates empieza acá.',
  fallbackCta: 'Consultá con tu sede',
} as const;

export const brandAssets = {
  logoWhite: require('../assets/clic/logo_white.png'),
  logoBlack: require('../assets/clic/logo_black.png'),
  isoWhite: require('../assets/clic/iso_white.png'),
  isoBlack: require('../assets/clic/iso_black.png'),
  isoAccent: require('../assets/clic/iso_accent.png'),
} as const;
