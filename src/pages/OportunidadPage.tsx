import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { OportunidadSkeleton } from "@/components/skeleton"
import { ActividadesSection } from "@/components/pipeline/ActividadesSection"
import { CotizacionesSection } from "@/components/pipeline/CotizacionesSection"
import { OportunidadDetalle } from "@/components/pipeline/OportunidadDetalle"
import { OportunidadEditarDialog } from "@/components/pipeline/OportunidadEditarDialog"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-client"
import { listContactos } from "@/lib/api/contacto"
import { listEmpresas } from "@/lib/api/empresa"
import {
  OportunidadFueraDeAlcanceError,
  OportunidadNotFoundError,
  desactivarOportunidad,
  getOportunidad,
  reactivarOportunidad,
  updateOportunidad,
} from "@/lib/api/oportunidad"
import { puedeVerEquipo } from "@/lib/pipeline-acceso"
import { listCausasPerdida, listEtapasPipeline, listServicios } from "@/lib/config-api"
import { useAuthStore } from "@/store/auth-store"
import type { Contacto } from "@/types/contacto"
import type { Empresa } from "@/types/empresa"
import type { OportunidadKanban, OportunidadUpdate } from "@/types/oportunidad"
import type { Servicio } from "@/types/servicio"

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
      catalogoServicios: Servicio[]
      causaPrincipal: string | null
      causaSecundaria: string | null
    }

export function OportunidadPage() {
  const { id } = useParams()
  const perfil = useAuthStore((state) => state.perfil)
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [editarOpen, setEditarOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])

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
          catalogoServicios: servicios,
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
    return <OportunidadSkeleton />
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

  async function abrirEdicion() {
    try {
      const [listaContactos, listaEmpresas] = await Promise.all([
        listContactos(),
        listEmpresas(),
      ])
      setContactos(listaContactos)
      setEmpresas(listaEmpresas)
      setEditarOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir la edición.")
    }
  }

  async function toggleActivo() {
    if (!id || !perfil || state.status !== "ok") {
      return
    }
    setCambiandoEstado(true)
    try {
      const actualizada = state.oportunidad.activo
        ? await desactivarOportunidad(id, perfil)
        : await reactivarOportunidad(id, perfil)
      setState({ ...state, oportunidad: actualizada })
      toast.success(actualizada.activo ? "Oportunidad reactivada." : "Oportunidad desactivada.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "No se pudo cambiar el estado.")
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function guardar(input: OportunidadUpdate) {
    if (!id || !perfil || state.status !== "ok") {
      return
    }
    setGuardando(true)
    try {
      const actualizada = await updateOportunidad(id, input, perfil)
      const servicios = state.catalogoServicios
      setState({
        ...state,
        oportunidad: actualizada,
        servicios: actualizada.servicios_ids.map((servicioId) => ({
          id: servicioId,
          nombre: servicios.find((servicio) => servicio.id === servicioId)?.nombre ?? servicioId,
        })),
      })
      setEditarOpen(false)
      toast.success("Oportunidad actualizada.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <PageHeader
        title={state.oportunidad.contacto.nombre_completo}
        description={
          <>
            <span>{state.oportunidad.empresa.nombre}</span>
            {!state.oportunidad.activo ? <span>Inactiva</span> : null}
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void abrirEdicion()}>
              Editar
            </Button>
            {perfil && puedeVerEquipo(perfil) ? (
              <Button
                type="button"
                variant="outline"
                disabled={cambiandoEstado}
                onClick={() => void toggleActivo()}
              >
                {state.oportunidad.activo ? "Desactivar" : "Reactivar"}
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/pipeline">Volver al pipeline</Link>
            </Button>
          </div>
        }
      />
      <OportunidadDetalle
        oportunidad={state.oportunidad}
        etapaNombre={state.etapaNombre}
        servicios={state.servicios}
        causaPrincipal={state.causaPrincipal}
        causaSecundaria={state.causaSecundaria}
      />
      <OportunidadEditarDialog
        open={editarOpen}
        enviando={guardando}
        oportunidad={state.oportunidad}
        contactos={contactos}
        empresas={empresas}
        servicios={state.catalogoServicios}
        onConfirm={(input) => void guardar(input)}
        onCancel={() => setEditarOpen(false)}
      />
      <div className="mt-8">
        <ActividadesSection
          oportunidadId={state.oportunidad.id}
          contactoId={state.oportunidad.contacto.id}
        />
      </div>
      <div className="mt-8">
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
      <h1 className="text-page">{title}</h1>
      {body ? <p className="text-kicker">{body}</p> : null}
      <Button asChild variant="outline">
        <Link to="/pipeline">Volver al pipeline</Link>
      </Button>
    </div>
  )
}
