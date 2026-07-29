// Configuración (dentro de Perfil): preferencias de la app.
// - Notificaciones: toggles por tipo (se guardan; el push se conecta en #8).
// - Sede por defecto: qué sede abre al iniciar (default fijado en el store).
// - Acerca de: versión de la app + acceso a términos/políticas.
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { FormBack } from '@/components/ui/Form';
import { Card } from '@/components/ui/Card';
import { TagLabel, PageTitle } from '@/components/ui/Text';
import { useSede } from '@/store/sede';
import {
  getNotifPrefs,
  setNotifPrefs,
  DEFAULT_NOTIF_PREFS,
  type NotifPrefs,
} from '@/lib/notifPrefs';
import { fetchNotifPrefs, syncNotifPrefs } from '@/api/push';
import { colors, fonts } from '@/theme';

const NOTIF_ITEMS: { key: keyof NotifPrefs; label: string; sub: string }[] = [
  {
    key: 'listaEspera',
    label: 'Lista de espera',
    sub: 'Cuando se libera un lugar y confirmamos tu reserva',
  },
  { key: 'novedades', label: 'Novedades de tu sede', sub: 'Avisos y comunicados' },
  {
    key: 'vencimiento',
    label: 'Vencimiento de plan',
    sub: 'Cuando tu plan está por vencer',
  },
];

export default function Configuracion() {
  const sedes = useSede((s) => s.sedes);
  const defaultSedeId = useSede((s) => s.defaultSedeId);
  const setDefaultSedeId = useSede((s) => s.setDefaultSedeId);

  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  useEffect(() => {
    // Prioridad al server; si falla (offline), cae al cache local.
    fetchNotifPrefs()
      .then((server) => {
        const merged = { ...DEFAULT_NOTIF_PREFS, ...server };
        setNotif(merged);
        setNotifPrefs(merged); // cache local
      })
      .catch(() => {
        getNotifPrefs().then(setNotif);
      });
  }, []);

  const toggle = (key: keyof NotifPrefs) => {
    const next = { ...notif, [key]: !notif[key] };
    setNotif(next); // optimista
    setNotifPrefs(next); // cache local
    syncNotifPrefs(next).catch(() => {
      // best-effort; se re-sincroniza al próximo ingreso
    });
  };

  const version = Constants.expoConfig?.version ?? '—';

  const sedeOptions: { id: number | null; label: string; sub?: string }[] = [
    { id: null, label: 'La última que usé' },
    ...sedes.map((s) => ({
      id: s.id,
      label: s.nombre,
      sub: s.esHome ? 'Tu sede principal' : undefined,
    })),
  ];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.head}>
        <FormBack />
        <PageTitle style={styles.title}>Configuración</PageTitle>
      </View>

      {/* Notificaciones */}
      <TagLabel style={styles.section}>Notificaciones</TagLabel>
      <Card style={styles.list}>
        {NOTIF_ITEMS.map((it, i) => (
          <View
            key={it.key}
            style={[styles.row, i === NOTIF_ITEMS.length - 1 && styles.rowLast]}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{it.label}</Text>
              <Text style={styles.rowSub}>{it.sub}</Text>
            </View>
            <Switch
              value={notif[it.key]}
              onValueChange={() => toggle(it.key)}
              trackColor={{ false: colors.line, true: colors.ink }}
              thumbColor={colors.surface}
            />
          </View>
        ))}
      </Card>
      <Text style={styles.note}>
        Elegí qué notificaciones push querés recibir.
      </Text>

      {/* Sede por defecto (solo si hay más de una accesible) */}
      {sedes.length > 1 && (
        <>
          <TagLabel style={styles.section}>Sede por defecto</TagLabel>
          <Card style={styles.list}>
            {sedeOptions.map((o, i) => {
              const active = o.id === defaultSedeId;
              return (
                <Pressable
                  key={o.id ?? 'none'}
                  style={[
                    styles.row,
                    i === sedeOptions.length - 1 && styles.rowLast,
                  ]}
                  onPress={() => setDefaultSedeId(o.id)}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{o.label}</Text>
                    {o.sub && <Text style={styles.rowSub}>{o.sub}</Text>}
                  </View>
                  <View style={[styles.radio, active && styles.radioOn]}>
                    {active && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              );
            })}
          </Card>
          <Text style={styles.note}>
            La app abre en tu sede por defecto. Sin una fija, abre en la última
            que usaste.
          </Text>
        </>
      )}

      {/* Acerca de */}
      <TagLabel style={styles.section}>Acerca de</TagLabel>
      <Card style={styles.list}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Versión</Text>
          <Text style={styles.rowValue}>{version}</Text>
        </View>
        <Pressable
          style={[styles.row, styles.rowLast]}
          onPress={() => router.push('/perfil/politicas')}
        >
          <Text style={styles.rowLabel}>Términos y políticas</Text>
          <Text style={styles.rowArrow}>→</Text>
        </Pressable>
      </Card>

      {/* Cuenta */}
      <TagLabel style={styles.section}>Cuenta</TagLabel>
      <Card style={styles.list}>
        <Pressable
          style={[styles.row, styles.rowLast]}
          onPress={() => router.push('/perfil/eliminar-cuenta')}
        >
          <View style={styles.rowText}>
            <Text style={styles.rowDanger}>Eliminar mi cuenta</Text>
            <Text style={styles.rowSub}>
              Borra tus datos personales. Es irreversible.
            </Text>
          </View>
          <Text style={styles.rowArrow}>→</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40 },
  head: { marginBottom: 24 },
  title: { marginTop: 6 },

  section: { marginTop: 24, marginBottom: 10, marginLeft: 4 },
  list: { padding: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1, gap: 3 },
  rowLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  rowSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.inkMute,
  },
  rowValue: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.inkSoft,
  },
  rowArrow: { color: colors.inkMute, fontSize: 13 },
  rowDanger: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.terracotta,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.ink },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ink,
  },

  note: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.inkMute,
    marginTop: 10,
    marginLeft: 4,
    marginRight: 4,
  },
});
