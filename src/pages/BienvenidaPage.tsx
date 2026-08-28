import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Bell,
  CalendarClock,
  FileText,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { KindMark } from "@/components/kind-mark"
import { PageHeader } from "@/components/page-header"
import { TilesSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
import { getInicio } from "@/lib/api/inicio"
import { formatMoney } from "@/lib/costo-interno"
import type { Inicio } from "@/types/inicio"

type Bloque = {
  label: string
  to: string
  value: string
  hint?: string
  icon: LucideIcon
  tone: string
}

function bloquesDe(data: Inicio): Bloque[] {
  const dias = data.dias_ventana
  const metas = data.metas
  const hayMeta = metas.meta_total != null
  const avance =
    metas.avance_total_pct == null ? "—" : `${metas.avance_total_pct.toFixed(1)}%`

  return [
    {
      label: "Actividades próximas",
      to: "/agenda/actividades",
      value: String(data.actividades_proximas.length),
      hint: `Próximos ${dias} días`,
      icon: CalendarClock,
      tone: "bg-kind-visita/15 text-kind-visita",
    },
    {
      label: "Cotizaciones por vencer",
      to: "/cotizaciones",
      value: String(data.cotizaciones_por_vencer.length),
      hint: `Enviadas que vencen en ${dias} días`,
      icon: FileText,
      tone: "bg-primary/15 text-primary",
    },
    {
      label: "Alertas",
      to: "/alertas",
      value: String(data.alertas.length),
      hint: "Oportunidades estancadas",
      icon: Bell,
      tone: "bg-warning/15 text-warning",
    },
    {
      label: "Meta vs. venta",
      to: "/dashboard",
      value: hayMeta ? avance : formatMoney(metas.valor_cerrado_total),
      hint: hayMeta
        ? `${formatMoney(metas.valor_cerrado_total)} de ${formatMoney(metas.meta_total ?? 0)}`
        : "Sin meta vigente",
      icon: Target,
      tone: "bg-success/15 text-success",
    },
  ]
}

function BloqueCard({ bloque }: { bloque: Bloque }) {
  return (
    <Link
      to={bloque.to}
      className="rounded-xl p-5 ring-1 ring-border transition-shadow duration-150 hover:shadow-raised hover:ring-foreground/20"
    >
      <div className="flex items-start gap-4">
        <KindMark icon={bloque.icon} tone={bloque.tone} size="lg" />
        <div className="min-w-0">
          <p className="text-kicker">{bloque.label}</p>
          <p className="mt-1 text-page tabular-nums">{bloque.value}</p>
          {bloque.hint ? <p className="mt-1 text-kicker">{bloque.hint}</p> : null}
        </div>
      </div>
    </Link>
  )
}

function SugerenciasCard() {
  return (
    <section className="rounded-xl p-5 ring-1 ring-border">
      <div className="flex items-start gap-4">
        <KindMark icon={Sparkles} tone="bg-muted text-muted-foreground" size="lg" />
        <div className="min-w-0 space-y-2">
          <p className="text-ui-medium">Sugerencias</p>
          <Badge variant="outline">Próximamente</Badge>
          <p className="text-kicker">
            Sugerencias de IA. Se scopea en un corte propio; el lugar en esta pantalla ya queda
            reservado.
          </p>
        </div>
      </div>
    </section>
  )
}

export function BienvenidaPage() {
  const [bloques, setBloques] = useState<Bloque[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getInicio()
      .then((data) => {
        if (!cancelled) {
          setBloques(bloquesDe(data))
        }
      })
      .catch((reason: unknown) => {
        if (cancelled) {
          return
        }
        toast.error(reason instanceof Error ? reason.message : "No se pudo cargar el inicio.")
        setError(true)
        setBloques([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageHeader title="Bienvenida" description="Tu día en el CRM." />
      {bloques == null ? (
        <TilesSkeleton count={5} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {error ? (
            <div className="sm:col-span-2">
              <EmptyState
                icon={CalendarClock}
                title="Sin el día"
                body="No se pudieron cargar actividades, cotizaciones, alertas ni la meta."
              />
            </div>
          ) : (
            bloques.map((bloque) => <BloqueCard key={bloque.label} bloque={bloque} />)
          )}
          <SugerenciasCard />
        </div>
      )}
    </>
  )
}
