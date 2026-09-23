import { useCallback, useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import { PageHeader } from "@/components/page-header"
import { CotizacionConstructor } from "@/components/pipeline/CotizacionConstructor"
import { OportunidadValor } from "@/components/pipeline/OportunidadValor"
import { TableSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-client"
import { getCotizacion, listProveedores } from "@/lib/api/cotizacion"
import { listDocumentosAlcance } from "@/lib/api/documento-alcance"
import {
  OportunidadFueraDeAlcanceError,
  OportunidadNotFoundError,
  getOportunidad,
} from "@/lib/api/oportunidad"
import { getConfiguracionGeneral, listEtapasPipeline, listServicios } from "@/lib/config-api"
import { formatMoney } from "@/lib/costo-interno"
import { useAuthStore } from "@/store/auth-store"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { CotizacionConLineas } from "@/types/cotizacion"
import type { DocumentoAlcance } from "@/types/documento-alcance"
import type { OportunidadKanban } from "@/types/oportunidad"
import type { Proveedor } from "@/types/proveedor"
import type { Servicio } from "@/types/servicio"

type LoadState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | {
      status: "ok"
      cotizacion: CotizacionConLineas
      oportunidad: OportunidadKanban
      etapaNombre: string
      servicios: Servicio[]
      proveedores: Proveedor[]
      config: ConfiguracionGeneral | null
      documentos: DocumentoAlcance[]
    }

export function CotizacionPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const documentoQuery = searchParams.get("documento")
  const perfil = useAuthStore((state) => state.perfil)
  const [state, setState] = useState<LoadState>({ status: "loading" })

  const reloadCotizacion = useCallback(async () => {
    if (!id || !perfil) {
      return
    }
    const cotizacion = await getCotizacion(id, perfil)
    const documentos = await listDocumentosAlcance(id)
    setState((prev) => (prev.status === "ok" ? { ...prev, cotizacion, documentos } : prev))
  }, [id, perfil])

  useEffect(() => {
    if (!id || !perfil) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const cotizacion = await getCotizacion(id, perfil)
        const [oportunidad, etapas, servicios, proveedores, config, documentos] =
          await Promise.all([
            getOportunidad(cotizacion.oportunidad_id, perfil),
            listEtapasPipeline(),
            listServicios(),
            listProveedores(),
            getConfiguracionGeneral(),
            listDocumentosAlcance(id),
          ])
        if (cancelled) {
          return
        }
        const etapaNombre =
          etapas.find((etapa) => etapa.codigo === oportunidad.etapa)?.nombre ??
          oportunidad.etapa
        setState({
          status: "ok",
          cotizacion,
          oportunidad,
          etapaNombre,
          servicios,
          proveedores,
          config,
          documentos,
        })
      } catch (error) {
        if (cancelled) {
          return
        }
        if (error instanceof ApiError && error.status === 404) {
          setState({ status: "not_found" })
          return
        }
        if (error instanceof OportunidadNotFoundError || error instanceof OportunidadFueraDeAlcanceError) {
          setState({ status: "not_found" })
          return
        }
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "No se pudo cargar.",
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, perfil])

  useEffect(() => {
    if (!documentoQuery) {
      return
    }
    window.requestAnimationFrame(() => {
      document.getElementById("documento-alcance")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    })
  }, [documentoQuery, state.status])

  if (!id) {
    return <CotizacionError title="Cotización no encontrada" />
  }

  if (state.status === "loading") {
    return <TableSkeleton />
  }

  if (state.status === "not_found") {
    return <CotizacionError title="Cotización no encontrada" />
  }

  if (state.status === "error") {
    return <CotizacionError title="No se pudo cargar" body={state.message} />
  }

  const { cotizacion, oportunidad, etapaNombre, servicios, proveedores, config, documentos } =
    state

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
      <div className="min-w-0">
        <PageHeader
          title={cotizacion.numero}
          description={
            <>
              <Link
                to={`/pipeline/${oportunidad.id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {oportunidad.contacto.nombre_completo}
              </Link>
              <span className="text-muted-foreground">·</span>
              <span>{oportunidad.empresa.nombre}</span>
              <span className="text-muted-foreground">·</span>
              <span>{etapaNombre}</span>
            </>
          }
          action={
            <Button asChild variant="outline">
              <Link to={`/pipeline/${oportunidad.id}`}>Volver al deal</Link>
            </Button>
          }
        />
        {perfil ? (
          <CotizacionConstructor
            cotizacion={cotizacion}
            perfil={perfil}
            ejecutivoId={oportunidad.ejecutivo.id}
            servicios={servicios}
            proveedores={proveedores}
            config={config}
            documentoIdInicial={documentoQuery}
            documentos={documentos}
            onChange={reloadCotizacion}
            onDocumentosChange={(rows) =>
              setState((prev) =>
                prev.status === "ok" ? { ...prev, documentos: rows } : prev,
              )
            }
          />
        ) : null}
      </div>
      <aside className="surface-card top-4 space-y-4 p-4 lg:sticky">
        <h2 className="text-section">Contexto del deal</h2>
        <dl className="space-y-3">
          <ContextField label="Contacto" value={oportunidad.contacto.nombre_completo} />
          <ContextField label="Empresa" value={oportunidad.empresa.nombre} />
          <ContextField label="Ejecutivo" value={oportunidad.ejecutivo.nombre_completo} />
          <ContextField
            label="Interés comercial"
            value={oportunidad.categoria_interes_nombre ?? "Sin clasificar"}
          />
          <div className="flex flex-col gap-1">
            <dt className="text-micro">Valor oportunidad</dt>
            <dd className="text-ui">
              <OportunidadValor
                valor_referencial={oportunidad.valor_referencial}
                valor_cotizado={oportunidad.valor_cotizado}
              />
            </dd>
          </div>
        </dl>
        <div className="border-t border-border pt-4">
          <p className="text-micro">Total cotización</p>
          <p className="text-page tabular-nums">{formatMoney(cotizacion.total_cotizacion)}</p>
          <p className="mt-1 text-kicker text-muted-foreground">
            {cotizacion.lineas.length}{" "}
            {cotizacion.lineas.length === 1 ? "línea" : "líneas"}
          </p>
        </div>
      </aside>
    </div>
  )
}

function ContextField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-micro">{label}</dt>
      <dd className="text-ui text-muted-foreground">{value}</dd>
    </div>
  )
}

function CotizacionError({ title, body }: { title: string; body?: string }) {
  return (
    <div className="max-w-md space-y-3">
      <h1 className="text-page">{title}</h1>
      {body ? <p className="text-kicker">{body}</p> : null}
      <Button asChild variant="outline">
        <Link to="/cotizaciones">Ir a cotizaciones</Link>
      </Button>
    </div>
  )
}
