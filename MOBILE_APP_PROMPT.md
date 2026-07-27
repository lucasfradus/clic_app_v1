# Prompt para la sesión de construcción de la app móvil CLIC

> Copiá todo lo que sigue (desde "---") como primer mensaje de una nueva sesión de Claude Code, abierta en la carpeta `c:\Users\lucas\webapp-clic`.
>
> Actualizado 2026-07-23: sincronizado con la webapp en `origin/main` commit `28f0eca` (incluye QR de acceso, foto de perfil y gate de autorización de menores).

---

Quiero que construyas la **app móvil de CLIC para iOS y Android** con **React Native + Expo**, partiendo de la webapp de clientas existente.

## Fuentes de verdad (leelas antes de escribir código)

1. **`MOBILE_APP_SPEC.md`** (en esta carpeta) — especificación funcional completa: pantallas, navegación, lógica de negocio, contrato de la API, modelos de datos, tema visual, features nativas y qué queda fuera de la v1. **Es la fuente de verdad; ante cualquier duda, mandá la spec.**
2. **`clic-webapp-clientes/src/`** — código real de la webapp. Consultalo cada vez que la spec referencie un archivo, en especial:
   - `src/pages/Agenda.tsx` → lógica de reservas/cancelaciones/lista de espera (portar literalmente, es el corazón del negocio)
   - `src/components/ProtectedRoute.tsx` → la cadena de gates: token → consentimiento → autorización de menores (el orden y las condiciones exactas importan; hay flags que faltan en backends viejos)
   - `src/api/*` y `src/types/index.ts` → cliente HTTP, endpoints y tipos (los tipos se copian tal cual)
   - `src/store/*` → stores de Zustand (incluido el flag de sesión `consentimientoNoRequerido`)
   - `src/pages/Acceso.tsx` + `src/lib/accessQr.ts` → credencial QR de acceso al molinete (cache por ownerId, wake lock)
   - `src/lib/useFotoPerfil.ts` → foto de perfil (subir/cambiar/quitar con compresión client-side)
   - `src/lib/date.ts` → helpers de fecha (semana lunes-a-domingo, `hoursUntil`, tiempos relativos)
   - `src/brand/theme-clic.ts` + `src/styles/globals.css` + `CLAUDE.md` → tokens de color, tipografía y lenguaje visual

## Decisiones ya tomadas (no re-preguntar)

- **Expo managed workflow** con **development build** (`expo-dev-client`) desde el día 1 — el push remoto no funciona en Expo Go.
- **Expo Router** (stack de auth + gates + 5 bottom tabs), **Zustand**, **TypeScript estricto**, **date-fns** locale `es`.
- **Una sola app, tema único CLIC** (beige/taupe/ink del manual de marca). Sin multi-tema runtime, sin dark mode, sin i18n, sin offline (única excepción: el cache de la credencial QR).
- **La autorización de menores es un gate obligatorio** después del consentimiento (cambió: antes era autogestión no bloqueante). PENDIENTE/APROBADA no bloquean; sin enviar o RECHAZADA sí. La spec §3 manda.
- Nativas v1: **push notifications** (expo-notifications, backend vía contrato §11.1 de la spec), **biometría como app-lock** (expo-local-authentication), **agregar clase al calendario** (expo-calendar).
- API real: `https://app.clicpilates.com/api/v1`. **No inventes endpoints** — solo los de la spec (§6) y el contrato nuevo de dispositivos (§11.1).
- Copy 100% en español rioplatense (voseo), igual que la webapp.

## Cómo trabajar

