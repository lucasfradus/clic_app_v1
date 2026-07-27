# CLIC App Mobile — Especificación funcional completa

> **Propósito de este documento**: es la fuente de verdad para construir la app móvil (iOS + Android) de CLIC a partir de la webapp de clientas (`clic-webapp-clientes/`). Fue generado mapeando exhaustivamente el código real de la webapp (no solo su documentación). Toda la lógica de negocio descrita acá debe portarse literalmente.
>
> **Actualizado**: 2026-07-23, sincronizado con `origin/main` commit `28f0eca`. Incluye las features nuevas de la webapp: credencial QR de acceso al molinete, foto de perfil, gate obligatorio de autorización de menores y el fix del loop de consentimiento.

---

## 1. Decisiones de alcance (ya tomadas — no re-discutir)

| Decisión | Valor |
|---|---|
| Tecnología | **React Native + Expo** (managed workflow, EAS) |
| Marcas | **Una sola app "CLIC"** que sirve a ambos negocios (CLIC Pilates y CLIC Fit), que comparten backend |
| Tema visual | **Tema único unificado CLIC** (identidad del manual de marca: beige/taupe/ink). No hay switching de tema por negocio en v1, pero los tokens de tema quedan centralizados para poder evolucionarlo |
| Features nativas v1 | **Push notifications**, **login/desbloqueo con biometría**, **agregar clases al calendario del teléfono** |
| Distribución | **App Store + Play Store** (builds y submit vía EAS) |
| Backend | Existente en `https://app.clicpilates.com` — se modifica **en otro repo/sesión**. La app se construye contra los contratos definidos en §11. No inventar endpoints |
| Offline | Fuera de alcance v1 (solo estados de error de conexión, como la webapp), con una excepción de paridad: la **credencial QR de acceso se cachea localmente** para poder mostrarse sin conexión (§5.13) |

---

## 2. Contexto: qué es la webapp de origen

SPA React 18 + Vite + TypeScript para **clientas de estudios de pilates/fitness**: login, reserva y cancelación de clases con cupos y lista de espera, estado de cuenta/plan, perfil con foto, credencial QR de acceso al molinete, firma digital de consentimiento informado, autorización de menores con foto de DNI, y novedades del estudio.

- Código fuente de referencia: `clic-webapp-clientes/src/`
- Backend: API REST `https://app.clicpilates.com/api/v1` (mismo backend para ambos negocios)
- La webapp se compila una vez por marca (`VITE_BRAND=clic|fit`) y se sirve en `clientes.clicpilates.com` y `clientes.clicfit.ar`. **En la app móvil esto desaparece: una sola app, un solo tema.**
- Stack de la webapp reutilizable conceptualmente: Zustand (estado), date-fns con locale `es`, fetch nativo.

---

## 3. Navegación móvil (mapa de pantallas)

La webapp usa React Router con sidebar (desktop) / tab bar (mobile). En la app nativa es directamente **bottom tabs + stacks**:

```
Root
├── (auth) Stack — sin sesión
│   └── Login
├── (gate 1) Consentimiento — con token, la sede lo exige y no está firmado
├── (gate 2) Autorización de menores — consentimiento OK, la sede la exige y falta enviarla o fue rechazada
├── Acceso (QR) — pantalla fullscreen SIN tabs, se abre desde Home
└── (app) Bottom Tabs — con token + ambos gates superados
    ├── Tab 1: Home
    ├── Tab 2: Agenda
    ├── Tab 3: Mi cuenta
    ├── Tab 4: Novedades  (badge de no leídas)
    └── Tab 5: Perfil
         ├── Editar perfil
         ├── Cambiar contraseña
         ├── Consentimiento firmado (estado/ver firma)
         ├── Políticas
         ├── Autorización de menores (estado)
         └── Autorización de menores (formulario de reenvío)
```

**Guards de navegación** (portar de `src/components/ProtectedRoute.tsx` — el orden importa):
1. Sin token → stack de Login.
2. Con token pero perfil aún cargando (bootstrap) → splash/loader.
3. **Gate de consentimiento**: bloquea si `perfil.consentimientoRequerido !== false` (los backends viejos no mandan el campo → tratar como requerido) **y** `!perfil.consentimientoFirmado` **y** no está seteado el flag de sesión `consentimientoNoRequerido` (§4) → pantalla Consentimiento.
4. **Gate de autorización de menores** (corre después del de consentimiento): bloquea si `perfil.autorizacionMenoresRequerido === true` **y** (estado `RECHAZADA`, **o** estado `null` sin `autorizacionMenoresFirmado` — legacy del flujo viejo). `PENDIENTE` y `APROBADA` **no** bloquean (la revisión la hace el estudio). → formulario de autorización en **modo gate**: pantalla standalone sin tabs, tag "Antes de empezar", sin botón volver.
5. OK → tabs.

