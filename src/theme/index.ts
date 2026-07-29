// Tema CLIC — único y neutro ("vainilla"). Decisión de producto: una sola
// imagen de CLIC para todas las unidades (Pilates / Hot / Fitness). No hay
// multi-marca: la identidad la cargan logos/isologos/frases (compartidos); el
// chrome es gris warm-neutral y el acento es el propio carbón (`ink`). Los
// colores funcionales (sage/terracotta/amber) NO son de marca: comunican estado.
// Nota: los nombres de token (beige/taupe) son históricos; hoy son roles de
// gris. Rename semántico pendiente como limpieza aparte.

export const colors = {
  bg: '#f5f4f2', // página — warm-gray, no clínico
  surface: '#ffffff', // tarjetas
  beige: '#e7e5e1', // relleno sutil (rol: subtle)
  beigeSoft: '#efedea', // relleno sutil suave (rol: subtleSoft)
  taupe: '#a6a39e', // gris medio (bordes activos, iconos) (rol: neutral)
  taupeDark: '#6e6b67', // gris fuerte (labels secundarias) (rol: neutralStrong)
  ink: '#26282b', // texto principal / superficies oscuras / acento monocromo
  inkSoft: '#53565a',
  inkMute: '#8d9095',
  line: '#e5e3df',
  lineSoft: '#efedea',
  // Acentos funcionales (no son de marca, solo estado UI)
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
  loginWelcome: 'Bienvenido',
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
