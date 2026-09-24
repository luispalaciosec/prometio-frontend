import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  PartyPopper,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import {
  AlcanceFuncionalEditor,
  EntregablesEditor,
  type DocumentoAlcanceDraft,
} from "@/components/pipeline/DocumentoAlcanceEditor"
import { DocumentoAlcanceRichText } from "@/components/pipeline/DocumentoAlcanceRichText"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api-client"
import {
  auditarDocumentoAlcance,
  descargarDocxDocumentoAlcance,
  enviarAprobacionDocumento,
  getDocumentoAlcance,
  subirDocxDocumentoAlcance,
  updateDocumentoAlcance,
} from "@/lib/api/documento-alcance"
import { guardadoHaceTexto, patchDesdeDraft, TITULO_SECCION } from "@/lib/documento-alcance-draft"
import { generacionEnCurso } from "@/lib/documento-alcance"
import { cn } from "@/lib/utils"
import type { ConfiguracionGeneral } from "@/types/configuracion-general"
import type {
  AdvertenciaAuditoria,
  DocumentoAlcance,
  RegenerarSeccionResponse,
  SeccionRegenerable,
} from "@/types/documento-alcance"
import { CopilotoPanel } from "./CopilotoPanel"
import { GeneracionProgreso } from "./GeneracionProgreso"
import { WizardStepper } from "./WizardStepper"
import {
  indiceStepper,
  pasoAnterior,
  pasoSiguiente,
  type WizardPasoId,
} from "./wizard-steps"

const AUTOSAVE_MS = 900
const POLL_MS = 2500

export type LineaCotizacionResumen = {
  titulo: string
  monto: string | null
}

