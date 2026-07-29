// Perfil (port de pages/Perfil.tsx): hero oscuro con avatar + foto de perfil,
// stats, gráfico de asistencia de últimos 5 meses y menú de navegación.
import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Watermark from '@/components/brand/Watermark';
import Avatar from '@/components/ui/Avatar';
import { Card, DarkCard } from '@/components/ui/Card';
import { TagLabel } from '@/components/ui/Text';
import PageHeader from '@/components/layout/PageHeader';
import { useFotoPerfil } from '@/lib/useFotoPerfil';
import { useAuth } from '@/store/auth';
import { useSelectedSede } from '@/store/sede';
import { getTurnos } from '@/api/turnos';
import { getSuscripciones } from '@/api/suscripciones';
import type { Turno, Suscripcion } from '@/types';
import { parse } from '@/lib/date';
import { ApiError } from '@/api/client';
import { toast } from '@/store/toast';
import { brandAssets, brandText, colors, fonts, radius } from '@/theme';

const MESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const BARS_HEIGHT = 140;

export default function Perfil() {
  const perfil = useAuth((s) => s.perfil);
  const logout = useAuth((s) => s.logout);
  const [historial, setHistorial] = useState<Turno[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const sede = useSelectedSede();
  const sedeId = sede?.id;
  const { fotoUrl, subiendo, subir, quitar } = useFotoPerfil();
  const [fotoSheet, setFotoSheet] = useState(false);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      Promise.all([getTurnos('historial'), getSuscripciones()])
        .then(([h, s]) => {
          setHistorial(h);
          setSuscripciones(s);
        })
        .catch((e: ApiError) => toast.error(e.message));
    }, [])
  );

  const historialSede = useMemo(
    () =>
      sedeId === undefined
        ? historial
        : historial.filter((t) => t.sede.id === sedeId),
    [historial, sedeId]
  );
  const asistidos = historialSede.filter((t) => t.estado === 'ASISTIO');
  const activa = useMemo(() => {
    const activas = suscripciones.filter((s) => s.estado === 'ACTIVA');
    if (sedeId === undefined) return activas[0];
    return (
      activas.find((s) => s.sedeId === sedeId) ??
      activas.find((s) => s.accesoMultisede)
    );
  }, [suscripciones, sedeId]);
  const restantes = activa
    ? activa.accesos + activa.accesosExtra - activa.accesosUsados
    : 0;

  const progressByMonth = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; count: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: MESES[d.getMonth()],
        count: 0,
      });
    }
    for (const t of asistidos) {
      const d = parse(t.inicio);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === key);
      if (m) m.count++;
    }
    const max = Math.max(1, ...months.map((m) => m.count));
    return months.map((m) => ({ ...m, v: m.count / max }));
  }, [asistidos]);

  const memberSince = perfil
    ? new Date(perfil.fechaRegistro).getFullYear()
    : '';

  const whatsappHref = sede?.whatsappUrl ?? null;

  const menu: { label: string; icon: string; to: Href }[] = [
    { label: 'Datos personales', icon: '☺', to: '/perfil/editar' },
    { label: 'Cambiar contraseña', icon: '⚙', to: '/perfil/password' },
    { label: 'Configuración', icon: '☰', to: '/perfil/configuracion' },
    {
      label: 'Consentimiento informado',
      icon: '✎',
      to: '/perfil/consentimiento',
    },
    // Solo si la sede tiene activada la autorización de menores
    ...(perfil?.autorizacionMenoresRequerido
      ? [
          {
            label: 'Autorización de menores',
            icon: '✦',
            to: '/perfil/autorizacion-menores' as Href,
          },
        ]
      : []),
    { label: 'Políticas del establecimiento', icon: '§', to: '/perfil/politicas' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <PageHeader title="Perfil" />

      {/* Hero oscuro */}
      <DarkCard style={styles.hero}>
        <Watermark
          color="accent"
          size={28}
          opacity={0.9}
          position={{ top: 24, right: 24 }}
        />
        <View style={styles.avatarWrap}>
          <Pressable
            onPress={() => setFotoSheet(true)}
            disabled={subiendo}
            style={[styles.avatarBtn, subiendo && styles.avatarBtnDisabled]}
            accessibilityLabel="Cambiar foto de perfil"
          >
            <Avatar fotoUrl={fotoUrl} nombre={perfil?.nombre} size={72} />
            <View style={styles.avatarCam}>
              <Text style={styles.avatarCamText}>{subiendo ? '…' : '✷'}</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.name}>
          {perfil?.nombre} {perfil?.apellido}
        </Text>
        <TagLabel style={styles.member}>Miembro · {memberSince}</TagLabel>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{asistidos.length}</Text>
            <TagLabel>Clases usadas</TagLabel>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{activa ? activa.accesos : '—'}</Text>
            <TagLabel>Plan</TagLabel>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{restantes}</Text>
            <TagLabel>Restan</TagLabel>
          </View>
        </View>

        <View style={styles.brandRow}>
          <Image
            source={brandAssets.isoAccent}
            style={styles.brandIso}
            resizeMode="contain"
          />
          <TagLabel>{brandText.fullName}</TagLabel>
        </View>
      </DarkCard>

      {/* Asistencia */}
      <Card>
        <View style={styles.progressHead}>
          <TagLabel>Asistencia · últimos 5 meses</TagLabel>
          <Text style={styles.progressPct}>{asistidos.length}</Text>
        </View>
        <View style={styles.bars}>
          {progressByMonth.map((p, i) => (
            <View key={i} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(Math.max(p.v, 0.08) * BARS_HEIGHT, 10) },
                ]}
              />
              <TagLabel>{p.label}</TagLabel>
            </View>
          ))}
        </View>
      </Card>

      {/* Menú */}
      <Card style={styles.menu}>
        {menu.map((m) => (
          <Pressable
            key={m.label}
            style={styles.menuRow}
            onPress={() => router.push(m.to)}
          >
            <Text style={styles.menuIcon}>{m.icon}</Text>
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Text style={styles.menuArrow}>→</Text>
          </Pressable>
        ))}
        {whatsappHref && sede && (
          <Pressable
            style={styles.menuRow}
            onPress={() => Linking.openURL(whatsappHref).catch(() => {})}
          >
            <Text style={styles.menuIcon}>✆</Text>
            <Text style={styles.menuLabel}>WhatsApp {sede.nombre}</Text>
            <Text style={styles.menuArrow}>↗</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.menuRow, styles.menuLast]}
          onPress={() => {
            logout();
            router.replace('/login');
          }}
        >
          <Text style={styles.menuIcon}>↗</Text>
          <Text style={[styles.menuLabel, styles.menuDanger]}>
            Cerrar sesión
          </Text>
          <Text style={styles.menuArrow}>→</Text>
        </Pressable>
      </Card>

      {/* Sheet de foto de perfil */}
      <Modal
        visible={fotoSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setFotoSheet(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setFotoSheet(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <TagLabel style={styles.sheetTitle}>Foto de perfil</TagLabel>
            <Pressable
              style={styles.sheetItem}
              onPress={() => {
                setFotoSheet(false);
                subir('galeria');
              }}
            >
              <Text style={styles.sheetItemText}>
                {fotoUrl ? 'Cambiar foto (galería)' : 'Subir foto (galería)'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.sheetItem}
              onPress={() => {
                setFotoSheet(false);
                subir('camara');
              }}
            >
              <Text style={styles.sheetItemText}>Sacar foto</Text>
            </Pressable>
            {fotoUrl && (
              <Pressable
                style={styles.sheetItem}
                onPress={() => {
                  setFotoSheet(false);
                  quitar();
                }}
              >
                <Text style={[styles.sheetItemText, styles.sheetDanger]}>
                  Quitar foto
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 32, gap: 20 },

  hero: {
    paddingTop: 36,
    paddingHorizontal: 32,
    paddingBottom: 28,
    alignItems: 'flex-start',
  },
  avatarWrap: { marginBottom: 16, zIndex: 1 },
  avatarBtn: { position: 'relative' },
  avatarBtnDisabled: { opacity: 0.7 },
  avatarCam: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarCamText: { fontSize: 12, color: colors.taupe },
  name: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 28,
    color: colors.surface,
    zIndex: 1,
  },
  member: { color: 'rgba(253,251,250,0.5)', marginTop: 6, zIndex: 1 },
  stats: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: 'rgba(253, 251, 250, 0.1)',
    zIndex: 1,
  },
  stat: { flex: 1, gap: 4 },
  statNum: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 30,
    color: colors.surface,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
    zIndex: 1,
  },
  brandIso: { width: 16, height: 16, opacity: 0.75 },

  progressHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  progressPct: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 30,
    color: colors.sage,
  },
  bars: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-end',
    height: BARS_HEIGHT + 26,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    backgroundColor: colors.taupe,
    borderRadius: 10,
  },

  menu: { padding: 4 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  menuLast: { borderBottomWidth: 0 },
  menuIcon: {
    width: 24,
    textAlign: 'center',
    color: colors.taupeDark,
    fontSize: 14,
  },
  menuLabel: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
    flex: 1,
  },
  menuDanger: { color: colors.terracotta },
  menuArrow: { color: colors.inkMute, fontSize: 13 },

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
  sheetTitle: { marginBottom: 12, marginLeft: 12 },
  sheetItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sheetItemText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.ink,
  },
  sheetDanger: { color: colors.terracotta },
});
