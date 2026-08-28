/**
 * Catálogo Kind de `tarifa_interna.modelo`. Las pantallas renderizan KindMark; no eligen Lucide ni tono.
 */
import { CalendarDays, Clock, Wallet, type LucideIcon } from "lucide-react"

import type { ModeloTarifa } from "@/types/tarifa-interna"

export const TARIFA_MODELO_VISUAL: Record<ModeloTarifa, { icon: LucideIcon; tone: string }> = {
  por_hora: { icon: Clock, tone: "bg-primary/15 text-primary" },
  por_sueldo: { icon: Wallet, tone: "bg-highlight/15 text-highlight" },
  por_evento: { icon: CalendarDays, tone: "bg-muted text-muted-foreground" },
}
