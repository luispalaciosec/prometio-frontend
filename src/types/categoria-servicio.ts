import type { Pilar } from "@/types/servicio"

export type CategoriaServicio = {
  id: string
  organizacion_id: string
  nombre: string
  pilar: Pilar | null
}
