# 14 · Seguridad

> Revisado contra el código el 13/10/2026.

Cómo se protege prometIO: quién puede entrar, quién puede hacer qué, qué impide que alguien se salte el backend y qué
sigue pendiente. La idea central es simple: **el navegador solo se autentica con Supabase; todo lo demás pasa por el
backend, que decide los permisos**. La interfaz oculta lo que un usuario no puede hacer, pero no es la barrera.

## Pendiente hoy

| Pendiente | Qué falta | Quién |
|---|---|---|
| Sentry del frontend | Crear el proyecto propio del frontend y cargar `VITE_SENTRY_DSN` en Vercel | Responsable técnico |
| Sentry del backend | Crear el proyecto del backend y cargar `SENTRY_DSN` en Railway | Responsable técnico |
| Migraciones `0091` y `0092` | Por confirmar si ya se aplicaron. Hasta entonces, la protección de columnas de `perfil` y el corte de usuarios desactivados en RLS están en el código pero no en la base | Responsable técnico |
| Bucket privado de documentos de alcance (`0094`) | Por confirmar si ya se aplicó. El backend ya sirve el PDF él mismo, así que el frontend no necesita cambios | Responsable técnico |
| Cifrado de credenciales | Cargar `SECRETS_ENCRYPTION_KEY` en Railway y correr una vez `python -m scripts.cifrar_secretos_existentes`. Sin la clave, los tokens de integraciones se guardan en claro | Responsable técnico |
| Rotación de secretos | Rotar la service role de Supabase, la clave de PageSpeed, el secreto del webhook de Resend, los secretos de webhooks salientes y los tokens de integraciones guardados | Responsable técnico |
| Registro público | Desactivar el signup público de Supabase Auth, o activar captcha | Responsable técnico |
| CSP con sesión iniciada | Revisar la consola, después del despliegue, en login, callbacks de Basecamp y Google, dashboard, pipeline, cotizaciones, PDF, editor de documento de alcance, logos, formulario web y `/tv` | Responsable técnico |
| CI obligatorio | Marcar el CI como check obligatorio en la protección de `main` | Responsable técnico |
| Dependencias de desarrollo | Quedan 7 avisos altos en la CLI de `shadcn`. No llegan al navegador; se espera una versión 4.x que los corrija | Dependabot |
| Visibilidad de perfiles | Cualquier usuario autenticado puede leer el correo y el teléfono de todos los perfiles (política `perfil_select`) | Por decidir |

## Autenticación

- **Login con Supabase Auth**, por correo y contraseña o con Google, con el flujo **PKCE** (`flowType: "pkce"` en
  `src/lib/supabase.ts`). Por qué PKCE: el código que vuelve en la URL no sirve sin el verificador que guardó el
  navegador, así que interceptarlo no alcanza para robar la sesión.
- **El backend recibe el JWT de la sesión** en `Authorization: Bearer` en cada petición (`src/lib/api-client.ts`) y lo
  verifica contra las claves públicas (JWKS, firma ES256) del proyecto. No hay un secreto JWT compartido.
- Todo usuario nuevo entra como `ventas`/`vendedor`, el rol de menor privilegio.
- Los secretos de OAuth de Basecamp y Google viven solo en el backend: el navegador recibe el código y el backend hace
  el intercambio.

## Autorización

Dos capas, y las dos tienen que estar bien:

| Capa | Qué hace |
|---|---|
| **Backend** | Cada endpoint exige el equipo o rol que necesita, con dependencias de FastAPI (`require_admin`, `require_acceso_ventas`, etc.). Un vendedor solo ve y toca lo suyo: «Esta oportunidad no te pertenece». El backend escribe con la service role, así que esta capa es la que decide |
| **RLS en Postgres** | Protege la base contra quien use la anon key y su propio JWT directo contra Supabase, saltándose el backend |

Las rutas protegidas del frontend (`AdminRoute`, `VentasRoute` y otras en `src/components/auth-routes.tsx`) solo
ordenan la interfaz. Por ejemplo, el botón «Activar» de un servicio solo aparece al equipo administrativo, y el
backend también lo verifica. Ver [Roles y permisos](./01-roles-permisos.md).

### Escrituras directas cerradas

El frontend no escribe ninguna tabla de dominio con Supabase. La única consulta directa es la **lectura** de `perfil`,
que hace falta en cada login para saber el equipo y el rol. Todo lo demás va por el backend.

Por eso, el 13/10/2026 se quitaron los permisos `INSERT`, `UPDATE` y `DELETE` a `authenticated` y `anon` sobre
`cotizacion`, `linea_cotizacion`, `linea_cotizacion_costo`, `oportunidad`, `documento_alcance`,
`contrato_recurrente`, `contrato_recurrente_linea`, `cuenta_contrato` y `lead_linkedin` (migración `0093`). Por qué: con esos permisos, un vendedor podía escribir directo en sus cotizaciones y saltarse
la aprobación de descuentos, el documento de alcance y el congelamiento de valores. El `SELECT` sobre `perfil` no se
tocó: sin él nadie puede entrar.

