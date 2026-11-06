import { useEffect, useState } from "react"

import { listLeadsPendientes } from "@/lib/api/atencion-lead"
import type { LeadPendiente } from "@/types/atencion-lead"

const INTERVALO_MS = 60_000

/**
 * Leads sin primer contacto, refrescados cada minuto mientras la pestaña está visible.
 * Si un refresco falla se conservan los últimos datos; `error` solo importa cuando `leads` sigue en null.
 */
export function useLeadsPendientes() {
  const [leads, setLeads] = useState<LeadPendiente[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function cargar() {
      try {
        const filas = await listLeadsPendientes()
        if (!cancelled) {
          setLeads(filas)
          setError(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
        }
      }
    }

    function refrescarSiVisible() {
      if (!document.hidden) {
        void cargar()
      }
    }

    void cargar()
    const intervalo = window.setInterval(refrescarSiVisible, INTERVALO_MS)
    document.addEventListener("visibilitychange", refrescarSiVisible)
    return () => {
      cancelled = true
      window.clearInterval(intervalo)
      document.removeEventListener("visibilitychange", refrescarSiVisible)
    }
  }, [])

  return { leads, error }
}
