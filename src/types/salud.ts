export const SALUD_SERVICIOS = [
  "railway",
  "vercel",
  "supabase-db",
  "supabase-storage",
  "weasyprint",
  "basecamp",
  "apify",
  "resend",
  "mcp",
] as const

export type SaludServicioNombre = (typeof SALUD_SERVICIOS)[number]

export const SALUD_ESTADOS = ["operativo", "degradado", "caido"] as const

export type SaludEstado = (typeof SALUD_ESTADOS)[number]

export type SaludServicio = {
  nombre: SaludServicioNombre
  estado: SaludEstado
  latencia_ms: number | null
}

export type SaludSistema = {
  servicios: SaludServicio[]
  verificado_en: string
}

export const SALUD_SERVICIO_LABELS: Record<SaludServicioNombre, string> = {
  railway: "Railway",
  vercel: "Vercel",
  "supabase-db": "Supabase DB",
  "supabase-storage": "Supabase Storage",
  weasyprint: "WeasyPrint",
  basecamp: "Basecamp",
  apify: "Apify",
  resend: "Resend",
  mcp: "MCP",
}

export function etiquetaSaludServicio(nombre: string): string {
  return nombre in SALUD_SERVICIO_LABELS
    ? SALUD_SERVICIO_LABELS[nombre as SaludServicioNombre]
    : nombre
}

export const SALUD_ESTADO_LABELS: Record<SaludEstado, string> = {
  operativo: "Operativo",
  degradado: "Degradado",
  caido: "Caído",
}
