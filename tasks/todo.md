# TODO — clic_app_v1

App móvil (Expo/RN) de CLIC. Un solo tema neutro para todas las unidades
(Pilates / Hot / Fitness). Ver `src/theme/index.ts`.

## 🍏 App Store — lo que falta (al 31-ago-2026)

Estado verificado contra la API de App Store Connect: **build 8 (1.0.0) está en
TestFlight con `processingState: VALID`** y la versión 1.0 está en
`PREPARE_FOR_SUBMISSION` (borrador, sin ficha). Google Play ya está publicada.

Paso a paso en `docs/publicar-stores.md` §4. Copy listo en `docs/app-store-ficha.md`.

### 0. Decisiones (destraban el resto)
- [x] **Nombre**: queda **"Clic Fitness"** — "CLIC" a secas ya estaba registrado
      por otro desarrollador y el nombre es único global. Ficha ajustada (salió
      `fitness` de las keywords, que Apple ya indexa por el nombre).
- [x] **Rama `feat/publicacion-ios` pusheada** a origin.

### 1. Humo en TestFlight — ✅ HECHO (31-ago)

Probado en iPhone con la cuenta del revisor. Anduvo todo: login, agenda,
cuenta, novedades, credencial y los permisos de cámara/fotos con los textos en
castellano.

**El push funciona en iOS** — era lo único que nunca había corrido en esa
plataforma. Se probaron los 4 tipos mandándolos directo a la Expo Push API con
el token de ese iPhone (los hooks reales habrían notificado a todos los socios
de la sede). Llegaron los 4 y el deep-link abrió la pantalla correcta en cada
caso: `lista_espera` y `clase_cancelada` → Agenda, `novedad` → Novedades,
`vencimiento` → Cuenta.

Nota: el token Android de ese alumno era el teléfono de Lucas, reasignado al
loguearse con la cuenta del revisor (`PushToken.token` es `@unique` por
dispositivo, así que un teléfono sirve a una sola cuenta a la vez).

- [x] **Build 8 asociado a la versión 1.0** (se hizo después del humo, ya sin
      riesgo de tener que rebuildear).

### 2. Capturas 6.9"
- [ ] **Lucas**: sacar 5 capturas del iPhone con la app de TestFlight —
      Home, Agenda, Cuenta, Novedades, Credencial/QR — y dejarlas crudas en
      `store-assets/capturas-crudas-ios/`.
- [ ] **Claude**: enmarcarlas a **1290×2796** con `sharp` (mismo estilo y títulos
      que las de Play) y commitearlas en `store-assets/capturas-ios/`.

Las capturas de Play son 1080×1920 y **no sirven**. No hacen falta capturas de
iPad: `supportsTablet` está desactivado → app iPhone-only.

### 2.b Usuario del revisor — **Lucas** (decidido 31-ago)

Procedimiento completo en `docs/app-store-ficha.md` → "App Access". Resumen:

- Cuenta **`revisor@clicpilates.com`**, en una **sede real con clases** (para que
  la agenda se vea con datos), con un plan de modalidad **`PACK`** que no sea de
  prueba.
- [ ] Alta en el backoffice con **fecha de nacimiento de adulto** (evita el gate
      de autorización de menores). Queda con la clave temporal `Clic2025`; la app
      no fuerza cambiarla.
- [ ] Cobrarle el plan PACK.
- [ ] Entrar **desde Android** con esa cuenta: firmar el consentimiento (es un
      gate de la app, no se puede desde el backoffice), reservar una clase futura
      y cambiar la clave por una propia.
- [ ] Cargar email + clave en ASC → *App Review Information*.
- [ ] ⚠️ Al quedar en una sede real con suscripción vigente **cuenta como socio
      activo** en los reportes de esa sede: darlo de baja cuando la app esté
      aprobada.

### 3. Ficha en App Store Connect — ✅ cargada por API (31-ago)

Se cargó con la App Store Connect API (key Admin en `C:Userslucas.appstore`),
leyendo los textos de `docs/app-store-ficha.md` para que no diverjan. Verificado
releyendo de Apple:

- [x] **Subtítulo** `Reservá clases en tu estudio` (28/30)
- [x] **URL de privacidad** → va en la pantalla **App Privacy**, no en
      *App Information*, aunque la API la exponga en `appInfoLocalizations`.
- [x] **Descripción** (948/4000), **keywords** (93/100), **texto promocional**,
      **support URL**.
- [x] **App Review Information**: notas en inglés + usuario demo
      `revisor@clicpilates.com` / `Clic2025`. Contacto para Apple: Lucas Fradusco,
      +541121566704, lucas.fradusco@gmail.com.
- [x] **Release: MANUAL** — la app sale cuando se aprieta el botón, no apenas
      Apple apruebe.
- [x] Ya estaban de antes: nombre `Clic Fitness`, categoría *Health & Fitness* y
      el **age rating** declarado.

**Falta en esta pantalla:**
- [ ] **App Privacy (nutrition labels)** — ⚠️ no se pudo verificar por API (los
      endpoints `appDataUsages` devuelven 404): **revisar a mano en la web**. La
      tabla con el mapeo está en `docs/app-store-ficha.md`.
