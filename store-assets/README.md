# Assets para las tiendas

Gráficos para la ficha de Google Play (y luego App Store). Ver textos y
cuestionarios en `docs/play-store-ficha.md`.

## Generados ✅
- **`play-icon-512.png`** (512×512) — ícono de la app para Play Store (iso de
  CLIC en blanco sobre carbón). Cumple: 32-bit PNG, 512×512.
- **`feature-graphic-1024x500.png`** (1024×500) — banner de cabecera de la ficha
  (wordmark CLIC sobre carbón).

Regenerables con `scratchpad/gen-store-assets.js` (usa `sharp` + los assets de
marca en `src/assets/clic/`).

## Faltan — las tenés que sacar del teléfono 📱
**Capturas de pantalla** (mínimo 2, hasta 8). Sacálas del APK instalado, en
vertical, resolución nativa del teléfono (ej. 1080×2400). Sugeridas:
1. Home (saludo)
2. Agenda (grilla de la semana)
3. Cuenta (plan + Pagaste/Vence)
4. Novedades
5. Credencial / QR de acceso

> Se pueden subir crudas. Si querés una ficha más vendedora, pasámelas y les
> agrego fondo de color, marco de teléfono y un título corto por pantalla.

## Para iOS (fase 2)
Mismo set de capturas pero en 6.7" (iPhone Pro Max) obligatorio; el ícono lo
maneja Expo desde `assets/images/icon.png`.
