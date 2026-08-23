/**
 * Catálogo Kind de servicios de salud: el único lugar donde se define ícono por servicio.
 * Sin logos de marca. Las pantallas renderizan `KindMark`; no eligen Lucide por su cuenta.
 */
import { Database, FileText, Globe, HardDrive, Server, type LucideIcon } from "lucide-react"

import type { SaludServicioNombre } from "@/types/salud"

export const SALUD_SERVICIO_VISUAL: Record<SaludServicioNombre, { icon: LucideIcon; tone: string }> =
  {
    railway: { icon: Server, tone: "bg-primary/15 text-primary" },
    vercel: { icon: Globe, tone: "bg-highlight/15 text-highlight" },
    "supabase-db": { icon: Database, tone: "bg-success/15 text-success" },
    "supabase-storage": { icon: HardDrive, tone: "bg-kind-email/15 text-kind-email" },
    weasyprint: { icon: FileText, tone: "bg-kind-tarea/15 text-kind-tarea" },
  }
