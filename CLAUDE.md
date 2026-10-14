# CLAUDE.md — prometio-frontend

Frontend de **prometIO**, el CRM interno de Geeks Ecuador. El backend (FastAPI + Supabase) vive en el repo hermano `../prometio-backend`. El contrato con ese repo es `../prometio-backend/docs/DATA_MODEL.md` + el OpenAPI que FastAPI expone en `/docs`. Ante una regla de negocio dudosa, leé también `../prometio-backend/CLAUDE.md`.

Antes de cuestionar una decisión de stack, revisá `../docs/DECISIONS.md`. Fases: `../docs/ROADMAP.md`. Detalle por pantalla: `docs/UI_GUIDE.md`. Setup y variables de entorno: `README.md`.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS 4 + shadcn/ui (`src/components/ui`)
- Tablas con el `Table` del sistema (`src/components/ui/table.tsx`), `@dnd-kit` (Kanban del pipeline), Tiptap (editor de documentos), Recharts (gráficos)
- Zustand (`src/store`), React Router v7 vía `react-router-dom` en modo librería (rutas en `src/App.tsx`)
- Sentry (`@sentry/react`), solo activo con `VITE_SENTRY_DSN`
- Desplegado en Vercel (`https://prometio.vercel.app`)

## Comandos

```bash
npm run dev      # Vite en http://127.0.0.1:5173, proxea /api-backend → DEV_API_PROXY_TARGET
npm run build    # tsc -b + vite build — tiene que pasar antes de commitear
npm run lint     # oxlint
```

## Cómo habla con el backend

- Auth: Supabase (`src/lib/supabase.ts`, `src/store/auth-store.ts`). Nada del dominio va directo a Supabase.
- Todo el dominio: HTTP vía `apiFetch` / `apiFetchBlob` en `src/lib/api-client.ts`, con el JWT de la sesión. Un archivo por dominio en `src/lib/api/*.ts`; config admin en `src/lib/config-api.ts`. Tipos en `src/types/*.ts`.
- Errores: `ApiError` trae `status` y `detail` — mostrar `detail` en `toast.error`.
- `src/lib/mock-*.ts` son leftover de cuando el dominio vivía en `localStorage`. No los uses para pantallas nuevas.
- Fechas/horas: Ecuador, offset fijo `-05:00` (sin horario de verano). Rangos de día calendario → `src/lib/rango-datetime-ecuador.ts`.

## Dirección visual

Referencia **app shell**: Stripe / DesignMD — canvas claro, ink `#0d253d`, primary índigo, sidebar claro, cards en gris suave, CTAs pill. Densidad y tablas siguen el criterio **Apollo.io** (badges de estado, filas legibles). Sin estética HubSpot clásica.

**Dos capas de color (ADR-022):** la UI del CRM usa tokens app (`--primary`, etc.) definidos en `src/index.css` — hex **solo ahí**. Los colores de `organizacion` van a `--brand-*` (PDF cotización, documentos, widget, previews envueltos en `BrandSurface`) — no pisan botones ni sidebar. Logo siempre desde API. Tema claro/oscuro: `perfil.tema_preferido`.

**Toda pantalla nueva nace con el lenguaje de Fase C + presencia visual aprobada (ago 2026) y usable en móvil.** No es un pase posterior. Referencia: Dashboard, Resumen, Actividades, Cumpleaños. Un canvas de texto chico sin wells no se mergea.

- Móvil: el sidebar de escritorio no existe bajo `md` (hamburger + cajón). Filtros `filter-bar` / `filter-field` (full width en teléfono). Tablas hacen scroll horizontal, no rompen el viewport. Bandeja es lista o hilo, no los dos. Padding de página `px-4` en móvil.
- Escala (no bajarla): `text-page` 28, `text-section` 16, `text-ui` / `text-ui-medium` 14, `text-kicker` 13, `text-micro` 12. Labels de form usan `text-kicker`, no `text-micro`. Inputs/select `h-9`.
- Tablas: `Table` del sistema (14px). Primera columna `text-ui-medium`; el resto `text-ui` o `text-muted-foreground`. `TableRow` con hover (`hover:bg-muted/50`) y `cursor-pointer` si la fila navega.
- Cards y KPIs: `KpiCard` o `KindMark` `lg` (well 44px) + número en `text-page`. Una card solo-texto tipo sello (nombre 14px, sin icono) no se acepta.
- Cards: `rounded-xl` + `ring-border` / `border-border` + `shadow-raised`.
- Badges de estado: `Badge` de `ui/badge` (pill `rounded-full`), variantes `outline` / `warning` / `success` / `destructive` — patrón de `CotizacionEstadoBadge` y `AlertaEstadoBadge`. No `default`/`secondary` sólidos ni radio de botón.
- Vacíos: `EmptyState` (well + ícono, título `text-section` + copy `text-kicker`). Cero filas o filtro sin match → empty, nunca una tabla en blanco.
- Nav "Próximamente": texto `text-micro` en tokens del sidebar, no un chip `Badge`.

