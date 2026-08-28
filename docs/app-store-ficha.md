# App Store — ficha y cuestionarios (listo para copiar/pegar)

Complemento de `docs/play-store-ficha.md`, que ya tiene el nombre, la descripción
larga, la categoría y el inventario de datos. Acá está **sólo lo que Apple pide y
Google no**. Paso a paso de la publicación en `docs/publicar-stores.md` §4.

---

## Textos propios de App Store

**Nombre:** `CLIC` (máx. 30)

**Subtítulo** (máx. 30 caracteres — se indexa para búsqueda):
```
Reservá clases en tu estudio
```

**Keywords** (máx. 100 caracteres, separadas por coma, **sin espacios**). No repetir
palabras del nombre ni del subtítulo: Apple ya las indexa y se desperdician:
```
pilates,gimnasio,fitness,turnos,socios,entrenamiento,agenda,credencial,wellness,hot,studio,cuota
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

**App Access (usuario demo):** el mismo que se cargó en Google Play. Tiene que
tener sede asignada, plan activo y alguna reserva visible para que el revisor vea
la app con datos.

---

## Capturas

**6.9"** (1290×2796 o 1320×2868) es el único tamaño obligatorio hoy. `supportsTablet`
está desactivado → app iPhone-only, **no hacen falta capturas de iPad**.

Mismo set y mismos títulos que Play (ver `store-assets/README.md`):
Home · Agenda · Cuenta · Novedades · Credencial/QR.

Las capturas de Play son 1080×1920 y **no sirven**. Sacar las crudas del iPhone
con la build de TestFlight, guardarlas en `store-assets/capturas-crudas-ios/` y
reenmarcarlas con `sharp` a la resolución de Apple.