**Flujos de redirección clave**:
- Login exitoso → Home si pasa ambos gates; si no, al gate que corresponda.
- En Consentimiento, si el backend responde `requerido: false` → setear el flag de sesión `consentimientoNoRequerido` en el store de auth (vive **fuera** de `perfil` para que un `fetchPerfil` posterior no lo pise) y entrar a la app (evita el loop consentimiento ↔ home).
- Al enviar la autorización de menores (o detectar estado PENDIENTE/APROBADA al cargar el form), hacer **`await fetchPerfil()` antes de navegar**: el guard lee del store y con datos viejos rebotaría de vuelta al formulario (loop).
- **Novedades nuevas**: la webapp fuerza una redirección a `/novedades` al abrir la app si hay novedades con `id > lastSeenId`. **Adaptación móvil**: reemplazar por **badge numérico en el tab Novedades** (el push notification ya cumple el rol de avisar). No forzar navegación.

---

## 4. Autenticación

- **Login**: `POST /auth` body `{email, password}` (sin auth) → `{token, user}`. Errores: 401 "Credenciales inválidas", 403 "Esta cuenta no es de alumno", 429 "Demasiados intentos".
- **Token**: JWT Bearer en header `Authorization`. **No hay refresh token.** En móvil se guarda en **`expo-secure-store`** (clave `clic_token`), no en storage plano.
- **Flujo post-login** (portar del store `auth.ts`): guardar token → set `consentimientoNoRequerido: false` → `trackEvent('login')` → `GET /perfil` → bootstrap de sedes (best-effort, puede dar 404 sin suscripción activa) → si algo falla, limpiar todo y mostrar error (nunca quedar en "Cargando…").
- **Estado del store de auth**: `token / user / perfil / consentimientoNoRequerido / loading`. `consentimientoNoRequerido` es un flag **de sesión, no persistido**, que se setea cuando `/consentimiento/texto` responde `requerido: false`; vive fuera de `perfil` a propósito (un `fetchPerfil` no debe pisarlo).
- **Bootstrap al abrir la app**: si hay token guardado → `GET /perfil` + bootstrap sedes; si falla → logout silencioso a Login.
- **401 global**: cualquier respuesta 401 → limpiar token, logout, toast "Tu sesión expiró. Iniciá sesión de nuevo.", volver a Login.
- **Cambiar contraseña**: `PUT /auth/password` body `{passwordActual, passwordNueva}`. Validación client-side: mínimo 6 caracteres, nueva === confirmación. No cierra sesión.
- **Logout**: `trackEvent('logout')`, borrar token de SecureStore, **borrar la credencial QR cacheada** (§5.13), reset del store de sede, **desregistrar el push token del dispositivo (§11.1)**, limpiar `consentimientoNoRequerido`, navegar a Login.
- **Biometría**: ver §11.2.

---

## 5. Pantallas en detalle

### 5.1 Login
Logo CLIC, saludo de bienvenida, form email + password con toggle mostrar/ocultar, botón deshabilitado con "Ingresando…" durante el request, error inline. Si ya hay sesión válida al abrir → directo a la app.

### 5.2 Home (dashboard)
Carga **en paralelo**: `getSuscripciones()`, `getTurnos('proximos')`, `getTurnos('historial')`, `getTurnos('cancelados')` + refresco de perfil best-effort. **Recargar al volver a foreground / al enfocar el tab** (equivalente móvil del `window focus` de la webapp — importante para reflejar promociones de lista de espera).

Secciones:
1. **Header**: saludo según hora (Buenos días/tardes/noches) + nombre + fecha de hoy + isotipo.
2. **Botón "Mostrar mi QR"**: visible **solo si `selectedSede?.controlAcceso?.disponible`** (molinete propio o sede anfitriona; **nunca inferirlo de `esHome` ni del plan**) → abre la pantalla de Acceso (§5.13). Subtítulo "Acceso a {nombre de la sede}". *(El viejo aviso no-bloqueante de autorización de menores que ocupaba este lugar ya no existe: fue reemplazado por el gate §3.)*
3. **Hero próxima clase**: primer turno `tipo=RESERVA` + `estado=CONFIRMADA` de la sede seleccionada. Si no hay → card CTA "Reservá una clase →" (a Agenda). *(Acá va también el botón "Agregar al calendario", §11.3.)*
4. **Plan**: suscripción `ACTIVA` para la sede (regla de selección §9.2). Si tiene `grupos` (multi-sala) → un stat por grupo (usados/total, restantes); si no → stat único con badge de modalidad (Horario fijo / Pack) + card de cancelaciones del mes (usadas/total). Si no hay activa pero hay una en otro estado → card "plan inactivo" con badge de estado.
5. **Mis reservas**: hasta 5 confirmadas.
6. **Lista de espera**: turnos `LISTA_ESPERA` con badge "En espera · N°{posicion}" y botón "Salir" → modal de confirmación → `DELETE /reservas/lista-espera?claseId=`.
7. **Historial**: hasta 10 items (historial + cancelados, orden desc) con badges: Asistió / Ausente / Canceló alumno / Canceló sede.
8. **Empty state global**: sin plan ni reservas → card quote "Tu pilates empieza acá."

