// Selector de sede del header (port de layout/SedeSelector.tsx). En móvil el
// dropdown se reemplaza por un bottom sheet nativo (Modal). Reglas iguales a
// la web: estático si hay una sola sede accesible, badge VISITANTE si la
// elegida no es la home del alumno.
import { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSede, useSelectedSede } from '../../store/sede';
import { colors, fonts, radius } from '../../theme';

export default function SedeSelector() {
  const sedes = useSede((s) => s.sedes);
  const setSelectedSedeId = useSede((s) => s.setSelectedSedeId);
  const selected = useSelectedSede();
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  if (sedes.length <= 1) {
    // Una sola sede accesible: no hay nada que elegir
    return selected ? (
      <View style={styles.trigger}>
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.label} numberOfLines={1}>
          {selected.nombre}
        </Text>
      </View>
    ) : null;
  }

  const isVisitor = selected && !selected.esHome;

  return (
    <>
      <Pressable
        style={[styles.trigger, isVisitor && styles.triggerVisitor]}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.label} numberOfLines={1}>
          {selected?.nombre ?? 'Elegí sede'}
        </Text>
        {isVisitor && (
          <View style={styles.visitorBadge}>
            <Text style={styles.visitorBadgeText}>VISITANTE</Text>
          </View>
        )}
        <Text style={styles.caret}>⌄</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.sheetTitle}>Elegí tu sede</Text>
            {sedes.map((s) => (
              <Pressable
                key={s.id}
                style={[
                  styles.item,
                  s.id === selected?.id && styles.itemActive,
                ]}
                onPress={() => {
                  setSelectedSedeId(s.id);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.itemText,
                    s.id === selected?.id && styles.itemTextActive,
                  ]}
                >
                  {s.nombre}
                </Text>
                {!s.esHome && <Text style={styles.hint}>(visitante)</Text>}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    maxWidth: 190,
  },
  triggerVisitor: {
    borderColor: colors.neutral,
  },
  icon: {
    fontSize: 11,
    opacity: 0.7,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.ink,
    flexShrink: 1,
  },
  visitorBadge: {
    backgroundColor: colors.neutral,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  visitorBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.8,
    color: colors.ink,
  },
  caret: {
    fontSize: 10,
    color: colors.inkMute,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 47, 52, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.hero,
    borderTopRightRadius: radius.hero,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sheetTitle: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: colors.neutralDark,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  itemActive: {
    backgroundColor: colors.bg,
  },
  itemText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
  },
  itemTextActive: {
    fontFamily: fonts.semibold,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.neutral,
    letterSpacing: 0.5,
  },
});
