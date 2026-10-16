# App Store — ficha y cuestionarios (listo para copiar/pegar)

Complemento de `docs/play-store-ficha.md`, que ya tiene el nombre, la descripción
larga, la categoría y el inventario de datos. Acá está **sólo lo que Apple pide y
Google no**. Paso a paso de la publicación en `docs/publicar-stores.md` §4.

---

## Textos propios de App Store

**Nombre:** `Clic Fitness` (12/30) — "CLIC" a secas ya estaba registrado por otro
desarrollador en el App Store. El nombre es único global y no hay forma de
reclamarlo.

**Subtítulo** (máx. 30 caracteres — se indexa para búsqueda):
```
Reservá clases en tu estudio
```

**Keywords** (máx. 100 caracteres, separadas por coma, **sin espacios**). No repetir
palabras del nombre ni del subtítulo: Apple ya las indexa y se desperdician. Por eso
`fitness` **no** va acá — ya está en el nombre — y se reemplazó por `musculacion`:
```
pilates,gimnasio,turnos,socios,entrenamiento,agenda,credencial,wellness,hot,cuota,musculacion
```

**Descripción:** reusar la descripción completa de `play-store-ficha.md` tal cual.

**Texto promocional** (opcional, 170 caracteres, editable sin nueva versión):
```
Reservá tu clase, mirá el estado de tu plan y llevá tu credencial siempre encima.
```

**URL de soporte:** `https://www.clicpilates.com`
**URL de privacidad:** `https://www.clicpilates.com/politicas`
**Categoría:** Health & Fitness · **Precio:** Free

---

## App Privacy (nutrition labels)

Las categorías de Apple no son las de Google. Mapeo del inventario de la sección 1
de `publicar-stores.md`:

| Categoría Apple | Tipo de dato | Finalidad | Linked to user | Tracking |
|---|---|---|---|---|
| Contact Info | Name | App Functionality | Sí | No |
| Contact Info | Email Address | App Functionality | Sí | No |
| Contact Info | Phone Number | App Functionality | Sí | No |
| Contact Info | Physical Address | App Functionality | Sí | No |
| Health & Fitness | Health | App Functionality | Sí | No |
| User Content | Photos or Videos | App Functionality | Sí | No |
| Purchases | Purchase History | App Functionality | Sí | No |
| Identifiers | User ID | App Functionality | Sí | No |
| Identifiers | Device ID | Analytics | Sí | No |
| Usage Data | Product Interaction | Analytics | Sí | No |

**Respuestas clave:**
- **¿Usás los datos para rastrear (tracking)?** → **NO**. No hay publicidad ni
  compartición con data brokers, y Firebase Analytics no usa el IDFA. Por eso la
  app **no necesita el prompt de App Tracking Transparency**. Si alguna vez se
  suman ads, esto cambia y hay que agregar ATT.
- **Diagnostics / Crash Data** → **no se declara**: no hay Crashlytics.
- **DNI del socio**: no encaja en ninguna categoría de Apple (su "Sensitive Info"
  cubre origen étnico, religión, orientación sexual, biometría — no documentos de
  identidad). Declararlo en **Other Data Types** con finalidad App Functionality.
- **Contraseña**: no se declara; Apple no tiene categoría para credenciales de
  autenticación de la propia app.
- **Foto del documento del tutor**: entra en *User Content → Photos or Videos*,
  igual que la foto de perfil.

---

## App Review — notas (pegar en "Notes")

En inglés, que es lo que lee el revisor:

```
CLIC is a members-only app for CLIC studios (Pilates, Hot and Fitness) in
Argentina. It requires an account: all features are behind login, so please use
the demo credentials provided in the App Access section.

PAYMENTS: The app does NOT sell anything. It only displays the member's account
status and payment history. Classes are in-person services at our physical
studios, paid outside the app through Mercado Pago (our local payment provider).
No digital goods or content are offered, so In-App Purchase does not apply
(Guideline 3.1.3(e) — goods and services outside of the app).

MINORS: Members under 18 are registered by a parent or legal guardian, who
completes an in-app authorization flow and uploads a photo of their own ID
document. This is a legal requirement for physical training facilities in
Argentina. The app is not directed at children.

CAMERA / PHOTOS: Used only for the member's profile picture and for the
guardian's ID document in the flow described above.

ACCOUNT DELETION: Profile > Configuración > Eliminar mi cuenta. Members can also
request deletion by writing to info@clicpilates.com.
```

---

## App Access — cómo crear el usuario del revisor

La app es 100% login-gated: sin credenciales que funcionen, Apple rechaza sin
siquiera mirar la app. **No hace falta tocar la base ni leer la casilla de mail.**

**Cuenta:** `revisor@clicpilates.com` · **Sede:** una sede real con clases (para
que la agenda se vea con datos) · **Plan:** uno de modalidad `PACK`.

### Pasos (todo desde el backoffice, salvo el 3)