### 5.3 Agenda — ⚠️ núcleo del negocio
Datos: `getSuscripciones()` (una vez); `GET /salones?sedeId=` al cambiar sede (resetea salón elegido); `GET /clases?sedeId&salonId&desde&dias=7` al cambiar sede/salón/semana; `GET /turnos?tipo=proximos` para mapear qué clases están reservadas / en espera. **Recargar todo al volver a foreground.**

UI:
- **Week strip** lunes-a-domingo con navegación ±7 días, selector de día.
- **Pill de salón** solo si la sede tiene >1 salón; opción "Todos los salones".
- **Banner "visitante"** si la sede seleccionada no es la home (`esHome`) del alumno.
- Contador de clases y reservadas del día.
- Estados: sin plan activo ("Necesitás un plan activo para ver la agenda") / cargando / día sin clases / lista.
- **Badges por clase**: Reservada (tuya) · En lista N°pos · Ya comenzó · No disponible (FUERA_DE_VENTANA) · Sin accesos · Lista de espera (llena) · Baja disponibilidad (≤3 cupos libres) · Disponible.

**Lógica al tocar una clase — portar LITERALMENTE de `src/pages/Agenda.tsx` (`onClaseClick`)**:
1. Ya en lista de espera → modal "salir de la lista" (muestra posición).
2. No reservada y ya comenzó (`YA_COMENZO` o `inicio <= ahora`) → toast error, no permite reservar.
3. **Cancelación de una reserva**:
   - Si `cancelacionesUsadas >= cancelaciones` (del plan, por mes) → error "Ya usaste todas tus cancelaciones del mes".
   - **Tolerancia**: si faltan menos de `sede.toleranciaCancelacionHoras` (**default 2 h**) para el inicio → error "No podés cancelar con menos de {tol} horas de anticipación".
   - Buscar `reservaId` en el mapa de turnos; si falta, fallback `GET /turnos?tipo=proximos` matcheando por `inicio` → modal confirmar → `DELETE /reservas?reservaId=`.
4. **Reserva**:
   - Sin suscripción activa o `accesosRestantes <= 0` → error "No te quedan clases disponibles…". **`accesosRestantes = accesos + accesosExtra - accesosUsados`** (por grupo si hay `grupos`).
   - **Antelación mínima**: si faltan `<= sede.antelacionReservaMinutos` (**default 30 min**) → error "Las reservas cierran {antelacion} minutos antes del inicio."
   - `FUERA_DE_VENTANA` → error "aún no está disponible para reservar".
   - Llena (`LLENO` o `cupo - reservas <= 0`) → modal **lista de espera**.
   - Si no → modal confirmar reserva → `POST /reservas {claseId}`.
- **Defensa contra carrera de cupo**: `POST /reservas` puede devolver `enListaEspera: true` aunque se haya intentado reservar → mostrar el toast correspondiente según `yaEstaba` / `posicion`.
- Tras cualquier acción, recargar clases + turnos + suscripciones.
- Analytics: `reserva_clase`, `lista_espera`, `cancelar_reserva`, `salir_lista_espera`.

### 5.4 Mi cuenta
Datos: perfil + `getSuscripciones()`.
- **Card oscura de plan**: nombre, fecha del último pago de la sede, vencimiento (`fin`) con "Venció hace X días" si ya pasó, badge de estado (ACTIVA→Activo, VENCIDA→Vencido, CANCELADA→Cancelado, PAUSADA→Pausado, CAMBIO_PLAN→Cambio de plan).
- **Stats de accesos**: por grupo si hay `grupos`; si no, stat único + card de cancelaciones del mes. Card "Accesos extra" si `accesosExtra > 0`.
- **Historial de pagos**: `perfil.ultimosPagos` filtrado por sede seleccionada; formato ARS sin decimales (`toLocaleString('es-AR')`). Empty state si no hay.

### 5.5 Perfil
Datos: `getTurnos('historial')` + `getSuscripciones()`.
- **Hero**: avatar con **foto de perfil** (componente `Avatar`: muestra `perfil.fotoUrl` si existe, si no la inicial del nombre). Tocar el avatar abre el picker para **subir/cambiar la foto**; si hay foto, aparece la acción "**Quitar foto**". La foto se comprime en el cliente antes de subir y tras subir/quitar se re-hidrata el perfil para refrescar todos los avatares (hook compartido, ver `src/lib/useFotoPerfil.ts`). Después: nombre completo, "Miembro · {año de fechaRegistro}", 3 stats: clases asistidas (turnos `ASISTIO`) / accesos del plan / restantes.
- **Gráfico de asistencia**: barras de los últimos 5 meses a partir de turnos `ASISTIO`, normalizadas al máximo.
- **Menú**: Datos personales · Cambiar contraseña · Consentimiento informado · Autorización de menores (**solo si `autorizacionMenoresRequerido`**) · Políticas · WhatsApp de la sede (abre `sede.whatsappUrl`, solo si existe) · **Ajustes de app** (nuevo en móvil: biometría §11.2, permisos de notificaciones) · Cerrar sesión.

