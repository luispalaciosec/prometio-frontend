# prometIO · frontend

[![CI](https://github.com/luispalaciosec/prometio-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/luispalaciosec/prometio-frontend/actions/workflows/ci.yml)

CRM comercial interno de **Geeks Ecuador**: contactos y empresas, pipeline de 9 etapas, cotizaciones con motor de
márgenes, documentos de alcance, contratos de fee recurrente, facturación (Contífico), dashboard con forecast y panel
TV.

- **App:** https://prometio.vercel.app
- **Documentación:** https://prometio.vercel.app/docs/ — cómo funciona cada módulo, operación, referencia técnica y
  decisiones. La fuente está en [`docs/`](docs/).
- **Backend:** repo hermano `prometio-backend` (FastAPI + Supabase, en Railway).

## Cómo encaja

```
Navegador ──login──▶ Supabase Auth
    │
    └──API con JWT──▶ prometio-backend (FastAPI, Railway) ──▶ Supabase Postgres (RLS) · Contífico · Basecamp · Google · Apify
```

- **El frontend no escribe la base de datos.** Supabase en el navegador se usa solo para iniciar sesión y leer
  perfiles (solo lectura). Todo el dominio va por HTTP al backend con el JWT de la sesión (`src/lib/api-client.ts`).
- **Los permisos los decide el servidor.** La interfaz oculta lo que un rol no puede hacer, pero la barrera real es el
  backend y las políticas RLS.
- **Montos sin IVA en pantalla.** El IVA solo aparece en el PDF para el cliente, que genera el backend.

## Stack

| | |
|---|---|
| Base | React 18, TypeScript, Vite |
| UI | Tailwind CSS 4, shadcn/ui, Lucide, Recharts, Tiptap, `@dnd-kit` (Kanban) |
| Estado y rutas | Zustand, React Router 7 (modo librería) |
| Auth | Supabase Auth (email y Google, PKCE) |
| Errores | Sentry (`@sentry/react`), activo solo con `VITE_SENTRY_DSN` |
| Docs | VitePress, publicado en `/docs` |
| Deploy | Vercel |

## Levantar en local

Requisitos: Node 20 o superior.

```bash
cp .env.example .env    # completar antes de entrar
npm install
npm run dev             # http://127.0.0.1:5173
```

| Variable | Para qué |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Proyecto de Supabase para el login (la anon key es pública por diseño). Sin ellas el login no arranca |
| `VITE_API_URL` | URL del backend, **sin barra final**. En local se deja vacía y se usa el proxy de abajo |
| `DEV_API_PROXY_TARGET` | Solo en `npm run dev`: a dónde va `/api-backend`. `http://127.0.0.1:8000` para un backend local, o la URL de Railway |
| `VITE_BASECAMP_CLIENT_ID` | Client ID público de la integración de Basecamp (local y producción son integraciones distintas) |
| `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT` | Opcionales. Sin DSN, Sentry no arranca |
| `DEV_SERVER_HOST`, `DEV_SERVER_PORT` | Opcionales |

**Contra el backend de producción desde local:** usa `DEV_API_PROXY_TARGET` con la URL de Railway. No uses
`VITE_API_URL` en local: el backend de producción solo acepta orígenes `https`.

Ningún secreto va en este repo ni en variables `VITE_*`: todo lo que empieza con `VITE_` termina en el navegador.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con proxy al backend |
| `npm run build` | Typecheck, build de la app y build del sitio de documentación en `dist/docs` (es lo que corre Vercel) |
| `npm run lint` | oxlint |
| `npm run docs:dev` | Sitio de documentación en local, con recarga |
| `npm run preview` | Sirve el build de producción |

El CI (`.github/workflows/ci.yml`) corre en cada push a `main` y en cada PR: lint, typecheck, build y
`npm audit --omit=dev --audit-level=high`. Dependabot propone actualizaciones cada lunes.

## Estructura

```
src/
├── pages/          Una pantalla por ruta (rutas y guards en App.tsx)
├── components/     Por dominio (pipeline/, contratos/, dashboard/…) y ui/ (shadcn)
├── lib/
│   ├── api-client.ts   apiFetch / ApiError: JWT, errores 401/403/409/429
│   ├── api/            Un cliente por dominio del backend
│   └── *-visual.ts     Catálogos de ícono y color por tipo (los componentes solo los consumen)
├── store/          Zustand: sesión, perfil y organización
├── hooks/
└── types/          Tipos de las respuestas de la API
docs/               Fuente del sitio de documentación (VitePress)
public/widget/      Widget embebible del formulario web
```

## Despliegue

Push a `main` → Vercel compila (`npm run build`) y publica. `vercel.json` define:

- **Rutas:** la SPA, el sitio `/docs` y la demo `/formulario-demo`.
- **Headers de seguridad por ruta:** CSP (el CRM no permite scripts inline), HSTS, `X-Frame-Options`, `nosniff`,
  `Referrer-Policy` y `Permissions-Policy`.

Las variables `VITE_*` se insertan al compilar: después de cambiar una en Vercel hay que volver a desplegar sin la
caché del build.

## Para contribuir

- Antes de tocar código, lee [`CLAUDE.md`](CLAUDE.md): convenciones, sistema de diseño y reglas de negocio que la UI
  respeta.
- `npm run build` y `npm run lint` tienen que pasar antes de cada commit.
- Commits en inglés, en imperativo y terminados en punto. Código y copy de la interfaz en español.
- Si cambias cómo funciona algo, actualiza su página en `docs/`.
- Los registros de seguridad están en [`HARDENING-CHANGELOG.md`](HARDENING-CHANGELOG.md).
