import { useEffect, useState } from "react"
import { Loader2, ScrollText } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { DocumentoAlcanceSectionSkeleton } from "@/components/skeleton"
import { draftDesdeDocumento, type DocumentoAlcanceDraft } from "@/components/pipeline/DocumentoAlcanceEditor"
import {
  DocumentoAlcanceWizard,
  type LineaCotizacionResumen,
} from "@/components/documento-alcance-wizard/DocumentoAlcanceWizard"
import { DocumentoAlcanceEstadoBadge } from "@/components/pipeline/DocumentoAlcanceEstadoBadge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  aprobarDocumentoAlcance,
  crearDocumentoAlcance,
  crearNuevaVersionDocumento,
  descargarPdfDocumentoAlcance,
  enviarAprobacionDocumento,
  getDocumentoAlcance,
  listDocumentosAlcance,
  reabrirDocumentoAlcance,
  rechazarDocumentoAlcance,
} from "@/lib/api/documento-alcance"
import {
  documentoEditable,
  documentoUsable,
  documentoVigente,
  generacionEnCurso,
  ordenarVersiones,
} from "@/lib/documento-alcance"
import {
  accionesDocumentoVisibles,
  mensajeSinAccionDocumento,
  type AccionDocumentoAlcance,
} from "@/lib/documento-alcance-transiciones"
import { formatDateTime } from "@/lib/datetime-local"
import { cn } from "@/lib/utils"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type { DocumentoAlcance } from "@/types/documento-alcance"
import type { Perfil } from "@/types/perfil"

const ACCION_LABEL: Record<AccionDocumentoAlcance, string> = {
  enviar: "Enviar a aprobación",
  aprobar: "Aprobar",
  rechazar: "Rechazar",
  reabrir: "Reabrir",
  nueva_version: "Nueva versión",
  descargar_pdf: "Descargar PDF",
}