### 5.6 Novedades
`GET /novedades` → `{novedades: Novedad[]}`. Estados: loading / error con Reintentar / vacío ("Todo tranquilo") / lista.
- Item: título, tiempo relativo de `publicadaEn`, imagen opcional, **contenido HTML** renderizado con `react-native-render-html` (sanitizado — el backend entrega HTML).
- Al cargar OK: guardar `maxId` por alumno en AsyncStorage (clave `clic_novedades_lastSeenId_{alumnoId}`) y limpiar el badge del tab.

### 5.7 Editar perfil
- **Editor de foto de perfil** arriba del form: avatar + botón "Subir foto"/"Cambiar foto" ("Subiendo…" durante el upload) + "Quitar foto" si hay. Mismo hook compartido que en Perfil (§5.5).
- Form: email (read-only), nombre*, apellido*, teléfono, DNI, dirección, fecha de nacimiento (date picker nativo), sexo (pills MASCULINO/FEMENINO/OTRO). Vacíos se envían como `null`. `PUT /perfil` → refrescar perfil → toast → volver.

### 5.8 Consentimiento informado (gate, pantalla de firma)
`GET /consentimiento/texto`. Si `requerido: false` → setear el flag de sesión `consentimientoNoRequerido` en el store (fuera de `perfil`, §4) y entrar a la app.
- Datos personales read-only + **2 contactos de emergencia** (nombre/teléfono/vínculo/tel. alternativo) + **antecedentes de salud** (12 flags como pills: cardíacas, óseas, tiroides, respiratorias, cirugías, musculares, hipertensión, intolerancia al calor, embarazo + semanas, diabetes, mareos, otra + detalle) + texto legal (HTML) + **canvas de firma** (`react-native-signature-canvas`, exporta PNG base64 data URL — mismo formato que la web) + checkbox de aceptación.
- Validaciones: firma no vacía, nombre + teléfono del contacto 1 obligatorios, checkbox tildado.
- `POST /consentimiento` `{firma, version, consentimientoId, emergencia, salud}` → refrescar perfil → entrar a la app (o al gate de menores si aplica).

### 5.9 Consentimiento firmado (consulta desde Perfil)
`GET /consentimiento/firmado` → estados: no requerido / pendiente (botón "Firmar ahora") / firmado (versión, fecha, imagen de la firma).

### 5.10 Políticas
`GET /politicas/texto` (**sin auth**) → título, versión, texto HTML.

### 5.11 Autorización de menores — estado (dentro de Perfil)
`GET /autorizacion-menores/firmado` + refresco de perfil. Estados: No enviada / En revisión (PENDIENTE) / Aprobada / Rechazada (+motivo). Muestra datos del tutor, fecha, link al documento. Botón "Completar / Volver a enviar" solo si estado `null` o `RECHAZADA`.
- ⚠️ **Cambio de regla (commit `9c9c491`)**: la autorización ahora **sí bloquea el uso de la app** — es un gate obligatorio que corre después del consentimiento (§3). Esta pantalla de estado sigue existiendo dentro de Perfil para consulta y reenvío cuando la autorización ya está al día.

### 5.12 Autorización de menores — formulario (doble modo)
El mismo formulario se usa en **dos modos** (en la web: `/autorizacion-menores` standalone vs `/perfil/autorizacion-menores/enviar` dentro del layout):
- **Modo gate**: pantalla standalone sin tabs ni botón volver, tag "Antes de empezar". Copy: "Tu sede lo pide para poder usar la app: al enviarlo queda en revisión del estudio y ya podés seguir."
- **Modo reenvío** (desde Perfil): con navegación normal de vuelta a la pantalla de estado.

Comportamiento:
- Carga `getAutorizacionMenoresTexto()` (sin auth) + `getAutorizacionMenoresFirmado()` fresco. **Guard interno**: si no requerido o estado PENDIENTE/APROBADA → `await fetchPerfil()` (sincronizar el store ANTES de navegar, si no el gate rebota — loop) y redirigir a la pantalla de estado.
- Form: texto legal, tutor (nombre, apellido, DNI, contacto), pills de relación (MADRE/PADRE/TUTOR), **foto del DNI** con cámara o galería (`expo-image-picker`) comprimida a JPEG data URI (`expo-image-manipulator`, máx 1600 px, calidad ~0.82 — replica `lib/image.ts`), checkbox.
- `POST /autorizacion-menores` `{firma: 'Acepto...', documento, version, tutorNombre/Apellido/Dni/Contacto/Relacion}` → **`await fetchPerfil()`** → toast "Autorización enviada. Queda en revisión por el estudio." → pantalla de estado (o directamente a la app si venía del gate: PENDIENTE no bloquea).

