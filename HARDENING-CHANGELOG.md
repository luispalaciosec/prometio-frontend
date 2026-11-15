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
- **#4 · Sentry.** [PENDIENTE-HUMANO] Crear en sentry.io un proyecto **propio del frontend** (React), distinto del backend, y cargar su DSN en Vercel como `VITE_SENTRY_DSN`. Los demás pasos solo-humano de backend están en el documento privado.

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

**Coordinación de backend posterior:** el estado se sigue en el documento privado (ronda 2: la versión pública de este registro no lista pendientes de backend).

---

## Diferido a la pasada 2 (Fase 3 de calidad + B8) — no se tocó

- Borrar `src/lib/mock-*.ts`. Siguen ahí; el único enlace vivo es `src/lib/config-api.ts`, que reexporta `MOCK_ORGANIZACION_ID` (**B8**).
- Partir `LineaCotizacionForm.tsx` (≈890 líneas) y `DocumentoAlcanceWizard.tsx` (≈1018 líneas).
- Capa de servicios y datos, dedupe de reglas de negocio, limpieza de comentarios y tipado.
- Los 24 avisos de lint que ya existían (`exhaustive-deps`, `only-export-components`, `double-comparisons`).
- Pasar la site key de hCaptcha a una sola fuente de verdad para el SPA y el widget.
- Bundle principal de unos 2,1 MB (≈600 KB gzip): conviene dividirlo por rutas con `import()`.

---

## Ronda 2 — 2026-11-14

Rama `hardening/2026-11-14b`, creada desde `main` en `a4489a0`. Sin push ni merge. Mientras el repo sea público, esta
sección registra estado y archivos, pero no describe pendientes del backend ni de Supabase: eso está en el documento
privado (ver P2.2).

| Punto | Estado |
|---|---|
| PASO 0 — línea base | Hecho |
| P1.1 Tailwind a devDependencies | Hecho |
| P1.2 vite sin advisories | Hecho |
| P1.3 audit de producción en 0 | Hecho |
| P1.4 equivalente al PR #12 + oxlint 1.92 | Hecho (una regla desactivada con su motivo) |
| P1.5 actions v4 → v7 | Hecho |
| P1.6 triage de majors | Hecho (tabla abajo) |
| P1.7 protección de `main` | Pendiente-humano |
| P2.1 `/docs` fuera del build | Hecho |
| P2.2 docs sensibles | Hecho; la subida al repo privado es pendiente-humano |
| P2.3 advertencia del historial de git | Hecho (abajo) |
| P2.4 visibilidad del repo | Pendiente-humano |
| P3 las 7 supresiones nuevas | Hecho (7 de 7) |
| P4.1 CI | Hecho; se cierra del todo con P1.7 |
| P4.2 Dependabot | Hecho |
| P4.3 token en localStorage | Hecho (documentado) |
| P4.4 CSP con sesión iniciada | Pendiente-humano |
| T1 Vitest | Hecho |
| T2 primeros tests | Hecho (sin el opcional del motor de márgenes) |
| T3 `npm test` en el CI | Hecho |

### PASO 0 — Línea base

- HEAD `a4489a0`, `main` = `origin/main`. No había rama ni commits de esta ronda.
- Sin commitear: `.claude/` (`launch.json` y `settings.local.json`). No se tocó ni se agregó a ningún commit.
- PR abiertos: #1, #2 (actions), #4, #5, #6, #7, #8 (majors) y #12 (grupo `minor-y-parches`, con el check `checks` en
  rojo).
- CI de `main`: en rojo en todos los push desde el 23/10; falla en el audit de producción.
- `npm audit --omit=dev`: 0 C · 1 H · 0 M (`vite` 8.2.0–8.2.2).
- `npm audit` completo: 0 C · 7 H · 10 M · 3 L.

### P1 — CI en verde

