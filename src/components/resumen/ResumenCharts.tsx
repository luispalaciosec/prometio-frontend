import type { ReactNode } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Building2, Inbox, Users, type LucideIcon } from "lucide-react"

import { KindMark } from "@/components/kind-mark"
import type { PuntoSerieDiaria } from "@/types/resumen"

function ejeX(isoDate: string): string {
  const [, month, day] = isoDate.slice(0, 10).split("-")
  if (!month || !day) {
    return isoDate
  }
  return `${day}/${month}`
}

function MarcoTooltip({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-popover px-3 py-2 text-ui shadow-raised ring-1 ring-border">
      {children}
    </div>
  )
}

function TooltipSerie({
  active,
  payload,
  unidad,
}: {
  active?: boolean
  payload?: Array<{ payload: PuntoSerieDiaria & { label: string } }>
  unidad: string
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) {
    return null
  }
  return (
    <MarcoTooltip>
      <p className="text-ui-medium">{row.label}</p>
      <p className="text-kicker tabular-nums">
        {row.cantidad} {unidad}
      </p>
    </MarcoTooltip>
  )
}

const SERIES: {
  key: "contactos" | "empresas" | "conversaciones"
  label: string
  unidad: string
  icon: LucideIcon
  tone: string
  stroke: string
}[] = [
  {
    key: "contactos",
    label: "Contactos",
    unidad: "altas",
    icon: Users,
    tone: "bg-primary/15 text-primary",
    stroke: "var(--primary)",
  },
  {
    key: "empresas",
    label: "Empresas",
    unidad: "altas",
    icon: Building2,
    tone: "bg-kind-email/15 text-kind-email",
    stroke: "var(--kind-email)",
  },
  {
    key: "conversaciones",
    label: "Conversaciones",
    unidad: "nuevas",
    icon: Inbox,
    tone: "bg-highlight/15 text-highlight",
    stroke: "var(--highlight)",
  },
]

function SerieCard({
  label,
  unidad,
  icon,
  tone,
  stroke,
  puntos,
}: {
  label: string
  unidad: string
  icon: LucideIcon
  tone: string
  stroke: string
  puntos: PuntoSerieDiaria[]
}) {
  const data = puntos.map((punto) => ({ ...punto, label: ejeX(punto.fecha) }))

  return (
    <div className="rounded-xl p-5 ring-1 ring-border">
      <KindMark icon={icon} tone={tone} size="md" label={label} />
      <div className="mt-4 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
              minTickGap={28}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              width={28}
              domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ stroke: "var(--border)" }}
              content={<TooltipSerie unidad={unidad} />}
            />
            <Area
              type="monotone"
              dataKey="cantidad"
              stroke={stroke}
              fill={stroke}
              fillOpacity={0.15}
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function ResumenCharts({
  contactos,
  empresas,
  conversaciones,
}: {
  contactos: PuntoSerieDiaria[]
  empresas: PuntoSerieDiaria[]
  conversaciones: PuntoSerieDiaria[]
}) {
  const series = { contactos, empresas, conversaciones }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {SERIES.map((item) => (
        <SerieCard key={item.key} {...item} puntos={series[item.key]} />
      ))}
    </div>
  )
}