export function DocumentoAlcanceWizard({
  documento,
  draft,
  onDraftChange,
  onDocumentoChange,
  clienteNombre,
  lineas,
  config,
  editable,
  onGuardado,
  onNuevaVersionTrasWord,
  onSolicitarGeneracion,
}: {
  documento: DocumentoAlcance
  draft: DocumentoAlcanceDraft
  onDraftChange: (next: DocumentoAlcanceDraft) => void
  onDocumentoChange: (doc: DocumentoAlcance) => void
  clienteNombre: string
  lineas: LineaCotizacionResumen[]
  config: ConfiguracionGeneral | null
  editable: boolean
  onGuardado?: (doc: DocumentoAlcance) => void
  onNuevaVersionTrasWord?: (doc: DocumentoAlcance) => void
  onSolicitarGeneracion?: () => Promise<void>
}) {
  const [paso, setPaso] = useState<WizardPasoId>(() => pasoInicial(documento))
  const [omitirCondiciones, setOmitirCondiciones] = useState(false)
  const [copilotoSeccion, setCopilotoSeccion] = useState<SeccionRegenerable>("objetivo")
  const [guardadoEn, setGuardadoEn] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const draftRef = useRef(draft)
  const skipAutosaveRef = useRef(true)
  const ignoradasRef = useRef<Set<string>>(new Set())

  const [auditoria, setAuditoria] = useState(documento.auditoria_ia)
  const [auditando, setAuditando] = useState(false)
  const [errorAuditoria, setErrorAuditoria] = useState<string | null>(null)

  const [subiendoWord, setSubiendoWord] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviadoOk, setEnviadoOk] = useState(false)
  const inputDocxRef = useRef<HTMLInputElement>(null)

  draftRef.current = draft

  const generando = generacionEnCurso(documento)

  useEffect(() => {
    if (generando) {
      setPaso("generando")
    } else if (paso === "generando") {
      setPaso("objetivo")
      toast.success("Borrador listo. Seguí editando cuando quieras.")
    }
  }, [generando, documento.objetivo, paso])

  useEffect(() => {
    if (!generando) {
      return
    }
    const timer = window.setInterval(() => {
      void getDocumentoAlcance(documento.id).then((row) => {
        onDocumentoChange(row)
        onDraftChange(importDraft(row))
        if (row.generacion_ia_estado === "completado") {
          toast.success("Borrador listo.")
        } else if (row.generacion_ia_estado === "fallido") {
          toast.error(row.generacion_ia_error ?? "La generación del borrador falló.")
        }
      })
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [documento.id, generando, onDocumentoChange, onDraftChange, documento])

  useEffect(() => {
    if (!editable) {
      return
    }
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false
      return
    }
    const timer = window.setTimeout(() => {
      void guardarSilencioso()
    }, AUTOSAVE_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, editable])

  useEffect(() => {
    setAuditoria(documento.auditoria_ia)
  }, [documento.auditoria_ia, documento.id])

  useEffect(() => {
    if (paso === "auditoria" && editable && !auditoria && !auditando) {
      void correrAuditoria()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso])

  const completados = useMemo(() => {
    const set = new Set<WizardPasoId>()
    if (draft.objetivo?.trim()) {
      set.add("objetivo")
    }
    if (
      draft.alcance_funcional.length > 0 ||
      draft.alcance_tecnico_incluido?.trim() ||
      draft.alcance_tecnico_no_incluido?.trim() ||
      draft.metodologia?.trim()
    ) {
      set.add("alcance")
    }
    if (
      draft.entregables.length > 0 ||
      draft.tiempos?.trim() ||
      draft.supuestos?.trim() ||
      draft.modelo_inversion?.trim()
    ) {
      set.add("entregables")
    }
    if (
      draft.condiciones_pago_texto?.trim() ||
      draft.exclusiones_texto?.trim() ||
      draft.consideraciones_texto?.trim() ||
      draft.por_que_geeks_texto?.trim()
    ) {
      set.add("condiciones")
    }
    if (auditoria) {
      set.add("auditoria")
    }
    if (documento.estado === "pendiente_aprobacion" || enviadoOk) {
      set.add("word")
    }
    return set
  }, [draft, auditoria, documento.estado, enviadoOk])

  const guardadoTexto = errorGuardado
    ? errorGuardado
    : guardando
      ? "Guardando…"
      : guardadoHaceTexto(guardadoEn)

  async function guardarSilencioso() {
    if (!editable) {
      return
    }
    setGuardando(true)
    setErrorGuardado(null)
    try {
      const row = await updateDocumentoAlcance(documento.id, patchDesdeDraft(draftRef.current))
      setGuardadoEn(new Date().toISOString())
      onDocumentoChange(row)
      onGuardado?.(row)
      if (row.auditoria_ia == null && auditoria) {
        setAuditoria(null)
      }
    } catch (error) {
      setErrorGuardado(error instanceof Error ? error.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  async function correrAuditoria() {
    setAuditando(true)
    setErrorAuditoria(null)
    try {
      const result = await auditarDocumentoAlcance(documento.id)
      setAuditoria(result)
      onDocumentoChange({ ...documento, auditoria_ia: result, auditoria_ia_en: result.auditado_en })
    } catch (error) {
      if (error instanceof ApiError && error.status === 502) {
        setErrorAuditoria("El auditor no respondió. Reintentá en un rato.")
      } else {
        setErrorAuditoria(error instanceof Error ? error.message : "No se pudo auditar.")
      }
    } finally {
      setAuditando(false)
    }
  }

  function marcarDirty(next: DocumentoAlcanceDraft) {
    onDraftChange(next)
    if (auditoria) {
      setAuditoria(null)
    }
  }

  function aceptarPropuesta(propuesta: RegenerarSeccionResponse) {
    const { seccion, valor } = propuesta
    const next = { ...draftRef.current }
    if (seccion === "alcance_funcional" && Array.isArray(valor)) {
      next.alcance_funcional = valor as DocumentoAlcanceDraft["alcance_funcional"]
    } else if (seccion === "entregables" && Array.isArray(valor)) {
      next.entregables = valor as DocumentoAlcanceDraft["entregables"]
    } else {
      ;(next as Record<string, unknown>)[seccion] = typeof valor === "string" ? valor : String(valor ?? "")
    }
    marcarDirty(next)
    toast.success("Listo, aplicamos la propuesta. Revisala y ajustá si hace falta.")
  }

  async function onSubirWord(file: File) {
    setSubiendoWord(true)
    try {
      const nueva = await subirDocxDocumentoAlcance(documento.id, file)
      onNuevaVersionTrasWord?.(nueva)
      onDocumentoChange(nueva)
      onDraftChange(importDraft(nueva))
      setPaso("word")
      toast.success("Word procesado. Te mostramos qué cambió.")
      void correrAuditoria()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el Word.")
    } finally {
      setSubiendoWord(false)
    }
  }

  async function enviarAprobacion() {
    setEnviando(true)
    try {
      await guardarSilencioso()
      const row = await enviarAprobacionDocumento(documento.id)
      onDocumentoChange(row)
      setEnviadoOk(true)
      toast.success("Enviado a aprobación. Tu supervisor lo revisa.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar.")
    } finally {
      setEnviando(false)
    }
  }

  const defaultsCapa2 = {
    exclusiones: config?.exclusiones_default_texto ?? null,
    consideraciones: config?.consideraciones_default_texto ?? null,
    porQueGeeks: config?.por_que_geeks_default_texto ?? null,
  }

  const showStepper = paso !== "arranque" && paso !== "generando"

  return (
    <div className="space-y-4">
      {showStepper ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <WizardStepper pasoActual={paso} completados={completados} />
          {guardadoTexto ? (
            <p className={cn("text-micro shrink-0", errorGuardado && "text-destructive")} aria-live="polite">
              {guardadoTexto}
            </p>
          ) : null}
        </div>
      ) : null}

      {paso === "arranque" ? (
        <PasoArranque
          clienteNombre={clienteNombre}
          lineas={lineas}
          errorGeneracion={
            documento.generacion_ia_estado === "fallido" ? documento.generacion_ia_error : null
          }
          onGenerar={() => {
            void onSolicitarGeneracion?.().then(() => setPaso("generando"))
          }}
          onBlanco={() => {
            setPaso("objetivo")
            toast.message("Seguí en blanco: escribí vos o pedile propuestas al copiloto en cada paso.")
          }}
        />
      ) : null}

      {paso === "generando" ? <GeneracionProgreso lineasCount={Math.max(lineas.length, 1)} /> : null}

      {paso !== "arranque" && paso !== "generando" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(260px,320px)]">
          <div className="min-w-0 space-y-4">
            {paso === "objetivo" ? (
              <PasoEncabezado
                titulo="¿Qué quiere lograr el cliente?"
                ayuda="Un párrafo claro que el cliente reconozca como su necesidad."
              />
            ) : null}
            {paso === "alcance" ? (
              <PasoEncabezado
                titulo="¿Qué incluye el proyecto?"
                ayuda="Funcional, técnico y cómo lo vamos a trabajar."
              />
            ) : null}
            {paso === "entregables" ? (
              <PasoEncabezado
                titulo="¿Qué entregamos y en qué plazos?"
                ayuda="Entregables concretos, tiempos, supuestos e inversión."
              />
            ) : null}
            {paso === "condiciones" ? (
              <PasoEncabezado
                titulo="Condiciones y textos de agencia"
                ayuda="Opcional. Si los dejás vacíos, en el PDF van los defaults de Geeks."
              />
            ) : null}
            {paso === "auditoria" ? (
              <PasoEncabezado
                titulo="Revisión con el auditor de IA"
                ayuda="Son avisos, no bloqueos. Vos decidís qué corregir."
              />
            ) : null}
            {paso === "word" ? (
              <PasoEncabezado
                titulo="Word y envío a aprobación"
                ayuda="Descargá, editá en Word sin borrar títulos de sección, y subí de nuevo si hace falta."
              />
            ) : null}

            {paso === "objetivo" ? (
              <CampoWizard
                label="Objetivo"
                value={draft.objetivo}
                disabled={!editable}
                onFocus={() => setCopilotoSeccion("objetivo")}
                onChange={(objetivo) => marcarDirty({ ...draft, objetivo })}
              />
            ) : null}

            {paso === "alcance" ? (
              <div className="space-y-4">
                <div onFocus={() => setCopilotoSeccion("alcance_funcional")}>
                  <AlcanceFuncionalEditor
                    value={draft.alcance_funcional}
                    disabled={!editable}
                    onChange={(alcance_funcional) => marcarDirty({ ...draft, alcance_funcional })}
                  />
                </div>
                <CampoWizard
                  label="Alcance técnico incluido"
                  value={draft.alcance_tecnico_incluido}
                  disabled={!editable}
                  onFocus={() => setCopilotoSeccion("alcance_tecnico_incluido")}
                  onChange={(alcance_tecnico_incluido) => marcarDirty({ ...draft, alcance_tecnico_incluido })}
                />
                <CampoWizard
                  label="Alcance técnico no incluido"
                  value={draft.alcance_tecnico_no_incluido}
                  disabled={!editable}
                  onFocus={() => setCopilotoSeccion("alcance_tecnico_no_incluido")}
                  onChange={(alcance_tecnico_no_incluido) =>
                    marcarDirty({ ...draft, alcance_tecnico_no_incluido })
                  }
                />
                <CampoWizard
                  label="Metodología"
                  value={draft.metodologia}
                  disabled={!editable}
                  onFocus={() => setCopilotoSeccion("metodologia")}
                  onChange={(metodologia) => marcarDirty({ ...draft, metodologia })}
                />
              </div>
            ) : null}

            {paso === "entregables" ? (
              <div className="space-y-4">
                <div onFocus={() => setCopilotoSeccion("entregables")}>
                  <EntregablesEditor
                    value={draft.entregables}
                    disabled={!editable}
                    onChange={(entregables) => marcarDirty({ ...draft, entregables })}
                  />
                </div>
                <CampoWizard
                  label="Tiempos"
                  value={draft.tiempos}
                  disabled={!editable}
                  onFocus={() => setCopilotoSeccion("tiempos")}
                  onChange={(tiempos) => marcarDirty({ ...draft, tiempos })}
                />
                <CampoWizard
                  label="Supuestos"
                  value={draft.supuestos}
                  disabled={!editable}
                  onFocus={() => setCopilotoSeccion("supuestos")}
                  onChange={(supuestos) => marcarDirty({ ...draft, supuestos })}
                />
                <CampoWizard
                  label="Modelo de inversión"
                  value={draft.modelo_inversion}
                  disabled={!editable}
                  onFocus={() => setCopilotoSeccion("modelo_inversion")}
                  onChange={(modelo_inversion) => marcarDirty({ ...draft, modelo_inversion })}
                />
              </div>
            ) : null}

            {paso === "condiciones" ? (
              <div className="space-y-4">
                <CampoWizard
                  label="Condiciones de pago"
                  value={draft.condiciones_pago_texto}
                  disabled={!editable}
                  onFocus={() => setCopilotoSeccion("condiciones_pago_texto")}
                  onChange={(condiciones_pago_texto) => marcarDirty({ ...draft, condiciones_pago_texto })}
                />
                <CampoWizard
                  label="Exclusiones"
                  value={draft.exclusiones_texto}
                  disabled={!editable}
                  placeholder={placeholderDefault(defaultsCapa2.exclusiones)}
                  onFocus={() => setCopilotoSeccion("exclusiones_texto")}
                  onChange={(exclusiones_texto) => marcarDirty({ ...draft, exclusiones_texto })}
                />
                <CampoWizard
                  label="Consideraciones"
                  value={draft.consideraciones_texto}
                  disabled={!editable}
                  placeholder={placeholderDefault(defaultsCapa2.consideraciones)}
                  onFocus={() => setCopilotoSeccion("consideraciones_texto")}
                  onChange={(consideraciones_texto) => marcarDirty({ ...draft, consideraciones_texto })}
                />
                <CampoWizard
                  label="Por qué Geeks"
                  value={draft.por_que_geeks_texto}
                  disabled={!editable}
                  placeholder={placeholderDefault(defaultsCapa2.porQueGeeks)}
                  onFocus={() => setCopilotoSeccion("por_que_geeks_texto")}
                  onChange={(por_que_geeks_texto) => marcarDirty({ ...draft, por_que_geeks_texto })}
                />
              </div>
            ) : null}

            {paso === "auditoria" ? (
              <PasoAuditoria
                auditando={auditando}
                error={errorAuditoria}
                auditoria={auditoria}
                ignoradas={ignoradasRef.current}
                onIgnorar={(key) => {
                  ignoradasRef.current.add(key)
                  setAuditoria(auditoria ? { ...auditoria } : null)
                }}
                onIr={(seccion) => irASeccion(seccion, setPaso)}
                onReintentar={() => void correrAuditoria()}
                desactualizada={!documento.auditoria_ia && !!auditoria}
              />
            ) : null}

            {paso === "word" ? (
              <PasoWord
                documento={documento}
                editable={editable}
                subiendo={subiendoWord}
                enviando={enviando}
                enviadoOk={enviadoOk || documento.estado === "pendiente_aprobacion"}
                inputRef={inputDocxRef}
                onSubir={onSubirWord}
                onEnviar={() => void enviarAprobacion()}
              />
            ) : null}

            <WizardNav
              paso={paso}
              omitirCondiciones={omitirCondiciones}
              editable={editable}
              onAtras={() => {
                const prev = pasoAnterior(paso)
                if (prev) {
                  setPaso(prev)
                }
              }}
              onSiguiente={() => {
                const next = pasoSiguiente(paso, omitirCondiciones)
                if (next) {
                  setPaso(next)
                }
              }}
              onSaltarCondiciones={() => {
                setOmitirCondiciones(true)
                setPaso("auditoria")
              }}
            />
          </div>

          {editable && paso !== "auditoria" && paso !== "word" ? (
            <CopilotoPanel
              documentoId={documento.id}
              seccion={copilotoSeccion}
              disabled={!editable}
              onAceptar={aceptarPropuesta}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function pasoInicial(doc: DocumentoAlcance): WizardPasoId {
  if (generacionEnCurso(doc)) {
    return "generando"
  }
  const vacio = !doc.objetivo && !doc.alcance_funcional?.length
  if (vacio && doc.generacion_ia_estado === "fallido") {
    return "arranque"
  }
  return "objetivo"
}

function importDraft(doc: DocumentoAlcance): DocumentoAlcanceDraft {
  return {
    objetivo: doc.objetivo,
    alcance_funcional: doc.alcance_funcional ?? [],
    alcance_tecnico_incluido: doc.alcance_tecnico_incluido,
    alcance_tecnico_no_incluido: doc.alcance_tecnico_no_incluido,
    metodologia: doc.metodologia,
    tiempos: doc.tiempos,
    modelo_inversion: doc.modelo_inversion,
    supuestos: doc.supuestos,
    entregables: doc.entregables ?? [],
    condiciones_pago_texto: doc.condiciones_pago_texto,
    exclusiones_texto: doc.exclusiones_texto,
    consideraciones_texto: doc.consideraciones_texto,
    por_que_geeks_texto: doc.por_que_geeks_texto,
  }
}

function PasoEncabezado({ titulo, ayuda }: { titulo: string; ayuda: string }) {
  return (
    <header>
      <h4 className="text-page">{titulo}</h4>
      <p className="mt-2 text-kicker text-muted-foreground">{ayuda}</p>
    </header>
  )
}

function PasoArranque({
  clienteNombre,
  lineas,
  errorGeneracion,
  onGenerar,
  onBlanco,
}: {
  clienteNombre: string
  lineas: LineaCotizacionResumen[]
  errorGeneracion: string | null
  onGenerar: () => void
  onBlanco: () => void
}) {
  return (
    <div className="surface-card space-y-6 p-6">
      <div>
        <h4 className="text-page">Hola, armemos el alcance para {clienteNombre || "tu cliente"}</h4>
        <p className="mt-2 text-kicker">
          Partimos de lo que ya cotizaste. La IA redacta un borrador; vos lo afinás con el copiloto.
        </p>
      </div>
      {lineas.length > 0 ? (
        <ul className="space-y-2 rounded-xl border border-border bg-muted/30 p-4">
          {lineas.map((linea, i) => (
            <li key={i} className="flex flex-wrap items-baseline justify-between gap-2 text-ui">
              <span className="text-ui-medium">{linea.titulo}</span>
              {linea.monto ? <span className="text-muted-foreground">{linea.monto}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-kicker text-muted-foreground">Todavía no hay líneas en la cotización.</p>
      )}
      {errorGeneracion ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-kicker text-destructive" role="alert">
          La última generación falló: {errorGeneracion}. Podés reintentar o empezar en blanco.
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={onGenerar}>
          Generar borrador con IA
        </Button>
        <Button type="button" variant="outline" onClick={onBlanco}>
          Prefiero empezar en blanco
        </Button>
      </div>
    </div>
  )
}

function CampoWizard({
  label,
  value,
  disabled,
  placeholder,
  onChange,
  onFocus,
}: {
  label: string
  value: string | null
  disabled: boolean
  placeholder?: string
  onChange: (next: string | null) => void
  onFocus?: () => void
}) {
  return (
    <div className="space-y-2" onFocus={onFocus}>
      <p className="text-kicker text-muted-foreground">{label}</p>
      <DocumentoAlcanceRichText
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  )
}

function placeholderDefault(valor: string | null): string | undefined {
  if (!valor?.trim()) {
    return "Vacío = default de agencia en el PDF."
  }
  return `Default de agencia si lo dejás vacío:\n${valor.slice(0, 200)}${valor.length > 200 ? "…" : ""}`
}

function WizardNav({
  paso,
  omitirCondiciones,
  editable,
  onAtras,
  onSiguiente,
  onSaltarCondiciones,
}: {
  paso: WizardPasoId
  omitirCondiciones: boolean
  editable: boolean
  onAtras: () => void
  onSiguiente: () => void
  onSaltarCondiciones: () => void
}) {
  const idx = indiceStepper(paso)
  const hayAtras = idx > 0
  const haySiguiente = pasoSiguiente(paso, omitirCondiciones) != null

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
      <Button type="button" variant="outline" size="sm" disabled={!hayAtras} onClick={onAtras}>
        <ChevronLeft className="size-4" strokeWidth={1.75} />
        Atrás
      </Button>
      <div className="flex flex-wrap gap-2">
        {paso === "condiciones" && editable ? (
          <Button type="button" variant="ghost" size="sm" onClick={onSaltarCondiciones}>
            Saltar este paso
          </Button>
        ) : null}
        {haySiguiente ? (
          <Button type="button" size="sm" onClick={onSiguiente}>
            Siguiente
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function severidadVariant(sev: AdvertenciaAuditoria["severidad"]) {
  if (sev === "alta") {
    return "destructive" as const
  }
  if (sev === "media") {
    return "warning" as const
  }
  return "outline" as const
}

function PasoAuditoria({
  auditando,
  error,
  auditoria,
  ignoradas,
  onIgnorar,
  onIr,
  onReintentar,
  desactualizada,
}: {
  auditando: boolean
  error: string | null
  auditoria: DocumentoAlcance["auditoria_ia"]
  ignoradas: Set<string>
  onIgnorar: (key: string) => void
  onIr: (seccion: string) => void
  onReintentar: () => void
  desactualizada: boolean
}) {
  if (auditando) {
    return (
      <div className="surface-card flex items-center gap-3 p-6">
        <Loader2 className="size-5 animate-spin text-primary" strokeWidth={1.75} />
        <p className="text-ui">Revisando coherencia con la cotización…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="surface-card space-y-3 p-6">
        <p className="text-ui-medium">No pudimos auditar</p>
        <p className="text-kicker text-destructive">{error}</p>
        <Button type="button" size="sm" onClick={onReintentar}>
          Reintentar
        </Button>
      </div>
    )
  }
  if (!auditoria) {
    return null
  }

  const visibles = auditoria.advertencias.filter((adv, i) => !ignoradas.has(advKey(adv, i)))
  const orden = { alta: 0, media: 1, baja: 2 }

  return (
    <div className="space-y-4">
      {desactualizada ? (
        <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-kicker">
          Editaste después de la última revisión.{" "}
          <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={onReintentar}>
            Volver a revisar
          </button>
        </p>
      ) : null}
      <p className="text-kicker">{auditoria.resumen}</p>
      {visibles.length === 0 ? (
        <div className="surface-card flex items-start gap-3 p-4">
          <CheckCircle2 className="size-5 shrink-0 text-success" strokeWidth={1.75} />
          <div>
            <p className="text-ui-medium">Lo demás está en orden</p>
            <p className="text-kicker text-muted-foreground">No vimos alertas pendientes. Igual revisá vos antes de enviar.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {[...visibles].sort((a, b) => orden[a.severidad] - orden[b.severidad]).map((adv, i) => (
            <li key={advKey(adv, i)} className="surface-card space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={severidadVariant(adv.severidad)}>{adv.severidad}</Badge>
                <span className="text-ui-medium">{adv.seccion}</span>
              </div>
              <p className="text-ui">{adv.mensaje}</p>
              {adv.cita ? (
                <blockquote className="border-l-2 border-primary/30 pl-3 text-kicker italic text-muted-foreground">
                  {adv.cita}
                  {!adv.cita_verificada ? (
                    <span className="mt-1 block text-micro not-italic text-warning">Cita aproximada</span>
                  ) : null}
                </blockquote>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="xs" variant="outline" onClick={() => onIr(adv.seccion)}>
                  Ir a la sección
                </Button>
                <Button type="button" size="xs" variant="ghost" onClick={() => onIgnorar(advKey(adv, i))}>
                  Es correcto, ignorar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {visibles.length > 0 ? (
        <div className="flex items-start gap-2 text-kicker text-muted-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-success" strokeWidth={1.75} />
          <span>El resto del documento no levantó alertas en esta pasada.</span>
        </div>
      ) : null}
    </div>
  )
}

function advKey(adv: AdvertenciaAuditoria, i: number) {
  return `${adv.seccion}-${adv.severidad}-${i}`
}

function irASeccion(tituloSeccion: string, setPaso: (p: WizardPasoId) => void) {
  const entry = Object.entries(TITULO_SECCION).find(([, t]) => t.toLowerCase() === tituloSeccion.toLowerCase())
  const campo = entry?.[0] as SeccionRegenerable | undefined
  if (!campo) {
    setPaso("objetivo")
    return
  }
  if (campo === "objetivo") {
    setPaso("objetivo")
  } else if (
    ["alcance_funcional", "alcance_tecnico_incluido", "alcance_tecnico_no_incluido", "metodologia"].includes(campo)
  ) {
    setPaso("alcance")
  } else if (["entregables", "tiempos", "supuestos", "modelo_inversion"].includes(campo)) {
    setPaso("entregables")
  } else {
    setPaso("condiciones")
  }
}

function PasoWord({
  documento,
  editable,
  subiendo,
  enviando,
  enviadoOk,
  inputRef,
  onSubir,
  onEnviar,
}: {
  documento: DocumentoAlcance
  editable: boolean
  subiendo: boolean
  enviando: boolean
  enviadoOk: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onSubir: (file: File) => void
  onEnviar: () => void
}) {
  const resumen = documento.resumen_cambios

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-muted/20 p-4 text-kicker">
        <p className="flex items-start gap-2">
          <AlertTriangle className="size-4 shrink-0 text-warning" strokeWidth={1.75} />
          No borres los títulos de sección en Word (Objetivo, Alcance funcional, etc.). Si falta un título, el texto
          puede pegarse a la sección anterior.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        disabled={subiendo}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            onSubir(file)
            e.target.value = ""
          }
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void descargarDocxDocumentoAlcance(documento.id)}>
          <Download className="size-4" strokeWidth={1.75} />
          Descargar Word
        </Button>
        {editable ? (
          <Button type="button" variant="outline" size="sm" disabled={subiendo} onClick={() => inputRef.current?.click()}>
            {subiendo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" strokeWidth={1.75} />}
            {subiendo ? "Leyendo tu Word…" : "Subir Word editado"}
          </Button>
        ) : null}
      </div>

      {subiendo ? (
        <p className="text-kicker animate-pulse" aria-live="polite">
          Comparando secciones y resumiendo cambios con IA…
        </p>
      ) : null}

      {resumen ? (
        <div className="surface-card space-y-3 p-4">
          <p className="text-ui-medium">Esto es lo que cambiaste</p>
          <p className="text-kicker">{resumen.resumen}</p>
          {resumen.cambios?.length ? (
            <ul className="space-y-2">
              {resumen.cambios.map((c, i) => (
                <li key={i} className="text-kicker">
                  <span className="text-ui-medium">{c.seccion}</span>
                  {c.detalle ? <span className="text-muted-foreground"> — {c.detalle}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          {resumen.secciones_no_encontradas?.length ? (
            <p className="text-micro text-warning">
              Títulos no encontrados en el Word: {resumen.secciones_no_encontradas.join(", ")}. Esas secciones
              conservaron el valor anterior.
            </p>
          ) : null}
          {resumen.titulos_no_reconocidos?.length ? (
            <p className="text-micro text-muted-foreground">
              Títulos extra en el Word: {resumen.titulos_no_reconocidos.join(", ")}.
            </p>
          ) : null}
          {resumen.ia_disponible === false ? (
            <p className="text-micro text-muted-foreground">Resumen sin IA — solo lista de secciones tocadas.</p>
          ) : null}
          {resumen.archivo_original_guardado === false ? (
            <p className="text-micro text-muted-foreground">No pudimos guardar el archivo original; el contenido sí se aplicó.</p>
          ) : null}
        </div>
      ) : null}

      {editable && !enviadoOk ? (
        <Button type="button" disabled={enviando || subiendo} onClick={onEnviar}>
          {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
          Enviar a aprobación
        </Button>
      ) : null}

      {enviadoOk ? (
        <div className="surface-card flex items-start gap-3 border-success/20 bg-success/5 p-6">
          <PartyPopper className="size-6 text-success" strokeWidth={1.75} />
          <div>
            <p className="text-section">Listo, quedó en la bandeja de aprobación</p>
            <p className="mt-1 text-kicker">Tu supervisor recibe el aviso. Mientras tanto podés seguir la cotización.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export { importDraft as draftFromDocumentoWizard }