### 5.13 Acceso — credencial QR del molinete (nueva)
Pantalla **fullscreen sin tabs** (en la web es `/acceso` sin layout), pensada para mostrarse frente al lector del molinete. Se abre desde el botón de Home (§5.2.2).
- **Datos**: `GET /control-acceso/qr` → `{qrValue}`. La credencial es **única por alumno y no depende de la sede**.
- **Cache offline** (portar de `src/lib/accessQr.ts`): al obtenerla, guardarla junto con el `ownerId = perfil.id`; al abrir la pantalla, mostrar primero el valor cacheado si pertenece al usuario actual (nunca mostrar la credencial de otra cuenta) y refrescar de fondo. Si no hay red y no hay cache → mensaje "Conectate una vez para habilitar tu QR de acceso." Se borra en logout. En móvil: guardar en **`expo-secure-store`** (es una credencial de acceso físico).
- **UI**: QR grande (en la web: SVG 260 px, error correction level M — en RN usar `react-native-qrcode-svg`), nombre y apellido del alumno debajo, hint "Acercá este código al lector", botón ✕ para volver a Home. Estados: cargando ("Generando tu credencial…") / ok / sin conexión.
- **Pantalla siempre encendida**: la web usa Screen Wake Lock re-adquirido al volver a foco; en móvil usar **`expo-keep-awake`** mientras la pantalla está montada (y opcionalmente subir el brillo al máximo con `expo-brightness` — mejora natural en nativo, no existe en web).

---

## 6. API existente (contrato completo)

Base: `https://app.clicpilates.com/api/v1` (configurable vía `app.config.ts` / EAS env). Auth: `Authorization: Bearer {token}` salvo donde se indica.

| Método | Path | Payload / Query | Respuesta | Auth |
|---|---|---|---|---|
| POST | `/auth` | `{email, password}` | `{token, user}` | no |
| PUT | `/auth/password` | `{passwordActual, passwordNueva}` | void | sí |
| GET | `/perfil` | — | `Perfil` | sí |
| PUT | `/perfil` | `{nombre, apellido, telefono, dni, sexo, direccion, fechaNacimiento}` | `{message}` | sí |
| PUT | `/perfil/foto` | `{foto: dataURI}` (png/jpg/webp, máx 10 MB) | `{message, fotoUrl}` | sí |
| DELETE | `/perfil/foto` | — | `{message}` | sí |
| GET | `/control-acceso/qr` | — | `{qrValue}` (credencial única por alumno) | sí |
| GET | `/clases` | `?sedeId&salonId&desde(ISO)&dias=7` | `Clase[]` | sí |
| GET | `/turnos` | `?tipo=proximos\|historial\|cancelados` | `Turno[]` | sí |
| POST | `/reservas` | `{claseId}` | `ReservaResult` | sí |
| DELETE | `/reservas` | `?reservaId=` | void | sí |
| DELETE | `/reservas/lista-espera` | `?claseId=` | void (404 si no estaba) | sí |
| GET | `/sedes` | — | `SedeAccesible[]` | sí |
| GET | `/salones` | `?sedeId=` | `Salon[]` | sí |
| GET | `/suscripciones` | — | `Suscripcion[]` | sí |
| GET | `/consentimiento/texto` | — | `ConsentimientoTexto` | sí |
| POST | `/consentimiento` | `FirmarConsentimientoBody` | void | sí |
| GET | `/consentimiento/firmado` | — | `ConsentimientoFirmado` | sí |
| GET | `/novedades` | — | `{novedades: Novedad[]}` | sí |
| GET | `/politicas/texto` | — | `PoliticasTexto` | no |
| GET | `/autorizacion-menores/texto` | — | `AutorizacionMenoresTexto` | no |
| GET | `/autorizacion-menores/firmado` | — | `AutorizacionMenoresFirmado` | sí |
| POST | `/autorizacion-menores` | `EnviarAutorizacionMenoresBody` | `{message, estado:'PENDIENTE'}` | sí |

**Cliente HTTP** (portar de `src/api/client.ts`): wrapper `apiFetch<T>(path, {method, body, auth, query})`; `Content-Type: application/json` solo si hay body; 204 → undefined; parseo JSON con fallback a texto; `ApiError {message, status}`.

**Errores centralizados**: fetch lanzó (sin red) → "Sin conexión a internet" (status 0) · 401 → limpiar token + logout global + "Tu sesión expiró…" · 429 → "Demasiados intentos. Esperá unos minutos." · ≥500 → "Error del servidor. Intentá más tarde." · resto → `data.error || data.message || 'Error {status}'`.

---

