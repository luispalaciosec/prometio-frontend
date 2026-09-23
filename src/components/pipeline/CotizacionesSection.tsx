import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { CotizacionLista } from "@/components/pipeline/CotizacionLista"
import { Button } from "@/components/ui/button"
import { createCotizacion, listCotizaciones } from "@/lib/api/cotizacion"
import { rutaConstructorCotizacion } from "@/lib/cotizacion-rutas"
import { listDocumentosAlcance } from "@/lib/api/documento-alcance"
import { useAuthStore } from "@/store/auth-store"
import type { CotizacionConLineas } from "@/types/cotizacion"
import type { DocumentoAlcance } from "@/types/documento-alcance"

export function CotizacionesSection({ oportunidadId }: { oportunidadId: string }) {
  const navigate = useNavigate()
  const perfil = useAuthStore((state) => state.perfil)
  const [cotizaciones, setCotizaciones] = useState<CotizacionConLineas[] | null>(null)
  const [docsPorCotizacion, setDocsPorCotizacion] = useState<Record<string, DocumentoAlcance[]>>({})

  const reloadLista = useCallback(async () => {
    if (!perfil) {
      return
    }
    setCotizaciones(await listCotizaciones({ oportunidad_id: oportunidadId }))
  }, [perfil, oportunidadId])

  useEffect(() => {
    if (!cotizaciones) {
      return
    }
    let cancelled = false
    void Promise.all(
      cotizaciones.map(async (row) => [row.id, await listDocumentosAlcance(row.id)] as const),
    )
      .then((pares) => {
        if (!cancelled) {
          setDocsPorCotizacion(Object.fromEntries(pares))
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudieron cargar los documentos de alcance.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [cotizaciones])

  useEffect(() => {
    void reloadLista().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las cotizaciones.")
      setCotizaciones([])
    })
  }, [reloadLista])

  function abrir(cotizacionId: string) {
    navigate(rutaConstructorCotizacion(cotizacionId))
  }

  async function nueva() {
    if (!perfil) {
      return
    }
    try {
      const created = await createCotizacion(oportunidadId, perfil)
      navigate(rutaConstructorCotizacion(created.id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la cotización.")
    }
  }

  return (
    <section id="cotizaciones" className="surface-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-section">Cotizaciones</h2>
        <Button type="button" size="sm" onClick={() => void nueva()}>
          Nueva cotización
        </Button>
      </div>
      <CotizacionLista
        cotizaciones={cotizaciones ?? []}
        cargando={cotizaciones == null}
        abiertaId={null}
        docsPorCotizacion={docsPorCotizacion}
        onAbrir={abrir}
        onNueva={() => void nueva()}
      />
    </section>
  )
}
