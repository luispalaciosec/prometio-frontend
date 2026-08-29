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
        body: "Probabilidad de cierre, umbral de alerta en horas y multiplicador de escalamiento al supervisor.",
        icon: ListOrdered,
      },
      {
        to: "/configuracion/margenes",
        label: "Márgenes e impuestos",
        body: "Margen de agencia, rango de comisión y tasa de impuesto.",
        icon: Percent,
      },
      {
        to: "/configuracion/meta-comercial",
        label: "Meta comercial",
        body: "Meta de la agencia y por vendedor, mensual o trimestral.",
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
        body: "Logo claro y oscuro, colores y contacto de la organización.",
        icon: Palette,
      },
      {
        to: "/configuracion/conectores",
        label: "Conectores",
        body: "Claude por MCP stdio local. ChatGPT y Gemini todavía no.",
        icon: Plug,
      },
      {
        to: "/configuracion/formulario-web",
        label: "Formulario web",
        body: "Snippet para landings, campos fijos y URL de conexión.",
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
