import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { CierrePerdidoDialog } from "@/components/pipeline/CierrePerdidoDialog"
import { OportunidadAltaDialog } from "@/components/pipeline/OportunidadAltaDialog"
import { PipelineBoard } from "@/components/pipeline/PipelineBoard"
import { PipelineLista } from "@/components/pipeline/PipelineLista"
import {
  PipelineToolbar,
  type PipelineVista,
} from "@/components/pipeline/PipelineToolbar"
import { ReasignarOportunidadDialog } from "@/components/pipeline/ReasignarOportunidadDialog"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { listAlertas } from "@/lib/api/alerta"
import { listContactos } from "@/lib/api/contacto"
import { listEmpresas } from "@/lib/api/empresa"
import { listPerfilesElegiblesEjecutivo } from "@/lib/api/perfiles"
import {
  createOportunidad,
  listOportunidades,
  moverOportunidad,
  puedeVerEquipo,
  reasignarOportunidad,
} from "@/lib/api/oportunidad"
import { listCausasPerdida, listEtapasPipeline, listServicios } from "@/lib/config-api"
import { coincideTexto } from "@/lib/lista-filtros"
import { useAuthStore } from "@/store/auth-store"
import type { EstadoAlerta } from "@/types/alerta"
import type { CausaPerdida } from "@/types/causa-perdida"
import type { EtapaPipeline, EtapaPipelineCodigo } from "@/types/etapa-pipeline"
import type { Contacto } from "@/types/contacto"
import type { Empresa } from "@/types/empresa"
import type { OportunidadCreate, OportunidadKanban, PipelineScope } from "@/types/oportunidad"
import type { Perfil } from "@/types/perfil"
import type { Servicio } from "@/types/servicio"

const VISTA_KEY = "prometio-pipeline-vista"

function leerVista(): PipelineVista {
  try {
    return localStorage.getItem(VISTA_KEY) === "lista" ? "lista" : "tablero"
  } catch {
    return "tablero"
  }
}

