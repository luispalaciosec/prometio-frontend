import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { UserSearch } from "lucide-react"

import { ProspeccionLinkedInLeadCard } from "@/components/prospeccion/ProspeccionLinkedInLeadCard"
import { EmptyState } from "@/components/empty-state"
import { TableSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError, extraerUuid } from "@/lib/api-client"
import {
  buscarProspeccionLinkedin,
  buscarProspeccionLinkedinEmpresa,
  convertirProspeccionLinkedinLead,
  findProspeccionLinkedinLeadById,
  investigarProspeccionLinkedinLead,
  listProspeccionLinkedinLeads,
  patchProspeccionLinkedinLead,
} from "@/lib/api/prospeccion-linkedin"
import { listCategoriasServicio } from "@/lib/config-api"
import type { CategoriaServicio } from "@/types/categoria-servicio"
import { formatDateTime } from "@/lib/datetime-local"
import { prospeccionEnCooldown } from "@/lib/prospeccion-linkedin-cooldown"
import { useAuthStore } from "@/store/auth-store"
import type { ProspeccionLinkedinLead } from "@/types/prospeccion-linkedin"
import {
  PROSPECCION_ESTADO_LABELS,
  PROSPECCION_LINKEDIN_ESTADOS,
  type ProspeccionLinkedinBuscarResultado,
  type ProspeccionLinkedinEstado,
  type ProspeccionLinkedinMesesEnCargo,
} from "@/types/prospeccion-linkedin"

const MESES_EN_CARGO_OPCIONES: { value: string; label: string }[] = [
  { value: "all", label: "Cualquier antigüedad" },
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
]

