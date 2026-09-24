import { useCallback, useEffect, useState } from "react"
import { DashboardDetalleBarras } from "@/components/dashboard/DashboardDetalleBarras"
import { DashboardDetalleTabla } from "@/components/dashboard/DashboardDetalleTabla"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDashboardDetalle } from "@/lib/api/dashboard"
import { formatMoney } from "@/lib/costo-interno"
import { formatDateOnly } from "@/lib/datetime-local"
import { etiquetaPeriodo } from "@/lib/meta-comercial"
import { cn } from "@/lib/utils"
import type { DashboardDetalle, DashboardDetalleRequest } from "@/types/dashboard-detalle"
import { Target } from "lucide-react"

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

export function DashboardDetalleModal({
  request,
  onClose,
  returnFocusRef,
}: {
  request: DashboardDetalleRequest | null
  onClose: () => void
  returnFocusRef: React.RefObject<HTMLElement | null>
}) {
  const open = request != null
  const reduceMotion = usePrefersReducedMotion()
  const [detalle, setDetalle] = useState<DashboardDetalle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(async () => {
    if (!request) {
      return
    }
    setCargando(true)
    setError(null)
    try {
      const data = await getDashboardDetalle(request.tarjeta, {
        etapa: request.etapa,
      })
      setDetalle(data)
    } catch (err) {
      setDetalle(null)
      setError(err instanceof Error ? err.message : "No se pudo cargar el detalle.")
    } finally {
      setCargando(false)
    }
  }, [request])

  useEffect(() => {
    if (!request) {
      setDetalle(null)
      setError(null)
      return
    }
    void cargar()
  }, [request, cargar])

  const titulo = detalle?.titulo ?? request?.previewTitulo ?? "Detalle"
  const valorGrande = request?.previewValor ?? "—"

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
        }
      }}
    >
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92vh,880px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl",
          "max-sm:fixed max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
          !reduceMotion && "dashboard-detalle-flip",
        )}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocusRef.current?.focus()
        }}
      >
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <DialogHeader>
            <DialogTitle className="text-page">{titulo}</DialogTitle>
            <DialogDescription className="sr-only">
              Detalle de oportunidades que componen este indicador
            </DialogDescription>
          </DialogHeader>
          <p className="mt-2 text-page tabular-nums">{valorGrande}</p>
          {detalle ? (
            <p className="mt-1 text-kicker text-muted-foreground">
              {detalle.cantidad} oportunidades · {formatMoney(detalle.valor_total)} en total
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {cargando ? (
            <div className="space-y-3" aria-busy="true" aria-live="polite">
              <div className="h-8 animate-pulse rounded-lg bg-muted" />
              <div className="h-40 animate-pulse rounded-xl bg-muted" />
              <div className="h-56 animate-pulse rounded-xl bg-muted" />
            </div>
          ) : error ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-kicker text-destructive">{error}</p>
              <Button type="button" size="sm" onClick={() => void cargar()}>
                Reintentar
              </Button>
            </div>
          ) : detalle ? (
            <ContenidoDetalle detalle={detalle} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ContenidoDetalle({ detalle }: { detalle: DashboardDetalle }) {
  if (detalle.tarjeta === "meta" && detalle.meta == null) {
    return (
      <EmptyState
        icon={Target}
        title="Sin meta para este período"
        body="No hay una meta comercial configurada que cubra hoy. El detalle de cierres aparece cuando exista meta vigente."
      />
    )
  }

  if (detalle.tarjeta === "conversion") {
    const ganadas = detalle.filas.filter((row) => row.resultado === "ganada")
    const perdidas = detalle.filas.filter((row) => row.resultado === "perdida")
    return (
      <div className="space-y-6">
        <p className="text-kicker">
          Tasa:{" "}
          {detalle.tasa_conversion_pct == null ? "—" : `${detalle.tasa_conversion_pct.toFixed(1)}%`} (
          {detalle.ganadas ?? 0} ganadas · {detalle.perdidas ?? 0} perdidas)
        </p>
        <Tabs defaultValue="ganadas">
          <TabsList>
            <TabsTrigger value="ganadas">Ganadas ({ganadas.length})</TabsTrigger>
            <TabsTrigger value="perdidas">Perdidas ({perdidas.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="ganadas" className="mt-4">
            <DashboardDetalleTabla filas={ganadas} />
          </TabsContent>
          <TabsContent value="perdidas" className="mt-4">
            <DashboardDetalleTabla filas={perdidas} mostrarCausa />
          </TabsContent>
        </Tabs>
        <Desglose detalle={detalle} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {detalle.meta ? <MetaBloque meta={detalle.meta} /> : null}
      <DashboardDetalleTabla filas={detalle.filas} />
      <Desglose detalle={detalle} />
    </div>
  )
}

function MetaBloque({ meta }: { meta: NonNullable<DashboardDetalle["meta"]> }) {
  const pct = meta.avance_pct ?? 0
  return (
    <div className="surface-card space-y-3 p-4">
      <p className="text-ui-medium">
        {etiquetaPeriodo(meta.periodo_tipo)} · {formatDateOnly(meta.fecha_inicio)} –{" "}
        {formatDateOnly(meta.fecha_fin)}
      </p>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-success transition-[width]"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <dl className="grid gap-2 text-kicker sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Meta</dt>
          <dd className="text-ui-medium tabular-nums">{formatMoney(meta.meta_total)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cerrado</dt>
          <dd className="text-ui-medium tabular-nums">{formatMoney(meta.valor_cerrado)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Faltante</dt>
          <dd className="text-ui-medium tabular-nums">{formatMoney(meta.faltante)}</dd>
        </div>
      </dl>
    </div>
  )
}

function Desglose({ detalle }: { detalle: DashboardDetalle }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {detalle.por_vendedor.length > 0 ? (
        <DashboardDetalleBarras titulo="Por vendedor" filas={detalle.por_vendedor} />
      ) : null}
      {detalle.por_etapa.length > 0 ? (
        <DashboardDetalleBarras titulo="Por etapa" filas={detalle.por_etapa} />
      ) : null}
    </div>
  )
}
