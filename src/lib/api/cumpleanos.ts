import { apiFetch } from "@/lib/api-client"
import type { CumpleanosProximo } from "@/types/cumpleanos"

export function listCumpleanosProximos(): Promise<CumpleanosProximo[]> {
  return apiFetch("/cumpleanos-proximos")
}
