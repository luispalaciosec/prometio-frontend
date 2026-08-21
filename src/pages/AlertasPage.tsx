import { useEffect, useState } from "react"
import { toast } from "sonner"

import { AlertaLista, type AlertaVista } from "@/components/alertas/AlertaLista"
import { PageHeader } from "@/components/page-header"
import { listAlertas } from "@/lib/api/alerta"
import {
  etiquetaContacto,
  etiquetaEjecutivo,
  etiquetaEmpresa,
  puedeVerEquipo,
} from "@/lib/api/oportunidad"
import { listEtapasPipeline } from "@/lib/config-api"
import { useAuthStore } from "@/store/auth-store"
import type { EtapaPipeline } from "@/types/etapa-pipeline"

export function AlertasPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const [alertas, setAlertas] = useState<AlertaVista[] | null>(null)
  const [etapas, setEtapas] = useState<EtapaPipeline[]>([])

  useEffect(() => {
    if (!perfil) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const [rows, etapas] = await Promise.all([listAlertas(perfil), listEtapasPipeline()])
        if (cancelled) {
          return
        }
        const nombreEtapa = new Map(etapas.map((etapa) => [etapa.codigo, etapa.nombre]))
        setEtapas(etapas)
        setAlertas(
          rows.map((row) => ({
            ...row,
            contactoNombre: etiquetaContacto(row.contacto_id),
            empresaNombre: etiquetaEmpresa(row.empresa_id),
            ejecutivoNombre: etiquetaEjecutivo(row.ejecutivo_id, perfil),
            etapaNombre: nombreEtapa.get(row.etapa) ?? row.etapa,
          })),
        )
      } catch (error) {
        if (cancelled) {
          return
        }
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar las alertas.")
        setAlertas([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [perfil])

  return (
    <>
      <PageHeader
        title="Alertas"
        description="Oportunidades que cruzaron el umbral de estancamiento."
      />
      {alertas == null ? (
        <p className="text-sm text-muted-foreground">Cargando alertas…</p>
      ) : (
        <AlertaLista
          alertas={alertas}
          etapas={etapas}
          mostrarEjecutivo={Boolean(perfil && puedeVerEquipo(perfil))}
        />
      )}
    </>
  )
}
