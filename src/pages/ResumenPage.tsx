import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TilesSkeleton } from "@/components/skeleton"
import { getResumen } from "@/lib/api/resumen"
import { BarChart3 } from "lucide-react"
import type { Resumen } from "@/types/resumen"

type Tile = {
  label: string
  to: string | null
  value: number | null
  hint?: string
}

function tilesDe(data: Resumen): Tile[] {
  return [
    { label: "Contactos", to: "/contactos", value: data.contactos },
    { label: "Empresas", to: "/empresas", value: data.empresas },
    { label: "Conversaciones", to: "/bandeja", value: data.conversaciones },
    { label: "Mensajes", to: "/bandeja", value: data.mensajes },
    {
      label: "Mails",
      to: null,
      value: data.mails,
      hint:
        data.mails == null
          ? "Sin visibilidad: el conteo de Resend es para administrativo y marketing."
          : undefined,
    },
  ]
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
        <TilesSkeleton count={4} />
      ) : error ? (
        <EmptyState
          icon={BarChart3}
          title="Sin conteos"
          body="No se pudieron cargar los volúmenes de CRM."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tiles.map((tile) => {
            const body = (
              <>
                <p className="text-kicker">{tile.label}</p>
                <p className="mt-1 font-heading text-[20px] font-semibold tracking-tight tabular-nums">
                  {tile.value == null ? "—" : tile.value}
                </p>
                {tile.hint ? <p className="mt-2 text-kicker">{tile.hint}</p> : null}
              </>
            )
            if (!tile.to) {
              return (
                <div key={tile.label} className="rounded-xl p-4 ring-1 ring-border">
                  {body}
                </div>
              )
            }
            return (
              <Link
                key={tile.label}
                to={tile.to}
                className="rounded-xl p-4 ring-1 ring-border transition-shadow duration-150 hover:shadow-raised hover:ring-foreground/20"
              >
                {body}
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
