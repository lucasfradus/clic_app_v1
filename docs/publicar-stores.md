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

## 3. Google Play — paso a paso

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

## 4. Apple App Store — paso a paso (fase 2)

### 4.1 Prerrequisitos
- [ ] **Apple Developer Program** (US$99/año).
- [ ] Una Mac no es obligatoria (EAS compila en la nube), pero sí la cuenta.
- [ ] Resolver bloqueante 2.3 (infoPlist) **antes** del build iOS.

### 4.2 Push en iOS (Firebase → APNs)
- [ ] Crear una **APNs Auth Key** (.p8) en el Apple Developer portal.
- [ ] Cargarla en Firebase (proyecto `clic-app-b18ed` → Cloud Messaging → APNs) y
      en EAS (`eas credentials` → iOS → Push key). Sin esto, el push no llega en iOS.

### 4.3 Build iOS
```bash
npx eas-cli build --platform ios --profile production
```
- EAS gestiona certificados y provisioning (login con la Apple ID del programa).
- Genera un `.ipa` firmado.

### 4.4 App Store Connect
- [ ] Crear el **app record** (bundle `com.clicestudio.app`).
- [ ] **Capturas**: 6.7" (iPhone 15/16 Pro Max) obligatoria; 6.5" recomendada; si
      soporta iPad, sumar las de iPad. Mismas pantallas que Android.
- [ ] **App Privacy** (nutrition labels) → cargar según sección 1.
- [ ] **URL de privacidad** (2.1). Descripción, keywords, categoría *Health & Fitness*.
- [ ] **App Review**: usuario demo (2.4) + notas explicando el login y el flujo de
      tutor para menores.

### 4.5 Envío
- [ ] Subir con `eas submit --platform ios` (usa una **App Store Connect API Key**).
- [ ] Enviar a revisión desde App Store Connect. Apple es más estricto: revisar
      que no haya red-boxes, que los permisos tengan textos claros, y que el
      contenido de pago (si se muestran precios/planes) no requiera IAP —
      **los pagos son externos (Mercado Pago, servicio real fuera de la app)**, lo
      cual Apple permite para bienes/servicios físicos (clases presenciales), pero
      conviene aclararlo en las notas de revisión.

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

### Estado actual (2026-07-29)
- App **feature-complete** y probada end-to-end (incl. reset de contraseña).
- Corriendo un **dev-build** de Android (perfil development) para validar en
  device el ícono de notificación, Firebase Analytics y el módulo nativo.
- **Bloqueantes de la sección 2:** 2.2 (borrado de cuenta) y 2.3 (infoPlist iOS)
  **hechos**; 2.1 (política de privacidad) tiene el borrador listo, falta
  hostearla. Quedan tareas **operativas, no de código**: hostear la política,
  definir el email de bajas, y completar los cuestionarios de Play Console
  (Data safety, Data deletion, App access con usuario demo).
