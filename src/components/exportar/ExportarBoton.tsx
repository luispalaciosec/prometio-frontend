import { useState } from "react"

import { ExportarDialog } from "@/components/exportar/ExportarDialog"
import { Button } from "@/components/ui/button"
import type { RecursoExportable } from "@/types/exportar"

/** Las tres pantallas viven tras VentasRoute: marketing nunca ve este botón. */
export function ExportarBoton({
  recurso,
  filtrosIniciales,
  aviso,
}: {
  recurso: RecursoExportable
  filtrosIniciales: Record<string, string>
  aviso?: string | null
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Exportar
      </Button>
      {open ? (
        <ExportarDialog
          recurso={recurso}
          open={open}
          onOpenChange={setOpen}
          filtrosIniciales={filtrosIniciales}
          aviso={aviso}
        />
      ) : null}
    </>
  )
}
