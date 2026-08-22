import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { getResumen } from "@/lib/api/resumen"
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
        <p className="text-sm text-muted-foreground">Cargando resumen…</p>
      ) : error ? (
        <p className="text-sm text-muted-foreground">No se pudieron cargar los conteos.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tiles.map((tile) => {
            const body = (
              <>
                <p className="text-sm text-muted-foreground">{tile.label}</p>
                <p className="mt-1 font-heading text-3xl tracking-tight tabular-nums">
                  {tile.value == null ? "—" : tile.value}
                </p>
                {tile.hint ? (
                  <p className="mt-2 text-xs text-muted-foreground">{tile.hint}</p>
                ) : null}
              </>
            )
            if (!tile.to) {
              return (
                <div key={tile.label} className="rounded-xl p-4 ring-1 ring-foreground/10">
                  {body}
                </div>
              )
            }
            return (
              <Link
                key={tile.label}
                to={tile.to}
                className="rounded-xl p-4 ring-1 ring-foreground/10 transition-colors duration-150 hover:bg-muted/50 hover:ring-primary/20"
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
