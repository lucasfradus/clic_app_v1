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

## Capturas ✅
Enmarcadas y listas para subir en **`capturas/`** (1080×1920, fondo carbón +
título + captura flotante con sombra):
1. `1-home.png` — "Tu estudio, en tu bolsillo"
2. `2-agenda.png` — "Reservá en segundos"
3. `3-cuenta.png` — "Tu plan, siempre al día"
4. `4-novedades.png` — "No te pierdas nada"
5. `5-perfil.png` — "Tu credencial, a mano"

Crudas (del teléfono, 720×1560) en `capturas-crudas/`. Regenerables con
`scratchpad/frame-screens.js` (cambiando los títulos si hace falta).

## Para iOS (fase 2)
Mismo set de capturas pero en 6.7" (iPhone Pro Max) obligatorio; el ícono lo
maneja Expo desde `assets/images/icon.png`.
