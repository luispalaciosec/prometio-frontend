import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TilesSkeleton } from "@/components/skeleton"
import { Cake } from "lucide-react"
import { listCumpleanosProximos } from "@/lib/api/cumpleanos"
import type { CumpleanosProximo } from "@/types/cumpleanos"

function etiquetaDias(dias: number): string {
  if (dias === 0) {
    return "Hoy"
  }
  if (dias === 1) {
    return "Mañana"
  }
  return `En ${dias} días`
}

export function CumpleanosPage() {
  const [rows, setRows] = useState<CumpleanosProximo[] | null>(null)

  useEffect(() => {
    void listCumpleanosProximos()
      .then(setRows)
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "No se pudieron cargar los cumpleaños.")
        setRows([])
      })
  }, [])

  return (
    <>
      <PageHeader
        title="Cumpleaños"
        description="Próximos cumpleaños de contactos activos. Nada que ver con las alertas de estancamiento."
      />
      {rows == null ? (
        <TilesSkeleton count={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Cake}
          title="Nadie cumple cerca"
          body="No hay cumpleaños de contactos activos en la ventana configurada."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.contacto_id}>
              <Link
                to={`/contactos/${row.contacto_id}`}
                className="block rounded-xl p-4 ring-1 ring-success/20 transition-shadow duration-150 hover:shadow-raised"
              >
                <p className="text-ui-medium text-success">{etiquetaDias(row.dias_hasta_cumpleanos)}</p>
                <p className="mt-1 text-ui-medium">{row.nombre_completo}</p>
                <p className="mt-1 text-kicker">Cumple {row.cumple_anos} años</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
