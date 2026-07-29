// Encabezado de página unificado. Sin pre-título (tag-label): solo el título,
// con espaciado generoso y consistente en todas las pantallas. Cambiar el
// "aire" acá lo cambia en toda la app.
import { View, StyleSheet } from 'react-native';
import { PageTitle } from '../ui/Text';

export default function PageHeader({ title }: { title: string }) {
  return (
    <View style={styles.header}>
      <PageTitle style={styles.title}>{title}</PageTitle>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 8, marginBottom: 28 },
  title: { fontSize: 40, lineHeight: 44 },
});