export function PipelinePage() {
  const navigate = useNavigate()
  const perfil = useAuthStore((state) => state.perfil)
  const mostrarAlcance = perfil ? puedeVerEquipo(perfil) : false
  const [scope, setScope] = useState<PipelineScope>(mostrarAlcance ? "equipo" : "mio")
  const [servicioId, setServicioId] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [etapaId, setEtapaId] = useState<EtapaPipelineCodigo | null>(null)
  const [ejecutivoId, setEjecutivoId] = useState<string | null>(null)
  const [vista, setVista] = useState<PipelineVista>(leerVista)
  const [etapas, setEtapas] = useState<EtapaPipeline[]>([])
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [causas, setCausas] = useState<CausaPerdida[]>([])
  const [items, setItems] = useState<OportunidadKanban[]>([])
  const [alertasPorId, setAlertasPorId] = useState<Map<string, EstadoAlerta>>(new Map())
  const [pendientePerdido, setPendientePerdido] = useState<string | null>(null)
  const [pendienteReasignar, setPendienteReasignar] = useState<string | null>(null)
  const [perfilesElegibles, setPerfilesElegibles] = useState<Perfil[]>([])
  const [contactosAlta, setContactosAlta] = useState<Contacto[]>([])
  const [empresasAlta, setEmpresasAlta] = useState<Empresa[]>([])
  const [altaOpen, setAltaOpen] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const reload = useCallback(async () => {
    if (!perfil) {
      return
    }
    try {
      const [rows, alertas] = await Promise.all([
        listOportunidades({
          perfil,
          scope,
          servicio_id: servicioId,
        }),
        listAlertas(perfil),
      ])
      setItems(rows)
      setAlertasPorId(new Map(alertas.map((row) => [row.oportunidad_id, row.estado_alerta])))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el pipeline.")
    }
  }, [perfil, scope, servicioId])

  useEffect(() => {
    void Promise.all([
      listEtapasPipeline(),
      listServicios(),
      listCausasPerdida(),
      mostrarAlcance ? listPerfilesElegiblesEjecutivo() : Promise.resolve([]),
    ])
      .then(([pipeline, catalogo, catalogoCausas, perfiles]) => {
        setEtapas(pipeline)
        setServicios(catalogo)
        setCausas(catalogoCausas)
        setPerfilesElegibles(perfiles)
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar el pipeline.")
      })
  }, [mostrarAlcance])

  useEffect(() => {
    if (perfil && !puedeVerEquipo(perfil)) {
      setScope("mio")
    }
  }, [perfil])

  useEffect(() => {
    void reload()
  }, [reload])

  function cambiarVista(next: PipelineVista) {
    setVista(next)
    try {
      localStorage.setItem(VISTA_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const ejecutivos = useMemo(() => {
    const seen = new Map<string, string>()
    for (const row of items) {
      seen.set(row.ejecutivo.id, row.ejecutivo.nombre_completo)
    }
    return [...seen.entries()]
      .map(([id, nombre_completo]) => ({ id, nombre_completo }))
      .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, "es"))
  }, [items])

  const filtradas = useMemo(() => {
    return items.filter((row) => {
      if (etapaId && row.etapa !== etapaId) {
        return false
      }
      if (ejecutivoId && row.ejecutivo.id !== ejecutivoId) {
        return false
      }
      return coincideTexto(busqueda, row.contacto.nombre_completo, row.empresa.nombre)
    })
  }, [items, etapaId, ejecutivoId, busqueda])

  const hayFiltroLocal = Boolean(busqueda.trim() || etapaId || ejecutivoId)

  async function crear(input: OportunidadCreate) {
    if (!perfil) {
      return
    }
    setEnviando(true)
    try {
      const created = await createOportunidad(input)
      setAltaOpen(false)
      toast.success("Oportunidad creada.")
      navigate(`/pipeline/${created.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la oportunidad.")
    } finally {
      setEnviando(false)
    }
  }

  async function mover(id: string, etapa: EtapaPipelineCodigo) {
    if (!perfil) {
      return
    }
    try {
      await moverOportunidad({ perfil, id, etapa })
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo mover.")
    }
  }

  async function confirmarPerdido(input: {
    causa_perdida_principal_id: string
    causa_perdida_secundaria_id: string | null
  }) {
    if (!perfil || !pendientePerdido) {
      return
    }
    try {
      await moverOportunidad({
        perfil,
        id: pendientePerdido,
        etapa: "cierre_perdido",
        causa_perdida_principal_id: input.causa_perdida_principal_id,
        causa_perdida_secundaria_id: input.causa_perdida_secundaria_id ?? "",
      })
      setPendientePerdido(null)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar como perdido.")
    }
  }

  async function confirmarReasignar(nuevo_ejecutivo_id: string) {
    if (!perfil || !pendienteReasignar) {
      return
    }
    try {
      await reasignarOportunidad({
        perfil,
        id: pendienteReasignar,
        nuevo_ejecutivo_id,
      })
      setPendienteReasignar(null)
      await reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reasignar.")
    }
  }

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="9 etapas fijas. El valor cotizado manda; si no hay, se muestra el referencial como estimado."
        action={
          <Button
            type="button"
            onClick={() => {
              void Promise.all([listContactos(), listEmpresas()])
                .then(([contactos, empresas]) => {
                  setContactosAlta(contactos)
                  setEmpresasAlta(empresas)
                  setAltaOpen(true)
                })
                .catch((error: unknown) => {
                  toast.error(
                    error instanceof Error ? error.message : "No se pudo abrir el alta.",
                  )
                })
            }}
          >
            Nueva oportunidad
          </Button>
        }
      />
      <div className="mb-6">
        <PipelineToolbar
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          etapas={etapas}
          etapaId={etapaId}
          onEtapaId={setEtapaId}
          ejecutivos={ejecutivos}
          ejecutivoId={ejecutivoId}
          onEjecutivoId={setEjecutivoId}
          mostrarEjecutivo={mostrarAlcance}
          servicios={servicios}
          servicioId={servicioId}
          onServicioId={setServicioId}
          mostrarAlcance={mostrarAlcance}
          scope={scope}
          onScope={setScope}
          vista={vista}
          onVista={cambiarVista}
        />
      </div>
      {vista === "tablero" ? (
        <PipelineBoard
          etapas={etapas}
          items={filtradas}
          alertasPorId={alertasPorId}
          onMover={(id, etapa) => void mover(id, etapa)}
          onPedirCierrePerdido={setPendientePerdido}
          onReasignar={mostrarAlcance ? setPendienteReasignar : undefined}
          onAbrir={(id) => navigate(`/pipeline/${id}`)}
        />
      ) : (
        <PipelineLista
          items={filtradas}
          etapas={etapas}
          alertasPorId={alertasPorId}
          mostrarEjecutivo={mostrarAlcance}
          onReasignar={mostrarAlcance ? setPendienteReasignar : undefined}
          onAbrir={(id) => navigate(`/pipeline/${id}`)}
        />
      )}
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No hay oportunidades en este alcance.
        </p>
      ) : filtradas.length === 0 && hayFiltroLocal ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Ninguna oportunidad coincide con los filtros.
        </p>
      ) : null}
      <CierrePerdidoDialog
        open={pendientePerdido !== null}
        causas={causas}
        onConfirm={(input) => void confirmarPerdido(input)}
        onCancel={() => setPendientePerdido(null)}
      />
      <ReasignarOportunidadDialog
        open={pendienteReasignar !== null}
        oportunidad={items.find((row) => row.id === pendienteReasignar) ?? null}
        perfiles={perfilesElegibles}
        onConfirm={(id) => void confirmarReasignar(id)}
        onCancel={() => setPendienteReasignar(null)}
      />
      <OportunidadAltaDialog
        open={altaOpen}
        enviando={enviando}
        contactos={contactosAlta}
        empresas={empresasAlta}
        servicios={servicios}
        onConfirm={(input) => void crear(input)}
        onCancel={() => setAltaOpen(false)}
      />
    </>
  )
}
