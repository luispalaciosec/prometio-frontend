import { useEffect, useMemo, useState } from "react"

import { getProyeccion } from "@/lib/api/contrato-recurrente"
import { listOportunidadesLookup } from "@/lib/api/oportunidad"
import { listEtapasPipeline } from "@/lib/config-api"
import type { ProyeccionMes } from "@/types/contrato-recurrente"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { Oportunidad } from "@/types/oportunidad"

/** Ventana de proyección que usa el dashboard: 12 meses atrás, el actual y 12 adelante. */
export const DASHBOARD_MESES_ATRAS = 12
export const DASHBOARD_MESES_ADELANTE = 13

export type DashboardDatos = {
  /** Activas. null = cargando; [] = sin datos o error. Ya filtradas por lo que el backend deja ver. */
  oportunidades: Oportunidad[] | null
  /** Activas e inactivas: para resolver contacto/empresa de cotizaciones viejas. */
  todasOportunidades: Oportunidad[] | null
  etapas: EtapaPipeline[] | null
  proyeccion: ProyeccionMes[] | null
}

/**
 * Datos extra del dashboard que no vienen en /dashboard/kpis. Cada fuente falla por separado:
 * un error deja esa lista vacía y la sección que la usa muestra su vacío.
 */
export function useDashboardDatos(): DashboardDatos {
  const [todasOportunidades, setTodasOportunidades] = useState<Oportunidad[] | null>(null)
  const [etapas, setEtapas] = useState<EtapaPipeline[] | null>(null)
  const [proyeccion, setProyeccion] = useState<ProyeccionMes[] | null>(null)

  useEffect(() => {
    let cancelled = false
    function cargar<T>(promesa: Promise<T[]>, set: (rows: T[]) => void) {
      void promesa
        .then((rows) => {
          if (!cancelled) {
            set(rows)
          }
        })
        .catch(() => {
          if (!cancelled) {
            set([])
          }
        })
    }
    cargar(listOportunidadesLookup(), setTodasOportunidades)
    cargar(listEtapasPipeline(), setEtapas)
    cargar(
      getProyeccion({ meses: DASHBOARD_MESES_ADELANTE, meses_atras: DASHBOARD_MESES_ATRAS }),
      setProyeccion,
    )
    return () => {
      cancelled = true
    }
  }, [])

  const oportunidades = useMemo(
    () => todasOportunidades?.filter((row) => row.activo) ?? null,
    [todasOportunidades],
  )

  return { oportunidades, todasOportunidades, etapas, proyeccion }
}
