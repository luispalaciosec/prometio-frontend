# 14 · Seguridad

> Versión pública: principios y controles ya implementados en el frontend. El detalle completo (pendientes, historial
> de auditorías y endurecimiento) vive en un documento privado, fuera de este repositorio. Esta página no entra al
> sitio de documentación.

La idea central es simple: **el navegador solo se autentica con Supabase; todo lo demás pasa por el backend, que decide
los permisos**. La interfaz oculta lo que un usuario no puede hacer, pero no es la barrera.

## Autenticación

- **Login con Supabase Auth**, por correo y contraseña o con Google, con el flujo **PKCE** (`flowType: "pkce"` en
  `src/lib/supabase.ts`). El código que vuelve en la URL no sirve sin el verificador que guardó el navegador.
- **El backend recibe el JWT de la sesión** en `Authorization: Bearer` en cada petición (`src/lib/api-client.ts`) y lo
  verifica contra las claves públicas del proyecto.
- Los secretos de OAuth de Basecamp y Google viven solo en el backend: el navegador recibe el código y el backend hace
  el intercambio.

## Autorización

| Capa | Qué hace |
|---|---|
| **Backend** | Cada endpoint exige el equipo o rol que necesita. Un vendedor solo ve y toca lo suyo. Es la capa que decide |
| **Base de datos** | Políticas de acceso que protegen la base aunque alguien intente saltarse el backend |

Las rutas protegidas del frontend (`AdminRoute`, `VentasRoute` y otras en `src/components/auth-routes.tsx`) solo
ordenan la interfaz. Ver [Roles y permisos](./01-roles-permisos.md).

**Regla para pantallas nuevas:** nada del dominio va directo a Supabase. La única consulta directa del frontend es la
**lectura** de `perfil` al iniciar sesión. Si una pantalla necesita escribir, se agrega un endpoint al backend.

**Cuenta desactivada.** El backend responde 403 «Tu cuenta está desactivada» en cualquier endpoint. El frontend lo
detecta, muestra un único aviso aunque fallen varias peticiones a la vez y cierra la sesión.

## Límites de tasa

El backend corta con 429 y `Retry-After`. El frontend muestra cuántos segundos esperar y conserva el `detail` original
del backend.

## CSP y cabeceras (`vercel.json`)

| Directiva | Valor | Por qué |
|---|---|---|
| `script-src` | `'self'` | Ningún script inline ni externo. El script del tema vive en `public/theme-init.js` |
| `style-src` | `'self' 'unsafe-inline'` | Tiptap y Sonner inyectan estilos al correr. No aplica a scripts |
| `connect-src` | El propio sitio, el backend, Supabase y el ingest de Sentry | Un script inyectado no puede mandar datos a otro host |
| `img-src` | `'self' data: blob: https:` | Logos de dominios variables; `blob:` es para el PDF |
| `frame-src`, `object-src` | `'none'` | La app no usa frames ni plugins |
| `frame-ancestors` | `'none'` | Nadie puede meter prometIO en un iframe |
| `base-uri`, `form-action` | `'self'` | |
| `upgrade-insecure-requests` | | Todo por https |

`/formulario-demo` y `/widget/` tienen una CSP aparte, que permite hCaptcha y Google Fonts. Todas las rutas llevan
además `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
una `Permissions-Policy` restrictiva y HSTS de dos años.

**Regla:** nunca `'unsafe-inline'` ni `'unsafe-eval'` en `script-src`, ni comodines amplios. Si una pantalla nueva
necesita otro origen, se agrega el mínimo en la directiva que corresponda.

## Solo https

El frontend valida con `esUrlHttps()` (`src/lib/url-https.ts`) la URL de los webhooks de la organización y la URL de
redirección del formulario web: solo `https:` con un host. El backend aplica el mismo criterio.

## Secretos

- **Nada secreto va al frontend.** Las variables `VITE_*` terminan en el navegador; por eso solo hay valores públicos
  (URL y anon key de Supabase, URL del backend, client id de Basecamp, DSN de Sentry).
- Los secretos viven solo en el backend. `.env` está en `.gitignore`; los nombres están en `.env.example`, sin valores.
- Los mensajes de error al usuario nunca traen el detalle interno de una excepción.

## Sentry sin datos personales

Arranca solo si existe `VITE_SENTRY_DSN`. Asocia los errores solo al **id** de perfil, nunca al correo ni al nombre, y
las trazas de rendimiento están apagadas.

## Dependencias

El CI corre `npm audit --omit=dev --audit-level=high` y **bloquea** si algo de lo que llega al navegador tiene una
vulnerabilidad alta o crítica. Dependabot propone actualizaciones cada semana. Ver
[Despliegue](./13-despliegue.md#ci-y-dependabot).
