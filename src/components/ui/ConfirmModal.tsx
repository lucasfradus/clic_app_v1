// Modal de confirmación compartido por Agenda y Home (port de .modal-* de
// globals.css + .modal-visitor de Agenda.css).
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { Button } from './Button';
import { TagLabel } from './Text';
import { colors, fonts, radius } from '../../theme';

interface Props {
  visible: boolean;
  tag: string;
  title: string;
  meta: (string | null | undefined | false)[];
  /** Aviso ámbar (lista de espera). */
  waitNote?: string | null;
  /** Aviso terracota (reserva como visitante). */
  visitorNote?: string | null;
  primaryLabel: string;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  visible,
  tag,
  title,
  meta,
  waitNote,
  visitorNote,
  primaryLabel,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !busy && onClose()}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => !busy && onClose()}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <TagLabel>{tag}</TagLabel>
          <Text style={styles.title}>{title}</Text>
          {meta.filter(Boolean).map((m, i) => (
            <Text key={i} style={styles.meta}>
              {m}
            </Text>
          ))}
          {waitNote ? <Text style={styles.wait}>{waitNote}</Text> : null}
          {visitorNote ? (
            <Text style={styles.visitor}>{visitorNote}</Text>
          ) : null}
          <View style={styles.actions}>
            <Button
              title="Volver"
              variant="secondary"
              onPress={onClose}
              disabled={busy}
              style={styles.action}
            />
            <Button
              title={busy ? 'Enviando…' : primaryLabel}
              onPress={onConfirm}
              disabled={busy}
              style={styles.action}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(44, 47, 52, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.modal,
    paddingTop: 32,
    paddingHorizontal: 32,
    paddingBottom: 28,
    width: '100%',
    maxWidth: 420,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 27,
    color: colors.ink,
    marginTop: 10,
    marginBottom: 16,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  wait: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.amberBg,
    color: colors.amber,
    borderRadius: 10,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    overflow: 'hidden',
  },
  visitor: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.terracottaBg,
    color: colors.terracotta,
    borderRadius: 10,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  action: {
    flex: 1,
  },
});
