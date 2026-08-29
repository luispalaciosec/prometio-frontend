import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"

import { CotizacionConstructor } from "@/components/pipeline/CotizacionConstructor"
import { CotizacionLista } from "@/components/pipeline/CotizacionLista"
import { Button } from "@/components/ui/button"
import {
  createCotizacion,
  getCotizacion,
  listCotizaciones,
  listProveedores,
} from "@/lib/api/cotizacion"
import { listDocumentosAlcance } from "@/lib/api/documento-alcance"
import { getConfiguracionGeneral, listServicios } from "@/lib/config-api"
import { useAuthStore } from "@/store/auth-store"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { CotizacionConLineas } from "@/types/cotizacion"
import type { DocumentoAlcance } from "@/types/documento-alcance"
import type { Proveedor } from "@/types/proveedor"
import type { Servicio } from "@/types/servicio"

export function CotizacionesSection({
  oportunidadId,
  ejecutivoId,
}: {
  oportunidadId: string
  ejecutivoId: string
}) {
  const perfil = useAuthStore((state) => state.perfil)
  const [searchParams] = useSearchParams()
  const cotizacionQuery = searchParams.get("cotizacion")
  const documentoQuery = searchParams.get("documento")
  const [cotizaciones, setCotizaciones] = useState<CotizacionConLineas[] | null>(null)
  const [abiertaId, setAbiertaId] = useState<string | null>(cotizacionQuery)
  const [abierta, setAbierta] = useState<CotizacionConLineas | null>(null)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [config, setConfig] = useState<ConfiguracionGeneral | null>(null)
  const [docsPorCotizacion, setDocsPorCotizacion] = useState<Record<string, DocumentoAlcance[]>>({})

  const reloadLista = useCallback(async () => {
    if (!perfil) {
      return
    }
    setCotizaciones(await listCotizaciones({ oportunidad_id: oportunidadId }))
  }, [perfil, oportunidadId])

  const reloadAbierta = useCallback(async () => {
    if (!perfil || !abiertaId) {
      setAbierta(null)
      return
    }
    setAbierta(await getCotizacion(abiertaId, perfil))
    await reloadLista()
  }, [perfil, abiertaId, reloadLista])

  useEffect(() => {
    void Promise.all([listServicios(), listProveedores(), getConfiguracionGeneral()]).then(
      ([catalogo, pvs, general]) => {
        setServicios(catalogo)
        setProveedores(pvs)
        setConfig(general)
      },
    )
  }, [])

  useEffect(() => {
    if (cotizacionQuery) {
      setAbiertaId(cotizacionQuery)
    }
  }, [cotizacionQuery])

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
    if (!cotizacionQuery) {
      return
    }
    const target = documentoQuery ? "documento-alcance" : "cotizaciones"
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [cotizacionQuery, documentoQuery])

  useEffect(() => {
    void reloadLista().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las cotizaciones.")
      setCotizaciones([])
    })
  }, [reloadLista])

  useEffect(() => {
    void reloadAbierta().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la cotización.")
    })
  }, [reloadAbierta])

  async function nueva() {
    if (!perfil) {
      return
    }
    try {
      const created = await createCotizacion(oportunidadId, perfil)
      setAbiertaId(created.id)
      await reloadLista()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la cotización.")
    }
  }

  return (
    <section id="cotizaciones" className="rounded-xl p-4 ring-1 ring-border">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-section">Cotizaciones</h2>
        <Button type="button" size="sm" onClick={() => void nueva()}>
          Nueva cotización
        </Button>
      </div>
      <CotizacionLista
        cotizaciones={cotizaciones ?? []}
        cargando={cotizaciones == null}
        abiertaId={abiertaId}
        docsPorCotizacion={docsPorCotizacion}
        onAbrir={setAbiertaId}
        onNueva={() => void nueva()}
      />
      {abierta && perfil ? (
        <CotizacionConstructor
          cotizacion={abierta}
          perfil={perfil}
          ejecutivoId={ejecutivoId}
          servicios={servicios}
          proveedores={proveedores}
          config={config}
          documentoIdInicial={documentoQuery}
          documentos={docsPorCotizacion[abierta.id]}
          onChange={reloadAbierta}
          onDocumentosChange={(rows) =>
            setDocsPorCotizacion((prev) => ({ ...prev, [abierta.id]: rows }))
          }
        />
      ) : null}
    </section>
  )
}
