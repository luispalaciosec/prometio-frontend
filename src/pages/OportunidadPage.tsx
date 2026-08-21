import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import { ActividadesSection } from "@/components/pipeline/ActividadesSection"
import { CotizacionesSection } from "@/components/pipeline/CotizacionesSection"
import { OportunidadDetalle } from "@/components/pipeline/OportunidadDetalle"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  OportunidadFueraDeAlcanceError,
  OportunidadNotFoundError,
  getOportunidad,
} from "@/lib/api/oportunidad"
import { listCausasPerdida, listEtapasPipeline, listServicios } from "@/lib/config-api"
import { useAuthStore } from "@/store/auth-store"
import type { OportunidadKanban } from "@/types/oportunidad"

type LoadState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "fuera_de_alcance" }
  | { status: "error"; message: string }
  | {
      status: "ok"
      oportunidad: OportunidadKanban
      etapaNombre: string
      servicios: { id: string; nombre: string }[]
      causaPrincipal: string | null
      causaSecundaria: string | null
    }

export function OportunidadPage() {
  const { id } = useParams()
  const perfil = useAuthStore((state) => state.perfil)
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    if (!id || !perfil) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const [oportunidad, etapas, servicios, causas] = await Promise.all([
          getOportunidad(id, perfil),
          listEtapasPipeline(),
          listServicios(),
          listCausasPerdida(),
        ])
        if (cancelled) {
          return
        }
        const etapaNombre =
          etapas.find((etapa) => etapa.codigo === oportunidad.etapa)?.nombre ??
          oportunidad.etapa
        setState({
          status: "ok",
          oportunidad,
          etapaNombre,
          servicios: oportunidad.servicios_ids.map((servicioId) => ({
            id: servicioId,
            nombre:
              servicios.find((servicio) => servicio.id === servicioId)?.nombre ??
              servicioId,
          })),
          causaPrincipal:
            causas.find((causa) => causa.id === oportunidad.causa_perdida_principal_id)
              ?.nombre ?? null,
          causaSecundaria:
            causas.find((causa) => causa.id === oportunidad.causa_perdida_secundaria_id)
              ?.nombre ?? null,
        })
      } catch (error) {
        if (cancelled) {
          return
        }
        if (error instanceof OportunidadNotFoundError) {
          setState({ status: "not_found" })
          return
        }
        if (error instanceof OportunidadFueraDeAlcanceError) {
          setState({ status: "fuera_de_alcance" })
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

  if (!id) {
    return <OportunidadError title="Oportunidad no encontrada" />
  }

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Cargando oportunidad…</p>
  }

  if (state.status === "not_found") {
    return <OportunidadError title="Oportunidad no encontrada" />
  }

  if (state.status === "fuera_de_alcance") {
    return (
      <OportunidadError
        title="Fuera de alcance"
        body="No tienes acceso a esta oportunidad."
      />
    )
  }

  if (state.status === "error") {
    return <OportunidadError title="No se pudo cargar" body={state.message} />
  }

  return (
    <>
      <PageHeader
        title={state.oportunidad.contacto.nombre_completo}
        description={state.oportunidad.empresa.nombre}
        action={
          <Button asChild variant="outline">
            <Link to="/pipeline">Volver al pipeline</Link>
          </Button>
        }
      />
      <OportunidadDetalle
        oportunidad={state.oportunidad}
        etapaNombre={state.etapaNombre}
        servicios={state.servicios}
        causaPrincipal={state.causaPrincipal}
        causaSecundaria={state.causaSecundaria}
      />
      <div className="mt-10">
        <ActividadesSection
          oportunidadId={state.oportunidad.id}
          contactoId={state.oportunidad.contacto.id}
        />
      </div>
      <div className="mt-10">
        <CotizacionesSection
          oportunidadId={state.oportunidad.id}
          ejecutivoId={state.oportunidad.ejecutivo.id}
        />
      </div>
    </>
  )
}

function OportunidadError({ title, body }: { title: string; body?: string }) {
  return (
    <div className="max-w-md space-y-3">
      <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
      {body ? <p className="text-sm text-muted-foreground">{body}</p> : null}
      <Button asChild variant="outline">
        <Link to="/pipeline">Volver al pipeline</Link>
      </Button>
    </div>
  )
}
