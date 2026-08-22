import { apiFetch } from "@/lib/api-client"
import type { SaludSistema } from "@/types/salud"

export function getSalud(): Promise<SaludSistema> {
  return apiFetch("/salud")
}
