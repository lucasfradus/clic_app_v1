// Carrusel de la tira de semana. Tres semanas (anterior / actual / siguiente)
// en fila; el gesto sigue el dedo (hilo de UI, reanimated) y hace spring al
// soltar. Al confirmar el cambio de semana se recentra de forma transparente:
// la semana que entró al centro pasa a ser la "actual" y el offset vuelve a 0.
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { weekDays, addDays, sameDay } from '@/lib/date';
import { colors, fonts } from '@/theme';

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const SPRING = { damping: 22, stiffness: 240, overshootClamping: true };

export default function WeekStripCarousel({
  weekRef,
  selectedDay,
  onSelectDay,
  onChangeWeek,
}: {
  weekRef: Date;
  selectedDay: Date;
  onSelectDay: (d: Date) => void;
  onChangeWeek: (delta: number) => void;
}) {
  const [width, setWidth] = useState(0);
  const tx = useSharedValue(0);

  const weeks = [
    weekDays(addDays(weekRef, -7)),
    weekDays(weekRef),
    weekDays(addDays(weekRef, 7)),
  ];

  // Corre en JS: cambia la semana y recentra el offset. La semana que quedó
  // en el centro (old next/prev) pasa a ser la nueva "actual" → sin salto.
  const commit = (delta: number) => {
    onChangeWeek(delta);
    tx.value = 0;
  };

  const pan = Gesture.Pan()
    // Solo activa en horizontal: no roba el tap de día ni el scroll vertical.
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onUpdate((e) => {
      'worklet';
      tx.value = Math.max(-width, Math.min(width, e.translationX));
    })
    .onEnd((e) => {
      'worklet';
      if (width === 0) return;
      const next = e.translationX < -width * 0.35 || e.velocityX < -500;
      const prev = e.translationX > width * 0.35 || e.velocityX > 500;
      if (next) {
        tx.value = withSpring(-width, SPRING, (done) => {
          if (done) runOnJS(commit)(7);
        });
      } else if (prev) {
        tx.value = withSpring(width, SPRING, (done) => {
          if (done) runOnJS(commit)(-7);
        });
      } else {
        tx.value = withSpring(0, SPRING);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    // Base -width: deja la semana "actual" (índice 1) centrada.
    transform: [{ translateX: tx.value - width }],
  }));

  return (
    <View
      style={styles.viewport}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.row, { width: width * 3 }, rowStyle]}>
          {weeks.map((days, wi) => (
            <View key={wi} style={[styles.week, { width }]}>
              {days.map((d, i) => {
                const active = sameDay(d.toISOString(), selectedDay);
                return (
                  <Pressable
                    key={i}
                    onPress={() => onSelectDay(d)}
                    style={[styles.day, active && styles.dayActive]}
                  >
                    <Text
                      style={[styles.dayLetter, active && styles.dayLetterActive]}
                    >
                      {DAY_LETTERS[i]}
                    </Text>
                    <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                      {d.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: { flex: 1, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  week: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dayActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  dayLetter: {
    fontFamily: fonts.medium,
    fontSize: 9,
    color: colors.taupeDark,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dayLetterActive: { color: 'rgba(253, 251, 250, 0.6)' },
  dayNum: {
    fontFamily: fonts.light,
    fontSize: 20,
    color: colors.ink,
    marginTop: 4,
  },
  dayNumActive: { color: colors.surface },
});
