import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Cake } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { KindMark } from "@/components/kind-mark"
import { PageHeader } from "@/components/page-header"
import { TilesSkeleton } from "@/components/skeleton"
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <li key={row.contacto_id}>
              <Link
                to={`/contactos/${row.contacto_id}`}
                className="flex items-start gap-4 rounded-xl p-5 ring-1 ring-success/25 transition-shadow duration-150 hover:shadow-raised"
              >
                <KindMark icon={Cake} tone="bg-success/15 text-success" size="lg" />
                <div className="min-w-0">
                  <p className="text-ui-medium text-success">{etiquetaDias(row.dias_hasta_cumpleanos)}</p>
                  <p className="mt-1 text-section">{row.nombre_completo}</p>
                  <p className="mt-1 text-ui">Cumple {row.cumple_anos} años</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
