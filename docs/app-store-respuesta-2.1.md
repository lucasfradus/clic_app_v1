# Respuesta al rechazo — Guideline 2.1 "Information Needed" (1-sep-2026)

Apple no encontró nada malo en la app: es el pedido estándar para cuentas de
desarrollador sin historial de revisiones (*"submitted by a developer account that
has a limited App Review history"*). Piden 6 cosas, hay que **responder en el
Resolution Center** y además **pegar la info en el campo Notes** de App Review
Information (esto último ya está cargado por API).

---

## 1. Screen recording — lo único que requiere el iPhone

Grabar con la grabadora de pantalla de iOS (Centro de Control), en el teléfono
físico, con la app instalada desde TestFlight. **Tiene que empezar con el lanzamiento
de la app**, no con la app ya abierta.

Guion, en orden:

1. Pantalla de inicio del iPhone → tocar el ícono de **Clic Fitness** (que se vea
   el splash y el arranque).
2. **Login** con las credenciales demo.
3. **Home**: saludo, próxima clase, resumen del plan.
4. **Agenda**: moverse de día, **reservar** una clase (que se vea la confirmación)
   y después **cancelarla**.
5. **Cuenta**: plan, fechas de pago y vencimiento, historial.
6. **News**: novedades de la sede.
7. **Perfil**: credencial QR y foto de perfil.
8. **Perfil → Configuración → Notificaciones**.
9. **Borrado de cuenta**: Perfil → Configuración → Cuenta → **Eliminar mi cuenta**
   → confirmar contraseña → se cierra la sesión. Apple lo pide explícitamente
   ("Account deletion is required in apps that support account creation").

⚠️ **No grabar el borrado con `revisor@clicpilates.com`**: la cuenta se anonimiza y
se pierden las credenciales que Apple tiene declaradas. Crear una **segunda cuenta
descartable** (mismo procedimiento que en `app-store-ficha.md`) y usar esa para el
paso 9.

Subirlo a YouTube **como "no listado"** o a Drive con link público, y pegar el link
en la respuesta. Apple acepta links; no hay que adjuntar el archivo.

---

## 2 a 6 — texto para pegar en el Resolution Center

```
Thank you for the review. Please find the requested information below.

1. SCREEN RECORDING
<PEGAR ACA EL LINK DEL VIDEO>
The recording starts by launching the app on a physical iPhone and shows the
full user flow: login, browsing the class schedule, booking and cancelling a
class, membership status and payment history, studio news, the QR membership
credential, notification settings, and the in-app account deletion flow.
The app has no user-generated content, no social features and no
user-to-user interaction, so content reporting and blocking mechanisms do not
apply.

2. PURPOSE AND TARGET AUDIENCE
Clic Fitness is the members app for CLIC, a chain of Pilates, Hot Pilates and
Fitness studios in Argentina. The target audience is our adult members (18+)
who already have a membership at one of our physical studios.
Problem it solves: until now members had to call or message the front desk to
book a class, cancel it, or check how many classes they had left. The app lets
them do all of that themselves, at any time, and shows their membership status
and payment history so there are no surprises at the studio.
This is a companion app for a physical service, aimed at our customers as
consumers. It is not an internal/employee tool and it is not restricted to a
specific company or organization.

3. HOW TO ACCESS THE MAIN FEATURES
The app requires an account: every feature is behind login and there is no
guest mode. Demo credentials are provided in the App Review Information
section (they are also repeated in the Notes field).
- Home: greeting, next booked class and a summary of the membership.
- Agenda tab: weekly class schedule. Tap a class to book it; tap a booked
  class to cancel it. Classes that are full offer a waiting list.
- Cuenta tab: membership status, amount of classes used and remaining,
  payment date and expiry date, and payment history.
- News tab: announcements published by the studio.
- Perfil tab: profile photo, QR membership credential used to enter the
  studio, health background form, emergency contacts, and Configuracion
  (notification preferences and "Eliminar mi cuenta" = account deletion).
- Password reset: "Olvidaste tu contrasena?" on the login screen sends a
  6-digit code by email.

4. EXTERNAL SERVICES USED
- Our own backend API (Next.js, hosted on Railway) at app.clicpilates.com:
  authentication (email + password, bcrypt), bookings, memberships and
  payment records. We own and operate it.
- Mercado Pago: payment processor used by our studios. IMPORTANT: payments do
  NOT happen inside the app. Memberships are paid at the studio or through
  Mercado Pago outside the app, because they are physical, in-person services
  (fitness classes at our locations). The app never collects card data; it
  only displays the member's payment history.
- Firebase Analytics (Google): anonymous usage analytics.
- Expo Push Notifications + Apple Push Notification service: to deliver
  notifications about waiting lists, cancelled classes, studio news and
  membership expiration.
- No AI services, no third-party data providers, no advertising networks and
  no tracking across apps (we do not use the IDFA).

5. REGIONAL DIFFERENCES
There are none. The app behaves identically in every region. It is available
in Spanish and serves members of our studios in Argentina. Anyone can download
it anywhere, but it requires an existing membership account with one of our
studios.

6. REGULATED INDUSTRY / THIRD-PARTY MATERIAL
The app does not operate in a regulated industry: we run physical fitness and
Pilates studios. All content in the app (class schedules, instructor names,
studio announcements, branding) is our own; there is no protected third-party
material.
The app does collect optional health background information (previous
injuries, pregnancy, cardiac or respiratory conditions) that members choose to
share so instructors can train them safely. This is the same information our
studios collect on paper at sign-up. It is declared in the App Privacy section
and covered by our privacy policy at https://www.clicpilates.com/politicas.
```

---

## Después de responder

- [ ] Pegar el link del video en el texto y responder en el Resolution Center.
- [ ] Volver a enviar la versión (**Add for Review**).
- Las Notes de App Review Information ya quedaron actualizadas con esta info
      (Apple lo pide "for reference on future submissions").
