import type { ReactNode } from "react"
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

import { formatPeriodo } from "@/lib/contrato-recurrente"
import { formatMoney } from "@/lib/costo-interno"
import type { ProyeccionMes } from "@/types/contrato-recurrente"

const SERIES = [
  { key: "facturado", label: "Facturado", color: "var(--success)" },
  { key: "por_facturar", label: "Por facturar", color: "var(--warning)" },
  { key: "resto", label: "Resto del piso", color: "var(--primary)", opacity: 0.25 },
] as const

const COLOR_VENCE = "var(--destructive)"

type Punto = {
  periodo: string
  etiqueta: string
  facturado: number
  por_facturar: number
  resto: number
  piso: number
  /** null = no dibujar marca. */
  vence: number | null
}

function MarcoTooltip({ children }: { children: ReactNode }) {
  return <div className="rounded-lg bg-popover px-3 py-2 text-ui shadow-raised">{children}</div>
}

function TooltipProyeccion({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: Punto }>
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) {
    return null
  }
  return (
    <MarcoTooltip>
      <p className="text-ui-medium first-letter:uppercase">{formatPeriodo(row.periodo, true)}</p>
      <p className="text-kicker tabular-nums">Piso contratado {formatMoney(row.piso)}</p>
      <p className="text-kicker tabular-nums">Facturado {formatMoney(row.facturado)}</p>
      <p className="text-kicker tabular-nums">Por facturar {formatMoney(row.por_facturar)}</p>
      {row.vence ? (
        <p className="text-kicker tabular-nums text-destructive">
          Vence este mes {formatMoney(row.vence)}
        </p>
      ) : null}
    </MarcoTooltip>
  )
}

function formatEje(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`
  }
  return `$${value}`
}

export function ProyeccionChart({ meses }: { meses: ProyeccionMes[] }) {
  const data: Punto[] = meses.map((mes) => ({
    periodo: mes.periodo,
    etiqueta: formatPeriodo(mes.periodo),
    facturado: mes.facturado,
    por_facturar: mes.por_facturar,
    resto: Math.max(0, mes.piso_contratado - mes.facturado - mes.por_facturar),
    piso: mes.piso_contratado,
    vence: mes.vence_en_el_mes > 0 ? mes.vence_en_el_mes : null,
  }))

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="h-72 min-w-[36rem] md:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
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
              <Tooltip cursor={{ fill: "var(--muted)" }} content={<TooltipProyeccion />} />
              {SERIES.map((serie, index) => (
                <Bar
                  key={serie.key}
                  dataKey={serie.key}
                  name={serie.label}
                  stackId="piso"
                  fill={serie.color}
                  fillOpacity={"opacity" in serie ? serie.opacity : 1}
                  barSize={22}
                  radius={index === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                />
              ))}
              <Line
                dataKey="vence"
                name="Vence en el mes"
                stroke="none"
                dot={{ r: 5, fill: COLOR_VENCE, stroke: "var(--background)", strokeWidth: 2 }}
                activeDot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {SERIES.map((serie) => (
          <li key={serie.key} className="flex items-center gap-1.5 text-kicker">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ background: serie.color, opacity: "opacity" in serie ? 0.5 : 1 }}
            />
            {serie.label}
          </li>
        ))}
        <li className="flex items-center gap-1.5 text-kicker">
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: COLOR_VENCE }} />
          Vence en el mes (se cae el siguiente si no se renueva)
        </li>
      </ul>
    </div>
  )
}