export function ProspeccionLinkedInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const perfil = useAuthStore((state) => state.perfil)
  const isAdmin = perfil?.equipo === "administrativo"

  const [estado, setEstado] = useState<ProspeccionLinkedinEstado>("nuevo")
  const [leads, setLeads] = useState<ProspeccionLinkedinLead[] | null>(null)
  const [accionLeadId, setAccionLeadId] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [ultimoResumen, setUltimoResumen] = useState<ProspeccionLinkedinBuscarResultado | null>(
    null,
  )
  const [proximoIntentoEn, setProximoIntentoEn] = useState<string | null>(null)
  const [cooldownMensaje, setCooldownMensaje] = useState<string | null>(null)
  const [faltaCriterios, setFaltaCriterios] = useState(false)

  const [convertirLead, setConvertirLead] = useState<ProspeccionLinkedinLead | null>(null)
  const [crearEmpresa, setCrearEmpresa] = useState(false)
  const [convirtiendo, setConvirtiendo] = useState(false)
  const [contactoDuplicadoId, setContactoDuplicadoId] = useState<string | null>(null)
  const [investigandoId, setInvestigandoId] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([])
  const [filtroCiudad, setFiltroCiudad] = useState("")
  const [filtroCiudadDebounced, setFiltroCiudadDebounced] = useState("")
  const [filtroCategoriaId, setFiltroCategoriaId] = useState<string>("all")
  const [filtroMesesEnCargo, setFiltroMesesEnCargo] = useState<string>("all")

  const [leadDestacadoId, setLeadDestacadoId] = useState<string | null>(() => searchParams.get("lead"))
  const [leadInyectado, setLeadInyectado] = useState<ProspeccionLinkedinLead | null>(null)

  const [buscarEmpresaAbierto, setBuscarEmpresaAbierto] = useState(false)
  const [empresaNombre, setEmpresaNombre] = useState("")
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false)

  const enCooldown = prospeccionEnCooldown(proximoIntentoEn)

  useEffect(() => {
    const t = window.setTimeout(() => setFiltroCiudadDebounced(filtroCiudad), 300)
    return () => window.clearTimeout(t)
  }, [filtroCiudad])

  useEffect(() => {
    void listCategoriasServicio()
      .then(setCategorias)
      .catch(() => setCategorias([]))
  }, [])

  const queryLeads = useMemo(() => {
    const meses =
      filtroMesesEnCargo === "3" || filtroMesesEnCargo === "6" || filtroMesesEnCargo === "12"
        ? (Number(filtroMesesEnCargo) as ProspeccionLinkedinMesesEnCargo)
        : undefined
    return {
      estado,
      ciudad: filtroCiudadDebounced.trim() || undefined,
      categoria_servicio_id:
        filtroCategoriaId !== "all" ? filtroCategoriaId : undefined,
      meses_en_cargo_menor_a: meses,
    }
  }, [estado, filtroCiudadDebounced, filtroCategoriaId, filtroMesesEnCargo])

  const reloadLeads = useCallback(async () => {
    setLeads(await listProspeccionLinkedinLeads(queryLeads))
  }, [queryLeads])

  function actualizarLeadEnLista(next: ProspeccionLinkedinLead) {
    setLeads((prev) => prev?.map((row) => (row.id === next.id ? next : row)) ?? prev)
  }

  useEffect(() => {
    setLeads(null)
    void reloadLeads().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los leads.")
      setLeads([])
    })
  }, [reloadLeads])

  useEffect(() => {
    const id = searchParams.get("lead")
    setLeadDestacadoId(id)
    if (!id) {
      setLeadInyectado(null)
      return
    }
    void findProspeccionLinkedinLeadById(id).then((lead) => {
      if (!lead) {
        toast.error("No se encontró el lead de LinkedIn.")
        return
      }
      setLeadInyectado(lead)
      setEstado(lead.estado)
      setFiltroCiudad("")
      setFiltroCategoriaId("all")
      setFiltroMesesEnCargo("all")
    })
  }, [searchParams])

  const leadsVisibles = useMemo(() => {
    if (leads == null) {
      return null
    }
    if (!leadInyectado || leadInyectado.estado !== estado) {
      return leads
    }
    if (leads.some((row) => row.id === leadInyectado.id)) {
      return leads
    }
    return [leadInyectado, ...leads]
  }, [leads, leadInyectado, estado])

  useEffect(() => {
    if (!leadDestacadoId || leadsVisibles == null) {
      return
    }
    const t = window.setTimeout(() => {
      document.getElementById(`prospeccion-lead-${leadDestacadoId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }, 150)
    return () => window.clearTimeout(t)
  }, [leadDestacadoId, leadsVisibles, estado])

  function mensajeProximaBusqueda(iso: string | null, detail?: string): string | null {
    if (detail?.trim()) {
      return detail.trim()
    }
    if (iso && prospeccionEnCooldown(iso)) {
      return `Próxima búsqueda disponible: ${formatDateTime(iso)}`
    }
    return null
  }

  function aplicarProximoIntento(iso: string | null) {
    setProximoIntentoEn(iso)
    setCooldownMensaje(mensajeProximaBusqueda(iso))
  }

  function toastExitoBusqueda(resumen: ProspeccionLinkedinBuscarResultado) {
    toast.success(
      resumen.leads_nuevos > 0
        ? `Se encontraron ${resumen.leads_nuevos} leads nuevos.`
        : "Búsqueda completada sin leads nuevos.",
    )
  }

  async function aplicarResultadoBusqueda(
    resumen: ProspeccionLinkedinBuscarResultado,
    opts: { actualizarCooldown: boolean },
  ) {
    setUltimoResumen(resumen)
    if (opts.actualizarCooldown) {
      aplicarProximoIntento(resumen.proximo_intento_en)
    }
    toastExitoBusqueda(resumen)
    if (estado === "nuevo") {
      await reloadLeads()
    } else {
      setEstado("nuevo")
    }
  }

  function manejarErrorBusqueda(error: unknown, opts: { manejarCooldown429: boolean }): void {
    if (error instanceof ApiError) {
      if (opts.manejarCooldown429 && error.status === 429) {
        const iso = extraerProximoIntento(error.detail)
        if (iso) {
          setProximoIntentoEn(iso)
        }
        setCooldownMensaje(mensajeProximaBusqueda(iso, error.detail))
        return
      }
      if (error.status === 404) {
        toast.error(error.detail)
        return
      }
      if (error.status === 422) {
        setFaltaCriterios(true)
        toast.error(error.detail)
        return
      }
      if (error.status === 502) {
        toast.error(error.detail)
        return
      }
      toast.error(error.detail)
      return
    }
    toast.error(error instanceof Error ? error.message : "No se pudo buscar.")
  }

  async function buscarAhora() {
    if (enCooldown) {
      return
    }
    setBuscando(true)
    setFaltaCriterios(false)
    try {
      const resumen = await buscarProspeccionLinkedin()
      await aplicarResultadoBusqueda(resumen, { actualizarCooldown: true })
    } catch (error) {
      manejarErrorBusqueda(error, { manejarCooldown429: true })
    } finally {
      setBuscando(false)
    }
  }

  async function confirmarBuscarEmpresa() {
    const nombre = empresaNombre.trim()
    if (!nombre) {
      toast.error("Escribí el nombre de la empresa.")
      return
    }
    setBuscandoEmpresa(true)
    setFaltaCriterios(false)
    try {
      const resumen = await buscarProspeccionLinkedinEmpresa(nombre)
      setBuscarEmpresaAbierto(false)
      setEmpresaNombre("")
      await aplicarResultadoBusqueda(resumen, { actualizarCooldown: false })
    } catch (error) {
      manejarErrorBusqueda(error, { manejarCooldown429: false })
    } finally {
      setBuscandoEmpresa(false)
    }
  }

  async function investigar(leadId: string) {
    setInvestigandoId(leadId)
    try {
      const next = await investigarProspeccionLinkedinLead(leadId)
      actualizarLeadEnLista(next)
      toast.success("Investigación completada.")
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "No se pudo investigar.")
    } finally {
      setInvestigandoId(null)
    }
  }

  async function cambiarEstado(leadId: string, next: ProspeccionLinkedinEstado) {
    setAccionLeadId(leadId)
    try {
      await patchProspeccionLinkedinLead(leadId, { estado: next })
      toast.success(next === "revisado" ? "Marcado como revisado." : "Lead descartado.")
      await reloadLeads()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.detail : "No se pudo actualizar.")
    } finally {
      setAccionLeadId(null)
    }
  }

  function abrirConvertir(lead: ProspeccionLinkedinLead) {
    setConvertirLead(lead)
    setCrearEmpresa(false)
    setContactoDuplicadoId(null)
  }

  async function confirmarConvertir() {
    if (!convertirLead) {
      return
    }
    setConvirtiendo(true)
    setContactoDuplicadoId(null)
    try {
      const resultado = await convertirProspeccionLinkedinLead(convertirLead.id, {
        crear_empresa_desde_actual: crearEmpresa,
      })
      setConvertirLead(null)
      toast.success("Contacto creado.")
      const advertencia = resultado.advertencia_otro_contacto_en_empresa?.trim()
      if (advertencia) {
        toast.warning(advertencia, { duration: 8000 })
      }
      navigate(`/contactos/${resultado.contacto.id}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const existente = extraerUuid(error.detail)
        if (existente) {
          setContactoDuplicadoId(existente)
          return
        }
      }
      toast.error(error instanceof ApiError ? error.detail : "No se pudo convertir.")
    } finally {
      setConvirtiendo(false)
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={buscandoEmpresa}
          onClick={() => setBuscarEmpresaAbierto(true)}
        >
          Buscar por empresa
        </Button>
        <Button
          type="button"
          disabled={buscando || enCooldown}
          onClick={() => void buscarAhora()}
        >
          {buscando ? "Buscando…" : "Buscar ahora"}
        </Button>
      </div>

      {cooldownMensaje ? (
        <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-kicker">
          {cooldownMensaje}
        </p>
      ) : null}

      {faltaCriterios ? (
        <p className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-kicker">
          Configurá al menos un criterio de búsqueda activo.{" "}
          {isAdmin ? (
            <Link
              to="/prospeccion-linkedin/configuracion"
              className="text-primary underline-offset-4 hover:underline"
            >
              Ir a configuración de criterios
            </Link>
          ) : (
            "Pedile a un administrador que los cargue en Configuración."
          )}
        </p>
      ) : null}

      {ultimoResumen ? (
        <div className="surface-card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <ResumenItem label="Leads nuevos" value={String(ultimoResumen.leads_nuevos)} />
          <ResumenItem
            label="Perfiles revisados"
            value={String(ultimoResumen.perfiles_revisados)}
          />
          <ResumenItem label="Criterios usados" value={String(ultimoResumen.criterios_usados)} />
          <ResumenItem
            label="Próximo intento"
            value={
              ultimoResumen.proximo_intento_en
                ? formatDateTime(ultimoResumen.proximo_intento_en)
                : "—"
            }
          />
        </div>
      ) : null}

      <div className="filter-bar mb-4">
        <div className="filter-field sm:min-w-40 sm:flex-1">
          <Label htmlFor="prospeccion-filtro-ciudad">Ciudad</Label>
          <Input
            id="prospeccion-filtro-ciudad"
            value={filtroCiudad}
            onChange={(event) => setFiltroCiudad(event.target.value)}
            placeholder="Ej. Quito, Guayaquil…"
          />
        </div>
        <div className="filter-field sm:min-w-48">
          <Label htmlFor="prospeccion-filtro-categoria">Categoría</Label>
          <Select value={filtroCategoriaId} onValueChange={setFiltroCategoriaId}>
            <SelectTrigger id="prospeccion-filtro-categoria">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map((row) => (
                <SelectItem key={row.id} value={row.id}>
                  {row.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="filter-field sm:min-w-48">
          <Label htmlFor="prospeccion-filtro-cargo">Recién en el cargo</Label>
          <Select value={filtroMesesEnCargo} onValueChange={setFiltroMesesEnCargo}>
            <SelectTrigger id="prospeccion-filtro-cargo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES_EN_CARGO_OPCIONES.map((row) => (
                <SelectItem key={row.value} value={row.value}>
                  {row.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs
        value={estado}
        onValueChange={(value) => setEstado(value as ProspeccionLinkedinEstado)}
        className="gap-4"
      >
        <TabsList className="w-full sm:w-auto">
          {PROSPECCION_LINKEDIN_ESTADOS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {PROSPECCION_ESTADO_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
        {PROSPECCION_LINKEDIN_ESTADOS.map((key) => (
          <TabsContent key={key} value={key} className="mt-0 space-y-3">
            {leadsVisibles == null ? (
              <TableSkeleton rows={4} />
            ) : leadsVisibles.length === 0 ? (
              <EmptyState
                icon={UserSearch}
                title={`Sin leads ${PROSPECCION_ESTADO_LABELS[key].toLowerCase()}`}
                body={
                  key === "nuevo"
                    ? "Usá «Buscar ahora» o cambiá de pestaña si ya procesaste los anteriores."
                    : "Los leads aparecen acá cuando cambiás su estado."
                }
                action={
                  key === "nuevo" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={buscando || enCooldown}
                      onClick={() => void buscarAhora()}
                    >
                      Buscar ahora
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              leadsVisibles.map((lead) => (
                <ProspeccionLinkedInLeadCard
                  key={lead.id}
                  lead={lead}
                  destacado={lead.id === leadDestacadoId}
                  busy={accionLeadId === lead.id}
                  investigando={investigandoId === lead.id}
                  onRevisado={() => void cambiarEstado(lead.id, "revisado")}
                  onDescartar={() => void cambiarEstado(lead.id, "descartado")}
                  onConvertir={() => abrirConvertir(lead)}
                  onInvestigar={() => void investigar(lead.id)}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog
        open={buscarEmpresaAbierto}
        onOpenChange={(open) => {
          if (!open && !buscandoEmpresa) {
            setBuscarEmpresaAbierto(false)
            setEmpresaNombre("")
          }
        }}
      >
        <DialogContent className="rounded-2xl shadow-modal sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buscar por empresa</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="prospeccion-buscar-empresa">Nombre de la empresa en LinkedIn</Label>
            <Input
              id="prospeccion-buscar-empresa"
              value={empresaNombre}
              onChange={(event) => setEmpresaNombre(event.target.value)}
              placeholder="Ej. Banco Pichincha"
              disabled={buscandoEmpresa}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void confirmarBuscarEmpresa()
                }
              }}
            />
            <p className="text-kicker text-muted-foreground">
              Trae perfiles que trabajan hoy en esa empresa. No comparte el cooldown de «Buscar ahora».
            </p>
          </div>
          <DialogFooter className="rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              disabled={buscandoEmpresa}
              onClick={() => setBuscarEmpresaAbierto(false)}
            >
              Cancelar
            </Button>
            <Button type="button" disabled={buscandoEmpresa} onClick={() => void confirmarBuscarEmpresa()}>
              {buscandoEmpresa ? "Buscando…" : "Buscar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={convertirLead != null}
        onOpenChange={(open) => {
          if (!open && !convirtiendo) {
            setConvertirLead(null)
            setContactoDuplicadoId(null)
          }
        }}
      >
        <DialogContent className="rounded-2xl shadow-modal sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convertir a contacto</DialogTitle>
          </DialogHeader>
          {convertirLead ? (
            <div className="space-y-3">
              <p className="text-kicker">
                Se creará un contacto desde{" "}
                <span className="text-ui-medium">{convertirLead.nombre}</span>
                {convertirLead.linkedin_url ? " con su perfil de LinkedIn." : "."}
              </p>
              {convertirLead.empresa_actual ? (
                <label className="flex items-start gap-2 text-kicker">
                  <Checkbox
                    checked={crearEmpresa}
                    onCheckedChange={(checked) => setCrearEmpresa(checked === true)}
                    disabled={convirtiendo}
                  />
                  <span>
                    Crear empresa desde «{convertirLead.empresa_actual}»
                  </span>
                </label>
              ) : null}
              {contactoDuplicadoId ? (
                <p className="rounded-lg bg-muted px-3 py-2 text-kicker">
                  Ya existe un contacto con ese LinkedIn.{" "}
                  <Link
                    to={`/contactos/${contactoDuplicadoId}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Ver contacto
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}
          <DialogFooter className="rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              disabled={convirtiendo}
              onClick={() => setConvertirLead(null)}
            >
              Cancelar
            </Button>
            {contactoDuplicadoId ? (
              <Button type="button" asChild>
                <Link to={`/contactos/${contactoDuplicadoId}`}>Ir al contacto</Link>
              </Button>
            ) : (
              <Button type="button" disabled={convirtiendo} onClick={() => void confirmarConvertir()}>
                {convirtiendo ? "Convirtiendo…" : "Convertir"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ResumenItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-micro text-muted-foreground">{label}</p>
      <p className="text-ui-medium tabular-nums">{value}</p>
    </div>
  )
}

/** Intenta sacar un ISO del mensaje de cooldown del backend. */
function extraerProximoIntento(detail: string): string | null {
  const iso =
    detail.match(/\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?/i)?.[0] ?? null
  if (iso && !Number.isNaN(new Date(iso).getTime())) {
    return iso
  }
  return null
}
