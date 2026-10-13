import { useState, type ReactNode } from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { boundsMesCalendario, getFacturasResumen } from "@/lib/api/factura"
import { formatPeriodo, mesActualEcuador, sumarMeses } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import type { ProyeccionMes } from "@/types/contrato-recurrente"
import type { FacturasResumen } from "@/types/factura"

const MESES = 12
/** Contífico se consulta mes a mes: de a pocos para no saturarlo. */
const CONCURRENCIA = 3
const CACHE_PREFIX = "prometio-dashboard-facturacion-"

type Punto = {
  mes: string
  etiqueta: string
  agencia: number
  medios: number
  fees: number | null
}

/** Los meses cerrados no cambian: se guardan en la sesión del navegador. */
function leerCache(mes: string): FacturasResumen | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${mes}`)
    return raw ? (JSON.parse(raw) as FacturasResumen) : null
  } catch {
    return null
  }
}

function guardarCache(mes: string, resumen: FacturasResumen) {
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${mes}`, JSON.stringify(resumen))
  } catch {
    /* sin storage: se vuelve a pedir la próxima vez */
  }
}

async function resumenMes(mes: string, actual: string): Promise<FacturasResumen> {
  if (mes !== actual) {
    const cache = leerCache(mes)
    if (cache) {
      return cache
    }
  }
  const resumen = await getFacturasResumen(boundsMesCalendario(mes))
  if (mes !== actual) {
    guardarCache(mes, resumen)
  }
  return resumen
}

function MarcoTooltip({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-popover px-3 py-2 text-ui shadow-raised">{children}</div>
}

function TooltipHistorial({ active, payload }: { active?: boolean; payload?: Array<{ payload: Punto }> }) {
  const row = payload?.[0]?.payload
  if (!active || !row) {
    return null
  }
  return (
    <MarcoTooltip>
      <p className="text-ui-medium first-letter:uppercase">{formatPeriodo(`${row.mes}-01`, true)}</p>
      <p className="text-kicker tabular-nums">Agencia {formatMoney(row.agencia)}</p>
      <p className="text-kicker tabular-nums">Medios {formatMoney(row.medios)}</p>
      {row.fees != null ? (
        <p className="text-kicker tabular-nums">Fees contratados {formatMoney(row.fees)}</p>
      ) : null}
    </MarcoTooltip>
  )
}

function formatEje(value: number): string {
  return value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`
}

export function DashboardFacturacionHistorial({ proyeccion }: { proyeccion: ProyeccionMes[] | null }) {
  const [puntos, setPuntos] = useState<Punto[] | null>(null)
  const [progreso, setProgreso] = useState<number | null>(null)

  async function cargar() {
    const actual = mesActualEcuador()
    const meses = Array.from({ length: MESES }, (_, index) => sumarMeses(actual, index - (MESES - 1)))
    const resultados = new Map<string, FacturasResumen>()
    let hechos = 0
    let fallidos = 0
    setProgreso(0)
    const cola = [...meses]
    async function trabajador() {
      for (let mes = cola.shift(); mes; mes = cola.shift()) {
        try {
          resultados.set(mes, await resumenMes(mes, actual))
        } catch {
          fallidos += 1
        }
        hechos += 1
        setProgreso(hechos)
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador))
    if (fallidos > 0) {
      toast.error(`No se pudo traer ${fallidos === 1 ? "1 mes" : `${fallidos} meses`} de Contífico.`)
    }
    setPuntos(
      meses.map((mes) => {
        const resumen = resultados.get(mes)
        const fees = proyeccion?.find((row) => row.periodo.slice(0, 7) === mes)?.piso_contratado
        return {
          mes,
          etiqueta: formatPeriodo(`${mes}-01`),
          agencia: resumen?.facturacion_agencia ?? 0,
          medios: resumen?.facturacion_medios ?? 0,
          fees: fees != null && fees > 0 ? fees : null,
        }
      }),
    )
    setProgreso(null)
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-section">Facturación últimos 12 meses</h2>
          <p className="mt-1 text-kicker text-muted-foreground">
            Contífico mes a mes, sin IVA, contra el piso de fees contratados.
          </p>
        </div>
        {puntos ? null : (
          <Button type="button" variant="outline" size="sm" disabled={progreso != null} onClick={() => void cargar()}>
            {progreso != null ? `Trayendo ${progreso}/${MESES}…` : "Cargar historial"}
          </Button>
        )}
      </div>
      {puntos ? (
        <div className="space-y-2 surface-card p-4 sm:p-5">
          <div className="overflow-x-auto">
            <div className="h-72 min-w-[36rem] md:min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={puntos} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="etiqueta"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatEje}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip cursor={{ fill: "var(--muted)" }} content={<TooltipHistorial />} />
                  <Bar dataKey="agencia" stackId="facturado" fill="var(--primary)" barSize={22} />
                  <Bar dataKey="medios" stackId="facturado" fill="var(--kind-email)" barSize={22} radius={[4, 4, 0, 0]} />
                  <Line
                    dataKey="fees"
                    stroke="var(--success)"
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    dot={false}
                    connectNulls
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            <li className="flex items-center gap-1.5 text-kicker">
              <span aria-hidden className="size-2 rounded-full" style={{ background: "var(--primary)" }} />
              Agencia
            </li>
            <li className="flex items-center gap-1.5 text-kicker">
              <span aria-hidden className="size-2 rounded-full" style={{ background: "var(--kind-email)" }} />
              Medios
            </li>
            <li className="flex items-center gap-1.5 text-kicker">
              <span aria-hidden className="h-0.5 w-3" style={{ background: "var(--success)" }} />
              Fees contratados
            </li>
          </ul>
        </div>
      ) : (
        <p className="rounded-xl bg-muted/40 px-4 py-3 text-kicker">
          Consulta Contífico doce veces, por eso no se carga sola. Los meses cerrados quedan guardados
          mientras no cierres la pestaña.
        </p>
      )}
    </section>
  )
}