## 7. Modelos de datos (portar de `src/types/index.ts`)

Copiar el archivo completo tal cual (es TypeScript puro, sin dependencias del DOM). Resumen de las interfaces:

- `AuthUser {id, email, nombre, apellido, alumnoId}` · `AuthResponse {token, user}`
- `SedeAccesible {id, nombre, direccion, ciudad, whatsappUrl, toleranciaCancelacionHoras, antelacionReservaMinutos, esHome, controlAcceso?: ControlAcceso}`
- `ControlAcceso {disponible: boolean, sedeMolineteId: number | null}` — la sede tiene molinete propio activo o figura permitida en el de una sede anfitriona; `sedeMolineteId` puede diferir del id de la sede. **Ausente en backends viejos → tratar como no disponible. No inferir de `esHome` ni del plan.**
- `Perfil`: datos personales + `fotoUrl?` (URL `/api/storage/...` o data URI; null sin foto; ausente en backends viejos) + `consentimientoRequerido?` (la sede tiene consentimiento asignado; ausente en backends viejos → tratar como requerido) + `consentimientoFirmado/Version` + `autorizacionMenoresRequerido/Firmado/Version/Estado/MotivoRechazo` + `sede {id, nombre}` + `suscripcionActiva | null` + `ultimosPagos: UltimoPago[]`
- `Suscripcion {id, plan, modalidad: HORARIO_FIJO|PACK, sedeId, accesoMultisede, estado, inicio, fin, accesos, accesosUsados, accesosExtra, cancelaciones, cancelacionesUsadas, grupos?: SuscripcionGrupo[]}`
- `SuscripcionGrupo {id, nombre, accesos, accesosUsados, accesosExtra}`
- `Clase {id, actividad, color, sede{id,nombre}, salon{id,nombre}|null, instructor, inicio, fin, cupo, reservas, disponible, yaReservada, motivoNoDisponible}`
- `MotivoNoDisponible = FUERA_DE_VENTANA | LLENO | YA_RESERVADA | SIN_ACCESOS | YA_COMENZO | null`
- `Turno {tipo: RESERVA|LISTA_ESPERA, claseId, reservaId?, estado?, posicion?, actividad, color, sede, instructor, inicio, fin, cupo}`
- `ReservaEstado = CONFIRMADA | CANCELADA_ALUMNO | CANCELADA_SEDE | AUSENTE | ASISTIO`
- `ReservaResult {enListaEspera, posicion?, yaEstaba?, reservaId?, message?}`
- `Salon {id, nombre, actividades: [{id, nombre, color}]}`
- `CredencialQr {qrValue: string}` (en `src/api/controlAcceso.ts`)
- Consentimiento: `ConsentimientoTexto` (union por `requerido`), `ConsentimientoFirmado`, `ContactoEmergencia` (×2), `DatosSalud` (12 booleans + `embarazoSemanas` + `detalle`), `FirmarConsentimientoBody`
- Autorización menores: `AutorizacionMenoresEstado (PENDIENTE|APROBADA|RECHAZADA)`, `TutorRelacion (PADRE|MADRE|TUTOR)`, textos y body
- `Novedad {id, titulo, contenido(HTML), imagenUrl, publicadaEn, vigenciaHasta}` · `PoliticasTexto {version, titulo, texto(HTML)}`
- `UltimoPago {id, fechaPago, plan, sedeId, vigenciaHasta, estado: ACREDITADO|PAGADO, monto}`

---

## 8. Tema e identidad visual (unificado CLIC)

Un único tema basado en el manual de marca CLIC 2024 (hoy en `src/brand/theme-clic.ts`):

- **Colores**: `bg #edece7` · `surface #fdfbfa` · `beige #dfd4ca` · `beigeSoft #e8e0d6` · `taupe #bcac9e` (primario) · `taupeDark #9a8a7c` · `ink #2c2f34` (cards oscuras) · `inkSoft #5a5d62` · `inkMute #9a9da2` · `line #e0d8cd` · `lineSoft #ebe5db` · acentos funcionales: `sage #8a9a82 / #e6ebe2` (ok) y `terracotta #b87560 / #f0e0d8` (alerta).
- **Tipografía**: **Poppins** (UI/cuerpo) + **Italiana** (títulos, números grandes, nombres de clase) vía `@expo-google-fonts/poppins` y `@expo-google-fonts/italiana` (empaquetadas, no `<link>` dinámico).
- **Tokens centralizados** en un `theme.ts` (colores, fuentes, radios, espaciados) consumido por un ThemeProvider propio — dejar la estructura preparada para variantes futuras, pero **sin** lógica de multi-marca en v1.
- **Lenguaje visual** (del CLAUDE.md de la webapp y el CSS real): cards claras `surface` con borde `lineSoft` radius 20; cards hero oscuras `ink` radius 24 con glow radial taupe y watermark del isotipo en opacidad ~0.07; labels Poppins uppercase 9-10px letter-spacing amplio color `taupeDark`; badges por estado (ok=sage, alerta=terracotta, tuya=taupe); botones CTA taupe pill. Nunca dos isotipos compitiendo en la misma vista.
- **Assets**: copiar los PNG de `clic-webapp-clientes/src/assets/clic/` (logo blanco/negro, isotipo blanco/negro/taupe). De ahí salen también ícono de app y splash (fondo `#edece7` o `#2c2f34` con isotipo).
- Textos de marca: nombre "CLIC", título "CLIC studio pilates", bienvenida "Bienvenida", quote fallback "Tu pilates empieza acá.".

