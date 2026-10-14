# Hardening frontend — 2026-10-13

Rama `hardening/2026-10-13`, creada desde `main` (que ya incluía `e120f43`, todavía sin push en ese momento). Sin push ni merge.
Alcance: seguridad + repo del frontend (#18, #19 y #20 en su parte frontend, y la Fase 4 de ops). No se tocó nada del backend ni de la Fase 3 de calidad.

| Ítem | Estado |
|---|---|
| Coordinación #1 — escrituras directas a Supabase | **Hecho** — no hay escrituras de dominio |
| Coordinación #2 — dominio de producción para CORS | **Hecho** — el backend ya lo aplicó |
| Coordinación #3 — URLs para connect-src | **Hecho** — el backend confirmó que Railway es la única URL pública del API |
| Coordinación #4 — Sentry propio del frontend | **Pendiente-humano** (DSN) |
| #18 — headers de seguridad + script inline | **Hecho** (falta validar en el deploy) |
| #20 — dependencias | **Hecho**, con pendientes en dependencias de desarrollo |
| #19 — https en URLs | **Hecho** |
| Fase 4 — `.env.example`, CI, Dependabot, Sentry | **Hecho** (falta el DSN) |
| Respuestas nuevas del backend (429, 409, 503, 403, SVG) | **Hecho** |

---

## Coordinación #1 — ¿El frontend escribe tablas de dominio con Supabase? **NO.**

**Resultado: luz verde para el lockdown de RLS (A2).** El frontend no hace ningún `INSERT`, `UPDATE`, `UPSERT` ni `DELETE` con el cliente de Supabase.

**Cómo se revisó.** Busqué en todo `src/` con grep: `createClient`, `@supabase/supabase-js`, `supabase.`, `.from(`, `.insert(`, `.update(`, `.upsert(`, `.delete(`, `.rpc(`, `.storage`, `.channel(`. Después revisé cada archivo que menciona `supabase`:

| Archivo | Uso |
|---|---|
| `src/lib/supabase.ts` | `createClient` (auth con PKCE) |
| `src/lib/perfil-api.ts` | **Lectura** de `perfil`: `fetchPerfil` y `listPerfiles` hacen `.select(...)`. Es la única consulta a una tabla |
| `src/components/auth-provider.tsx` | `auth.onAuthStateChange` |
| `src/pages/LoginPage.tsx` | `auth.signInWithPassword`, `auth.signInWithOAuth` |
| `src/lib/google-oauth.ts` | `auth.signInWithOAuth` |
| `src/pages/InvitacionPage.tsx` | `auth.getSession`, `auth.onAuthStateChange`, `auth.updateUser({ password })` |
| `src/lib/auth-invite.ts` | `auth.setSession` |
| `src/pages/AuthCallbackPage.tsx` | `auth.getSession`, `auth.onAuthStateChange` |
| `src/store/auth-store.ts` | `auth.signOut` |
| `src/pages/CuentaPage.tsx` | solo `isSupabaseConfigured` |
| `src/lib/mock-*.ts` | no usan Supabase |

Las tablas de dominio (`cotizacion`, `linea_cotizacion`, `linea_cotizacion_costo`, `oportunidad`, `documento_alcance`, `contrato_recurrente`, `contrato_recurrente_linea` y la facturación) se leen y escriben **solo** a través del API backend (`apiFetch`).

**Lo que se le reporta a la sesión backend.** Puede quitar `INSERT`, `UPDATE` y `DELETE` a `authenticated` en las tablas de dominio. **No debe quitar el `SELECT` sobre `perfil`** para `authenticated`, porque `fetchPerfil` lo usa en cada login para resolver el equipo y el rol. Sin ese permiso nadie puede entrar.

## Coordinación #2, #3 y #4 — datos para la sesión backend

- **#2 · CORS.** El dominio real de producción del frontend es **`https://prometio.vercel.app`**. Es lo que va en `CORS_ALLOW_ORIGINS`. `http://localhost:5173` no debería quedar en producción; para desarrollo local, el README usa `http://127.0.0.1:5173`.
- **#3 · connect-src.**
  - **API backend:** `https://prometio-backend-production.up.railway.app`, tomada del README (es la `VITE_API_URL` de Vercel). **La sesión backend debe confirmarla** y avisar si hay otra URL pública, por ejemplo un dominio propio.
  - **Supabase:** `https://<proyecto>.supabase.co` (el de `VITE_SUPABASE_URL`), tomada del `.env`.
  - **hCaptcha:** el CRM no lo usa. Solo lo usan el widget y la página `/formulario-demo`, que tienen su propia CSP con `*.hcaptcha.com`.
- **#4 · Sentry.** [PENDIENTE-HUMANO] Crear en sentry.io un proyecto **propio del frontend** (React), distinto del backend, y cargar su DSN en Vercel como `VITE_SENTRY_DSN`. También queda para el humano, una sola vez: la configuración del signup de Supabase Auth y la rotación de secretos.

---

## #18 — Headers de seguridad y script inline · Hecho, falta validar en el deploy

**a) Script inline.** El script de tema de `index.html` se movió a `public/theme-init.js`. Se carga con `<script src>` de forma bloqueante en el `<head>`, así que no hay flash del tema claro. **Riesgo que elimina:** la CSP puede quedar en `script-src 'self'`, sin `'unsafe-inline'` ni hashes que recalcular. El build (`dist/index.html`) quedó sin ningún script inline.

