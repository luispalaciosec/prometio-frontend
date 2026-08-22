export const SALUD_SERVICIOS = [
  "railway",
  "vercel",
  "supabase-db",
  "supabase-storage",
  "weasyprint",
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
}

export const SALUD_ESTADO_LABELS: Record<SaludEstado, string> = {
  operativo: "Operativo",
  degradado: "Degradado",
  caido: "Caído",
}
