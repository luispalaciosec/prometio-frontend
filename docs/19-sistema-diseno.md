# 19 · Sistema de diseño

> Revisado contra `src/index.css`, `src/components` y el `CLAUDE.md` del frontend el 13/10/2026.

Las reglas visuales del CRM y por qué existen. Si una pantalla nueva no las cumple, no se mergea. El detalle pantalla
por pantalla está en la [Guía de UI original](./UI_GUIDE.md).

## Dirección

- **App shell:** referencia Stripe / DesignMD. Canvas claro, tinta `#0d253d`, primary índigo, sidebar claro, cards en
  gris suave, botones pill.
- **Densidad y tablas:** criterio Apollo.io. Badges de estado, filas legibles, nada apretado.
- **Sin estética HubSpot clásica**, sin paletas copiadas de otros CRM.
- **Toda pantalla nueva nace** con el lenguaje de Fase C y la presencia visual aprobada en agosto de 2026, **y usable
  en móvil**. No es un pase posterior. Referencias vivas: Dashboard, Resumen, Actividades, Cumpleaños. Un canvas de
  texto chico sin wells no se acepta.

---

## Dos capas de color (ADR-022)

| Capa | Variables | De dónde salen | Dónde se usan |
|---|---|---|---|
| **App** | `--primary`, `--secondary`, `--muted`, `--sidebar`, `--success`, `--warning`, `--destructive`, `--kind-*`, `--chart-*`, ... | Fijas en `src/index.css` | Toda la UI del CRM: botones, nav, badges, gráficos |
| **Marca** | `--brand-primary`, `--brand-secondary`, `--brand-highlight`, `--brand-sidebar` | `organizacion.color_primario` … `color_cuaternario`, vía `GET /organizacion` y `applyOrganizationBrandTheme()` (`src/lib/theme.ts`) | Entregables: PDF de cotización, documentos generados, widget del formulario, y sus previews dentro del CRM |

**Por qué dos capas.** El CRM necesita consistencia de producto; los clientes esperan sus colores en la cotización y
en el formulario, no en cada botón del pipeline. Los colores de la organización nunca pisan `--primary` ni el sidebar.

Para mostrar un preview con la marca dentro del CRM se envuelve en `BrandSurface` (clase `.brand-surface`), que
remapea `--primary`, `--secondary`, `--highlight` y `--ring` a los `--brand-*` solo dentro de ese bloque. Hoy lo usan
la pantalla de Marca y la pestaña de Apariencia del formulario web.

**El logo** sale siempre de la API (`logo_url`, `logo_url_oscuro`), nunca de un archivo del repo.

### Reglas de tokens

- **Hex solo en `src/index.css`.** Ningún componente TSX lleva un color literal; usa clases de token (`bg-primary`,
  `text-muted-foreground`, `bg-kind-email/15`).
- Tokens propios además de los de shadcn: `--primary-hover`, `--highlight`, `--success`, `--warning`, `--overlay`,
  `--shadow-ink`, `--shadow-raised`, `--shadow-modal`, `--kind-*` (tipos de actividad) y `--conector-*` (Claude,
  OpenAI, Gemini, solo para el well de esa pantalla).
- Tipografía: Geist Variable (`@fontsource-variable/geist`) para todo; `--font-heading` = `--font-sans`.
- Radio base `--radius: 0.5rem`; las escalas `sm` … `4xl` se derivan de él.

---

## Escala tipográfica

Utilidades de `index.css`. **No se baja la escala.**

| Clase | Tamaño | Peso | Uso |
|---|---|---|---|
| `text-page` | 28 px | semibold, tracking tight | Título de página y número de un KPI |
| `text-section` | 16 px | semibold | Título de sección y de un estado vacío |
| `text-ui` | 14 px | normal | Texto de interfaz, celdas |
| `text-ui-medium` | 14 px | medium | Primera columna de una tabla, nombres |
| `text-kicker` | 13 px | normal, `muted-foreground` | Descripciones, **labels de formulario**, cabeceras de tabla |
| `text-micro` | 12 px | medium, `muted-foreground` | Metadatos mínimos, "Próximamente" en el nav |

