import { useEffect, useState } from "react"
import { useOutletContext } from "react-router-dom"
import { CalendarX, ChartColumn, Clock, Layers, ReceiptText } from "lucide-react"
import { toast } from "sonner"

import type { ContratosOutletContext } from "@/components/contratos/ContratosLayout"
import { ProyeccionChart } from "@/components/contratos/ProyeccionChart"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { DashboardSkeleton } from "@/components/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getProyeccion } from "@/lib/api/contrato-recurrente"
import { formatPeriodo, mesActualEcuador } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import { cn } from "@/lib/utils"
import type { ProyeccionMes } from "@/types/contrato-recurrente"

export function ProyeccionContratosPage() {
  const { version } = useOutletContext<ContratosOutletContext>()
  const [meses, setMeses] = useState("12")
  const [mesesAtras, setMesesAtras] = useState("3")
  const [conContifico, setConContifico] = useState(false)
  const [rows, setRows] = useState<ProyeccionMes[] | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let cancelled = false
    setCargando(true)
    void getProyeccion({
      meses: Number(meses),
      meses_atras: Number(mesesAtras),
      incluir_contifico: conContifico,
    })
      .then((data) => {
        if (!cancelled) {
          setRows(data)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo cargar la proyección.")
          setRows([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCargando(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [meses, mesesAtras, conContifico, version])

  const mesActual = `${mesActualEcuador()}-01`
  const actual = rows?.find((row) => row.periodo.slice(0, 10) === mesActual) ?? null
  const hayPiso = rows?.some((row) => row.piso_contratado > 0) ?? false
  const muestraContifico = rows?.some((row) => row.facturado_agencia_contifico != null) ?? false

  return (
    <>
      <div className="filter-bar">
        <div className="filter-field">
          <Label htmlFor="proyeccion-meses">Hacia adelante</Label>
          <Select value={meses} onValueChange={setMeses}>
            <SelectTrigger id="proyeccion-meses">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
              <SelectItem value="18">18 meses</SelectItem>
              <SelectItem value="24">24 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="filter-field">
          <Label htmlFor="proyeccion-atras">Hacia atrás</Label>
          <Select value={mesesAtras} onValueChange={setMesesAtras}>
            <SelectTrigger id="proyeccion-atras">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Ninguno</SelectItem>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-ui">
          <Checkbox
            checked={conContifico}
            disabled={cargando}
            onCheckedChange={(value) => setConContifico(value === true)}
          />
          Comparar con lo facturado en Contífico
          <span className="text-kicker">(lento)</span>
        </label>
      </div>
      {rows == null || (cargando && rows.length === 0) ? (
        <DashboardSkeleton />
      ) : !hayPiso ? (
        <EmptyState
          icon={ChartColumn}
          title="Sin piso contratado"
          body="Cuando haya contratos de fee recurrente vigentes, la proyección mes a mes aparece acá."
        />
      ) : (
        <div className={cn("space-y-6", cargando && "opacity-60 transition-opacity")}>
          {actual ? (
            <section className="space-y-3">
              <h2 className="text-section first-letter:uppercase">{formatPeriodo(actual.periodo, true)}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  title="Piso contratado"
                  value={formatMoney(actual.piso_contratado)}
                  hint="Subtotal sin IVA"
                  icon={Layers}
                  tone="bg-primary/15 text-primary"
                />
                <KpiCard
                  title="Facturado"
                  value={formatMoney(actual.facturado)}
                  icon={ReceiptText}
                  tone="bg-success/15 text-success"
                />
                <KpiCard
                  title="Por facturar"
                  value={formatMoney(actual.por_facturar)}
                  icon={Clock}
                  tone="bg-warning/15 text-warning"
                />
                <KpiCard
                  title="Vence este mes"
                  value={formatMoney(actual.vence_en_el_mes)}
                  hint="Se cae el mes siguiente si no se renueva"
                  icon={CalendarX}
                  tone="bg-destructive/15 text-destructive"
                />
              </div>
            </section>
          ) : null}
          <section className="space-y-3 surface-card p-4 sm:p-5">
            <h2 className="text-section">Piso de facturación por mes</h2>
            <ProyeccionChart meses={rows} />
          </section>
          <section className="space-y-3">
            <h2 className="text-section">Detalle</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Piso contratado</TableHead>
                  <TableHead className="text-right">Facturado</TableHead>
                  <TableHead className="text-right">Por facturar</TableHead>
                  <TableHead className="text-right">Vence en el mes</TableHead>
                  {muestraContifico ? (
                    <TableHead className="text-right">Facturado agencia (Contífico)</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.periodo}
                    className={cn(row.periodo.slice(0, 10) === mesActual && "bg-muted/40")}
                  >
                    <TableCell className="text-ui-medium first-letter:uppercase">
                      {formatPeriodo(row.periodo, true)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(row.piso_contratado)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMoney(row.facturado)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatMoney(row.por_facturar)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        row.vence_en_el_mes > 0 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {row.vence_en_el_mes > 0 ? formatMoney(row.vence_en_el_mes) : "—"}
                    </TableCell>
                    {muestraContifico ? (
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {row.facturado_agencia_contifico != null
                          ? formatMoney(row.facturado_agencia_contifico)
                          : "—"}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>
      )}
    </>
  )
}