---

## 9. Estado global y reglas transversales

### 9.1 Stores (Zustand, igual que la web)
- `useAuth`: `token / user / perfil / consentimientoNoRequerido / loading` + `login / logout / fetchPerfil / bootstrap`. `consentimientoNoRequerido` es un flag de sesión no persistido (§4). Persistencia: **solo el token**, en SecureStore.
- `useSede`: `sedes / selectedSedeId / loaded` + `bootstrap / setSelectedSedeId / reset`. Persistencia: `selectedSedeId` en AsyncStorage (clave `clic.selectedSedeId`). `bootstrap()` trae `/sedes`, valida el id guardado, si no cae al `esHome` o al primero.
- `useToast`: cola con auto-hide 3500 ms (o reemplazar por una lib de toasts RN equivalente).

### 9.2 Regla de selección de suscripción por sede — usada en Home, Agenda, Cuenta y Perfil
**Extraer a un helper compartido** (en la web está repetida): dado `Suscripcion[]` y `sedeId` seleccionada → preferir la ACTIVA local de esa sede > ACTIVA con `accesoMultisede` > primera ACTIVA; para estados no activos, mismo orden como fallback para mostrar "plan inactivo".

### 9.3 Selector de sede
Presente en el header de la app (equivale a Sidebar/MobileHeader): action sheet o bottom sheet nativo si hay >1 sede accesible; texto estático si hay 1; badge "VISITANTE" cuando la sede elegida no es `esHome`. La sede seleccionada filtra clases, turnos, suscripciones y pagos en todas las pantallas, **y decide si se muestra el botón de QR de acceso** (`controlAcceso.disponible`).

### 9.4 Refresco de datos
Home y Agenda deben recargar al **enfocar la pantalla** (`useFocusEffect`) y al **volver la app a foreground** (`AppState`). Motivo de negocio: la promoción de lista de espera → reserva la hace el backend automáticamente y el cliente la refleja al refrescar.

### 9.5 Formatos
Fechas con date-fns locale `es` (portar `lib/date.ts`: `relativeFromNow`, `hoursUntil`, semana lunes-a-domingo). Moneda ARS sin decimales estilo `es-AR`. Todo el copy de la app en español rioplatense (voseo), igual que la web.

---

## 10. Reemplazos web → nativo (checklist)

| Web (archivo) | En la app móvil |
|---|---|
| `localStorage` token (`api/client.ts`) | `expo-secure-store`, clave `clic_token` |
| `localStorage` sede + novedades leídas | `@react-native-async-storage/async-storage`, mismas claves |
| `localStorage` credencial QR (`lib/accessQr.ts`, clave `clic_access_qr` + `ownerId`) | `expo-secure-store` (credencial de acceso físico), misma semántica de `ownerId` |
| `window.location.origin` para armar URLs | Base URL absoluta desde config (no existe proxy `/api`) |
| `qrcode.react` (`QRCodeSVG`) | `react-native-qrcode-svg` |
| `navigator.wakeLock` (pantalla Acceso) | `expo-keep-awake` mientras el QR está en pantalla (+ opcional `expo-brightness` al máximo) |
| `react-signature-canvas` (canvas web) | `react-native-signature-canvas` → PNG base64 (mismo contrato) |
| `lib/image.ts` (canvas + `URL.createObjectURL`) | `expo-image-picker` + `expo-image-manipulator` (máx 1600 px, JPEG ~0.82, data URI) — para foto de DNI **y** foto de perfil |
| `<input type="file" accept="image/*">` | Picker nativo cámara/galería con permisos |
| `BrandProvider` inyectando CSS vars + `<link>` fonts + `document.title` | ThemeProvider propio + `expo-font`/`@expo-google-fonts` |
| `window 'focus'` listener | `useFocusEffect` + `AppState` |
| `document mousedown` para cerrar dropdown de sede | Bottom sheet / action sheet nativo |
| `dangerouslySetInnerHTML` + DOMPurify (novedades, consentimiento, políticas, autorización) | `react-native-render-html` (el backend entrega HTML; mantener criterio de sanitización) |
| GA4 `gtag.js` | Abstracción `trackEvent()` con implementación no-op en v1 (mantener los nombres de eventos: `login`, `logout`, `reserva_clase`, `lista_espera`, `cancelar_reserva`, `salir_lista_espera`, `page_view`); SDK real (ej. Firebase Analytics) queda para después |
| Toasts con `setTimeout` | Toast/snackbar RN (propio o lib) |
| Sidebar desktop + tab bar CSS | Solo bottom tabs (5) |
| React Router + `Navigate` | Expo Router (o React Navigation): stack auth + gates + tabs |

