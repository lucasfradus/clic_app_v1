# TODO — clic_app_v1

App móvil (Expo/RN) de CLIC. Un solo tema neutro para todas las unidades
(Pilates / Hot / Fitness). Ver `src/theme/index.ts`.

## Backlog (pedido 2026-07-27)

### 1. Configuración (dentro de Perfil) ✅ (v1)
- [x] Fila "Configuración" en el menú de Perfil → `/perfil/configuracion`.
- [x] **Notificaciones**: 4 toggles (clase, lista de espera, novedades,
      vencimiento) persistidos en AsyncStorage (`src/lib/notifPrefs.ts`).
      Inertes hasta #8 (push) — hay nota en pantalla avisándolo.
- [x] **Sede por defecto**: default fijado (`clic.defaultSedeId`) que gana en el
      arranque; radio con opción "la última que usé". Solo si hay >1 sede.
- [x] **Acerca de**: versión (expo-constants) + link a términos/políticas.
- Futuro (no en v1): apariencia claro/oscuro, idioma, eliminar cuenta.

### 2. Resetear contraseña
- [ ] Flujo de **reset de contraseña** (olvidé mi contraseña) desde login.
  - Depende de endpoint en Clicnet (`/api/v1/auth/...`) — verificar si existe
    recuperación por email o hay que sumarlo.

### 3. Login: teclado tapa los inputs ✅
- [x] `KeyboardAvoidingView` no tenía `behavior` en Android → agregado `'height'`
      (iOS sigue con `'padding'`). Ya tenía ScrollView + keyboardShouldPersistTaps.

### 4. Header del Home (saludo) ✅
- [x] Saludo humano ("Buenas tardes" en minúscula, no tag-label) + nombre grande
      (40px, mismo aire que `PageHeader`).
- [x] Sacado el iso (redundante con el logo del `AppHeader`) y la fecha.

### 7. Afordancia: botones grises no se distinguen de lo no-clickeable ✅
- [x] Botón primario → fondo `ink` (carbón) + texto claro. Secundario → borde
      `taupe` + texto tinta. `disabled` a 0.45 (distingue activo de inactivo).
- [ ] Pendiente revisar Pressables ad-hoc (qrBtn, pills, filas de menú) — hoy
      tienen chevron `→`, aceptable, pero revisar consistencia global.

### 5. Agenda: aviso de clases aún no habilitadas ✅ (parcial)
- [x] Banner informativo debajo del día cuando TODO el día está
      `FUERA_DE_VENTANA`. Proactivo, sin tener que tocar una clase.
- [ ] **"en X días" exacto** requiere backend: la API `/api/v1/clases` NO
      devuelve `sede.diasReservaAnticipada` (lo usa solo server-side). Follow-up
      chico en Clicnet: agregar ese número (o `reservaAbreEn` ISO por clase) a la
      respuesta → la app calcula `daysUntil(inicio) - diasReservaAnticipada`.
      Implica deploy de Clicnet a prod (la app pega a prod).

### 6. Sacar pre-títulos / dar más aire (TODAS las páginas) ✅ (parcial)
- [x] Componente `PageHeader` único (sin pre-título, título 40px, +aire).
- [x] Aplicado en Agenda, Cuenta, Novedades, Perfil.
- [ ] Home queda para #4 (rediseño del saludo).
- [ ] Pendiente pantallas de flujo (consentimiento, autorización de menores):
      tienen pre-títulos contextuales ("Antes de empezar", "Documento"). Revisar
      si también se sacan o se dejan por ser parte del onboarding.

### 8. Notificaciones push — PLAN (decidido: dev-build sí, los 4 tipos)
Servicio: **Expo Push** (app `expo-notifications` → Expo Push API desde Clicnet).
Prefs viven en el **server** (hoy son device-local en `src/lib/notifPrefs.ts`).
Ver memoria [[clic-notificaciones-infra-push]] para el mapa de eventos.

**Fase 0 — Prereqs (EAS + dev-build)**
- [x] `expo-dev-client` + `expo-notifications` instalados; `eas.json` (perfil
      `development`, APK, internal distribution).