Los labels de formulario usan `text-kicker`, no `text-micro`. Inputs y selects miden `h-9`.

`PageHeader` (`src/components/page-header.tsx`) es la cabecera estándar: una barrita de degradado
`primary → highlight`, el título en `text-page` y la descripción en `text-kicker`, con la acción a la derecha (abajo en
móvil).

---

## Superficies y cards

| Clase / componente | Qué es |
|---|---|
| `surface-card` | `rounded-xl`, `border-border`, `bg-card`, sombra `--shadow-raised`. La base de cards y tablas |
| `surface-interactive` | Igual, con hover: borde `primary/30` y `--shadow-modal`. Para cards que navegan |
| `surface-muted` | Bloque secundario en `bg-muted/40` |
| `Card` (`ui/card.tsx`) | Primitiva shadcn con el mismo lenguaje (`rounded-xl`, borde, `shadow-raised`) |

En modo oscuro las sombras de superficie se apagan: el contraste lo dan el borde y el fondo.

### KPIs

`KpiCard` (`src/components/kpi-card.tsx`): `KindMark` tamaño `lg` (well de 44 px) + título en `text-kicker` + valor en
`text-page` con números tabulares + pista opcional. Tiene una densidad `tv` más compacta para `/tv`.

Una card solo de texto, tipo sello (nombre a 14 px, sin ícono), no se acepta.

---

## Badges de estado

`Badge` de `ui/badge.tsx`: pill `rounded-full`, altura 20 px.

| Variante | Para |
|---|---|
| `outline` | Neutro: borrador, sin asignar, inactivo |
| `success` | Positivo: aprobada, activo, conectado |
| `warning` | Atención: preparación, por vencer, pendiente |
| `destructive` | Negativo: rechazada, vencida, caído |

No se usan `default` ni `secondary` sólidos, ni un radio de botón. El patrón de referencia es `CotizacionEstadoBadge`
(`components/pipeline/`) y `AlertaEstadoBadge` (`components/alertas/`): un componente por enum que mapea estado → variante y
etiqueta, para que la tabla solo diga `<CotizacionEstadoBadge estado={...} />`.

---

## Tablas

- `Table` del sistema (`ui/table.tsx`): ya viene envuelta en `surface-card` con `overflow-x-auto`, texto a 14 px,
  cabeceras en `text-kicker`.
- Primera columna en `text-ui-medium`; el resto en `text-ui` o `text-muted-foreground`.
- `TableRow` trae `hover:bg-muted/50`. Si la fila navega, agrega `cursor-pointer`.
- En móvil la tabla hace scroll horizontal dentro de su card; nunca rompe el ancho de la página.
- Cero filas, o un filtro sin resultados, se muestra con `EmptyState`. **Nunca** una tabla en blanco.

---

## Estados vacíos

`EmptyState` (`src/components/empty-state.tsx`): well de 48 px en `bg-muted` con el ícono, título en `text-section`,
texto en `text-kicker` (máximo 320 px de ancho) y una acción opcional. Obligatorio cuando no hay datos.

Mientras carga, las pantallas usan `Skeleton` (`src/components/skeleton.tsx`, clase `animate-skeleton`) con la forma
aproximada del contenido.

---

## Íconos

Solo **Lucide**, siempre con `strokeWidth={1.75}`. Tres roles; fuera de ellos no se ponen íconos.

| Rol | Dónde | Regla |
|---|---|---|
| **Wayfinding** | Navegación y Configuración | Obligatorio en cada entrada del nav |
| **Kind** | Tipo de entidad de un enum cerrado (actividad, evento, modelo de tarifa, servicio del panel de salud, ...) | `KindMark` + catálogo `src/lib/*-visual.ts` |
| **Empty** | `EmptyState` | Obligatorio si no hay datos |

**Dónde no:** timestamps, labels de formulario, cada celda de una tabla, badges de estado. Tampoco emojis, logos de
marca (WhatsApp, Meet, Claude) ni otra librería de íconos.