1. **Alumnos → Nuevo.**
   - Nombre/Apellido: `Apple Reviewer`.
   - **Fecha de nacimiento de adulto** ← es lo que evita el flujo de
     autorización de menores. La regla es
     `requiereAutorizacionMenor(fechaNacimiento, sede.autorizacionMenoresActiva)`:
     con un adulto, `autorizacionMenoresRequerido` da `false` y el gate no
     aparece.
   - DNI obligatorio (7 u 8 dígitos), y una sola sede.
   - El alta crea el `Usuario` con la clave temporal **`Clic2025`** y
     `debeCambiarClave: true`. La **app móvil ignora ese flag** (sólo lo devuelve
     la API en `/auth`), así que el revisor entra sin que nada lo fuerce a
     cambiarla.

2. **Cobrarle un plan `PACK`** en esa sede. Que **no** sea plan de prueba
   (`esPrueba: true` dispara seguimientos). Queda con `Suscripcion` en estado
   `ACTIVA` y accesos disponibles.

3. **Firmar el consentimiento** — esto no se puede hacer desde el backoffice, es
   un gate de la app (`consentimientoRequerido: !!alumno.sede?.consentimiento`).
   Entrar una vez con ese usuario **desde Android** (no hace falta el iPhone) y
   firmarlo. Aprovechar para:
   - **reservar una clase futura**, así el revisor ve la agenda con datos;
   - **cambiar la clave** por una propia en vez de la genérica `Clic2025`.

4. **Cargarlo en ASC** → *App Review Information* → *Sign-In Required*: email y
   contraseña.

⚠️ Al estar en una sede real con suscripción vigente, **cuenta como socio activo**
en los reportes de esa sede. Darlo de baja cuando la app esté aprobada.

---

## Capturas

**6.9"** (1290×2796 o 1320×2868) es el único tamaño obligatorio hoy. `supportsTablet`
está desactivado → app iPhone-only, **no hacen falta capturas de iPad**.

Mismo set y mismos títulos que Play (ver `store-assets/README.md`):
Home · Agenda · Cuenta · Novedades · Credencial/QR.

Las capturas de Play son 1080×1920 y **no sirven**. Sacar las crudas del iPhone
con la build de TestFlight, guardarlas en `store-assets/capturas-crudas-ios/` y
reenmarcarlas con `sharp` a la resolución de Apple.

---

## Dónde va cada cosa en App Store Connect

ASC reparte la ficha en **cuatro pantallas distintas**, y no es obvio cuál es cuál.
Entrando a la app (`Clic Fitness`, id `6806391392`), en el menú de la izquierda:

### 1. `App Information` — datos que no cambian por versión
| Campo | De dónde sale |
|---|---|
| **Name** | `Clic Fitness` |
| **Subtitle** | el subtítulo de este doc (28/30) |
| **Category** | Primary: *Health & Fitness* |
| **Age Rating** → *Edit* | cuestionario; mismo criterio que el IARC de Play |

⚠️ La **URL de privacidad NO se carga acá**, aunque internamente el dato pertenezca
al `appInfo`. La UI la pone en la pantalla **App Privacy** (ver punto 3).
| **Content Rights** | no usa contenido de terceros |

### 2. `Pricing and Availability`
- **Price:** Free · **Availability:** todos los países (o sólo Argentina, si se
  prefiere acotar).

### 3. `App Privacy` — los nutrition labels
- Es una pantalla **propia**, no está dentro de la versión. Se carga una vez y
  aplica a toda la app.
- **Privacy Policy URL** → arriba de todo, bloque *Privacy Policy* con su propio
  botón *Edit*: `https://www.clicpilates.com/politicas`. Es acá y no en
  *App Information*, que es donde uno la busca primero.
- Los labels: usar la tabla de este doc. Empieza en *Data Collection* → "Yes, we
  collect data".
- **Tracking: No** (sin ads, Firebase Analytics no usa IDFA) → la app no necesita ATT.

### 4. `iOS App → 1.0 Prepare for Submission` — lo de esta versión
| Sección | Qué cargar |
|---|---|
| **App Previews and Screenshots** | las capturas 6.9" (1290×2796) |
| **Promotional Text** | el de este doc (editable sin nueva versión) |
| **Description** | la descripción completa de `play-store-ficha.md` |
| **Keywords** | las de este doc (93/100) |
| **Support URL** | `https://www.clicpilates.com` |
| **Build** | botón **+** → elegir el **build 8** |
| **App Review Information** | ✔ *Sign-in required* → email y clave del revisor, más las **Notes** en inglés de este doc |
| **Version Release** | *Manually release* conviene: la app sale cuando vos querés, no apenas la aprueban |

### 5. Enviar
Botón **Add for Review** / **Submit for Review**, arriba a la derecha de la
pantalla de la versión. Si algo obligatorio falta, ASC lo marca en rojo ahí mismo.

**Orden sugerido:** 1 → 2 → 3 primero (son de la app y quedan hechas para
siempre), y la 4 al final, cuando estén las capturas.
