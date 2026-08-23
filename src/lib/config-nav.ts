import type { LucideIcon } from "lucide-react"
import {
  CircleOff,
  Clock,
  Code2,
  FileText,
  ListOrdered,
  Package,
  Palette,
  Percent,
  Plug,
  Search,
  Target,
} from "lucide-react"

export type ConfigNavItem = {
  to: string
  label: string
  body: string
  icon: LucideIcon
}

export type ConfigNavGroup = {
  title: string
  items: ConfigNavItem[]
}

export const CONFIG_NAV_GROUPS: ConfigNavGroup[] = [
  {
    title: "Catálogo y precios",
    items: [
      {
        to: "/configuracion/servicios",
        label: "Servicios",
        body: "Catálogo y wizard de creación (borrador → activo).",
        icon: Package,
      },
      {
        to: "/configuracion/tarifas-internas",
        label: "Tarifas internas",
        body: "Costo/hora por rol. Nunca por persona.",
        icon: Clock,
      },
      {
        to: "/configuracion/tipos-documento",
        label: "Tipos de documento",
        body: "Catálogo abierto asociado a cada servicio.",
        icon: FileText,
      },
    ],
  },
  {
    title: "Reglas de negocio",
    items: [
      {
        to: "/configuracion/etapas",
        label: "Etapas y alertas",
        body: "probabilidad_cierre_default_pct, umbral_alerta_horas y multiplicador_escalamiento_supervisor.",
        icon: ListOrdered,
      },
      {
        to: "/configuracion/margenes",
        label: "Márgenes e impuestos",
        body: "margen_agencia_default_pct, comisión de agencia (rango) y tasa_impuesto_pct.",
        icon: Percent,
      },
      {
        to: "/configuracion/meta-comercial",
        label: "Meta comercial",
        body: "Meta de ventas total y por vendedor. Contrato con el backend todavía no cerrado.",
        icon: Target,
      },
      {
        to: "/configuracion/causas-perdida",
        label: "Causas de pérdida",
        body: "Catálogo usado en Cierre Perdido.",
        icon: CircleOff,
      },
    ],
  },
  {
    title: "Marca e integraciones",
    items: [
      {
        to: "/configuracion/marca",
        label: "Marca",
        body: "Logo y colores de la organización. POST /organizacion/logo y PATCH /organizacion.",
        icon: Palette,
      },
      {
        to: "/configuracion/conectores",
        label: "Conectores",
        body: "Claude, OpenAI y Gemini. Sin conexión activa todavía.",
        icon: Plug,
      },
      {
        to: "/configuracion/formulario-web",
        label: "Formulario web",
        body: "Snippet embebible para landings. POST /formulario.",
        icon: Code2,
      },
    ],
  },
  {
    title: "Sitio",
    items: [
      {
        to: "/seo",
        label: "SEO",
        body: "Crawl técnico y Core Web Vitals. Campo y laboratorio se muestran aparte.",
        icon: Search,
      },
    ],
  },
]
