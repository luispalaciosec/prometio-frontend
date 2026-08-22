import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
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
        <p className="text-sm text-muted-foreground">Cargando cumpleaños…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay cumpleaños próximos en la ventana configurada.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.contacto_id}>
              <Link
                to={`/contactos/${row.contacto_id}`}
                className="block rounded-xl p-4 ring-1 ring-success/20 transition-colors duration-150 hover:bg-success/5"
              >
                <p className="text-sm font-medium text-success">{etiquetaDias(row.dias_hasta_cumpleanos)}</p>
                <p className="mt-1 font-heading text-xl tracking-tight">{row.nombre_completo}</p>
                <p className="mt-1 text-sm text-muted-foreground">Cumple {row.cumple_anos} años</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
