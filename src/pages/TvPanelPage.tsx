import { useCallback, useEffect, useMemo, useState } from "react"
import { CircleDollarSign, Columns3, Percent, Target } from "lucide-react"

import { KpiCard } from "@/components/kpi-card"
import { PrometioLogo } from "@/components/prometio-logo"
import { TvActividadReciente } from "@/components/tv/TvActividadReciente"
import { TvFinancieroFila } from "@/components/tv/TvFinancieroFila"
import { TvMetasLista } from "@/components/tv/TvMetasLista"
import { TvPipelineBarras } from "@/components/tv/TvPipelineBarras"
import { getDashboardKpis, getTvFinanciero } from "@/lib/api/dashboard"
import { listTimeline } from "@/lib/api/timeline"
import { ApiError } from "@/lib/api-client"
import { formatMoney } from "@/lib/costo-interno"
import { cn } from "@/lib/utils"
import { useOrgStore } from "@/store/org-store"
import type { DashboardKPIs } from "@/types/dashboard"
import type { TimelineEvento } from "@/types/timeline"
import type { TvFinanciero } from "@/types/tv-financiero"

const POLL_MS = 90_000
const ROTACION_MS = 30_000

function formatRelativo(segundos: number): string {
  if (segundos < 60) {
    return `hace ${segundos}s`
  }
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) {
    return `hace ${minutos} min`
  }
  const horas = Math.floor(minutos / 60)
  return `hace ${horas} h`
}

