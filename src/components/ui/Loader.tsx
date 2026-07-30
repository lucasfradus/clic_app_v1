// Equivalente del .full-loader de la web ("Cargando…" a pantalla completa).
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme';

export default function Loader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.neutral} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
  },
});
