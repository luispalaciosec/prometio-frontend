import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  BarChart3,
  Building2,
  Inbox,
  Mail,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TilesSkeleton } from "@/components/skeleton"
import { getResumen } from "@/lib/api/resumen"
import { cn } from "@/lib/utils"
import type { Resumen } from "@/types/resumen"

type Tile = {
  label: string
  to: string | null
  value: number | null
  hint?: string
  icon: LucideIcon
}

function tilesDe(data: Resumen): Tile[] {
  return [
    { label: "Contactos", to: "/contactos", value: data.contactos, icon: Users },
    { label: "Empresas", to: "/empresas", value: data.empresas, icon: Building2 },
    { label: "Conversaciones", to: "/bandeja", value: data.conversaciones, icon: Inbox },
    { label: "Mensajes", to: "/bandeja", value: data.mensajes, icon: MessageSquare },
    {
      label: "Mails",
      to: null,
      value: data.mails,
      icon: Mail,
      hint:
        data.mails == null
          ? "Sin visibilidad: el conteo de Resend es para administrativo y marketing."
          : undefined,
    },
  ]
}

function TileCard({ tile }: { tile: Tile }) {
  const Icon = tile.icon
  const body = (
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary"
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-kicker">{tile.label}</p>
        <p className="mt-1 text-page tabular-nums">{tile.value == null ? "—" : tile.value}</p>
        {tile.hint ? <p className="mt-2 text-kicker">{tile.hint}</p> : null}
      </div>
    </div>
  )

  const clase = cn(
    "rounded-xl p-4 ring-1 ring-border",
    tile.to && "transition-shadow duration-150 hover:shadow-raised hover:ring-foreground/20",
  )

  if (!tile.to) {
    return <div className={clase}>{body}</div>
  }
  return (
    <Link to={tile.to} className={clase}>
      {body}
    </Link>
  )
}

export function ResumenPage() {
  const [tiles, setTiles] = useState<Tile[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getResumen()
      .then((data) => {
        if (!cancelled) {
          setTiles(tilesDe(data))
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return
        }
        toast.error(err instanceof Error ? err.message : "No se pudo cargar el resumen.")
        setError(true)
        setTiles([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageHeader
        title="Resumen"
        description="Volumen de CRM. Los KPIs de pipeline viven en Negocios → Dashboard."
      />
      {tiles == null ? (
        <TilesSkeleton count={5} className="lg:grid-cols-3" />
      ) : error ? (
        <EmptyState
          icon={BarChart3}
          title="Sin conteos"
          body="No se pudieron cargar los volúmenes de CRM."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <TileCard key={tile.label} tile={tile} />
          ))}
        </div>
      )}
    </>
  )
}