function formatHora(date: Date): string {
  return date.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export function TvPanelPage() {
  const organizacion = useOrgStore((state) => state.organizacion)
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [financiero, setFinanciero] = useState<TvFinanciero | null>(null)
  const [contificoDisponible, setContificoDisponible] = useState(true)
  const [timeline, setTimeline] = useState<TimelineEvento[]>([])
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null)
  const [segundosDesdeSync, setSegundosDesdeSync] = useState(0)
  const [reloj, setReloj] = useState(() => new Date())
  const [vistaRotacion, setVistaRotacion] = useState<"pipeline" | "metas">("pipeline")
  const [cursorOculto, setCursorOculto] = useState(false)

  const cargar = useCallback(async () => {
    const [kpiResult, timelineResult, financieroResult] = await Promise.allSettled([
      getDashboardKpis(),
      listTimeline({ limit: 20 }),
      getTvFinanciero(),
    ])

    if (kpiResult.status === "fulfilled") {
      setKpis(kpiResult.value)
    }
    if (timelineResult.status === "fulfilled") {
      setTimeline(timelineResult.value)
    }
    if (financieroResult.status === "fulfilled") {
      setFinanciero(financieroResult.value)
      setContificoDisponible(true)
    } else {
      const err = financieroResult.reason
      if (err instanceof ApiError && err.status === 502) {
        setContificoDisponible(false)
      }
    }

    setUltimaActualizacion(new Date())
  }, [])

  useEffect(() => {
    void cargar().catch(() => {
      /* mantener datos previos en pantalla */
    })
    const poll = window.setInterval(() => {
      void cargar().catch(() => {})
    }, POLL_MS)
    return () => window.clearInterval(poll)
  }, [cargar])

  useEffect(() => {
    const tick = window.setInterval(() => setReloj(new Date()), 1000)
    return () => window.clearInterval(tick)
  }, [])

  useEffect(() => {
    if (!ultimaActualizacion) {
      return
    }
    const tick = window.setInterval(() => {
      setSegundosDesdeSync(Math.floor((Date.now() - ultimaActualizacion.getTime()) / 1000))
    }, 1000)
    return () => window.clearInterval(tick)
  }, [ultimaActualizacion])

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion) {
      return
    }
    const rotar = window.setInterval(() => {
      setVistaRotacion((prev) => (prev === "pipeline" ? "metas" : "pipeline"))
    }, ROTACION_MS)
    return () => window.clearInterval(rotar)
  }, [])

  useEffect(() => {
    let timer: number | undefined
    function ocultar() {
      setCursorOculto(false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setCursorOculto(true), 5000)
    }
    ocultar()
    window.addEventListener("mousemove", ocultar)
    window.addEventListener("mousedown", ocultar)
    return () => {
      window.removeEventListener("mousemove", ocultar)
      window.removeEventListener("mousedown", ocultar)
      window.clearTimeout(timer)
    }
  }, [])

  const conversion = kpis?.conversion
  const tasa =
    conversion?.tasa_conversion_pct == null
      ? "—"
      : `${conversion.tasa_conversion_pct.toFixed(1)}%`
  const metaPct =
    kpis?.metas.avance_total_pct == null ? "—" : `${Math.round(kpis.metas.avance_total_pct)}%`

  const logoUrl = organizacion?.logo_url_oscuro ?? organizacion?.logo_url

  const timelineVisible = useMemo(() => timeline, [timeline])

  return (
    <div
      className={cn(
        "dark flex min-h-svh flex-col bg-background text-foreground",
        cursorOculto && "cursor-none",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-9 max-w-40 object-contain object-left" />
          ) : (
            <PrometioLogo onDark className="h-8 w-auto" />
          )}
          <div className="min-w-0">
            <p className="truncate text-section">{organizacion?.nombre ?? "prometIO"}</p>
            <p className="text-kicker text-muted-foreground">Panel en vivo</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-2xl tabular-nums tracking-tight">{formatHora(reloj)}</p>
          <p className="text-kicker text-muted-foreground">
            {ultimaActualizacion
              ? `Actualizado ${formatRelativo(segundosDesdeSync)}`
              : "Sincronizando…"}
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Valor en juego"
              value={kpis ? formatMoney(kpis.valor_total_en_juego) : "—"}
              hint="Pipeline abierto"
              icon={CircleDollarSign}
              tone="bg-primary/15 text-primary"
              density="tv"
            />
            <KpiCard
              title="Meta del mes"
              value={metaPct}
              hint={
                kpis?.metas.meta_total != null
                  ? `${formatMoney(kpis.metas.valor_cerrado_total)} de ${formatMoney(kpis.metas.meta_total)}`
                  : "Sin meta vigente"
              }
              icon={Target}
              tone="bg-success/15 text-success"
              density="tv"
            />
            <KpiCard
              title="Conversión"
              value={tasa}
              hint={
                conversion
                  ? `${conversion.ganadas} ganadas · ${conversion.perdidas} perdidas`
                  : undefined
              }
              icon={Percent}
              tone="bg-highlight/15 text-highlight"
              density="tv"
            />
            <KpiCard
              title="Oportunidades abiertas"
              value={
                kpis
                  ? kpis.pipeline_por_etapa
                      .filter(
                        (row) => row.etapa !== "cierre_ganado" && row.etapa !== "cierre_perdido",
                      )
                      .reduce((sum, row) => sum + row.cantidad, 0)
                  : "—"
              }
              hint="En etapas activas"
              icon={Columns3}
              tone="bg-warning/15 text-warning"
              density="tv"
            />
          </div>

          <TvFinancieroFila datos={financiero} contificoDisponible={contificoDisponible} />

          <section className="min-h-0 flex-1 rounded-xl p-5 ring-1 ring-border">
            <div className="mb-4 flex items-baseline justify-between gap-2">
              <h2 className="text-section">
                {vistaRotacion === "pipeline" ? "Pipeline por etapa" : "Metas por vendedor"}
              </h2>
              <p className="text-kicker text-muted-foreground">Rota cada 30 s</p>
            </div>
            {kpis ? (
              vistaRotacion === "pipeline" ? (
                <TvPipelineBarras etapas={kpis.pipeline_por_etapa} />
              ) : (
                <TvMetasLista filas={kpis.metas.por_vendedor} />
              )
            ) : (
              <p className="text-kicker text-muted-foreground">Cargando indicadores…</p>
            )}
          </section>
        </div>

        <TvActividadReciente eventos={timelineVisible} />
      </div>
    </div>
  )
}