**Regla para pantallas nuevas:** nada del dominio va directo a Supabase. Si una pantalla necesita escribir, se agrega
un endpoint al backend.

### Perfil y cuenta desactivada

- Un usuario no puede cambiar su propio `equipo`, `rol_ventas`, `activo`, `email` ni `organizacion_id`; solo el
  equipo administrativo puede (trigger de la migración `0091`).
- **Una cuenta desactivada no tiene acceso.** El backend responde 403 «Tu cuenta está desactivada» en cualquier
  endpoint. Al desactivar, además, se la banea en Supabase Auth y se revocan sus sesiones. Reactivar la desbanea
  primero.
- El frontend detecta ese 403, muestra un único aviso aunque fallen varias peticiones a la vez y cierra la sesión.

## Límites de tasa

El backend corta con 429 y `Retry-After` cuando se superan estos límites. El frontend muestra cuántos segundos esperar.

| Endpoint | Límite |
|---|---|
| `POST /formulario` (formulario web público) | 10 por minuto por IP |
| Verificación pública de cotización (`/cotizaciones/{id}/verificar`) | 30 por minuto por IP |
| PDF de cotización para el cliente | 20 por minuto por usuario |
| SEO (crawl y Core Web Vitals) | 5 cada 5 minutos por usuario |
| IA del documento de alcance | 10 cada 5 minutos por usuario |

Los contadores viven en memoria de cada proceso. Con una sola instancia en Railway son exactos; si algún día hay
varias réplicas, el límite real se multiplica y hay que moverlos a una base compartida.

## CSP y cabeceras

### Frontend (`vercel.json`)

La CSP del CRM es estricta a propósito:

| Directiva | Valor | Por qué |
|---|---|---|
| `script-src` | `'self'` | Ningún script inline ni externo. El script del tema se movió a `public/theme-init.js` para no necesitar `'unsafe-inline'` |
| `style-src` | `'self' 'unsafe-inline'` | Tiptap y Sonner inyectan estilos al correr. No aplica a scripts |
| `connect-src` | El propio sitio, el backend de Railway, Supabase y el ingest de Sentry | Un script inyectado no puede mandar datos a otro host |
| `img-src` | `'self' data: blob: https:` | Los logos de organización y empresas vienen de dominios variables; `blob:` es para el PDF |
| `frame-src`, `object-src` | `'none'` | La app no usa frames ni plugins |
| `frame-ancestors` | `'none'` | Nadie puede meter prometIO en un iframe (clickjacking) |
| `base-uri`, `form-action` | `'self'` | |
| `upgrade-insecure-requests` | | Todo por https |

`/formulario-demo` y `/widget/` tienen una CSP aparte, que permite hCaptcha y Google Fonts. Todas las rutas llevan
además `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
una `Permissions-Policy` que apaga cámara, micrófono, geolocalización, pagos y otros sensores, y HSTS de dos años.

### Backend

Todas las respuestas llevan `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, una
`Permissions-Policy` y CSP `default-src 'none'` (se omite en los PDF). En producción, además, HSTS, y la documentación
interactiva (`/docs`, `/redoc`, `/openapi.json`) queda apagada para no publicar el mapa de la API.

## CORS

El backend solo acepta los orígenes de `CORS_ALLOW_ORIGINS`. **En producción descarta cualquier origen que no sea
https**, así que solo queda `https://prometio.vercel.app`. Los orígenes de desarrollo (`http://localhost:5173` y
`http://127.0.0.1:5173`) solo valen contra un backend en modo desarrollo.

La excepción es `POST /formulario`: acepta cualquier origen, porque el widget se incrusta en sitios de terceros. Lo
protegen hCaptcha, el límite por IP y la validación de cada campo.

## Solo https

- El frontend valida con `esUrlHttps()` (`src/lib/url-https.ts`) la URL de los webhooks de la organización y la URL
  de redirección del formulario web. Solo acepta `https:` con un host; rechaza `http:`, `javascript:`, `data:` y
  cualquier texto que no sea una URL absoluta.
- El backend aplica el mismo criterio y responde 422. La UI no es la única barrera.
- Los webhooks salientes, además, solo van a hosts públicos y sin seguir redirecciones (protección contra SSRF). El
  crawler SEO valida cada salto contra IPs privadas y de metadatos.

## Secretos

- **Nada secreto va al frontend.** Las variables `VITE_*` terminan en el navegador; por eso solo hay valores públicos
  (URL y anon key de Supabase, URL del backend, client id de Basecamp, DSN de Sentry). La site key de hCaptcha también
  es pública.