**b) Bloque `headers` en `vercel.json`.** Tiene tres reglas:

1. **CRM (todo menos `/formulario-demo` y `/widget/`).** Su `Content-Security-Policy`:
   - `default-src 'self'`
   - `script-src 'self'`
   - `style-src 'self' 'unsafe-inline'`. Hace falta porque Tiptap/ProseMirror y Sonner inyectan `<style>` mientras la app corre y escriben atributos `style`. No aplica a scripts.
   - `img-src 'self' data: blob: https:`. Los logos de organización y empresa vienen de dominios variables: el bucket y el enriquecimiento.
   - `font-src 'self' data:`. Geist viene en el bundle.
   - `connect-src 'self'` + API backend + Supabase + ingest de Sentry (`*.ingest.sentry.io`, `*.ingest.us.sentry.io`, `*.ingest.de.sentry.io`).
   - `frame-src 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` y `upgrade-insecure-requests`.
2. **`/formulario-demo` y `/widget/`.** Una CSP aparte, porque la demo tiene script y estilos inline, carga el widget desde `https://prometio.vercel.app`, hCaptcha (`hcaptcha.com`, `*.hcaptcha.com` en script, frame, style y connect) y Google Fonts. También lleva `frame-ancestors 'none'`.
3. **Todas las rutas.**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (respaldo para navegadores viejos)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy`: apaga camera, microphone, geolocation, payment, usb, serial, bluetooth, magnetometer, gyroscope, accelerometer y browsing-topics. El clipboard **no** se tocó porque la app lo usa.
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains`

**Riesgos que elimina:** clickjacking, scripts inyectados desde orígenes ajenos, exfiltración vía `fetch` a hosts no listados, MIME sniffing, filtrado del Referer y APIs del navegador que la app no usa.

**Cómo se verificó.** Serví el build de producción (`dist/`) con un servidor local que aplica las reglas de `vercel.json` tal cual, y lo abrí en el navegador:
- `/login` carga sin violaciones de CSP en la consola.
- Desde la página: Supabase pasa la CSP (responde 401 del propio servidor), el API de Railway pasa la CSP (lo frena el **CORS**, porque el origen de prueba era `127.0.0.1:4173`; es lo esperado) y `https://example.com` queda **bloqueado** por `connect-src`.
- El tema oscuro sigue aplicándose antes del render con `theme-init.js`.
- `/formulario-demo` carga el widget, el formulario con la marca y el captcha de hCaptcha. La primera versión bloqueaba el widget, porque la demo lo pide con la URL absoluta de producción; se corrigió en `94732d8`.

