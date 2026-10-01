import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { UserSearch } from "lucide-react"

import { ProspeccionLinkedInLeadCard } from "@/components/prospeccion/ProspeccionLinkedInLeadCard"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  convertirProspeccionLinkedinLead,
  listProspeccionLinkedinLeads,
  patchProspeccionLinkedinLead,
} from "@/lib/api/prospeccion-linkedin"
import { formatDateTime } from "@/lib/datetime-local"
import { prospeccionEnCooldown } from "@/lib/prospeccion-linkedin-cooldown"
import { useAuthStore } from "@/store/auth-store"
import type { ProspeccionLinkedinLead } from "@/types/prospeccion-linkedin"
import {
  PROSPECCION_ESTADO_LABELS,
  PROSPECCION_LINKEDIN_ESTADOS,
  type ProspeccionLinkedinBuscarResultado,
  type ProspeccionLinkedinEstado,
} from "@/types/prospeccion-linkedin"

export function ProspeccionLinkedInPage() {
  const navigate = useNavigate()
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

  const enCooldown = prospeccionEnCooldown(proximoIntentoEn)

  const reloadLeads = useCallback(async () => {
    setLeads(await listProspeccionLinkedinLeads(estado))
  }, [estado])

  useEffect(() => {
    setLeads(null)
    void reloadLeads().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los leads.")
      setLeads([])
    })
  }, [reloadLeads])

  function aplicarProximoIntento(iso: string | null) {
    setProximoIntentoEn(iso)
    if (iso && prospeccionEnCooldown(iso)) {
      setCooldownMensaje(`Próxima búsqueda disponible: ${formatDateTime(iso)}`)
    } else {
      setCooldownMensaje(null)
    }
  }

  async function buscarAhora() {
    if (enCooldown) {
      return
    }
    setBuscando(true)
    setFaltaCriterios(false)
    try {
      const resumen = await buscarProspeccionLinkedin()
      setUltimoResumen(resumen)
      aplicarProximoIntento(resumen.proximo_intento_en)
      toast.success(
        resumen.leads_nuevos > 0
          ? `Se encontraron ${resumen.leads_nuevos} leads nuevos.`
          : "Búsqueda completada sin leads nuevos.",
      )
      if (estado === "nuevo") {
        await reloadLeads()
      } else {
        setEstado("nuevo")
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 429) {
          setCooldownMensaje(error.detail)
          const iso = extraerProximoIntento(error.detail)
          if (iso) {
            setProximoIntentoEn(iso)
          }
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
    } finally {
      setBuscando(false)
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
      const contacto = await convertirProspeccionLinkedinLead(convertirLead.id, {
        crear_empresa_desde_actual: crearEmpresa,
      })
      setConvertirLead(null)
      toast.success("Contacto creado.")
      navigate(`/contactos/${contacto.id}`)
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
      <PageHeader
        title="Prospección LinkedIn"
        description="Leads desde Apify según los criterios de la organización. Revisá, descartá o convertí a contacto."
        action={
          <Button
            type="button"
            disabled={buscando || enCooldown}
            onClick={() => void buscarAhora()}
          >
            {buscando ? "Buscando…" : "Buscar ahora"}
          </Button>
        }
      />

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
              to="/configuracion/linkedin-criterios"
              className="text-primary underline-offset-4 hover:underline"
            >
              Ir a criterios LinkedIn
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
            {leads == null ? (
              <TableSkeleton rows={4} />
            ) : leads.length === 0 ? (
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
              leads.map((lead) => (
                <ProspeccionLinkedInLeadCard
                  key={lead.id}
                  lead={lead}
                  busy={accionLeadId === lead.id}
                  onRevisado={() => void cambiarEstado(lead.id, "revisado")}
                  onDescartar={() => void cambiarEstado(lead.id, "descartado")}
                  onConvertir={() => abrirConvertir(lead)}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <p className="mt-6 text-kicker text-muted-foreground">
        {isAdmin ? (
          <>
            Criterios de búsqueda en{" "}
            <Link
              to="/configuracion/linkedin-criterios"
              className="text-primary underline-offset-4 hover:underline"
            >
              Configuración → Criterios LinkedIn
            </Link>
            .
          </>
        ) : (
          "Si falta configuración, pedile a un administrador que cargue criterios activos."
        )}
      </p>

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
