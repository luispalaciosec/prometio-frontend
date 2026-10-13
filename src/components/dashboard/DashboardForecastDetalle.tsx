import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Columns3, Receipt, Repeat } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { ListSkeleton } from "@/components/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { listCotizaciones } from "@/lib/api/cotizacion"
import { etiquetaContacto, etiquetaEmpresa } from "@/lib/api/oportunidad"
import { formatPeriodo } from "@/lib/contrato-recurrente"
import { rutaConstructorCotizacion } from "@/lib/cotizacion-rutas"
import { formatMoney } from "@/lib/costo-interno"
import type { FilaPipelinePonderado } from "@/lib/dashboard-comercial"
import { cn } from "@/lib/utils"
import type { CotizacionConLineas } from "@/types/cotizacion"
import type { EtapaPipeline } from "@/types/etapa-pipeline"
import type { Oportunidad } from "@/types/oportunidad"

export type ForecastMontos = {
  cerrado: number
  porFacturar: number
  fees: number
  pipeline: number
  meta: number
}

type Pestana = "pipeline" | "por_facturar" | "fees"

function FilaCuenta({
  signo,
  label,
  detalle,
  monto,
  total,
  destacado,
}: {
  signo?: string
  label: string
  detalle?: string
  monto: number
  total?: boolean
  destacado?: "bien" | "mal"
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2",
        total && "border-t border-border",
      )}
    >
      <div className="min-w-0">
        <p className={total ? "text-ui-medium" : "text-ui"}>
          {signo ? <span className="mr-2 inline-block w-3 text-muted-foreground">{signo}</span> : null}
          {label}
        </p>
        {detalle ? <p className="pl-5 text-kicker text-muted-foreground">{detalle}</p> : null}
      </div>
      <p
        className={cn(
          "shrink-0 tabular-nums",
          total ? "text-ui-medium" : "text-ui",
          destacado === "bien" && "text-success",
          destacado === "mal" && "text-destructive",
        )}
      >
        {formatMoney(monto)}
      </p>
    </div>
  )
}