### Íconos

Lucide, `strokeWidth={1.75}`. Tres roles, no decoración suelta:

1. **Wayfinding** — nav y config. Obligatorio.
2. **Kind** — tipo de entidad de enum cerrado (actividad, canal, servicio de salud, etc.). `KindMark` + catálogo `src/lib/*-visual.ts` — ese archivo es el único lugar donde se define ícono y color por tipo; los componentes solo lo consumen. El color vive en el well del icono, nunca en la fila ni en competencia con el badge de estado. En tablas el default es `md` (well 32px), no `sm`.
3. **Empty** — `EmptyState`. Obligatorio si no hay datos.

Dónde no: timestamps, labels de form, cada celda de una tabla, badges de estado. No emojis, no logos de marca (WhatsApp, Meet, Claude), no una librería distinta de Lucide.

## Reglas de negocio que la UI respeta (no las reinventes en el frontend)

- El pipeline de Oportunidad tiene 9 etapas fijas, en Kanban arrastrable. La "vista por servicio" es un filtro sobre el mismo pipeline, no otra pantalla.
- El valor de una Oportunidad se muestra siempre etiquetado: "estimado" (`valor_referencial`) hasta que exista `valor_cotizado` en firme.
- Montos de cotización en UI: sin IVA, derivados de `subtotal_con_comision` (no de campos con impuestos).
- El PDF de cotización lo genera el backend. La vista para cliente **nunca** muestra desglose de costo/margen; la interna depende de permisos del usuario, no de un toggle libre.
- Wizard de Servicio: 8 pasos, guardable como borrador; "Activar" solo habilitado para equipo `administrativo` (el backend también lo verifica — la UI no es la única barrera).
- Una conversación de la bandeja NO es un Contacto hasta que el usuario hace clic explícito en "Convertir a contacto" — no lo automatices.

### Categorías en líneas de cotización

Aplica a `LineaCotizacionForm.tsx`, `CotizacionConstructor.tsx`, `src/lib/api/cotizacion.ts`, `CategoriasServicioPage.tsx`, `src/types/categoria-servicio.ts`, `src/lib/config-api.ts`.

- **Línea a medida (`servicio_id: null`):** POST exige `categoria_servicio_id` (UUID), sin él → 422. UI: selector obligatorio en el paso 2 del alta, lista desde `GET /config/categorias-servicio`, precarga `oportunidad.categoria_interes_id` (editable). En `createLinea`, incluir `categoria_servicio_id` **solo** cuando `servicio_id == null`.
- **Línea con catálogo:** no enviar `categoria_servicio_id` en POST (el backend hereda de `servicio.categoria_id`). PATCH con categoría en línea con servicio → 422.
- **Lectura:** `categoria_servicio_nombre` puede ser null → mostrar **Sin categoría**. El pilar no viene en la línea.
- **Config (admin):** `GET /config/categorias-servicio` → `{ id, organizacion_id, nombre, pilar }`, `pilar` nullable en legacy (mostrar **Sin pilar**, permitir asignarlo al editar). `POST { nombre, pilar }` con pilar obligatorio: `marca` | `crecimiento` | `transformacion` | `transversal`. `PATCH` acepta `nombre` y/o `pilar`. `DELETE` → 409 si la usan servicios, líneas u oportunidades (mostrar `ApiError.detail`).

## Convenciones

- Código, nombres de dominio y copy de UI en español (voseo rioplatense en el copy: "Elegí", "dejala"). Commits en inglés, imperativo, terminando en punto.
- Alias `@/` → `src/`.