**P1.1 · Hecho.** `tailwindcss` y `@tailwindcss/vite` pasan a `devDependencies`: solo los usan `vite.config.ts` y el
CSS al compilar. **Riesgo que elimina:** `vite` dejaba de ser dependencia de producción solo por ser peer de Tailwind, y
sus advisories del servidor de desarrollo tumbaban el audit bloqueante. `tw-animate-css` y `@fontsource-variable/geist`
quedan en `dependencies`: los importa `src/index.css` y la regla de esta ronda es no mover lo que importa `src/`.
Anotado para la pasada de calidad.

**P1.2 · Hecho.** `vite` 8.2.0 → 8.3.6, con el lockfile del PR #12. Hizo falta ese lockfile porque las extensiones de
Tiptap fijan su peer en la versión exacta y un `npm install` sobre el lockfile viejo daba ERESOLVE. `npm ci` termina
limpio.

**P1.3 · Hecho.**

| `npm audit` | Crítica | Alta | Media | Baja |
|---|---|---|---|---|
| Producción, antes | 0 | 1 | 0 | 0 |
| **Producción, después** | **0** | **0** | **0** | **0** |
| Completo, antes | 0 | 7 | 10 | 3 |
| Completo, después (informativo) | 0 | 1 | 7 | 4 |

Lo que queda es solo de desarrollo y no tiene arreglo sin un major:
- la alta es el `vite` 5 que trae vitepress (con su esbuild): no hay arreglo publicado;
- la CLI de `shadcn` (`@shadcn/registry`, `ts-morph`, `minimatch`, `deepmerge`): npm propone `shadcn@1.0.0`, que es un
  retroceso;
- `mermaid`/`katex`: se arregla con mermaid 12 (ver P1.6).

**P1.4 · Hecho.** Se aplicaron en esta rama las mismas subidas del #12 (21 paquetes, incluido oxlint 1.75 → 1.92).
oxlint 1.92 trae reglas del React Compiler y el lint dio 73 avisos:

| Regla | Avisos | Qué se hizo |
|---|---|---|
| `react/set-state-in-effect` | 67 | Desactivada en `.oxlintrc.json`, con el motivo escrito ahí. Marca el patrón estándar del proyecto (vaciar la lista antes de recargar, reiniciar un diálogo al abrirlo) en unos 50 archivos; corregirlo bien es reestructurar cada pantalla. Queda para la pasada de calidad |
| `react/purity` | 4 | Corregido: `new Date()` y `Date.now()` en render pasan a inicializadores de estado (`ActividadForm`, `ActividadReportar`, `PipelineBoard`, `PipelineLista`) |
| `react/refs` | 1 | Corregido: `PipelinePage` sincroniza el ref de servicios en un efecto, no en el render |
| `react/preserve-manual-memoization` | 1 | Corregido: `SugerenciasCard` memoiza sobre la lista misma |

No se agregó ninguna supresión en línea. Cuando se mergee esta rama, **el #12 queda obsoleto**: lo cierra el humano.

**P1.5 · Hecho.** `actions/checkout@v7` y `actions/setup-node@v7` en `ci.yml`; el YAML se validó con un parser.
**#1 y #2 quedan obsoletos.**

**P1.6 · Hecho.** Cada PR se probó en un worktree descartable con su propio lockfile (`npm ci`, `tsc` y `vite build`):

| PR | Qué sube | Resultado | Recomendación |
|---|---|---|---|
| #4 | react-dom + @types/react-dom → 19 | `npm ci` falla: los tipos de react-dom 19 piden @types/react 19 | Cerrar. React 19 va en su propia ronda, con react y react-dom juntos (shadcn asume React 19 en refs). `ignore` de major agregado |
| #8 | react + @types/react → 19 | `npm ci` falla: @types/react-dom 18 pide @types/react 18 | Cerrar, por lo mismo que el #4 |
| #7 | typescript 5.9 → 7.0.2 | `vite build` pasa; `tsc` falla con 1 error: `baseUrl` se eliminó (`tsconfig.app.json`) | Posponer a su propia ronda (compilador nuevo). `ignore` de major agregado |
| #6 | @types/node 24 → 26 | `tsc` y `vite build` pasan | Cerrar: los tipos deben seguir a la Node del CI (22). Ojo: hoy están en `^24`, por encima del CI; alinearlos a 22 queda para la pasada de calidad |
| #5 | mermaid 11 → 12 | `npm ci` falla: `vitepress-plugin-mermaid` pide mermaid 10 u 11 | Posponer hasta que el plugin acepte la 12. Solo afecta a los docs locales. `ignore` de major agregado |