export function DashboardForecastDetalle({
  open,
  onClose,
  montos,
  soloLoPropio,
  fechaFin,
  pipeline,
  etapas,
  fees,
  oportunidades,
}: {
  open: boolean
  onClose: () => void
  montos: ForecastMontos
  soloLoPropio: boolean
  fechaFin: string
  pipeline: FilaPipelinePonderado[]
  etapas: EtapaPipeline[]
  fees: { periodo: string; monto: number }[]
  /** Activas e inactivas, para nombrar las cotizaciones por facturar. */
  oportunidades: Oportunidad[]
}) {
  const [pestana, setPestana] = useState<Pestana>("pipeline")
  const [porFacturar, setPorFacturar] = useState<CotizacionConLineas[] | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    setPorFacturar(null)
    void listCotizaciones({ estado: "por_facturar" })
      .then((rows) => {
        if (!cancelled) {
          setPorFacturar(rows)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPorFacturar([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const comprometido = montos.cerrado + montos.porFacturar + montos.fees
  const forecast = comprometido + montos.pipeline
  const brecha = montos.meta - forecast
  const oppPorId = new Map(oportunidades.map((row) => [row.id, row]))
  const nombreEtapa = (codigo: string) => etapas.find((row) => row.codigo === codigo)?.nombre ?? codigo

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
        className={cn(
          "flex max-h-[min(92vh,880px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl",
          "max-sm:fixed max-sm:inset-0 max-sm:top-0 max-sm:left-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none",
        )}
      >
        <div className="border-b border-border px-4 py-4 sm:px-6">
          <DialogHeader>
            <DialogTitle className="text-page">Cómo se calcula el forecast</DialogTitle>
            <DialogDescription>
              Hasta el fin del período de la meta. Todos los montos sin IVA.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="rounded-xl bg-muted/40 px-4 py-2">
            <FilaCuenta
              label={soloLoPropio ? "Cerrado en el CRM" : "Facturado (Contífico)"}
              detalle={soloLoPropio ? "Oportunidades ganadas en el período" : "Facturación agencia del período, sin medios"}
              monto={montos.cerrado}
            />
            <FilaCuenta
              signo="+"
              label="Por facturar"
              detalle="Cotizaciones aceptadas que todavía no tienen factura"
              monto={montos.porFacturar}
            />
            <FilaCuenta
              signo="+"
              label="Fees por generar"
              detalle="Contratos de fee recurrente sin cotización todavía, hasta fin del período"
              monto={montos.fees}
            />
            <FilaCuenta label="Comprometido" monto={comprometido} total />
            <FilaCuenta
              signo="+"
              label="Pipeline ponderado"
              detalle="Cada oportunidad abierta × su probabilidad de cierre"
              monto={montos.pipeline}
            />
            <FilaCuenta label="Forecast" monto={forecast} total />
            <FilaCuenta signo="−" label="Meta" monto={montos.meta} />
            <FilaCuenta
              label={brecha > 0 ? "Falta para la meta" : "Sobre la meta"}
              detalle={
                brecha > 0
                  ? "Lo que falta aunque se cierre todo el pipeline esperado"
                  : "Lo que se pasa si se cumple lo esperado"
              }
              monto={Math.abs(brecha)}
              total
              destacado={brecha > 0 ? "mal" : "bien"}
            />
          </div>

          <Tabs value={pestana} onValueChange={(value) => setPestana(value as Pestana)}>
            <TabsList>
              <TabsTrigger value="pipeline">Pipeline ({pipeline.length})</TabsTrigger>
              <TabsTrigger value="por_facturar">
                Por facturar{porFacturar ? ` (${porFacturar.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="fees">Fees ({fees.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pipeline" className="mt-4">
              {pipeline.length === 0 ? (
                <EmptyState icon={Columns3} title="Sin pipeline abierto" body="No hay oportunidades abiertas que sumen." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Oportunidad</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Prob.</TableHead>
                      <TableHead className="text-right">Ponderado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipeline.map((fila) => (
                      <TableRow key={fila.oportunidad.id} className="cursor-pointer">
                        <TableCell className="whitespace-normal">
                          <Link to={`/pipeline/${fila.oportunidad.id}`} className="block" onClick={onClose}>
                            <p className="text-ui-medium">
                              {fila.oportunidad.nombre ?? etiquetaContacto(fila.oportunidad.contacto_id)}
                            </p>
                            <p className="text-kicker text-muted-foreground">
                              {etiquetaEmpresa(fila.oportunidad.empresa_id)}
                            </p>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{nombreEtapa(fila.oportunidad.etapa)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(fila.valor)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {Math.round(fila.probabilidad * 100)}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(fila.ponderado)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="por_facturar" className="mt-4">
              {porFacturar == null ? (
                <ListSkeleton rows={3} />
              ) : porFacturar.length === 0 ? (
                <EmptyState icon={Receipt} title="Nada por facturar" body="No hay cotizaciones aceptadas esperando factura." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cotización</TableHead>
                      <TableHead>Contacto / empresa</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {porFacturar.map((cotizacion) => {
                      const opp = oppPorId.get(cotizacion.oportunidad_id)
                      return (
                        <TableRow key={cotizacion.id}>
                          <TableCell className="text-ui-medium">
                            <Link to={rutaConstructorCotizacion(cotizacion.id)} onClick={onClose} className="hover:underline">
                              {cotizacion.numero}
                            </Link>
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <p className="text-ui">{opp ? etiquetaContacto(opp.contacto_id) : "—"}</p>
                            <p className="text-kicker text-muted-foreground">{opp ? etiquetaEmpresa(opp.empresa_id) : "—"}</p>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{formatMoney(cotizacion.subtotal_cotizacion)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="fees" className="mt-4">
              {fees.length === 0 ? (
                <EmptyState
                  icon={Repeat}
                  title="Sin fees por generar"
                  body={`Ningún contrato de fee recurrente tiene meses sin cotización hasta el ${fechaFin}.`}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Fees sin cotización</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fees.map((row) => (
                      <TableRow key={row.periodo}>
                        <TableCell className="text-ui-medium first-letter:uppercase">{formatPeriodo(row.periodo, true)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMoney(row.monto)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
