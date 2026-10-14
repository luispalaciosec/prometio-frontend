# 12 · Levantar el proyecto en local

> Revisado contra el código el 13/10/2026.

prometIO son dos repos hermanos que se despliegan por separado: `prometio-frontend` (React + Vite, en Vercel) y
`prometio-backend` (FastAPI, en Railway). Los dos usan el mismo proyecto de Supabase: el frontend solo para el login,
el backend para todo lo demás. Esta página explica cómo levantar cada uno, cómo conectarlos y cómo correr este sitio de
documentación.

```
prometIO/
  prometio-frontend/   React 18 + Vite + TypeScript. Este sitio vive en docs/
  prometio-backend/    FastAPI + migraciones de Supabase (supabase/migrations/)
  docs/                DECISIONS.md y ROADMAP.md
```

## Requisitos

| Para | Necesitas |
|---|---|
| Frontend y docs | Node 20 o superior. El CI usa Node 22 |
| Backend | Python 3.11 o superior. En macOS, `brew install pango` para los PDF |
| Migraciones | [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), si no las aplicas desde el SQL Editor |
| Pruebas de RLS del backend | Postgres instalado (`initdb`, `pg_ctl` y `psql` en el `PATH`). Sin eso, esas pruebas se saltan solas |

## Frontend

```bash
cd prometio-frontend
cp .env.example .env
npm install
npm run dev
```

Queda en `http://127.0.0.1:5173`. Completa `.env` **antes** de entrar: sin las variables de Supabase el login no
arranca y la pantalla lo dice.

### Variables del frontend

| Variable | Qué hace |
|---|---|
| `VITE_SUPABASE_URL` | Project URL de Supabase (solo Auth) |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase. Es pública: va al navegador |
| `VITE_API_URL` | URL del backend, sin barra final. **En local déjala vacía** para usar el proxy |
| `DEV_API_PROXY_TARGET` | Solo `npm run dev`. A dónde reenvía Vite las peticiones a `/api-backend` |
| `DEV_SERVER_HOST` / `DEV_SERVER_PORT` | Opcionales. Por defecto `127.0.0.1` y `5173` |
| `VITE_BASECAMP_CLIENT_ID` | Client id público de la app OAuth de Basecamp. La integración local es distinta de la de producción (cambia el redirect). El secret nunca va acá |
| `VITE_SENTRY_DSN` | DSN del proyecto de Sentry del frontend. Vacío = Sentry apagado, que es lo normal en local |
| `VITE_SENTRY_ENVIRONMENT` | Opcional. Por defecto, el modo de Vite |

Las variables `VITE_*` se fijan al compilar. Si cambias una, reinicia `npm run dev`.

### El proxy `/api-backend`

Con `VITE_API_URL` vacía, el cliente HTTP (`src/lib/api-client.ts`) pide todo a `/api-backend/...` y Vite lo reenvía
a `DEV_API_PROXY_TARGET`, quitando el prefijo. Por qué así: el navegador habla solo con Vite, en el mismo origen, y no
hay CORS de por medio.

| Quieres | `DEV_API_PROXY_TARGET` |
|---|---|
| Backend local | `http://127.0.0.1:8000` (el valor del ejemplo) |
| Backend de producción en Railway | `https://prometio-backend-production.up.railway.app` |

Contra Railway, usa el proxy y no `VITE_API_URL`. El backend de producción solo acepta orígenes https en CORS, así
que un navegador en `http://127.0.0.1:5173` hablando directo con Railway queda bloqueado.

::: warning
Contra Railway trabajas con **datos reales de producción**. Todo lo que crees, edites o borres es de verdad.
:::

Si dejas `VITE_API_URL` vacía en un build de producción, la app falla con `Falta VITE_API_URL.` a propósito.

### Las dos configuraciones de lanzamiento

`.claude/launch.json` define dos formas de levantar el frontend desde Claude Code, las dos en el puerto 5173:

| Nombre | Qué corre | Para qué |
|---|---|---|
| `frontend` | `npm run dev` con lo que diga tu `.env` | El caso normal, contra el backend local |
| `frontend-railway` | `npm run dev` con `DEV_API_PROXY_TARGET` apuntando a Railway | Probar la UI con datos reales sin levantar el backend |

## Backend

```bash
cd prometio-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env    # y complétalo
uvicorn app.main:app --reload
```

Comprueba que responde: `http://localhost:8000/health` devuelve `{"status": "ok"}`. En local, la documentación
interactiva de la API queda en `http://localhost:8000/docs`; en producción está apagada.

### PDF en macOS

WeasyPrint necesita Pango y GLib nativos. Con Homebrew se instalan, pero Python no siempre los encuentra. Si al
generar un PDF ves `OSError: cannot load library 'libgobject-2.0-0'`, corre el servidor así:

```bash
DYLD_LIBRARY_PATH=/opt/homebrew/lib uvicorn app.main:app --reload
```

Si lo lanzas en segundo plano con `nohup ... &`, macOS borra la variable. Lánzalo en primer plano o con un mecanismo
que conserve el entorno. En el contenedor de Railway (Debian) no hace falta nada de esto.

### Variables del backend

Están todas en `prometio-backend/.env.example`, con un comentario cada una.

| Grupo | Variables | Sin ellas |
|---|---|---|
| **Obligatorias** | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CONTIFICO_API_KEY`, `APIFY_API_TOKEN`, `RESEND_WEBHOOK_SECRET`, `PAGESPEED_API_KEY` | El backend no arranca |
| Basecamp | `BASECAMP_CLIENT_ID`, `BASECAMP_CLIENT_SECRET`, `BASECAMP_ACCOUNT_ID` | Fallan solo las rutas de Basecamp |
| IA | `ANTHROPIC_API_KEY` | Falla solo la generación con IA |
| Formulario web | `HCAPTCHA_SECRET_KEY`, `HCAPTCHA_HOSTNAMES` | Sin la clave, `POST /formulario` rechaza todo con 422 |
| Correo | `RESEND_API_KEY` | No sale el correo de asignación de leads; el lead se crea igual |
| Cron | `CRON_SECRET` | La vía automática de `generar-mes` responde 403; el botón de la app sigue funcionando |
| Cifrado | `SECRETS_ENCRYPTION_KEY` | Las credenciales de integraciones se guardan sin cifrar |
| Observabilidad | `SENTRY_DSN` | Sentry apagado |
| Entorno | `ENVIRONMENT`, `CORS_ALLOW_ORIGINS` | Ver abajo |

Las opcionales lo son a propósito: una variable faltante apaga su función, no tumba todo el backend (ya pasó una vez,
con un crashloop en producción).

- **`ENVIRONMENT`.** En Railway no hace falta: el backend detecta producción por `RAILWAY_ENVIRONMENT`. En local,
  `development` o `local` fuerzan modo desarrollo: `/docs` visible, sin HSTS y CORS acepta http.
- **`CORS_ALLOW_ORIGINS`.** Lista JSON. Por defecto incluye `http://localhost:5173`, `http://127.0.0.1:5173` y
  `https://prometio.vercel.app`. Si la cambias, agrega orígenes; no reemplaces la lista.
- **`SECRETS_ENCRYPTION_KEY`.** El comando para generarla está en el comentario de `.env.example`. Después de cargarla
  por primera vez, corre una vez `python -m scripts.cifrar_secretos_existentes`.

El backend verifica los JWT de Supabase contra las claves públicas (JWKS) del proyecto, así que no hace falta ninguna
variable de secreto JWT.

### Base de datos por primera vez

Solo aplica a un proyecto de Supabase nuevo. Las migraciones están en `supabase/migrations/`, numeradas. El detalle de
cómo se aplican está en [Despliegue](./13-despliegue.md#migraciones).

Antes de que alguien inicie sesión tiene que existir la fila de la organización: el trigger que crea el `perfil` de
cada usuario nuevo la necesita, y sin ella el registro falla.

```sql
insert into organizacion (nombre) values ('Geeks Ecuador');
```

Todo usuario nuevo entra como `ventas`/`vendedor`, el rol de menor privilegio. Al primer administrador hay que
promoverlo por SQL, porque todavía no hay nadie que pueda hacerlo desde la app. Desde ahí, los roles se ajustan en
Usuarios.

### Pruebas y lint

```bash
pip install ".[dev]"
ruff check --select F,E9 app tests
pytest -q
```

Las pruebas de RLS levantan un Postgres efímero propio; nunca tocan la base de producción.

## Sitio de documentación

Este sitio es VitePress y vive en `prometio-frontend/docs/`. Los `.md` de esa carpeta son la fuente: se editan ahí.

```bash
cd prometio-frontend
npm run docs:dev
```

En producción se publica dentro del frontend, en `https://prometio.vercel.app/docs`. Ver
[Despliegue](./13-despliegue.md#sitio-de-documentacion).

## Antes de subir un cambio al frontend

Es lo mismo que corre el CI. Si pasa en local, pasa en el CI.

```bash
npm run lint                              # oxlint
npx tsc -b --noEmit                       # tipos
npm run build                             # tsc -b, build de la app y del sitio de docs
npm audit --omit=dev --audit-level=high   # dependencias que llegan al navegador
```

`npm run preview` sirve el build de `dist/` para revisarlo como en producción.
