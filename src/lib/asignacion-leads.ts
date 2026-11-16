import { formatDateOnly } from "@/lib/datetime-local"
import type { PersonaAsignacion } from "@/types/asignacion-leads"

/** Por qué una persona no recibe leads ahora, o null si está disponible. Solo para mostrar: decide el backend. */
export function motivoNoDisponible(persona: PersonaAsignacion): string | null {
  if (persona.disponible) {
    return null
  }
  if (!persona.activo) {
    return "Inactivo"
  }
  if (!persona.recibe_leads) {
    return "No recibe leads"
  }
  if (persona.leads_pausado_hasta) {
    return `En pausa hasta el ${formatDateOnly(persona.leads_pausado_hasta)}`
  }
  if (persona.tope_pendientes != null && persona.pendientes_actuales >= persona.tope_pendientes) {
    return "Llegó a su tope"
  }
  return "No disponible"
}

export function etiquetaEquipo(persona: Pick<PersonaAsignacion, "equipo" | "rol_ventas">): string {
  if (persona.equipo === "administrativo") {
    return "Administrativo"
  }
  return persona.rol_ventas === "supervisor" ? "Ventas · supervisor" : "Ventas · vendedor"
}
