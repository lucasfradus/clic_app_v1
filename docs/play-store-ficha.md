# Play Store — ficha y cuestionarios (listo para copiar/pegar)

Contenido para cargar en Google Play Console una vez creada la cuenta. Ver el
paso a paso general en `docs/publicar-stores.md`.

---

## Ficha de la tienda (Store listing)

**Nombre de la app:** `CLIC`

**Descripción corta** (máx. 80 caracteres):
```
Reservá tus clases, seguí tu cuenta y recibí avisos de tu estudio CLIC.
```

**Descripción completa** (máx. 4000 caracteres):
```
CLIC es la app para socios de los estudios CLIC (Pilates, Hot y Fitness). Todo lo que necesitás para tu día a día, en un solo lugar.

RESERVÁ TUS CLASES
Mirá la agenda de tu sede semana a semana y reservá en segundos. Si una clase está llena, anotate en la lista de espera y te avisamos apenas se libera un lugar.

TU CUENTA, AL DÍA
Consultá el estado de tu plan, cuándo pagaste y cuándo vence, y tu historial de pagos. Sin sorpresas.

NO TE PIERDAS NADA
Recibí notificaciones de tu sede: confirmación de lista de espera, vencimiento de tu plan, cambios de clase y novedades. Elegí qué avisos querés recibir desde la configuración.

TU CREDENCIAL, SIEMPRE A MANO
Accedé con tu credencial digital desde la app.

MULTISEDE
¿Entrenás en más de una sede CLIC? Cambiá de sede desde la app y elegí tu sede por defecto.

CLIC es para vos si sos socio de alguno de nuestros estudios. Descargala, iniciá sesión con tu cuenta y hacé el clic.
```

**Categoría:** Salud y bienestar (Health & Fitness)
**Email de contacto:** `info@clicpilates.com`
**Política de privacidad:** `https://www.clicpilates.com/politicas`

**Assets gráficos** (los tenés que generar/exportar):
- Ícono 512×512 PNG (reusar el iso de CLIC sobre fondo carbón).
- Feature graphic 1024×500.
- 2 a 8 capturas de teléfono. Sugeridas: Home (saludo), Agenda (grilla), Cuenta (plan + pagos), Novedades, Credencial/QR.

---

## Data safety (formulario)

Base: la app recolecta datos para operar el servicio; **no vende datos**; todo va
**cifrado en tránsito** (HTTPS); el usuario **puede pedir el borrado** (Perfil →
Configuración → Eliminar mi cuenta, o email a `info@clicpilates.com`).

Marcá **"Sí, se recolectan/comparten"** y para cada tipo la finalidad
"Funcionalidad de la app" (y "Analytics" donde corresponda):

| Tipo de dato | Recolecta | Comparte | Notas |
|---|---|---|---|
| Nombre | Sí | No | Cuenta |
| Email | Sí | No | Cuenta / login |
| Teléfono | Sí | No | Contacto (opcional) |
| Dirección | Sí | No | Perfil (opcional) |
| ID de usuario | Sí | No | Cuenta |
| Otros IDs (documento/DNI) | Sí | No | Identificación (opcional) |
| Fotos | Sí | No | Foto de perfil / documento del tutor |
| Info financiera: historial de compras | Sí | No | Se muestra; el pago lo procesa Mercado Pago (la app NO capta tarjetas) |
| ID de dispositivo o de otro tipo | Sí | Sí (Google) | Push (FCM) + Analytics |
| Actividad en la app (interacciones, pantallas) | Sí | Sí (Google) | Firebase Analytics |
| Info de salud | Sí | No | Antecedentes de salud del socio (opcional) — **dato sensible** |

Respuestas clave del formulario:
- **¿Se cifran los datos en tránsito?** Sí.
- **¿Los usuarios pueden pedir que se eliminen sus datos?** Sí.
- **¿Recopila datos de salud?** Sí (antecedentes que el socio carga).

> Nota: el dato de **salud** conviene declararlo. Es opcional para el socio y se
> usa solo para la operación del estudio; se elimina al dar de baja la cuenta.

---

## Data deletion (App content → Data deletion)

- **Método en la app:** Perfil → Configuración → Eliminar mi cuenta.
- **Método sin la app (URL/instrucción):** el usuario escribe a
  `info@clicpilates.com` y el equipo procesa la baja
  (`scripts/anonimizar-cuenta.ts`).
- **Qué se borra:** todos los datos personales y de salud; se conserva solo el
  historial de pagos de-identificado por obligación legal (facturación).

---

## App access (usuario demo para el revisor)

La app requiere login. Cargar en Play Console un usuario de prueba con datos
reales de demo:
- Email: `[revisor@clicpilates.com o similar]`
- Contraseña: `[definir]`
- Que tenga: sede asignada, plan activo y alguna reserva, para que el revisor
  vea la app funcionando.

---

## Content rating (cuestionario IARC)

App sin violencia, contenido sexual, lenguaje fuerte, apuestas ni drogas. Compra
de servicios físicos (clases) fuera de la app. Resultado esperado: apto para
todo público / clasificación baja.

---

## Ads

Hoy la app **no** muestra publicidad → declarar **"No, no contiene anuncios"**.
(Si a futuro se suman ads, actualizar esto y revisar consentimiento/privacidad.)