**P1.7 · Pendiente-humano.** La rama `main` no tiene protección (404). Correr **después** de mergear esta rama y ver el
CI en verde en `main`. El check se llama como el job, `checks`:

```bash
gh api -X PUT repos/luispalaciosec/prometio-frontend/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["checks"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

Verificación: `gh api repos/luispalaciosec/prometio-frontend/branches/main/protection` responde 200 con `checks` en
`required_status_checks.contexts`. `enforce_admins: false` deja al dueño saltarse el check en una emergencia; con `true`
nadie puede pushear en rojo.

### P2 — Documentación interna expuesta

**P2.1 · Hecho.**
- `npm run build` queda en `tsc -b && vite build`.
- VitePress sale a `docs/.vitepress/dist`, ignorado por git y fuera del `dist/` que despliega Vercel.
- `vercel.json` ya no tiene los rewrites de `/docs` ni su bloque de headers. La CSP del CRM pasa a
  `/((?!formulario-demo|widget/).*)`, así que una ruta `/docs` queda bajo la CSP del CRM y cae en la SPA. Las reglas de
  `/formulario-demo` y `/widget/` no cambian.
- El CI falla si `dist/docs` existe tras el build y compila los docs como paso informativo.
- README, `docs/README.md`, `12-setup` y `13-despliegue` se actualizaron.

**Riesgo que elimina:** el sitio de documentación, con su mapa del sistema, se servía sin autenticación junto al CRM.
**Verificación:** `npm run build` → `dist/` sin `docs/` (`test ! -e dist/docs`); `npm run docs:build` → sitio en
`docs/.vitepress/dist`, sin enlaces rotos. El comportamiento de las rutas de Vercel no se puede probar en local: se
confirma con el próximo preview o deploy (`/docs/...` tiene que mostrar la app, no el sitio).

**P2.2 · Hecho; la subida al repo privado es pendiente-humano.**
- Las copias completas de `docs/14-seguridad.md` y de este changelog se guardaron **primero**, idénticas (`cmp`), en
  `../prometio-docs-privados/` (fuera de cualquier repo, sin commitear): `14-seguridad.completo.md` y
  `HARDENING-CHANGELOG.completo.md`.
- `docs/14-seguridad.md` queda reducido a principios y controles implementados, sin la lista de pendientes.
- `14-seguridad.md` y `endurecimiento.md` salen del sidebar y entran en `srcExclude`.
- Se quitaron los nombres de secretos del backend, los pendientes y los endpoints que solo usan procesos del backend
  (tareas programadas y webhooks entrantes) de `11-integraciones`, `12-setup`, `13-despliegue`, `16`, `17`, `18`,
  `operacion` y `05-contratos-facturacion`. Ahora apuntan a `prometio-backend/.env.example`. Las variables `VITE_*` y
  cómo levantar en local se quedan.
- En este changelog, la ronda 1 conserva su contenido, salvo dos menciones a pendientes de backend que pasan al
  documento privado.

**P2.3 · Advertencia del historial de git.** Borrar o editar archivos **no los quita del historial**. Mientras el repo
sea público, cualquiera puede leer las versiones anteriores de `docs/14-seguridad.md` y de este changelog en commits
viejos (incluido `d0eb239`). La rama `hardening/2026-10-13` no está en el remoto (verificado el 14/11), pero
sus commits llegaron a `main`. Las opciones reales son:
(a) hacer privado el repo, o (b) reescribir el historial con `git filter-repo` y forzar el push, que es destructivo y no
se hizo en esta sesión. Lo que de verdad protege es **cerrar los pendientes** que listaban esos documentos, que son de
backend y del panel de Supabase.

**P2.4 · Pendiente-humano.** La sesión no cambia la visibilidad. Comando listo:

```bash
gh repo edit luispalaciosec/prometio-frontend --visibility private --accept-visibility-change-consequences
```

Antes, revisar:
- que Vercel siga desplegando desde un repo privado con el plan actual;
- que Dependabot y Actions sigan activos;
- que los minutos de Actions alcancen (en un repo privado consumen cuota; en uno público son gratis).

### P3 — Las 7 supresiones `exhaustive-deps` nuevas · Hecho

| # | Sitio | Por qué faltaba la dependencia | Arreglo |
|---|---|---|---|
| 1 | `ExportarDialog` | «Tomar los filtros de la pantalla solo al abrir»: leía la prop `filtrosIniciales` sin declararla | El panel se monta en cada apertura, así que `useState(filtrosIniciales)` toma la foto de ese momento y es una dependencia real que no cambia |
| 2 | `FacturasPage` | La firma de filtros (`filterSig` + un ref) reemplazaba las dependencias reales; además el efecto ponía `offset` en 0 y eso lo volvía a disparar | La página recuerda a qué filtros pertenece y el offset vigente se deriva en el render. Dependencias reales (fechas, cliente, orden, offset). **También arregla un pedido doble** al cambiar filtros desde la página 2 |
| 3 | `MarcaPage` | «Solo al montar»: usaba `aplicar`, una función recreada en cada render | `aplicar` con `useCallback([setOrganizacion])`; el efecto depende de ella |
| 4 | `AuditoriaPage` | «Solo al montar»: los filtros se aplican con «Filtrar», no al tipear | Estado propio de filtros aplicados (`consulta`), que «Filtrar» actualiza; el efecto depende de él e ignora respuestas viejas |
| 5 | `ConvertirContactoDialog` | Un efecto reiniciaba el formulario «al abrir o cambiar de conversación» | Reset por `key`: la Bandeja remonta el diálogo en cada apertura y el estado nace de la conversación. El efecto solo carga empresas |
| 6 | `DocumentoAlcanceSection` | Leía `docs` (que el propio efecto actualiza: un bucle si fuera dependencia) y el callback `onListaChange` | Refs de «último valor» sincronizadas después de cada render; además, una respuesta vieja ya no pisa el documento abierto |
| 7 | `MedicionTab` | Firma de filtros + ref + `setOffset` dentro del efecto | «Aplicar» pone los filtros y el offset en 0 en el mismo evento; el efecto depende de los filtros aplicados y del offset |

`grep -rn "eslint-disable" src` muestra solo las 4 previas: `DocumentoAlcanceWizard.tsx` (2), `DocumentoAlcanceSection.tsx`
(la de la carga de la lista) y `FacturasPage.tsx` (la del resumen). Siguen para la pasada de calidad.

**Verificación:**
- **Tests:** Auditoría y Facturas tienen tests. El de Facturas falla con el código anterior (4 pedidos) y pasa con el
  arreglo (3).
- **Navegador, con respuestas simuladas:**
  - Exportar pide las opciones y la vista previa una vez cada una, con el filtro precargado.
  - Medición pide los eventos una vez al montar.
  - Convertir a contacto pide las empresas una vez por apertura y vuelve limpio al reabrir.
- **Sin probar en pantalla:** Marca y Documento de alcance necesitan sesión y datos reales; quedan cubiertos por tipos y
  lint.

### P4 — Los ⚠️ que quedan

**P4.1 · Hecho.** `ci.yml` corre lint, tsc, **tests**, build, el chequeo de `dist/docs`, los docs (informativo), el
audit de producción (bloqueante) y el completo (informativo). Se cierra del todo con P1.7.

**P4.2 · Hecho.** `dependabot.yml`:
- un solo PR para todas las GitHub Actions;
- oxlint en su propio grupo, para que una regla nueva no frene `minor-y-parches` (lo que pasó con el #12);
- `ignore` de major, con su motivo y cuándo revisarlo, para react, react-dom, @types/react, @types/react-dom,
  typescript, @types/node y mermaid. No hay ningún `ignore` general.

**P4.3 · Hecho (documentado, sin cambios).** El token de supabase-js vive en `localStorage`. Riesgo residual: un script
inyectado podría leerlo. Lo mitigan:
- la CSP del CRM con `script-src 'self'`, sin `'unsafe-inline'` ni `'unsafe-eval'` (confirmado en `vercel.json` en esta
  ronda; `'unsafe-inline'` solo existe en la regla de `/formulario-demo` y `/widget/`, y en `style-src`);
- `connect-src` restringido al backend, Supabase y Sentry;
- el cierre de sesión ante el 403 de cuenta desactivada (`src/lib/api-client.ts`).

El almacenamiento del token no se cambió.

**P4.4 · Pendiente-humano.** No hay preview de esta rama ni cuenta de prueba en la sesión, así que no se revisó con
sesión iniciada y no se inventa el resultado. Checklist, en el preview de Vercel de esta rama (DevTools → Console,
filtrar «Content-Security-Policy»):
1. Login con correo y con Google.
2. Callbacks OAuth de Basecamp y Google Calendar (Mi cuenta).
3. Ver y descargar el PDF de una cotización (`blob:`).
4. Editor del documento de alcance (Tiptap).
5. Logo de la organización en Marca y logos de empresas (`img-src`).
6. Dashboard (recharts).
7. `/tv`.
8. Que `/docs/...` muestre la app y no el sitio.

Si aparece una violación legítima: ajustar la directiva mínima en `vercel.json` (nunca `'unsafe-inline'` en
`script-src` ni comodines amplios) y registrar el antes y el después.

### Tests

**T1 · Hecho.**
- Vitest 5 (es el que soporta Vite 8; la 3 pedía Vite ≤ 7), jsdom y Testing Library.
- `vitest.config.ts` propio, sin Tailwind ni el proxy, y `src/test/setup.ts` con el `cleanup` entre tests.
- Script `"test": "vitest run"`.
- lint y `tsc -b` siguen pasando con los tests.

**T2 · Hecho.** 3 archivos, 9 tests:
- `src/lib/url-https.test.ts` (`esUrlHttps`): acepta https con host; rechaza http, `javascript:`, `data:`, `ftp:`,
  vacíos, relativas y https sin host. `https:///ruta` no está en la lista porque el parser estándar la normaliza a un
  host válido (`https://ruta/`).