export function DocumentoAlcanceSection({
  cotizacionId,
  perfil,
  config,
  requiereDocumento,
  documentoIdInicial,
  onListaChange,
  clienteNombre,
  lineasResumen,
}: {
  cotizacionId: string
  perfil: Perfil
  config: ConfiguracionGeneral | null
  requiereDocumento: boolean
  documentoIdInicial?: string | null
  onListaChange?: (docs: DocumentoAlcance[]) => void
  clienteNombre?: string
  lineasResumen?: LineaCotizacionResumen[]
}) {
  const [docs, setDocs] = useState<DocumentoAlcance[] | null>(null)
  const [abiertoId, setAbiertoId] = useState<string | null>(documentoIdInicial ?? null)
  const [abierto, setAbierto] = useState<DocumentoAlcance | null>(null)
  const [draft, setDraft] = useState<DocumentoAlcanceDraft | null>(null)
  const [creando, setCreando] = useState(false)
  const [accionPendiente, setAccionPendiente] = useState<AccionDocumentoAlcance | null>(null)
  const [reabrirOpen, setReabrirOpen] = useState(false)

  function publicarLista(next: DocumentoAlcance[]) {
    setDocs(next)
    onListaChange?.(next)
  }

  async function reloadLista(preferId?: string | null) {
    const rows = ordenarVersiones(await listDocumentosAlcance(cotizacionId))
    publicarLista(rows)
    const preferido =
      (preferId && rows.find((row) => row.id === preferId)) ||
      (abiertoId && rows.find((row) => row.id === abiertoId)) ||
      (documentoIdInicial && rows.find((row) => row.id === documentoIdInicial)) ||
      rows.find((row) => generacionEnCurso(row)) ||
      documentoVigente(rows)
    setAbiertoId(preferido?.id ?? null)
    return rows
  }

  useEffect(() => {
    void reloadLista(documentoIdInicial).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los documentos de alcance.")
      publicarLista([])
    })
    // Solo al montar / cambiar de cotización.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cotizacionId])

  useEffect(() => {
    if (!abiertoId) {
      setAbierto(null)
      setDraft(null)
      return
    }
    const cached = docs?.find((row) => row.id === abiertoId)
    if (cached) {
      setAbierto(cached)
      setDraft(draftDesdeDocumento(cached))
    }
    void getDocumentoAlcance(abiertoId)
      .then((row) => {
        setAbierto(row)
        setDraft(draftDesdeDocumento(row))
        setDocs((prev) => {
          if (!prev) {
            return prev
          }
          const next = prev.some((item) => item.id === row.id)
            ? prev.map((item) => (item.id === row.id ? row : item))
            : [...prev, row]
          onListaChange?.(next)
          return next
        })
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento.")
      })
  }, [abiertoId])

  async function generar(opts?: { generarIa?: boolean }) {
    setCreando(true)
    try {
      const creado = await crearDocumentoAlcance(cotizacionId, opts)
      await reloadLista(creado.id)
      if (opts?.generarIa === false) {
        toast.success("Documento en blanco listo. Escribí vos o usá el copiloto en cada paso.")
      } else {
        toast.success("Generando el borrador. Suele tardar entre 10 y 20 segundos.")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el documento.")
    } finally {
      setCreando(false)
    }
  }

  async function ejecutar(accion: AccionDocumentoAlcance) {
    if (!abierto) {
      return
    }
    if (accion === "reabrir") {
      setReabrirOpen(true)
      return
    }
    if (accion === "descargar_pdf") {
      setAccionPendiente(accion)
      try {
        await descargarPdfDocumentoAlcance(abierto.id)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo descargar el PDF.")
      } finally {
        setAccionPendiente(null)
      }
      return
    }
    setAccionPendiente(accion)
    try {
      const row =
        accion === "enviar"
          ? await enviarAprobacionDocumento(abierto.id)
          : accion === "aprobar"
            ? await aprobarDocumentoAlcance(abierto.id)
            : accion === "rechazar"
              ? await rechazarDocumentoAlcance(abierto.id)
              : await crearNuevaVersionDocumento(abierto.id)
      setAbierto(row)
      setDraft(draftDesdeDocumento(row))
      await reloadLista(row.id)
      if (accion === "aprobar") {
        toast.success("Documento aprobado. El PDF ya está listo.")
      } else if (accion === "nueva_version") {
        toast.success("Nueva versión creada a partir de esta.")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar la acción.")
    } finally {
      setAccionPendiente(null)
    }
  }

  async function confirmarReabrir() {
    if (!abierto) {
      return
    }
    setAccionPendiente("reabrir")
    try {
      const row = await reabrirDocumentoAlcance(abierto.id)
      setAbierto(row)
      setDraft(draftDesdeDocumento(row))
      await reloadLista(row.id)
      setReabrirOpen(false)
      toast.success("Documento reabierto. Volvió a borrador.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reabrir el documento.")
    } finally {
      setAccionPendiente(null)
    }
  }

  const lista = docs ?? []
  const vigente = documentoVigente(lista)
  const sinDocs = docs !== null && lista.length === 0
  const puedeGenerar = lista.every((row) => !documentoUsable(row))
  const editable = documentoEditable(abierto)
  const acciones = abierto ? accionesDocumentoVisibles(perfil, abierto) : []

  return (
    <section id="documento-alcance" className="space-y-4 surface-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-section">Documento de alcance</h3>
          {requiereDocumento && !lista.some((row) => row.estado === "aprobado") ? (
            <p className="mt-1 text-kicker">
              Hace falta un Documento de Alcance aprobado para enviar esta cotización.
            </p>
          ) : (
            <p className="mt-1 text-kicker">
              Borrador para el cliente. La IA lo arma; vos lo editás y un supervisor lo aprueba.
            </p>
          )}
        </div>
        {puedeGenerar ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={creando} onClick={() => void generar()}>
              {creando ? <Loader2 className="size-4 animate-spin" /> : null}
              Generar con IA
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={creando}
              onClick={() => void generar({ generarIa: false })}
            >
              Empezar en blanco
            </Button>
          </div>
        ) : null}
      </div>

      {docs == null ? (
        <DocumentoAlcanceSectionSkeleton />
      ) : sinDocs ? (
        <EmptyState
          icon={ScrollText}
          title="Sin documento de alcance"
          body="Se arma con las líneas de esta cotización. La IA escribe un borrador; después lo editás."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="ghost" size="sm" disabled={creando} onClick={() => void generar()}>
                Generar con IA
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={creando}
                onClick={() => void generar({ generarIa: false })}
              >
                Empezar en blanco
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {lista.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {lista.map((row) => {
                const esVigente = vigente?.id === row.id
                const seleccionado = abiertoId === row.id
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setAbiertoId(row.id)}
                    className={cn(
                      "shrink-0 rounded-full border border-transparent px-3 py-1 text-micro",
                      seleccionado && "border-primary/40 bg-muted",
                    )}
                  >
                    v{row.version}
                    {esVigente ? " · vigente" : ""}
                    {" · "}
                    {row.estado === "pendiente_aprobacion" ? "pendiente" : row.estado}
                  </button>
                )
              })}
            </div>
          ) : null}

          {abierto && draft ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <DocumentoAlcanceEstadoBadge estado={abierto.estado} />
                <span className="text-kicker">
                  v{abierto.version}
                  {abierto.creado_por_nombre ? ` · ${abierto.creado_por_nombre}` : ""}
                  {` · ${formatDateTime(abierto.created_at)}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {acciones
                  .filter((accion) => accion !== "enviar")
                  .map((accion) => (
                  <Button
                    key={accion}
                    type="button"
                    size="sm"
                    variant={accion === "rechazar" || accion === "reabrir" ? "outline" : "default"}
                    disabled={accionPendiente != null}
                    onClick={() => void ejecutar(accion)}
                  >
                    {accionPendiente === accion ? <Loader2 className="size-4 animate-spin" /> : null}
                    {accionPendiente === "aprobar" && accion === "aprobar"
                      ? "Aprobando…"
                      : ACCION_LABEL[accion]}
                  </Button>
                ))}
              </div>
              {acciones.length === 0 ? (
                <p className="text-kicker">{mensajeSinAccionDocumento(abierto, perfil)}</p>
              ) : null}
              <DocumentoAlcanceWizard
                key={abierto.id}
                documento={abierto}
                draft={draft}
                editable={editable}
                clienteNombre={clienteNombre ?? "tu cliente"}
                lineas={lineasResumen ?? []}
                config={config}
                onDraftChange={setDraft}
                onDocumentoChange={(row) => {
                  setAbierto(row)
                  setDocs((prev) => {
                    if (!prev) {
                      return prev
                    }
                    const next = prev.map((item) => (item.id === row.id ? row : item))
                    onListaChange?.(next)
                    return next
                  })
                }}
                onGuardado={(row) => {
                  void reloadLista(row.id)
                }}
                onNuevaVersionTrasWord={(nueva) => {
                  setAbiertoId(nueva.id)
                  void reloadLista(nueva.id)
                }}
                onSolicitarGeneracion={async () => {
                  if (generacionEnCurso(abierto)) {
                    return
                  }
                  if (
                    abierto.generacion_ia_estado === "fallido" &&
                    !abierto.objetivo &&
                    !abierto.alcance_funcional?.length
                  ) {
                    await generar()
                  }
                }}
              />
            </>
          ) : null}
        </>
      )}

      <Dialog open={reabrirOpen} onOpenChange={setReabrirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir documento</DialogTitle>
            <DialogDescription>
              Reabrir invalida la aprobación y el PDF fijo. El documento vuelve a borrador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setReabrirOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={accionPendiente === "reabrir"}
              onClick={() => void confirmarReabrir()}
            >
              {accionPendiente === "reabrir" ? <Loader2 className="size-4 animate-spin" /> : null}
              Reabrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

