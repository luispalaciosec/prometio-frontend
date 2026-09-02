import { useEffect, useState } from "react"
import { Loader2, ScrollText } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { DocumentoAlcanceSectionSkeleton } from "@/components/skeleton"
import { DocumentoAlcanceEditor, draftDesdeDocumento, type DocumentoAlcanceDraft } from "@/components/pipeline/DocumentoAlcanceEditor"
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
  updateDocumentoAlcance,
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
import type { DocumentoAlcance, DocumentoAlcanceUpdate } from "@/types/documento-alcance"
import type { Perfil } from "@/types/perfil"

const POLL_MS = 2500

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
}: {
  cotizacionId: string
  perfil: Perfil
  config: ConfiguracionGeneral | null
  requiereDocumento: boolean
  documentoIdInicial?: string | null
  onListaChange?: (docs: DocumentoAlcance[]) => void
}) {
  const [docs, setDocs] = useState<DocumentoAlcance[] | null>(null)
  const [abiertoId, setAbiertoId] = useState<string | null>(documentoIdInicial ?? null)
  const [abierto, setAbierto] = useState<DocumentoAlcance | null>(null)
  const [draft, setDraft] = useState<DocumentoAlcanceDraft | null>(null)
  const [guardando, setGuardando] = useState(false)
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

  useEffect(() => {
    if (!abierto || !generacionEnCurso(abierto)) {
      return
    }
    const timer = window.setInterval(() => {
      void getDocumentoAlcance(abierto.id)
        .then((row) => {
          setAbierto(row)
          setDraft(draftDesdeDocumento(row))
          setDocs((prev) => {
            if (!prev) {
              return prev
            }
            const next = prev.map((item) => (item.id === row.id ? row : item))
            onListaChange?.(next)
            return next
          })
          if (row.generacion_ia_estado === "completado") {
            toast.success("Borrador listo. Ya lo podés editar.")
          } else if (row.generacion_ia_estado === "fallido") {
            toast.error(row.generacion_ia_error ?? "La generación del borrador falló.")
          }
        })
        .catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : "No se pudo actualizar el documento.")
        })
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [abierto?.id, abierto?.generacion_ia_estado])

  async function generar() {
    setCreando(true)
    try {
      const creado = await crearDocumentoAlcance(cotizacionId)
      await reloadLista(creado.id)
      toast.success("Generando el borrador. Suele tardar entre 10 y 20 segundos.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el documento.")
    } finally {
      setCreando(false)
    }
  }

  async function guardar() {
    if (!abierto || !draft) {
      return
    }
    setGuardando(true)
    try {
      const row = await updateDocumentoAlcance(abierto.id, patchDesdeDraft(draft))
      setAbierto(row)
      setDraft(draftDesdeDocumento(row))
      await reloadLista(row.id)
      toast.success("Documento guardado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el documento.")
    } finally {
      setGuardando(false)
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
  const generando = generacionEnCurso(abierto)
  const acciones = abierto ? accionesDocumentoVisibles(perfil, abierto) : []

  return (
    <section id="documento-alcance" className="space-y-4 rounded-xl p-4 ring-1 ring-border">
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
          <Button type="button" size="sm" disabled={creando} onClick={() => void generar()}>
            {creando ? <Loader2 className="size-4 animate-spin" /> : null}
            Generar Documento de Alcance
          </Button>
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
            <Button type="button" variant="ghost" size="sm" disabled={creando} onClick={() => void generar()}>
              Generar Documento de Alcance
            </Button>
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
                      "shrink-0 rounded-full px-3 py-1 text-micro ring-1 ring-border",
                      seleccionado && "bg-muted ring-foreground/20",
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

          {abierto && generando ? (
            <div className="flex items-start gap-3 rounded-xl p-4 ring-1 ring-border">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Loader2 className="size-5 animate-spin" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-section">Generando el borrador</p>
                <p className="mt-1 text-kicker">
                  Suele tardar entre 10 y 20 segundos. No cierra esta pantalla.
                </p>
              </div>
            </div>
          ) : null}

          {abierto && abierto.generacion_ia_estado === "fallido" ? (
            <div className="rounded-xl p-4 ring-1 ring-border">
              <p className="text-ui-medium">La generación falló</p>
              <p className="mt-1 text-kicker">
                {abierto.generacion_ia_error ?? "El proveedor de IA no devolvió el borrador."}
              </p>
              <Button type="button" size="sm" className="mt-3" disabled={creando} onClick={() => void generar()}>
                Reintentar
              </Button>
            </div>
          ) : null}

          {abierto && !generando && abierto.generacion_ia_estado !== "fallido" && draft ? (
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
                {editable ? (
                  <Button type="button" size="sm" disabled={guardando} onClick={() => void guardar()}>
                    {guardando ? <Loader2 className="size-4 animate-spin" /> : null}
                    Guardar
                  </Button>
                ) : null}
                {acciones.map((accion) => (
                  <Button
                    key={accion}
                    type="button"
                    size="sm"
                    variant={accion === "rechazar" || accion === "reabrir" ? "outline" : "default"}
                    disabled={accionPendiente != null || guardando}
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
              <DocumentoAlcanceEditor
                key={abierto.id}
                draft={draft}
                disabled={!editable}
                defaultsCapa2={{
                  exclusiones: config?.exclusiones_default_texto ?? null,
                  consideraciones: config?.consideraciones_default_texto ?? null,
                  porQueGeeks: config?.por_que_geeks_default_texto ?? null,
                }}
                onChange={setDraft}
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

function patchDesdeDraft(draft: DocumentoAlcanceDraft): DocumentoAlcanceUpdate {
  return {
    objetivo: draft.objetivo,
    alcance_funcional: limpiarSecciones(draft.alcance_funcional),
    alcance_tecnico_incluido: draft.alcance_tecnico_incluido,
    alcance_tecnico_no_incluido: draft.alcance_tecnico_no_incluido,
    metodologia: draft.metodologia,
    tiempos: draft.tiempos,
    modelo_inversion: draft.modelo_inversion,
    supuestos: draft.supuestos,
    entregables: limpiarEntregables(draft.entregables),
    condiciones_pago_texto: draft.condiciones_pago_texto,
    exclusiones_texto: draft.exclusiones_texto,
    consideraciones_texto: draft.consideraciones_texto,
    por_que_geeks_texto: draft.por_que_geeks_texto,
  }
}

function limpiarSecciones(rows: DocumentoAlcanceDraft["alcance_funcional"]) {
  const next = rows
    .map((row) => ({
      seccion: row.seccion.trim(),
      entregables: row.entregables.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((row) => row.seccion || row.entregables.length > 0)
  return next.length > 0 ? next : null
}

function limpiarEntregables(rows: DocumentoAlcanceDraft["entregables"]) {
  const next = rows
    .map((row) => ({ nombre: row.nombre.trim(), descripcion: row.descripcion.trim() }))
    .filter((row) => row.nombre || row.descripcion)
  return next.length > 0 ? next : null
}
