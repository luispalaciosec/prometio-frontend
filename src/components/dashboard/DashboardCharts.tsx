import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { formatMoney } from "@/lib/costo-interno"
import { tonoEtapa } from "@/lib/etapa-tono"
import { ETAPA_PIPELINE_CODIGOS, type EtapaPipelineCodigo } from "@/types/etapa-pipeline"
import type { CotizacionesPorEstado, PipelinePorEtapa } from "@/types/dashboard"

const COLORES_TORTA = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const

const FILL_TONO = {
  temprana: "var(--primary)",
  media: "var(--warning)",
  ganado: "var(--success)",
  perdido: "var(--destructive)",
} as const

function esEtapa(codigo: string): codigo is EtapaPipelineCodigo {
  return (ETAPA_PIPELINE_CODIGOS as readonly string[]).includes(codigo)
}

function fillEtapa(etapa: string): string {
  if (!esEtapa(etapa)) {
    return "var(--chart-1)"
  }
  return FILL_TONO[tonoEtapa(etapa)]
}

function MarcoTooltip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-ui shadow-raised ring-1 ring-border">
      {children}
    </div>
  )
}

function TooltipPipeline({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: PipelinePorEtapa }>
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) {
    return null
  }
  return (
    <MarcoTooltip>
      <p className="text-ui-medium">{row.nombre}</p>
      <p className="text-kicker tabular-nums">{row.cantidad} oportunidades</p>
      <p className="text-kicker tabular-nums">{formatMoney(row.valor_en_juego)}</p>
    </MarcoTooltip>
  )
}

function TooltipTorta({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number }>
}) {
  const item = payload?.[0]
  if (!active || !item) {
    return null
  }
  return (
    <MarcoTooltip>
      <p className="text-ui-medium">{item.name}</p>
      <p className="text-kicker tabular-nums">{item.value} cotizaciones</p>
    </MarcoTooltip>
  )
}

export function PipelineBarras({ rows }: { rows: PipelinePorEtapa[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={rows} margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={128}
            tick={{ fill: "var(--foreground)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "var(--muted)" }} content={<TooltipPipeline />} />
          <Bar dataKey="cantidad" name="Oportunidades" radius={[0, 4, 4, 0]} barSize={14}>
            {rows.map((row) => (
              <Cell key={row.etapa} fill={fillEtapa(row.etapa)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CotizacionesTorta({
  rows,
  etiquetas,
}: {
  rows: CotizacionesPorEstado[]
  etiquetas: Record<string, string>
}) {
  const data = rows.map((row) => ({
    ...row,
    nombre: etiquetas[row.estado] ?? row.estado,
  }))

  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="cantidad"
              nameKey="nombre"
              innerRadius={52}
              outerRadius={84}
              paddingAngle={2}
            >
              {data.map((row, index) => (
                <Cell key={row.estado} fill={COLORES_TORTA[index % COLORES_TORTA.length]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipTorta />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        {data.map((row, index) => (
          <li key={row.estado} className="flex items-center gap-1.5 text-kicker">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ background: COLORES_TORTA[index % COLORES_TORTA.length] }}
            />
            {row.nombre}
            <span className="tabular-nums">{row.cantidad}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