**[PENDIENTE — validar en el deploy]** No se probó con sesión iniciada, porque no hay credenciales de prueba en esta sesión. Después del primer deploy hay que revisar la consola en busca de violaciones de CSP en estos flujos:
1. Login con email y con Google.
2. Callback de Basecamp y de Google Calendar en Mi cuenta.
3. Dashboard, pipeline y constructor de cotizaciones.
4. Abrir y descargar el PDF de una cotización (`blob:`).
5. Editor de Documento de Alcance (Tiptap).
6. Logo de la organización en Marca y logos de empresas.
7. `/formulario-demo`, enviando el formulario.
8. `/tv`.

**Archivos:** `index.html`, `public/theme-init.js`, `vercel.json`.

---

## #20 — Dependencias · Hecho, con pendientes en dependencias de desarrollo

| Cambio | Detalle |
|---|---|
| Quitadas `@dnd-kit/sortable`, `@tanstack/react-table`, `next-themes` | Con grep en `src/` confirmé que ninguna se importa en ningún lado |
| `shadcn` → `devDependencies` (`^4.21.4`) | **No estaba sin uso:** `src/index.css` hace `@import "shadcn/tailwind.css"`, pero eso se resuelve al compilar. Vercel instala las devDependencies para hacer el build, así que no afecta el deploy |
| `react-router-dom` 6.30.4 → **7.18.4** | Las dos advertencias (open redirect con barra invertida en `<Link>` y `useNavigate`, GHSA-wrjc-x8rr-h8h6, y GHSA-337j-9hxr-rhxg) cubren `>=6.0.0 <7.18.0`. **No existe un 6.x corregido**, así que hizo falta el salto de versión mayor. La app solo usa APIs estables (`BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, `Navigate`, `Outlet`, `useNavigate`, `useParams`, `useSearchParams`, `useLocation`, `useOutletContext`), que no cambian en la v7. Compila y tipa sin cambios de código |
| `npm audit fix` | Arregló las transitivas sin romper nada |

**`npm audit`:**

| | critical | high | moderate | total |
|---|---|---|---|---|
| Antes (todas) | 1 | 12 | 6 | 19 |
| Después (todas) | 0 | 7 | 0 | 7 |
| **Después, solo producción (`--omit=dev`)** | **0** | **0** | **0** | **0** |

**[PENDIENTE]** Las 7 «high» que quedan son **solo de desarrollo**, de la CLI `shadcn` (`@shadcn/registry`, `ts-morph`, `@ts-morph/common`, `fast-glob`, `micromatch`, `braces`). No llegan al bundle ni al navegador. La «solución» que propone npm es `shadcn@1.0.0`, que en realidad es un retroceso y rompe el CLI. Hay que esperar a que salga un `shadcn` 4.x que las corrija; Dependabot lo va a proponer.

**Cómo se verificó:** `npm install` limpio, `npx tsc -b --noEmit` sin errores, `npm run lint` con 0 errores (24 avisos, todos de antes), `npm run build` ok, `npm ci --dry-run` ok (el lockfile está en sync) y la prueba en el navegador de #18.

**Archivos:** `package.json`, `package-lock.json`.

---

## #19 — https obligatorio en las URLs · Hecho

- Nuevo `src/lib/url-https.ts`. `esUrlHttps()` acepta solo `https:` con un host, y rechaza `http:`, `javascript:`, `data:`, `ftp:` y cualquier texto que no sea una URL absoluta. El mensaje de error es el mismo para todas las validaciones.
- `src/components/formulario-web/WebhooksTab.tsx`: la URL de destino del webhook exige https. Si no lo es, sale un toast de error y no se guarda. El input queda marcado con `aria-invalid` y tiene la ayuda «Solo https://».
- `src/components/formulario-web/AparienciaTab.tsx` (esa es la ruta real): la URL de redirección después del envío exige https si se completa. Sigue siendo opcional.
- **Riesgo que elimina:** que el payload de los webhooks o la navegación del visitante viajen en texto plano, y que se use un esquema peligroso.
- **Coordinación:** el backend debe aplicar el mismo criterio (solo https) al validar `organizacion_webhook.url` y `formulario_redirect_url`. La UI no es la única barrera.

**Cómo se verificó:** tsc, lint y revisión del flujo de guardado (la validación corre antes del PATCH/POST, igual que la de http/https que había). La UI no se probó con sesión.

---

## Fase 4 — Ops · Hecho, falta el DSN

- **`.env.example`:** agregué `VITE_SENTRY_DSN` y `VITE_SENTRY_ENVIRONMENT` con valores vacíos. Ya tenía `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`, `VITE_BASECAMP_CLIENT_ID`, `DEV_API_PROXY_TARGET` y `DEV_SERVER_HOST`/`DEV_SERVER_PORT`. Todos los nombres del `.env` real están en el ejemplo.
  - **La site key de hCaptcha no se pasó a una variable de entorno.** Es pública y está fija en dos lugares que tienen que coincidir: `src/lib/formulario-web-urls.ts` y `public/widget/prometio-form.js`. Este último lo sirve tal cual `public/` y no puede leer variables de Vite. Moverla rompería esa sincronía; está anotado para la pasada 2.
- **CI** (`.github/workflows/ci.yml`), en cada push a `main` y en cada PR, con Node 22:
  - Corre `npm ci`, `npm run lint`, `npx tsc -b --noEmit` y `npm run build`.
  - `npm audit --omit=dev --audit-level=high` **bloquea**: falla con cualquier vulnerabilidad high o critical en lo que llega al navegador.
  - Una auditoría completa informativa que no bloquea, por los pendientes de `shadcn`.
  - Todavía no hay tests; cuando existan, se agrega `npm test`.
- **Dependabot** (`.github/dependabot.yml`): revisa npm y github-actions cada lunes. Junta los menores y parches en un solo PR; los major van por separado.
- **Sentry** (`@sentry/react` 11.7.0):
  - `src/lib/sentry.ts` arranca **solo si existe `VITE_SENTRY_DSN`**, así que en desarrollo local sin DSN no hace nada. `tracesSampleRate: 0`.
  - `sentryUsuario()` asocia los errores solo al **id** de perfil, nunca al email ni al nombre. Se llama al cargar el perfil y al cerrar sesión (`src/store/auth-store.ts`).
  - `src/main.tsx` envuelve la app en `Sentry.ErrorBoundary` con `src/components/error-fallback.tsx`. Si un error de render tumba la app, aparece una pantalla con «Recargar» en vez de quedar en blanco. Esto funciona aunque no haya DSN.
  - `src/vite-env.d.ts` tipa las variables nuevas, y la CSP permite el ingest de Sentry.
  - [PENDIENTE-HUMANO] Crear el proyecto de Sentry del frontend y cargar `VITE_SENTRY_DSN` (y si se quiere `VITE_SENTRY_ENVIRONMENT=production`) en Vercel.
- **[PENDIENTE-HUMANO]** El CI se activa cuando se haga push de la rama o del merge; no se pudo ver correr desde aquí. Conviene marcarlo como check obligatorio en la protección de `main`.

**Cómo se verificó:** `tsc`, `lint` y `build` ok. `npm audit --omit=dev --audit-level=high` sale con 0, que es el mismo paso que corre el CI.

---

## Respuesta de la sesión backend y ajustes del frontend · Hecho

**Lo que confirmó el backend (rama `hardening/2026-10-13` del backend):**
- **A2:** el REVOKE de `INSERT`/`UPDATE`/`DELETE` a `authenticated`/`anon` ya corre en producción sobre `cotizacion`, `linea_cotizacion`, `linea_cotizacion_costo`, `oportunidad`, `documento_alcance`, `contrato_recurrente`, `contrato_recurrente_linea`, `cuenta_contrato` y `lead_linkedin`. El `SELECT` sobre `perfil` no se tocó.
- **CORS:** en producción solo acepta `https://prometio.vercel.app`; en desarrollo agregó `http://127.0.0.1:5173`.
- **CSP:** Railway es la única URL pública del API, así que `connect-src` no cambia.
- **https:** `organizacion_webhook.url` y `formulario_redirect_url` devuelven 422 si no son https. Es el mismo criterio que usa el frontend.

**Cómo se adaptó el frontend** (`45e79b1`):

| Respuesta del backend | Qué hace el frontend | Archivos |
|---|---|---|
| **429** con `Retry-After` (POST /formulario, verificar, pdf-cliente, SEO, IA) | `apiFetch` y `apiFetchBlob` muestran «Hiciste muchas solicitudes seguidas. Probá de nuevo en N s.» (o «esperá un momento» si no viene el header). `ApiError.detail` **conserva el texto original del backend**, porque el cooldown de Prospección LinkedIn lo parsea. Además `ApiError` expone `retryAfter` | `src/lib/api-client.ts` |
| **409** en transiciones de cotización y documento de alcance | Nuevo helper `esConflicto()`. Muestra el `detail` y **recarga el registro**: constructor de cotización (transiciones y marcar facturada), detalle de contrato (marcar facturado un mes), sección de documento de alcance (enviar, aprobar, rechazar, nueva versión, reabrir) y wizard de documento (enviar a aprobación) | `CotizacionConstructor.tsx`, `ContratoPage.tsx`, `DocumentoAlcanceSection.tsx`, `DocumentoAlcanceWizard.tsx` |
| **403 «Tu cuenta está desactivada»** en cualquier endpoint | `apiFetch` lo detecta, muestra el mensaje (un solo toast, con id fijo, aunque fallen varias peticiones a la vez) y **cierra la sesión**, que lleva al login | `src/lib/api-client.ts` |
| **503** en POST /formulario (hCaptcha no responde) y 429 | El widget muestra un mensaje claro, **reinicia el captcha** (el token ya se gastó) y vuelve a habilitar «Enviar». Ante cualquier otro error de red también se reinicia el captcha, que antes quedaba con un token inválido | `public/widget/prometio-form.js` |
| **422** SVG de logo con scripts o recursos externos | El error del backend ya se mostraba. Se agregó la aclaración «sin scripts ni recursos externos» en la ayuda del logo claro | `src/pages/MarcaPage.tsx` |

**Cómo se verificó.** `tsc`, `lint` (0 errores) y `build` ok; `node --check` sobre el widget. Además cargué el `api-client` real en el servidor de desarrollo y simulé las respuestas en el navegador:
- **429 con `Retry-After: 30`:** mensaje con «30 s», `detail` intacto y `retryAfter` 30.
- **429 sin el header:** sale el mensaje genérico.
- **409:** `esConflicto` da verdadero.
- **403 de cuenta desactivada:** cierra la sesión. Probé cuatro 403 seguidos y sale **un solo** aviso.

No se probaron con sesión los flujos de 409 en pantalla, ni el widget contra un 503 real.

**[PENDIENTE-COORDINACIÓN] Bucket privado de documentos de alcance.** El backend va a pasar el bucket a privado, con URLs firmadas, y avisa antes de hacerlo. Eso cambia cómo se abre el PDF aprobado (`descargarPdfDocumentoAlcance` y los enlaces a `pdf_url`). No se tocó todavía.

---

## Diferido a la pasada 2 (Fase 3 de calidad + B8) — no se tocó

- Borrar `src/lib/mock-*.ts`. Siguen ahí; el único enlace vivo es `src/lib/config-api.ts`, que reexporta `MOCK_ORGANIZACION_ID` (**B8**).
- Partir `LineaCotizacionForm.tsx` (≈890 líneas) y `DocumentoAlcanceWizard.tsx` (≈1018 líneas).
- Capa de servicios y datos, dedupe de reglas de negocio, limpieza de comentarios y tipado.
- Los 24 avisos de lint que ya existían (`exhaustive-deps`, `only-export-components`, `double-comparisons`).
- Pasar la site key de hCaptcha a una sola fuente de verdad para el SPA y el widget.
- Bundle principal de unos 2,1 MB (≈600 KB gzip): conviene dividirlo por rutas con `import()`.