- Los secretos (service role de Supabase, claves de Contífico, Apify, Anthropic, Resend, hCaptcha, PageSpeed, OAuth de
  Google y Basecamp, `CRON_SECRET`) viven solo en Railway y, en el caso de `CRON_SECRET`, también en los secretos de
  GitHub.
- `.env` está en `.gitignore` en los dos repos. Las listas de nombres están en cada `.env.example`, sin valores.
- Las credenciales de integraciones guardadas en la base se cifran con Fernet si existe `SECRETS_ENCRYPTION_KEY`
  (pendiente, ver arriba).
- Los logs del backend redactan todo lo que parezca `key`, `token`, `secret`, `password` o `authorization`. La clave
  de PageSpeed viaja en una cabecera, no en la URL, para que no aparezca en errores.
- Los mensajes de error al usuario nunca traen el detalle interno de una excepción.
- `CRON_SECRET` se compara en tiempo constante.

## Sentry sin datos personales

| | Frontend | Backend |
|---|---|---|
| Arranca | Solo si existe `VITE_SENTRY_DSN` | Solo si existe `SENTRY_DSN` |
| Usuario | Solo el **id** de perfil, nunca correo ni nombre | `send_default_pii=False` |
| Qué no se envía | | Cuerpos de petición, cookies y cabeceras sensibles (`Authorization`, `X-Cron-Secret` y otras) |
| Trazas de rendimiento | Apagadas | Apagadas |

Son dos proyectos de Sentry distintos, uno por repo. Hoy los dos DSN están pendientes.

## Dependencias

- Frontend: el CI corre `npm audit --omit=dev --audit-level=high` y **bloquea** si algo de lo que llega al navegador
  tiene una vulnerabilidad alta o crítica. Al 13/10/2026, cero.
- Backend: dependencias exactas con hash (`requirements.lock`), imagen base fijada por digest y `pip-audit` en el CI.
- Dependabot en los dos repos. Detalle en [Despliegue](./13-despliegue.md#ci-y-dependabot).

## Auditoría del 10/10/2026 y endurecimiento del 13/10/2026

El 10/10/2026 se hizo una auditoría de solo lectura sobre todo el código de prometIO. El veredicto fue «no apto para
seguir en producción hasta corregir los 2 hallazgos críticos», con 2 críticos, 2 altos y 4 medios de seguridad. El
13/10/2026 se cerraron en una pasada de endurecimiento en los dos repos, coordinada entre frontend y backend.

| Hallazgo | Qué era | Qué se hizo |
|---|---|---|
| C1 · Crítico | Un usuario podía cambiar su propio rol por RLS | Trigger que protege `equipo`, `rol_ventas`, `activo`, `email` y `organizacion_id` (`0091`) |
| C2 · Crítico | Datos sin escapar en los PDF, con un motor que podía leer archivos locales y la red | Autoescape en las plantillas, WeasyPrint limitado a `https` y `data` sin redirecciones, validación de largo y caracteres en la entrada |
| A1 · Alto | Los usuarios desactivados conservaban el acceso | 403 en cualquier endpoint, baneo en Auth y revocación de sesiones (`0092`); el frontend cierra la sesión |
| A2 · Alto | Un vendedor podía escribir directo en sus cotizaciones | Escrituras directas revocadas en las tablas de dominio (`0093`), después de confirmar que el frontend no las usaba |
| M1 · Medio | SSRF en el crawler SEO | Cada salto se valida contra IPs privadas, loopback y metadatos |
| M2 · Medio | La clave de PageSpeed se filtraba en los errores | Clave en cabecera; los errores nunca guardan ni devuelven el texto de la excepción |
| M3 · Medio | HTML sin escapar en el correo de nuevo lead | Datos de terceros saneados y escapados |
| M4 · Medio | El servidor MCP necesitaba la service role en la máquina de cada usuario | El MCP es ahora un cliente HTTP de la API que envía el token del propio usuario |

Además, en el frontend: cabeceras y CSP en Vercel, script de tema fuera del HTML, https obligatorio en URLs,
dependencias sin vulnerabilidades en producción (incluido el salto a React Router 7), CI, Dependabot, Sentry opcional
y manejo de las respuestas nuevas del backend (429, 409, 403 de cuenta desactivada y 503 del captcha). En el backend:
límites de tasa, transiciones de estado atómicas (409 si otra petición ganó), validación de archivos subidos, cifrado
de credenciales en reposo, cabeceras, CORS solo https en producción e imagen Docker sin root.

El detalle, ítem por ítem, con archivos y cómo se verificó cada uno, está en
[Endurecimiento del 13/10/2026](./endurecimiento.md).
