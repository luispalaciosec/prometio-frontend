import { ArrowDown, ArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { ColumnaElegida } from "@/lib/exportar-preferencias"
import type { ColumnaExportacion } from "@/types/exportar"

/** Checklist con reordenamiento por flechas. No deja quitar la última columna activa. */
export function ExportarColumnas({
  columnas,
  definicion,
  onCambio,
}: {
  columnas: ColumnaElegida[]
  definicion: ColumnaExportacion[]
  onCambio: (columnas: ColumnaElegida[]) => void
}) {
  const titulo = new Map(definicion.map((columna) => [columna.clave, columna.titulo]))
  const activas = columnas.filter((columna) => columna.activa).length

  function mover(index: number, delta: number) {
    const destino = index + delta
    if (destino < 0 || destino >= columnas.length) {
      return
    }
    const copia = [...columnas]
    const [item] = copia.splice(index, 1)
    copia.splice(destino, 0, item)
    onCambio(copia)
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {columnas.map((columna, index) => {
        const id = `exportar-columna-${columna.clave}`
        const ultimaActiva = columna.activa && activas === 1
        return (
          <li key={columna.clave} className="flex items-center gap-2 px-3 py-1.5">
            <Checkbox
              id={id}
              checked={columna.activa}
              disabled={ultimaActiva}
              onCheckedChange={(value) =>
                onCambio(columnas.map((item) => (item.clave === columna.clave ? { ...item, activa: value === true } : item)))
              }
            />
            <label
              htmlFor={id}
              className={columna.activa ? "min-w-0 flex-1 truncate text-ui" : "min-w-0 flex-1 truncate text-ui text-muted-foreground"}
              title={ultimaActiva ? "Tiene que quedar al menos una columna" : undefined}
            >
              {titulo.get(columna.clave) ?? columna.clave}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label={`Subir ${titulo.get(columna.clave) ?? columna.clave}`}
              disabled={index === 0}
              onClick={() => mover(index, -1)}
            >
              <ArrowUp className="size-3.5" strokeWidth={1.75} aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label={`Bajar ${titulo.get(columna.clave) ?? columna.clave}`}
              disabled={index === columnas.length - 1}
              onClick={() => mover(index, 1)}
            >
              <ArrowDown className="size-3.5" strokeWidth={1.75} aria-hidden />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}
