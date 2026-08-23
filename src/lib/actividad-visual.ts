/**
 * Catálogo Kind de actividad: el único lugar donde se define ícono y color por tipo.
 * Las pantallas renderizan `TipoActividadMark` / `KindMark`; no eligen Lucide ni tono por su cuenta.
 * El mismo contrato vale para otros enums (`src/lib/*-visual.ts`).
 */
import {
  ListTodo,
  Mail,
  MapPin,
  MessageCircle,
  PhoneCall,
  Video,
  type LucideIcon,
} from "lucide-react"

import type { TipoActividad } from "@/types/actividad"

export const TIPO_ACTIVIDAD_VISUAL: Record<
  TipoActividad,
  { icon: LucideIcon; tone: string }
> = {
  llamada: { icon: PhoneCall, tone: "bg-kind-llamada/15 text-kind-llamada" },
  whatsapp: { icon: MessageCircle, tone: "bg-kind-whatsapp/15 text-kind-whatsapp" },
  visita: { icon: MapPin, tone: "bg-kind-visita/15 text-kind-visita" },
  videollamada: { icon: Video, tone: "bg-kind-videollamada/15 text-kind-videollamada" },
  email: { icon: Mail, tone: "bg-kind-email/15 text-kind-email" },
  tarea_interna: { icon: ListTodo, tone: "bg-kind-tarea/15 text-kind-tarea" },
}