Creá el proyecto en `c:\Users\lucas\webapp-clic\app-clic-v1.1\` (la carpeta ya existe, vacía). Avanzá por fases, y **verificá cada fase antes de pasar a la siguiente** (typecheck + levantar la app y navegar el flujo en el emulador/Expo):

1. **Fundaciones**: scaffold Expo + TypeScript + Expo Router; tema (tokens + fuentes Poppins/Italiana empaquetadas); copiar assets desde `clic-webapp-clientes/src/assets/clic/`; portar `types/index.ts`, cliente HTTP (base URL absoluta, manejo centralizado de errores y 401 global) y stores (`auth` con SecureStore y el flag `consentimientoNoRequerido`, `sede` con AsyncStorage, `toast`).
2. **Auth + shell**: Login, bootstrap de sesión, **cadena de gates** (token → consentimiento → autorización de menores → tabs, portando las condiciones exactas de `ProtectedRoute.tsx`, incluidos los campos opcionales de backends viejos), tabs con placeholder, selector de sede en el header, componentes base (Card, card oscura con watermark, Badge, Avatar con foto o inicial, Toast).
3. **Pantallas core**: Home (con botón "Mostrar mi QR" solo si `selectedSede.controlAcceso?.disponible`), **Acceso** (QR fullscreen: `react-native-qrcode-svg`, cache de credencial por ownerId en SecureStore, `expo-keep-awake`), Agenda (con TODA la lógica de negocio de `onClaseClick`: tolerancia de cancelación default 2 h, antelación default 30 min, límite de cancelaciones mensuales, accesos restantes = accesos + extra − usados, lista de espera con posición, defensa contra carrera de cupo), Cuenta, Perfil (con foto de perfil: subir/cambiar/quitar desde el avatar), Novedades (HTML con `react-native-render-html` + badge de no leídas en el tab).
4. **Pantallas secundarias**: Editar perfil (incluye editor de foto), Cambiar contraseña, Consentimiento (firma con `react-native-signature-canvas` → PNG base64; si `requerido: false` → flag de sesión, no tocar el perfil), Consentimiento firmado, Políticas, Autorización de menores (estado + **formulario en doble modo**: gate standalone "Antes de empezar" y reenvío desde Perfil; siempre `await fetchPerfil()` antes de navegar para no loopear con el gate; foto de DNI vía `expo-image-picker` + `expo-image-manipulator`).
5. **Nativas**: push (permiso post-login con pantalla explicativa, registro del Expo push token contra `POST /dispositivos`, navegación por `data.tipo` al tocar, canales Android; hasta que el backend exista, dejá el registro tolerante a error y probá con notificaciones locales), biometría (ajuste en Perfil + app-lock al abrir/volver de background), calendario (botón en confirmación de reserva, hero de Home y reservas).
6. **Builds y stores**: `app.config.ts` completo (ícono, splash, permisos con textos en español), perfiles EAS (`development`/`preview`/`production`), documentación de los pasos de EAS Submit y el checklist de stores (§12 de la spec). **Antes del primer build preguntame los bundle IDs** (sugerido `com.clicestudio.app`) porque no se pueden cambiar después.

## Reglas

- La lógica de negocio se **porta, no se re-diseña**. Si la webapp y la spec difieren en algo, gana el código de la webapp — avisame de la discrepancia.
- Mantené el lenguaje visual CLIC: cards `surface` radius 20, heros oscuros `ink` radius 24 con glow y watermark del isotipo (~0.07 de opacidad), labels uppercase con letter-spacing, badges sage/terracotta/taupe, Italiana para títulos y números. La app tiene que sentirse boutique, no genérica.
- Home y Agenda recargan datos al enfocar y al volver a foreground (refleja la promoción automática de lista de espera).
- Los campos nuevos del backend son opcionales por compatibilidad (`consentimientoRequerido`, `fotoUrl`, `controlAcceso`): respetá los defaults de la spec (consentimiento ausente = requerido; controlAcceso ausente = sin QR).
- Mantené la abstracción `trackEvent()` con los nombres de eventos de la spec (implementación no-op en v1).
- Al terminar cada fase, contame en un párrafo qué quedó funcionando y cómo lo verificaste.
- El backend nuevo (endpoints de dispositivos, envío de push) se implementa en otra sesión: al llegar a la fase 5, generá un archivo `BACKEND_PUSH_CONTRACT.md` con el contrato exacto (endpoints, payloads, eventos que disparan push según §11.1) listo para entregar a esa sesión.
