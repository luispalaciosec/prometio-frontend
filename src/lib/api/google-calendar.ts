import { apiFetch } from "@/lib/api-client"
import type { EstadoCalendar } from "@/types/google-calendar"

export function getEstadoCalendar(): Promise<EstadoCalendar> {
  return apiFetch("/google/estado-calendar")
}

export function conectarCalendar(refreshToken: string): Promise<EstadoCalendar> {
  return apiFetch("/google/conectar-calendar", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}
