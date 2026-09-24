import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { CheckCircle2, ChevronDown, Copy, RefreshCw, Sparkles } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { KindMark } from "@/components/kind-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSugerenciasInicio } from "@/lib/api/inicio"
import { rutaEnlaceSugerenciaAsync } from "@/lib/inicio-sugerencias-rutas"
import {
  PRIORIDAD_BADGE,
  PRIORIDAD_ORDEN,
  SUGERENCIA_TIPO_VISUAL,
} from "@/lib/inicio-sugerencias-visual"
import { cn } from "@/lib/utils"
import type { SugerenciaInicio, SugerenciasInicioResponse } from "@/types/inicio-sugerencias"

type Estado = "idle" | "cargando" | "ok" | "error"

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduce(mq.matches)
    const handler = () => setReduce(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return reduce
}

function visualTipo(tipo: string) {
  return (
    SUGERENCIA_TIPO_VISUAL[tipo as keyof typeof SUGERENCIA_TIPO_VISUAL] ?? {
      icon: Sparkles,
      tone: "bg-highlight/15 text-highlight",
      label: "Sugerencia",
    }
  )
}

function ordenar(sugerencias: SugerenciaInicio[]): SugerenciaInicio[] {
  return [...sugerencias].sort(
    (a, b) => PRIORIDAD_ORDEN[a.prioridad] - PRIORIDAD_ORDEN[b.prioridad],
  )
}

export function SugerenciasCard() {
  const navigate = useNavigate()
  const reduceMotion = usePrefersReducedMotion()
  const [estado, setEstado] = useState<Estado>("idle")
  const [data, setData] = useState<SugerenciasInicioResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [navegandoId, setNavegandoId] = useState<string | null>(null)

  const cargar = useCallback(async (refrescar: boolean) => {
    setEstado("cargando")
    setErrorMsg(null)
    try {
      const resp = await getSugerenciasInicio(refrescar)
      setData(resp)
      setEstado("ok")
    } catch (err) {
      setData(null)
      setEstado("error")
      setErrorMsg(err instanceof Error ? err.message : "No se pudieron cargar las sugerencias.")
    }
  }, [])

  useEffect(() => {
    void cargar(false)
  }, [cargar])

  const sugerencias = useMemo(
    () => (data?.sugerencias ? ordenar(data.sugerencias) : []),
    [data?.sugerencias],
  )

  const pulse = !reduceMotion && estado === "cargando"

  async function irA(enlace: SugerenciaInicio["enlace"], id: string) {
    setNavegandoId(id)
    try {
      const ruta = await rutaEnlaceSugerenciaAsync(enlace)
      navigate(ruta)
    } catch {
      toast.error("No pudimos abrir ese registro.")
    } finally {
      setNavegandoId(null)
    }
  }

  return (
    <section
      className="surface-card p-5 sm:col-span-2"
      aria-labelledby="sugerencias-inicio-titulo"
      aria-busy={estado === "cargando"}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <KindMark icon={Sparkles} tone="bg-highlight/15 text-highlight" size="lg" />
          <div>
            <h2 id="sugerencias-inicio-titulo" className="text-ui-medium">
              Sugerencias
            </h2>
            <p className="text-kicker text-muted-foreground">
              En qué enfocarte hoy, según tu cartera.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={estado === "cargando"}
          className="text-kicker"
          onClick={() => void cargar(true)}
        >
          <RefreshCw
            className={cn("size-3.5", pulse && "animate-spin")}
            strokeWidth={1.75}
            aria-hidden
          />
          Actualizar
        </Button>
      </div>

      <div className="mt-4" aria-live="polite" aria-atomic="true">
        {estado === "cargando" ? (
          <div className="space-y-3">
            <p className="text-kicker text-muted-foreground">
              Tu asistente está mirando tu cartera…
            </p>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-20 rounded-xl bg-muted/60",
                  pulse && "animate-pulse",
                )}
              />
            ))}
          </div>
        ) : null}

        {estado === "error" ? (
          <div className="space-y-3 py-2 text-center">
            <p className="text-kicker text-destructive">{errorMsg}</p>
            <Button type="button" size="sm" onClick={() => void cargar(false)}>
              Reintentar
            </Button>
          </div>
        ) : null}

        {estado === "ok" && data?.generado_con_ia === false ? (
          <p className="mb-3 text-micro text-muted-foreground">
            Sugerencias básicas: el asistente no estuvo disponible.
          </p>
        ) : null}

        {estado === "ok" && sugerencias.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nada urgente hoy"
            body="Tu cartera está al día. Volvé más tarde o pedí una actualización."
          />
        ) : null}

        {estado === "ok" && sugerencias.length > 0 ? (
          <ul className="space-y-3">
            {sugerencias.map((row) => (
              <SugerenciaFila
                key={row.id}
                row={row}
                conIa={data?.generado_con_ia ?? false}
                navegando={navegandoId === row.id}
                onVer={() => void irA(row.enlace, row.id)}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

function SugerenciaFila({
  row,
  conIa,
  navegando,
  onVer,
}: {
  row: SugerenciaInicio
  conIa: boolean
  navegando: boolean
  onVer: () => void
}) {
  const visual = visualTipo(row.tipo)
  const mostrarMensaje = conIa && !!row.mensaje_sugerido?.trim()
  const [expandido, setExpandido] = useState(false)
  const [borrador, setBorrador] = useState(row.mensaje_sugerido ?? "")

  useEffect(() => {
    setBorrador(row.mensaje_sugerido ?? "")
  }, [row.mensaje_sugerido])

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
      toast.success("Copiado")
    } catch {
      toast.error("No se pudo copiar al portapapeles.")
    }
  }

  return (
    <li className="rounded-xl border border-border bg-background p-4 shadow-raised">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <KindMark icon={visual.icon} tone={visual.tone} size="md" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={PRIORIDAD_BADGE[row.prioridad]} className="capitalize">
              {row.prioridad}
            </Badge>
            <span className="sr-only">{visual.label}</span>
          </div>
          <p className="text-ui-medium">{row.titulo}</p>
          <p className="text-kicker text-muted-foreground line-clamp-2">{row.motivo}</p>
          <p className="text-kicker">
            <span className="text-ui-medium">{row.accion}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <Button type="button" size="sm" disabled={navegando} onClick={onVer}>
            Ver
          </Button>
          {mostrarMensaje ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void copiar(borrador.trim() || row.mensaje_sugerido!)}
              >
                <Copy className="size-3.5" strokeWidth={1.75} aria-hidden />
                Copiar mensaje
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-kicker"
                aria-expanded={expandido}
                onClick={() => setExpandido((v) => !v)}
              >
                {expandido ? "Ocultar" : "Ver mensaje"}
                <ChevronDown
                  className={cn("size-3.5 transition-transform", expandido && "rotate-180")}
                  strokeWidth={1.75}
                  aria-hidden
                />
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {mostrarMensaje && expandido ? (
        <div className="mt-3 border-t border-border pt-3">
          <label className="text-kicker text-muted-foreground" htmlFor={`msg-${row.id}`}>
            Borrador para el cliente (podés editarlo antes de copiar)
          </label>
          <textarea
            id={`msg-${row.id}`}
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-ui"
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => void copiar(borrador.trim())}
          >
            Copiar texto editado
          </Button>
        </div>
      ) : null}
    </li>
  )
}
