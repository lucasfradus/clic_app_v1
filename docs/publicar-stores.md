# Publicación en Google Play y App Store — Handoff / Prompt

Guía completa y accionable para llevar la app **CLIC** (Expo/React Native) a
**Google Play** (primero) y **Apple App Store** (después). Incluye los datos
reales de la app, el inventario de datos para los formularios de privacidad, los
bloqueantes a resolver antes de subir, y el paso a paso de cada tienda.

> Cómo usar este doc: las secciones **0–2** son la verdad de la app y lo que hay
> que resolver sí o sí. Las secciones **3–4** son el paso a paso por tienda. La
> sección **5** es un prompt reutilizable para pasarle a un agente (Claude Code)
> y que ejecute la parte técnica.

---

## 0. Datos de la app (verdad de origen)

| Campo | Valor |
|---|---|
| Nombre visible | **CLIC** |
| Slug Expo | `clic-app` |
| Package Android / Bundle iOS | `com.clicestudio.app` |
| Versión actual | `1.0.0` (`appVersionSource: remote`, `autoIncrement` en producción) |
| Owner Expo / EAS project | `lucasfra` / `7e7c4b25-b893-4afc-894a-ddd0b34a7b2f` |
| Apple Team ID | `YT24YH8WXT` (enrolado como **Individual**) |
| Backend | Clicnet (Next.js), prod en `https://app.clicpilates.com/api/v1` |
| Stack | Expo SDK 57, React Native 0.86, expo-router (typed routes), New Arch, React Compiler |
| Notificaciones push | Expo Push + FCM (Firebase `clic-app-b18ed`, `google-services.json` en el repo) |
| Analytics | Firebase Analytics (`@react-native-firebase/app` + `/analytics`) |
| Marca / negocio | Estudios CLIC (Pilates / Hot / Fitness), Argentina. App para socios. |
| Login | Obligatorio (email + contraseña). No hay modo invitado. |
| Reset de contraseña | Código de 6 dígitos por email (`/auth/forgot` + `/auth/reset`). |

**Permisos nativos que pide la app:**
- **Cámara** (`expo-image-picker` → `requestCameraPermissions`): foto de perfil y
  foto del DNI del tutor (autorización de menores).
- **Galería / fotos** (`launchImageLibrary`): misma finalidad.
- **Notificaciones** (`expo-notifications`): push.
- **NO** usa ubicación, contactos, micrófono, ni escanea QR (el QR de acceso solo
  se **muestra** con `react-native-qrcode-svg`).

---

## 1. Inventario de datos recolectados (para Data Safety / App Privacy)

Sirve tanto para el **Data Safety** de Google como para las **Privacy Nutrition
Labels** de Apple. Todo se recolecta para operar el servicio (gestión del socio);
nada se vende.

| Dato | Se recolecta | Se comparte con terceros | Finalidad |
|---|---|---|---|
| Nombre y apellido | Sí | No | Cuenta / identificación del socio |
| Email | Sí | No | Login, recupero de contraseña, avisos |
| Teléfono | Sí (opcional) | No | Contacto |
| **DNI** (documento) | Sí (opcional) | No | Identificación / acceso |
| Sexo, dirección, fecha de nacimiento | Sí (opcional) | No | Perfil |
| **Foto de perfil** | Sí (opcional) | No | Credencial / perfil |
| **Foto de DNI del tutor** (menores) | Sí, si aplica | No | Autorización legal de menores |
| Contraseña | Sí | No | Autenticación (hash bcrypt en el server) |
| Historial de pagos (monto, fecha, plan) | Se muestra | Mercado Pago (procesa el pago) | Ver estado de cuenta. **La app NO captura datos de tarjeta**; el pago ocurre en Mercado Pago. |
| **Push token** (Expo/FCM) | Sí | Google (FCM) / Expo (envío) | Enviar notificaciones |
| **Analytics de uso** (screen views, eventos, ID de dispositivo/instalación) | Sí | Google (Firebase Analytics) | Métricas de uso |
| Diagnóstico / crashes | Solo si se agrega Crashlytics (hoy no) | — | — |