- `src/pages/AuditoriaPage.test.tsx`: un pedido al montar; tipear no pide; «Filtrar» pide una vez y con el filtro.
- `src/pages/FacturasPage.test.tsx`: un pedido al montar; desde la página 2, cambiar el orden pide una sola vez y en la
  página 1.

El test opcional del motor de márgenes no se hizo.

**T3 · Hecho.** `npm test` en el CI.

### Verificación final, en local

`npm ci` limpio · `npm run lint` 0 · `npx tsc -b --noEmit` 0 · `npm test` 9/9 · `npm run build` ok y sin `dist/docs` ·
`npm audit --omit=dev` 0 vulnerabilidades.

### Diferido a la pasada de calidad

No se tocó:
- los mocks muertos;
- partir `LineaCotizacionForm` y `DocumentoAlcanceWizard`;
- B8 (`MOCK_ORGANIZACION_ID`);
- las reglas de negocio duplicadas del backend y los exports muertos;
- R4 (funciones largas);
- las 4 supresiones previas;
- `react/set-state-in-effect`;
- alinear `@types/node` a 22;
- `tw-animate-css` y `@fontsource-variable/geist` en `dependencies`.

### Acciones solo-humano

- **H1:** decidir la visibilidad del repo (P2.4) y subir `../prometio-docs-privados/` a un repo privado (P2.2).
- **H2:** proteger `main` con el check `checks` (P1.7), después de mergear esta rama.
- **H3:** mergear esta rama. Después:
  - cerrar los PR obsoletos #1, #2 y #12;
  - cerrar #4, #6 y #8 según el triage;
  - dejar #5 y #7 abiertos o cerrarlos, porque los `ignore` ya evitan que vuelvan.
- **H4:** revisar la CSP con sesión iniciada (P4.4).
- **H5:** crear el proyecto de Sentry del frontend y cargar `VITE_SENTRY_DSN` en Vercel.