---

## 11. Features nativas nuevas (v1)

### 11.1 Push notifications
- **Cliente**: `expo-notifications`. Pedir permiso en el momento correcto (tras el primer login, con pantalla explicativa — no en frío al abrir). Obtener **Expo Push Token** y registrarlo en el backend. Manejar tap en la notificación → deep link a la pantalla correspondiente (Agenda / Novedades / Home). Badge del ícono y del tab de Novedades. En Android: canal de notificaciones "Recordatorios" + "Novedades".
- ⚠️ Push remoto **no funciona en Expo Go** → usar **development build** (`expo-dev-client`) desde el día 1.
- **Contrato backend nuevo** (a implementar en el repo del backend; la app se construye contra esto):
  - `POST /dispositivos` (auth) body `{pushToken: string, plataforma: 'ios'|'android'}` → 201. Idempotente por `pushToken`.
  - `DELETE /dispositivos?pushToken=` (auth) → 204. Llamar en logout.
  - El backend envía vía **Expo Push API** (`https://exp.host/--/api/v2/push/send`) — evita manejar FCM/APNs directo.
  - **Eventos que disparan push** (definición funcional para el backend): recordatorio de clase (~2 h antes, alineado con la tolerancia de cancelación), promoción de lista de espera → reserva confirmada (hoy solo avisa por email), clase cancelada por la sede, nueva novedad publicada, vencimiento de plan próximo.
- Payload sugerido: `{title, body, data: {tipo: 'recordatorio'|'promocion_espera'|'cancelacion_sede'|'novedad'|'vencimiento', claseId?, novedadId?}}` — `data.tipo` decide la navegación al tocar.

### 11.2 Biometría (Face ID / huella)
- `expo-local-authentication`. Ajuste en Perfil: "Desbloquear con Face ID / huella" (on/off, detectando qué biometría hay disponible).
- **v1 = app-lock**: el token queda en SecureStore; si la opción está activa, al abrir la app (y al volver de background después de ~5 min) se pide biometría antes de mostrar contenido, con fallback a passcode del sistema y opción "Usar contraseña" (re-login manual).
- Limitación conocida: el backend no tiene refresh tokens; si el JWT expira, el 401 global lleva a re-login manual. (Sugerencia para el repo backend, no bloqueante: tokens de larga vida o refresh tokens.)
- iOS: `NSFaceIDUsageDescription` en español.

### 11.3 Calendario del teléfono
- `expo-calendar`. Botón "Agregar al calendario" en: (a) el modal de confirmación post-reserva, (b) la hero card de próxima clase en Home, (c) cada reserva confirmada.
- Evento: título "{actividad} — CLIC", inicio/fin del turno, ubicación = dirección de la sede, notas con instructor y salón. Pedir permiso de calendario recién al primer uso. Permissions strings en español (iOS `NSCalendarsUsageDescription`).

---

## 12. Build, distribución y stores

- **EAS Build + EAS Submit** con perfiles `development` (dev client), `preview` (internal/TestFlight) y `production`.
- Bundle IDs sugeridos: iOS `com.clicestudio.app` / Android `com.clicestudio.app` (confirmar con el usuario antes del primer build — no se pueden cambiar después de publicar).
- `app.config.ts`: nombre "CLIC", scheme `clic`, ícono y splash desde assets de marca, locales `es`, `userInterfaceStyle: 'light'` (el diseño es claro; no hay dark mode en v1), permisos declarados solo los usados (cámara/galería, calendario, Face ID, notificaciones).
- Versionado: `version` semántico + auto-increment de `buildNumber`/`versionCode` vía EAS.
- **Checklist stores** (requiere acción del usuario, dejar documentado): cuenta Apple Developer (USD 99/año) y Google Play Console (USD 25), **URL de política de privacidad** (obligatoria en ambas stores — la app maneja datos de salud del consentimiento y foto de perfil: revisar la declaración de datos con cuidado, en App Privacy de Apple y Data Safety de Google), screenshots, descripción en español, clasificación de contenido.

---

## 13. Qué NO hacer en v1

- No implementar multi-tema runtime (Pilates vs Fit) — tema único CLIC.
- No inventar endpoints que no estén en §6 o §11.1.
- No modo offline / caché persistente de datos (única excepción: el cache de la credencial QR de acceso, §5.13).
- No i18n (todo en español, como la web).
- No dark mode.
- No re-diseñar los flujos de negocio: la lógica de Agenda (§5.3) y los gates (§3) se portan tal cual.