### `KindMark` y los catálogos `*-visual.ts`

```
src/lib/actividad-visual.ts        TIPO_ACTIVIDAD_VISUAL   { icon, tone } por tipo
              │
              ▼
<KindMark icon={...} tone={...} size="md" />   well de color + ícono
```

- El archivo `*-visual.ts` es el **único** lugar donde se define el ícono y el color de cada tipo. Los componentes solo
  lo consumen; no eligen un ícono ni un tono por su cuenta.
- El color vive en el **well** del ícono (`bg-kind-llamada/15 text-kind-llamada`), nunca en la fila ni compitiendo con
  el badge de estado.
- Tamaños de `KindMark`: `sm` (28 px), `md` (32 px), `lg` (44 px). En tablas el default es **`md`**; `lg` es para KPIs.

Catálogos actuales: actividad, calendario, timeline, tarifa interna, salud, sugerencias de inicio y conectores (lista
completa en [Arquitectura del frontend](./15-arquitectura-frontend.md#_7-catalogos-visuales)). Para un enum nuevo se
crea su `*-visual.ts`; si necesita un color que no existe, se agrega el token en `index.css` (claro y oscuro).

---

## Móvil

| Regla | Cómo |
|---|---|
| Sin sidebar bajo `md` | `AppShell` muestra una barra superior con hamburguesa y el nav en un cajón; el sidebar de escritorio (`15.5rem`) solo existe desde `md` |
| Padding de página | `px-4` en móvil; `md:px-6` o `md:px-8` en escritorio según el ancho de la página |
| Filtros | Contenedor `filter-bar` y cada campo `filter-field`: ancho completo en teléfono, en fila desde `sm` |
| Tablas | Scroll horizontal dentro de la card |
| Bandeja | En teléfono se ve la lista **o** el hilo, no los dos |
| Cabecera | `PageHeader` apila título y acción |
| Safe area | La barra superior respeta `env(safe-area-inset-top)` |

---

## Modo oscuro

- `.dark` en `<html>` redefine todos los tokens de la capa app (fondo `#161616`, cards `#222221`, primary más claro).
  Los `--brand-*` no cambian: son de la organización.
- El selector (`ModeToggle`) ofrece claro, oscuro y sistema. La elección se guarda en `localStorage` (`prometio-theme`)
  y `public/theme-init.js` la aplica antes del primer render para evitar el destello claro.
- Claro y oscuro también se guardan en `perfil.tema_preferido`, así el tema sigue al usuario en otro equipo. «Sistema»
  queda solo en el navegador.
- Todo color nuevo se define en `:root` **y** en `.dark`.

---

## Navegación

- Las entradas del nav llevan su ícono de wayfinding.
- Lo que todavía no existe se marca "Próximamente" con texto `text-micro` en los tokens del sidebar, no con un chip
  `Badge`.
- `prefers-reduced-motion` desactiva las transiciones de superficie y la animación de volteo de las tarjetas del
  dashboard.

---

## Checklist para revisar una pantalla

- [ ] Título con `PageHeader` y escala sin reducir.
- [ ] Ningún hex en el TSX.
- [ ] Cards `rounded-xl` + borde + `shadow-raised` (o `surface-card`).
- [ ] KPIs con `KpiCard` o `KindMark lg` + número `text-page`.
- [ ] Estados con `Badge` pill (`outline` / `success` / `warning` / `destructive`).
- [ ] Tipos de enum con `KindMark` desde su `*-visual.ts`, `md` en tablas.
- [ ] `EmptyState` para cero filas y filtros sin resultado.
- [ ] Labels `text-kicker`, inputs `h-9`.
- [ ] Probada a 375 px: sin scroll horizontal de página, filtros a ancho completo, `px-4`.
- [ ] Probada en modo oscuro.
- [ ] Previews con colores del cliente dentro de `BrandSurface`.

Relacionado: [Arquitectura del frontend](./15-arquitectura-frontend.md), [Guía de UI original](./UI_GUIDE.md),
[Registro de decisiones](./decisiones.md).
