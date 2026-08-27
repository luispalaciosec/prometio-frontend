# prometio-frontend

Frontend de **prometIO**, el CRM interno de Geeks Ecuador. React 18 + TypeScript + Vite, Tailwind + shadcn/ui, desplegado en Vercel (`https://prometio.vercel.app`).

El backend (FastAPI + Supabase) vive en el repo hermano `prometio-backend`. El contrato es `prometio-backend/docs/DATA_MODEL.md` + el OpenAPI en `/docs` de FastAPI. Decisiones de stack y fases: `../docs/DECISIONS.md` y `../docs/ROADMAP.md`.

Este repo **no habla con Supabase para el dominio** (contactos, pipeline, bandeja, etc.). Auth sí: login email/Google vía `@supabase/supabase-js`. El resto va por HTTP al backend con el JWT de la sesión.

## Requisitos

- Node 20+
- Un proyecto Supabase (Auth) — las mismas credenciales que usa el backend para verificar JWT
- Backend levantado (local o Railway) si querés datos reales

## Levantar en local

```bash
cp .env.example .env
npm install
npm run dev
```

El dev server queda en `http://127.0.0.1:5173` (host/puerto configurables). Completá `.env` **antes** de entrar: sin `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` el login no arranca.

| Variable | Qué hace |
|---|---|
| `VITE_SUPABASE_URL` | Project URL de Supabase (Auth) |
| `VITE_SUPABASE_ANON_KEY` | Anon key de Supabase (pública, va al browser) |
| `VITE_API_URL` | URL pública del backend, **sin barra final**. En local **dejala vacía**: el cliente usa `/api-backend` y Vite proxea. En Vercel es `https://prometio-backend-production.up.railway.app` |
| `VITE_BASECAMP_CLIENT_ID` | Client id público de la app OAuth en Launchpad. Local y producción son integraciones distintas (redirect `http://127.0.0.1:5173/auth/basecamp/callback` vs `https://prometio.vercel.app/auth/basecamp/callback`). El secret queda en el backend |
| `DEV_API_PROXY_TARGET` | Solo `npm run dev`. Destino del proxy `/api-backend`. Default del example: `http://127.0.0.1:8000` (uvicorn local). Podés apuntarlo a Railway si no tenés backend local |
| `DEV_SERVER_HOST` / `DEV_SERVER_PORT` | Bind del Vite. Opcional |

Scripts: `npm run dev`, `npm run build` (`tsc -b` + Vite), `npm run preview`, `npm run lint` (oxlint).

## Backend real vs. “mock”

**No hay un modo mock conmutable.** La app en runtime siempre pega HTTP (`src/lib/api-client.ts` → `src/lib/api/*` y `src/lib/config-api.ts`).

- **Local contra backend local:** `VITE_API_URL` vacío + `DEV_API_PROXY_TARGET=http://127.0.0.1:8000` + uvicorn en el repo backend.
- **Local contra Railway:** o bien `DEV_API_PROXY_TARGET=https://prometio-backend-production.up.railway.app` (sigue yendo por `/api-backend`), o `VITE_API_URL=https://prometio-backend-production.up.railway.app` (el browser habla directo; CORS del backend ya permite `http://localhost:5173`).
- **Producción (Vercel):** hace falta `VITE_API_URL`. Sin esa variable el build de prod tira `Falta VITE_API_URL.`

Los archivos `src/lib/mock-*.ts` son leftover de cuando el dominio vivía en `localStorage`. Ninguna página los importa para leer/escribir datos. No los uses para desarrollar pantallas nuevas.

## Sistema de diseño

No copies paletas de otros CRMs ni pongas hex en componentes. Referencia visual: Apollo.io templado con Linear/Notion. Detalle de pantallas: `docs/UI_GUIDE.md`.

**Tokens** — viven en `src/index.css` (paleta D). Hex **solo ahí**. El theming de organización (`GET /organizacion`) pisa `--primary`, `--secondary`, `--highlight` y `--sidebar` vía `src/lib/theme.ts`. Cada usuario elige claro/oscuro (`perfil.tema_preferido`).

Escala de tipo (no bajarla): `text-page` 28, `text-section` 16, `text-ui` / `text-ui-medium` 14, `text-kicker` 13, `text-micro` 12. Labels de form usan `text-kicker`. Cards `rounded-xl` + `ring-border` + `shadow-raised`. Badges: `outline` / `warning` / `success` / `destructive`, no `default`/`secondary` sólidos.

**Íconos Kind** — Lucide, `strokeWidth={1.75}`. El color e ícono de un tipo de enum cerrado se definen **una sola vez** en un catálogo `src/lib/*-visual.ts`. Las pantallas solo consumen `KindMark` (o el wrapper del catálogo). Hoy:

- `src/lib/actividad-visual.ts` — tipos de actividad
- `src/lib/calendario-visual.ts` — cumpleaños y vencimiento de cotización
- `src/lib/salud-visual.ts` — servicios del panel de salud

No logos de marca (WhatsApp, Meet, Claude). No una librería de íconos distinta. Vacío de datos: `EmptyState`, nunca una tabla en blanco.