- [ ] **Capturas 6.9"** (0 cargadas) — bloqueado por el iPhone.
- [ ] **Asociar el build** a la versión 1.0 (hoy no tiene ninguno). Conviene
      hacerlo al final, después del humo: si el humo falla habrá un build nuevo.
### 4. Enviar a revisión — **Lucas**
- [ ] En la versión 1.0, seleccionar el **build 8**.
- [ ] *Submit for Review*. La primera revisión tarda entre 24 h y unos días.

### 5. No bloquean, pero conviene no olvidarlos
- [ ] **16 dependencias desalineadas del SDK** (`expo@57.0.8` vs `~57.0.18`,
      `react-native@0.86.0` vs `0.86.3`, etc.). Alinear con `npx expo install --fix`
      en una rama propia y probar **Android además de iOS**. No se tocó durante la
      publicación para no mezclar cambios en un build de 25 min.
- [ ] La cuenta está enrolada como **Individual**: en la ficha el desarrollador
      figura con el nombre personal, no "CLIC". Cambiarlo requiere migrar a
      Organization (pide D-U-N-S). Se puede publicar ahora y migrar después.
- [ ] `store-assets/README.md` dice 6.7" para iOS; Apple hoy pide **6.9"**.


## Backlog (pedido 2026-07-27)

### 1. Configuración (dentro de Perfil) ✅ (v1)
- [x] Fila "Configuración" en el menú de Perfil → `/perfil/configuracion`.
- [x] **Notificaciones**: 4 toggles (clase, lista de espera, novedades,
      vencimiento) persistidos en AsyncStorage (`src/lib/notifPrefs.ts`).
      Inertes hasta #8 (push) — hay nota en pantalla avisándolo.
- [x] **Sede por defecto**: default fijado (`clic.defaultSedeId`) que gana en el
      arranque; radio con opción "la última que usé". Solo si hay >1 sede.
- [x] **Acerca de**: versión (expo-constants) + link a términos/políticas.
- [x] **Eliminar mi cuenta** (Cuenta): confirma contraseña → `DELETE /auth/account`
      → anonimiza en Clicnet y cierra sesión. Requisito de Google Play. Vía web =
      email a soporte (`scripts/anonimizar-cuenta.ts`). Ver `docs/publicar-stores.md`.
- Futuro (no en v1): apariencia claro/oscuro, idioma.

### 2. Resetear contraseña ✅
- [x] Flujo de **reset de contraseña** (olvidé mi contraseña) desde login, con
      **código de 6 dígitos** por email.
- [x] Backend Clicnet (PR #255, prod): modelo `PasswordResetToken` (sha256, 15min,
      un solo uso) + `POST /api/v1/auth/forgot` (anti-enumeración, rate-limit
      3/15min) + `POST /api/v1/auth/reset` (bcrypt, rate-limit 8/15min).
- [x] App: `forgotPassword`/`resetPassword` en `api/auth.ts`; pantalla `/forgot`
      de dos pasos (email → código+contraseña); link "¿Olvidaste tu contraseña?"
      en el login.

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

### 5. Agenda: aviso de clases aún no habilitadas ✅
- [x] Banner informativo debajo del día cuando TODO el día está
      `FUERA_DE_VENTANA`.
- [x] **"en X días" exacto** — Clicnet expone `reservaAbreEn` en `/api/v1/clases`
      (PR #254, prod); la app calcula "se habilitan en X días / mañana" con
      fallback genérico. 

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
- [x] Baja de token en logout (`store/auth.ts` → `unregisterPushToken`).

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
- [x] Limpieza test: feriado 142 (30/7 Sede Test) marcado
      `notificacionEnviada=true` en prod para evitar el push duplicado del cron.

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

## Cerrados (pasada de tema neutro)
- [x] **Rename semántico** de tokens: `beige→subtle`, `beigeSoft→subtleSoft`,
      `taupe→neutral`, `taupeDark→neutralDark` en todo `@/theme` + usos.
- [x] **`brandText`**: tagline "studio pilates" ya no se muestra; "Bienvenida"→
      "Bienvenido". Subtítulo "Tu espacio de práctica" se mantiene (decisión).
- [x] Afordancia Pressables sueltos + pre-títulos de flujos → se dejan como están
      (chevron OK; los pre-títulos de onboarding son contexto, no navegación).

## Hardening opcional
- [ ] Restringir la API key de Firebase en Google Cloud (Android + package
      com.clicestudio.app + SHA-1 del keystore). No es secreto real; el alert de
      GitHub ya se descartó. Link: console.cloud.google.com/apis/credentials?project=clic-app-b18ed

## Ideas / más adelante
- [x] **Preloader** con el iso (pulso, reanimated) en el app-open —
      `src/components/ui/Preloader.tsx`, reemplaza el spinner genérico.
- [x] **Analytics con Firebase** — código listo (`@react-native-firebase/app`
      + `/analytics`; `trackEvent`→`logEvent`; screen tracking en el root).
      Se **activa con el rebuild**. Para el objetivo de ads: mirar DAU/MAU +
      retención (audiencia) y vistas/tiempo por pantalla (tasar inventario);
      a futuro, impresiones/clicks por slot. Ojo consentimiento/privacidad
      antes de lanzar ads. Alternativa: PostHog.

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