**Categorías Google Data Safety a marcar:** Info personal (nombre, email,
teléfono, dirección, IDs de usuario), Fotos, Info financiera (historial de
transacciones — "mostrada"), IDs de dispositivo, Actividad en la app, App
info & performance. **Encriptación en tránsito: Sí** (HTTPS). **El usuario puede
pedir borrado de sus datos: Sí** (ver bloqueante #2).

---

## 2. ⚠️ Bloqueantes a resolver ANTES de subir (no son features, pero frenan)

### 2.1 Política de privacidad pública (Google y Apple la exigen) — ✅ HECHO (falta deploy)
Página pública creada en el repo `clic-pilates-landing` → `/politicas`
(`src/app/politicas/page.tsx`, estática, datos legales reales cargados). URL
final: **`https://www.clicpilates.com/politicas`**. Rama `feat/politicas-privacidad`
pusheada; **falta mergear a main para que Vercel la publique en producción**.
Borrador original (markdown) en `docs/politica-privacidad-borrador.md`.
Usar esa URL en Play Console y App Store Connect.
- Opciones de hosting: una página en el sitio de CLIC, o `clicpilates.com/privacidad`.
- Contenido mínimo: qué datos se recolectan (usar la tabla de la sección 1), para
  qué, con quién se comparten (Mercado Pago, Google/Firebase), cómo se pide el
  borrado, y un contacto (email).
- **Borrador de política:** ver `docs/politica-privacidad-borrador.md` (generar
  aparte si se pide).

### 2.2 Borrado de cuenta (requisito duro de Google Play) — ✅ HECHO
Google Play exige, para apps con cuenta, un mecanismo para **pedir baja de cuenta
+ datos**, accesible desde la app y por una vía sin la app.
- **En la app:** Perfil → Configuración → **Eliminar mi cuenta** → confirma
  contraseña → anonimiza en el server y cierra sesión. (Clicnet:
  `DELETE /api/v1/auth/account` + `anonimizarCuenta()`, deployado.)
- **Vía sin app (decisión: email a soporte):** el socio escribe a
  `[bajas@clicpilates.com]` y el equipo corre `scripts/anonimizar-cuenta.ts`
  (dry-run + `--apply`). Documentar ese email en la política y en la ficha.
- **Falta (operativo, no código):** definir el email real de bajas, y
  declararlo en Play Console → *App content → Data deletion*.

### 2.3 Strings de permisos iOS (Apple rechaza sin esto) — ✅ HECHO
Ya está en `app.json` → `ios.infoPlist` con `NSCameraUsageDescription` y
`NSPhotoLibraryUsageDescription`. (Referencia del contenido agregado:)
```json
"ios": {
  "bundleIdentifier": "com.clicestudio.app",
  "infoPlist": {
    "NSCameraUsageDescription": "CLIC usa la cámara para tu foto de perfil y la foto del documento del tutor.",
    "NSPhotoLibraryUsageDescription": "CLIC accede a tus fotos para elegir tu foto de perfil o el documento del tutor."
  }
}
```
(Android: `expo-image-picker` y `expo-notifications` ya inyectan sus permisos vía
plugin; no hace falta tocar el manifest a mano.)

### 2.4 Cuenta demo para el revisor (ambas tiendas)
La app es 100% login-gated. Google y Apple **necesitan un usuario de prueba** con
datos cargados (sede, plan activo, alguna reserva) para revisar. Preparar
`revisor@clicpilates.com` / contraseña, y anotarlo en las notas de revisión.

### 2.5 Menores (declaración correcta, no bloqueante si se declara bien)
La app maneja **autorización de menores** (un tutor autoriza). El público objetivo
son socios (mayormente adultos); los menores usan con tutor. Declarar **target
audience: adultos (18+)** o el rango real, y describir el flujo de tutor. No
activar la sección "Families" salvo que se apunte explícitamente a niños.

---

## 3. Google Play — paso a paso ✅ PUBLICADA (30-jul-2026)

### 3.1 Prerrequisitos
- [ ] Cuenta de **Google Play Console** (pago único US$25). Owner: cuenta de CLIC.
- [ ] Resolver bloqueantes 2.1, 2.2, 2.4 (privacidad, borrado de cuenta, demo).

### 3.2 Build de producción (AAB)
```bash
# desde clic_app_v1, con la rama a publicar mergeada
npx eas-cli build --platform android --profile production
```
- Genera un **AAB** (Android App Bundle), no APK — es lo que pide Play.
- `autoIncrement: true` sube el `versionCode` solo. La `version` (1.0.0) se
  gestiona remota (`appVersionSource: remote`).
- Las credenciales (keystore) ya están en EAS (perfil development las usa; el de
  producción reusa el mismo keystore administrado por Expo). **Guardar backup del
  keystore** (`eas credentials`) — si se pierde, no se puede actualizar la app.

### 3.3 Ficha de Play Store (assets a preparar)
- [ ] **Ícono** 512×512 PNG (32-bit, con alfa) — reusar el iso de CLIC.
- [ ] **Feature graphic** 1024×500 PNG/JPG (banner de cabecera).
- [ ] **Capturas de teléfono**: mín. 2, hasta 8 (16:9 o 9:16, ≥320px). Sugerido:
      Home, Agenda, Cuenta, Novedades, credencial/QR.
- [ ] **Descripción corta** (≤80 caracteres).
- [ ] **Descripción completa** (≤4000 caracteres).
- [ ] Categoría: *Health & Fitness*. Email de contacto. URL de privacidad (2.1).

### 3.4 Cuestionarios de Play Console (App content)
- [ ] **Data safety** → cargar según sección 1.
- [ ] **Content rating** (cuestionario IARC) → app sin contenido sensible.
- [ ] **Target audience & content** → sección 2.5.
- [ ] **Data deletion** → URL + método de baja (2.2).
- [ ] **App access** → credenciales del usuario demo (2.4) para el revisor.
- [ ] **Ads**: hoy **no** hay ads → declarar "No". (Cuando se sumen, cambiar acá
      y revisar consentimiento — ver TODO de analytics/ads.)

### 3.5 Publicación
- [ ] Subir el AAB a un **track de testing** (Internal testing) primero →
      instalar desde el link, humo rápido.
- [ ] Promover a **Producción** → enviar a revisión (suele tardar días la primera).
- Automatizable con `eas submit --platform android` (requiere un **Google Service
  Account JSON** con permisos en Play Console; configurarlo una vez).

---

## 4. Apple App Store — EN CURSO (cuenta aprobada 2026-08-28)

Google Play ya está publicada, así que **todo lo transversal está resuelto y se
reusa tal cual**: política de privacidad, borrado de cuenta, inventario de datos
(sección 1), copy de la ficha y usuario demo. Lo que sigue es sólo lo específico
de Apple.

### 4.1 Arreglos de configuración ✅ (rama `feat/publicacion-ios`, 28-ago)
Tres cosas que iban a romper el primer build de iOS:

- **Ícono**: `ios.icon` apuntaba a `assets/expo.icon`, que era el **placeholder de
  Expo** (símbolo de Expo con gradiente azul) — habría salido así en el App Store.
  Ahora apunta a `./assets/images/icon.png` (1024×1024, el mismo iso que Android).
  El directorio `assets/expo.icon` se borró.
- **`ITSAppUsesNonExemptEncryption: false`** en el `infoPlist`: la app sólo usa
  HTTPS estándar. Sin esta clave, App Store Connect pregunta por export compliance
  en **cada** subida a TestFlight.
- **`ios.googleServicesFile`** declarado. ⚠️ **Falta el archivo**: hay que agregar
  una app iOS (bundle `com.clicestudio.app`) al proyecto Firebase `clic-app-b18ed`
  y bajar el `GoogleService-Info.plist` a la raíz del repo. Sin él,
  `@react-native-firebase` falla el prebuild. Está gitignoreado (igual que su par
  de Android, que sí se trackea).

### 4.2 Paso 0 — `GoogleService-Info.plist` (único bloqueante de código)
1. [Firebase Console](https://console.firebase.google.com) → proyecto
   **`clic-app-b18ed`** → ⚙️ *Configuración del proyecto* → *Tus apps* →
   **Agregar app** → **iOS**.
2. *ID del paquete*: **`com.clicestudio.app`** (exacto, igual que Android).
   Apodo: "CLIC iOS". El App Store ID se deja vacío.
3. **Descargar `GoogleService-Info.plist`** → dejarlo en la **raíz** de
   `clic_app_v1`, al lado de `google-services.json`.
4. **Ignorar el resto del asistente** (pods, `AppDelegate`, código de init): el
   config plugin de Expo hace todo eso en el build. Con bajar el archivo alcanza.

⚠️ El plist **se commitea**, igual que `google-services.json`. EAS Build sólo sube
al builder los archivos **trackeados por git**: con el plist ignorado el build corta
con *"File specified via `ios.googleServicesFile` is not checked in to your repository
and won't be uploaded to the builder"*. No es un secreto — es config de cliente que
viaja dentro del binario. El secreto de Firebase es la clave de cuenta de servicio
(`*-firebase-adminsdk-*.json`), que sigue ignorada.

### 4.2.b `expo-build-properties` — lo que hizo fallar los dos primeros builds

Los primeros builds de iOS murieron en la fase **Install pods**. EAS sólo reporta
`UNKNOWN_ERROR`; el error de verdad está en el log (ver 4.2.c para bajarlo):

```
[!] The 'Pods-CLIC' target has transitive dependencies that include statically
    linked binaries: (.../FirebaseAnalytics.xcframework)
```

Dos cosas, en este orden:

1. El proyecto **no tenía `expo-build-properties`**, que es donde se declara el
   linkeo de frameworks en iOS. `@react-native-firebase` lo exige. Android nunca
   lo pidió, por eso el problema apareció recién en el primer build de iOS.
2. Con `useFrameworks: "dynamic"` **vuelve a fallar**: `FirebaseAnalytics` se
   distribuye como **binario estático** y CocoaPods se niega a mezclarlo con
   frameworks dinámicos. La doc de react-native-firebase recomienda `dynamic`
   para React Native 0.75+ *cuando se usa Swift Package Manager*; este proyecto
   compila Firebase por **CocoaPods**, así que corresponde `static`.

Config que quedó:
```json
["expo-build-properties", { "ios": { "useFrameworks": "static" } }]
```

`disableSPM` (que la doc menciona junto a `static`) **no existe** en el plugin de
`@react-native-firebase/app@25.1.0` instalado — es de una versión posterior. No
hizo falta.

### 4.2.c Cómo leer el log real de un build fallido

La página de expo.dev pide login, pero el log sale por CLI. El campo `logFiles`
trae una URL firmada (válida ~15 min) y el archivo viene **gzipeado**:

```bash
npx eas-cli build:list --platform ios --limit 1 --non-interactive --json
# copiar logFiles[0] y:
curl -s --compressed "<url>" -o build.log
```

Es JSON por línea; cada entrada tiene `phase` (`INSTALL_PODS`, `RUN_FASTLANE`, …)
y `msg`. Filtrar por la fase que falló y mirar las últimas líneas.

**Pendiente aparte (no bloqueaba el build):** hay 16 dependencias desalineadas del
SDK (`expo@57.0.8` vs `~57.0.18`, `react-native@0.86.0` vs `0.86.3`, etc.).
Alinearlas con `npx expo install --fix` en un cambio propio, no mezclado con la
publicación, y volver a probar Android además de iOS.

### 4.3 Paso 1 — Primer build de iOS
Conviene hacerlo **antes** de crear el app record: EAS registra solo el App ID en
el Developer Portal y así después aparece en la lista desplegable de ASC.

```bash
npx eas-cli build --platform ios --profile production
```
⚠️ **Lo tiene que correr una persona.** El primer build pide login con la Apple ID
y el **código de doble factor**, así que en modo no interactivo falla con
*"Credentials are not set up. Run this command again in interactive mode"*. Una vez
creadas las credenciales en EAS, los builds siguientes ya salen sin intervención.

**Alternativa sin 2FA** (sirve si la contraseña de Apple no entra en la terminal, y
es además el modo en que se puede automatizar): crear primero la App Store Connect
API Key (paso 4.5) y exportar estas cuatro variables antes de correr el build —
EAS gestiona los certificados con la key, sin pedir usuario ni código:

```bash
export EXPO_ASC_API_KEY_PATH="/ruta/a/AuthKey_XXXXXXXX.p8"
export EXPO_ASC_KEY_ID="XXXXXXXX"
export EXPO_ASC_ISSUER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export EXPO_APPLE_TEAM_ID="YT24YH8WXT"
```

Lo que pasa en el camino:
- Pide login con la **Apple ID del Developer Program** (una sola vez; queda en EAS).
- Crea solo, sin intervención: el **App Identifier**, el *Distribution
  Certificate*, el *Provisioning Profile* y — cuando pregunta *"Setup Push
  Notifications for your project?"* → **responder que sí** — la **APNs Key**.
  No hace falta ir al portal de Apple a crear la .p8 de push a mano.
- **No** hace falta registrar el UDID del iPhone: eso aplica sólo a builds
  ad-hoc / *internal distribution*. Un build de producción se instala por
  TestFlight.
- Tarda ~15-25 min entre cola y compilación.

### 4.4 Paso 2 — Crear el app record en App Store Connect
[App Store Connect](https://appstoreconnect.apple.com) → *Apps* → **+** → *Nueva app*:
- **Plataforma**: iOS
- **Nombre**: `CLIC` (máx. 30 caracteres; es **único global** en todo el App Store)
- **Idioma principal**: Español (no existe variante rioplatense; usar España o México)
- **ID del paquete**: `com.clicestudio.app` (aparece en la lista si ya corrió el build)
- **SKU**: identificador interno libre, ej. `clic-app-001`
- **Acceso de usuario**: acceso completo

Después, en *App Information*, anotar el **Apple ID numérico** de la app: es el
`ascAppId` que va en `eas.json`.

> **Contratos**: la app es **gratuita**, así que alcanza con el *Apple Developer
> Program License Agreement* (se acepta al entrar por primera vez). El *Paid
> Applications Agreement* y los datos fiscales/bancarios **no hacen falta**
> porque no se cobra nada dentro de la app. Si al entrar a ASC aparece un banner
> de términos pendientes, aceptarlo antes de seguir.

### 4.5 Paso 3 — App Store Connect API Key (para `eas submit`)
[Users and Access](https://appstoreconnect.apple.com/access/users) → pestaña
**Integrations** → *App Store Connect API* → **+** al lado de "Active":
- Nombre: `EAS Submit` · **Acceso: `Admin`**
- **Descargar el `.p8`** — ⚠️ **se puede descargar una sola vez**. Guardarlo fuera
  del repo (no commitear).
- Anotar el **Key ID** y el **Issuer ID** (los muestra el mismo portal).

### 4.6 Paso 4 — Subir a TestFlight ✅ (primer submit: 28-ago)

Las credenciales del **submit** NO son las mismas variables que las del build.
`EXPO_ASC_*` sirve para que EAS gestione certificados durante el build, pero
`eas submit` las lee de `eas.json` → `submit.production.ios`. Con sólo las
variables de entorno corta con *"App Store Connect API Keys cannot be set up in
--non-interactive mode"*.

Para no meter la clave ni su ruta en el repo, `eas.json` usa **interpolación de
variables de entorno** (`$VAR`), que EAS resuelve al ejecutar:

```json
"submit": { "production": { "ios": {
  "ascAppId": "6806391392",
  "ascApiKeyPath": "$ASC_API_KEY_PATH",
  "ascApiKeyId": "$ASC_API_KEY_ID",
  "ascApiKeyIssuerId": "$ASC_API_KEY_ISSUER_ID"
} } }
```

```bash
export ASC_API_KEY_PATH="C:/Users/lucas/.appstore/AuthKey_XXXXXXXXXX.p8"
export ASC_API_KEY_ID="XXXXXXXXXX"          # sale del nombre del archivo
export ASC_API_KEY_ISSUER_ID="<uuid>"       # ASC → Users and Access → Integrations
npx eas-cli submit --platform ios --latest --non-interactive
```

⚠️ **La key `.p8` se descarga una sola vez.** Está fuera del repo, en
`C:Userslucas.appstore`. Si se pierde, hay que revocarla y generar otra.
`.gitignore` ya cubre `*.p8`, pero igual no conviene dejarla dentro del repo:
EAS Build sube al builder todo lo que git no ignore.

Después del submit, Apple **procesa** el binario 5-10 min y avisa por mail. Recién
ahí aparece en TestFlight.

### 4.7 Paso 5 — Humo en el iPhone
Instalar **TestFlight** desde el App Store y entrar con la misma Apple ID.
El export compliance ya no pregunta nada (`ITSAppUsesNonExemptEncryption`).
Probar, en este orden:
- [ ] Login + "olvidé mi contraseña" (código de 6 dígitos por email)
- [ ] Agenda: reservar y cancelar
- [ ] Credencial / QR
- [ ] Foto de perfil → **permiso de cámara y de fotos** (que aparezcan los textos
      en castellano del `infoPlist`)
- [ ] **Push real** — es lo único de la app que nunca se probó en iOS. Disparar
      uno desde Clicnet y verificar que llega y que el **deep-link** abre la
      pantalla correcta.

### 4.8 Paso 6 — Capturas y ficha
- **Capturas**: sacarlas del iPhone (botón lateral + subir volumen) con la app de
  TestFlight. Guardarlas crudas en `store-assets/capturas-crudas-ios/`; el
  enmarcado a la resolución exacta que pide Apple (**6.9"**: 1290×2796 o
  1320×2868) se genera con `sharp`, igual que se hizo para Play. **No** hacen
  falta capturas de iPad: `supportsTablet` está desactivado → app iPhone-only.
- **Textos**: reusar `docs/play-store-ficha.md`. Apple pide además un **subtítulo**
  (30 caracteres) y **keywords** (100, separadas por coma) que Play no tiene.
- **App Privacy**: mapear la tabla de la sección 1. No omitir el **dato de salud**
  ni marcar el analytics como *linked to the user*.
- **Age rating**, **Pricing: Free**, y **URL de privacidad**
  (`https://www.clicpilates.com/politicas`).
- **Notas para App Review**: credenciales del usuario demo + aclarar que el login
  es obligatorio, que la autorización de menores la completa un tutor, y que los
  pagos ocurren **fuera de la app** (Mercado Pago) por tratarse de clases
  presenciales — servicios físicos, exentos de IAP. La app no tiene ningún flujo
  de compra: sólo muestra el estado de cuenta.

### 4.9 Paso 7 — Envío
*Submit for Review*. La primera revisión suele tardar entre 24 h y unos días.
Rechazos típicos para una app así: faltan credenciales demo, capturas que no
matchean la app real, o privacy labels incompletos.

---

## 5. Prompt reutilizable para un agente

> Copiar/pegar esto (ajustando lo que ya esté hecho) para que un agente ejecute la
> parte técnica:

```
Contexto: app Expo/React Native "CLIC" (SDK 57, expo-router, New Arch) en
clic_app_v1, package/bundle com.clicestudio.app, EAS project 7e7c4b25-b893-4afc-894a-ddd0b34a7b2f,
owner lucasfra. Backend Clicnet en app.clicpilates.com/api/v1. Login obligatorio.
Usa cámara + galería (foto de perfil / DNI de tutor), push (Expo+FCM) y Firebase
Analytics. No usa ubicación. Ver docs/publicar-stores.md para el detalle.

Quiero salir a Google Play. Tareas:
1. Agregar ios.infoPlist con NSCameraUsageDescription y NSPhotoLibraryUsageDescription
   en app.json (bloqueante iOS, dejarlo listo aunque iOS sea fase 2).
2. Implementar "Eliminar mi cuenta" en Configuración (Perfil) + endpoint en Clicnet
   que dispare la baja de cuenta y datos (requisito de Google Play). Debe haber
   también un método web equivalente.
3. Verificar que el perfil de producción de eas.json genera AAB y usa el keystore
   administrado; hacer backup del keystore (documentar el comando).
4. Preparar un usuario demo con sede/plan/reserva para el revisor.
5. Disparar `eas build --platform android --profile production`.
Antes de codear, entrá en plan mode y confirmá el plan. No toques la lógica de
pagos (son externos, Mercado Pago).
```

---

## Apéndice — comandos EAS útiles

```bash
# Estado / login
npx eas-cli whoami
npx eas-cli build:list --platform android --limit 5

# Builds
npx eas-cli build --platform android --profile development   # APK interno (test)
npx eas-cli build --platform android --profile production    # AAB (store)
npx eas-cli build --platform ios --profile production        # IPA (store)

# Credenciales (¡backup del keystore!)
npx eas-cli credentials

# Envío a tiendas
npx eas-cli submit --platform android   # requiere Google Service Account JSON
npx eas-cli submit --platform ios       # requiere App Store Connect API Key

# OTA (JS-only, sin rebuild) — para parches de JS entre releases
npx eas-cli update --branch production --message "fix ..."
```

### Estado actual (2026-08-28)
- **Google Play: PUBLICADA.** El AAB de producción (1.0.0, build 2) se subió el
  30-jul y la app está viva. Todos los cuestionarios (Data safety, Data deletion,
  App access, Content rating) quedaron completados.
- **App Store: arrancando.** Cuenta del Apple Developer Program **aprobada el
  28-ago**. Todavía no hay ningún build de iOS (`eas build:list` sólo muestra
  Android). Los tres arreglos de config están hechos en la rama
  `feat/publicacion-ios` (ver 4.1); el resto son tareas en la cuenta Apple (4.2).
- **Único bloqueante de código para el primer build iOS:** falta el
  `GoogleService-Info.plist` de Firebase (4.1).
- Bloqueantes transversales de la sección 2: **todos resueltos**. La política de
  privacidad está viva en `https://www.clicpilates.com/politicas`.

### Estado anterior (2026-07-29)
- App **feature-complete** y probada end-to-end (incl. reset de contraseña).
- Bloqueantes 2.2 (borrado de cuenta) y 2.3 (infoPlist iOS) hechos; 2.1 (política
  de privacidad) con el borrador listo, faltaba hostearla.