- [x] `android.package` + `ios.bundleIdentifier` = com.clicestudio.app; plugin
      `expo-notifications` (color); `googleServicesFile` → google-services.json.
- [x] `eas init` (projectId `7e7c4b25…`, owner lucasfra). Firebase creado
      (proyecto clic-app-b18ed), google-services.json en el repo (gitignored).
- [x] Clave **FCM V1** (cuenta de servicio) subida a Expo vía `eas credentials`.
      El JSON secreto se borró del repo (gitignored igual).
- [x] `eas build --profile development --platform android` — APK instalado en
      teléfono físico (2 builds: el 2º con google-services.json + ícono nuevo).

**Fase 1 — Plumbing + 1 evento (lista de espera) ✅ (deployado a prod, PR #246)**
- [x] App: `registerForPushNotificationsAsync` (permiso, token, canal Android) +
      `POST /push/register` tras login (`_layout.tsx`).
- [x] Backend: migración `PushToken` + `POST/DELETE /api/v1/push/register`.
- [x] Backend: `lib/notificaciones/push.ts` → `enviarPush(alumnoId, payload)`
      vía Expo Push API; da de baja tokens `DeviceNotRegistered`.
- [x] Enganchado en **lista de espera** (`promoverListaEspera`).
- [x] Validado end-to-end en prod: token registrado (alumnoId 6632) + push de
      prueba recibido. Falta ver el hook de lista de espera "en vivo".
- [x] **Limpiar debug**: sacados los logs `[PUSH]` y el bloque "Push token
      (debug)" de Configuración.
- [x] **Ícono de notificación** (barra de estado Android): `notification-icon.png`
      (silueta blanca del iso, transparente) + plugin `expo-notifications.icon`.
      ⚠️ Es config nativa → **se ve recién en el próximo build**. Android solo
      permite silueta monocroma (usa el alfa), no el logo full-color.
- [ ] Baja de token en logout (quedó para Fase 4).

**Fase 2 — Prefs server + eventos que ya disparan ✅ (deployado a prod, PR #249)**
- [x] Backend: `NotifPrefs` por alumno + `GET/PUT /api/v1/push/prefs`.
- [x] `enviarPush(alumnoId, payload, tipo?)` respeta prefs; sin `tipo` = crítico.
- [x] App: Configuración carga prefs del server + sincroniza al togglear (cache
      local de fallback). Copy actualizada.
- [x] Push en **vencimiento de plan** (cron diario) y **clase cancelada**
      (feriado, crítico — sin toggle propio).
- [x] **Probado en prod (Sede Test, 28/7):** prefs (guardado en server ✅),
      clase cancelada (contenido real ✅), **lista de espera (hook real
      server-side end-to-end ✅)**, vencimiento (contenido ✅). Aprendizajes:
      feriado futuro → aviso diferido al cron (no inmediato); Prisma 7 no conecta
      al proxy de prod desde local (usar pg directo); vencimiento tiene dedup 5d.
- [ ] Limpieza test: feriado 142 (30/7 Sede Test) quedó con
      `notificacionEnviada=false` → el cron podría mandar un push duplicado cerca
      del 30/7. Borrar el feriado o marcarlo si molesta.

**Fase 3 — Triggers nuevos ✅ (parcial, deployado a prod, PR #252)**
- [x] **Novedades**: hook en `crearNovedad()` (con `after()`) → push masivo a
      alumnos con sub activa en las sedes de la novedad; respeta pref `novedades`.
      `enviarPushMasivo` con chunking de 100. Toggle "Recordatorio de clase"
      sacado de la app.
- [~] **Recordatorio de clase**: DESCARTADO por ahora (poco crítico + suma cron/
      scheduler). La columna `NotifPrefs.recordatorioClase` queda por si se retoma.

**Fase 4 — Pulido ✅ (app-only, sin deploy)**
- [x] **Deep-link** al tocar la notificación (`src/lib/useNotificationRouting.ts`):
      lista_espera/clase_cancelada→Agenda, novedad→News, vencimiento→Cuenta.
- [x] **Baja del token en logout** (`store/auth.ts` → `unregisterPushToken`).
- [x] Limpieza de tokens muertos → ya estaba en `enviarPushMasivo`.
- [ ] **Ícono de notificación** — configurado; entra en el próximo `eas build`.
- Nota: deep-link + logout son JS (se ven por Metro); probar deep-link requiere
  tocar un push real. El ícono necesita rebuild.

**Decisiones abiertas menores:** lead time del recordatorio (X horas);
¿recordatorio push-only o también email?; copy corto por tipo (título/cuerpo).

## Pendientes de la pasada de tema neutro
- [ ] **Rename semántico** de tokens históricos (`beige`/`taupe` hoy son grises)
      → roles (`subtle`/`neutral`/…) en los ~29 archivos que consumen `@/theme`.
- [ ] Neutralizar **`brandText`** (`src/theme/index.ts`): hoy dice "studio
      pilates" y el login "Bienvenida / Tu espacio de práctica" — atado a Pilates.
      Def de producto: tagline neutro de CLIC.

## Ideas / más adelante
- [ ] **Analytics con Firebase** (medir uso → base para vender publicidad).
  - Base YA lista: `src/lib/analytics.ts` es un no-op con `trackEvent` enchufado
    en login/logout (store) y reservas/lista-espera (api). Pensado para Firebase.
  - Usar el **mismo proyecto Firebase** del push (`clic-app-b18ed`, ya hay
    google-services.json) → sin proveedor nuevo ni costo.
  - Pasos: (1) `@react-native-firebase/app` + `/analytics` (plugin + **rebuild**);
    (2) `trackEvent` → `logEvent` (un archivo, call-sites ya existen);
    (3) screen tracking auto (listener de expo-router → `page_view` por pantalla).
  - Métricas para el objetivo de ads: **DAU/MAU + retención** (audiencia),
    **vistas/tiempo por pantalla** (tasar inventario — la Agenda seguro lidera),
    y cuando haya slots: **impresiones/clicks por slot**.
  - Ojo: consentimiento/privacidad antes de lanzar ads (políticas de stores).
  - Alternativa si se quiere más producto: PostHog (funnels/cohortes/self-host).
- [ ] **Pantalla de preloader/carga** con el logo de CLIC (el iso). Mientras la
      app bootstrapea (fuentes, token, sede, sesión) hoy muestra `null`/`Loader`
      genérico. Armar algo de marca — iso centrado, quizás con una animación
      sutil (reanimated: fade/pulse). Aprovecha la infra de gestos/anim ya
      montada. Distinto del splash nativo (ese es pre-JS); esto es el estado de
      carga in-app.

## Hecho
- [x] Fix loop de re-render en Agenda (`useReloadOnFocus` con ref).
- [x] Logo → Home y foto de perfil → Perfil (tap en `AppHeader`).
- [x] Paleta neutra "vainilla" (gris warm-neutral) en `src/theme/index.ts`.
- [x] `PageHeader` (sin pre-título, +aire) en Agenda/Cuenta/Novedades/Perfil.
- [x] Home: saludo rediseñado (sin iso ni fecha).
- [x] Login: fix teclado en Android (`behavior='height'`).
- [x] Cuenta: "Pagaste"/"Vence" a dos columnas con divisor, fecha destacada.
- [x] Tab News resaltado (label tinta + semibold) cuando hay sin leer.
      Verificado en prod (ojo: hay 2 sedes "Sede Test" id=5 y "Test Sede" id=16).
- [x] Botón primario carbón (afordancia) + secundario/disabled más nítidos.
- [x] Agenda: banner "clases aún no habilitadas" (día fuera de ventana).
- [x] Agenda: tira de semana swipeable (PanResponder). Flechas se mantienen.
- [x] Gestos reales: `GestureHandlerRootView` en el root + carrusel de semana
      con reanimated (sigue el dedo + spring, recentrado transparente).
      `WeekStripCarousel`. Reemplaza al PanResponder. Infra lista para reusar.
