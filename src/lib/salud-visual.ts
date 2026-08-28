/**
 * Catálogo Kind de servicios de salud: el único lugar donde se define ícono por servicio.
 * Sin logos de marca. Las pantallas renderizan `KindMark`; no eligen Lucide por su cuenta.
 */
import {
  Bot,
  CircleHelp,
  Database,
  FileText,
  Globe,
  HardDrive,
  Mail,
  Server,
  Tent,
  Terminal,
  type LucideIcon,
} from "lucide-react"

import type { SaludServicioNombre } from "@/types/salud"

type SaludVisual = { icon: LucideIcon; tone: string }

export const SALUD_SERVICIO_VISUAL: Record<SaludServicioNombre, SaludVisual> = {
  railway: { icon: Server, tone: "bg-primary/15 text-primary" },
  vercel: { icon: Globe, tone: "bg-highlight/15 text-highlight" },
  "supabase-db": { icon: Database, tone: "bg-success/15 text-success" },
  "supabase-storage": { icon: HardDrive, tone: "bg-kind-email/15 text-kind-email" },
  weasyprint: { icon: FileText, tone: "bg-kind-tarea/15 text-kind-tarea" },
  basecamp: { icon: Tent, tone: "bg-kind-visita/15 text-kind-visita" },
  apify: { icon: Bot, tone: "bg-kind-llamada/15 text-kind-llamada" },
  resend: { icon: Mail, tone: "bg-kind-email/15 text-kind-email" },
  mcp: { icon: Terminal, tone: "bg-kind-videollamada/15 text-kind-videollamada" },
}

const SALUD_SERVICIO_FALLBACK: SaludVisual = {
  icon: CircleHelp,
  tone: "bg-muted text-muted-foreground",
}

export function visualSaludServicio(nombre: string): SaludVisual {
  if (Object.hasOwn(SALUD_SERVICIO_VISUAL, nombre)) {
    return SALUD_SERVICIO_VISUAL[nombre as SaludServicioNombre]
  }
  return SALUD_SERVICIO_FALLBACK
}
