/**
 * Fachada de alertas. Apunta al backend real (GET /alertas).
 */
import { refrescarEtiquetasOportunidad } from "@/lib/api/oportunidad"
import { apiFetch } from "@/lib/api-client"
import type { Alerta } from "@/types/alerta"
import type { Perfil } from "@/types/perfil"

export async function listAlertas(_perfil?: Perfil): Promise<Alerta[]> {
  const [rows] = await Promise.all([
    apiFetch<Alerta[]>("/alertas"),
    refrescarEtiquetasOportunidad(),
  ])
  return rows
}
