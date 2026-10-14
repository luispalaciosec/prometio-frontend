import { useEffect, useState } from "react"
import { FileStack } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { ListSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { listPlantillasCotizacion } from "@/lib/api/cotizacion"
import { formatMoney } from "@/lib/costo-interno"
import { formatDateOnly } from "@/lib/datetime-local"
import { cn } from "@/lib/utils"
import type { PlantillaCotizacion } from "@/types/cotizacion"

/** Elegir una cotización ganada (de cualquier vendedor) como punto de partida de una nueva. */
export function PlantillaCotizacionDialog({
  open,
  enviando,
  onConfirm,
  onCancel,
}: {
  open: boolean
  enviando: boolean
  onConfirm: (plantillaId: string) => void
  onCancel: () => void
}) {
  const [busqueda, setBusqueda] = useState("")
  const [qDebounced, setQDebounced] = useState("")
  const [rows, setRows] = useState<PlantillaCotizacion[] | null>(null)
  const [elegida, setElegida] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(busqueda), 300)
    return () => window.clearTimeout(t)
  }, [busqueda])

  useEffect(() => {
    if (!open) {
      setBusqueda("")
      setQDebounced("")
      setElegida(null)
      setRows(null)
      return
    }
    let cancelled = false
    setRows(null)
    void listPlantillasCotizacion(qDebounced)
      .then((data) => {
        if (!cancelled) {
          setRows(data)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudieron cargar las plantillas.")
          setRows([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, qDebounced])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !enviando && onCancel()}>
      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Partir de una plantilla</DialogTitle>
          <DialogDescription>
            Cotizaciones ganadas de todo el equipo. Se copia en borrador a esta oportunidad. Si es de otro vendedor, se
            copian servicios, descripciones, cantidades y precios, pero no costos, proveedores, margen ni comisión.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plantilla-busqueda">Buscar</Label>
          <Input
            id="plantilla-busqueda"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Número, empresa, oportunidad o servicio"
            autoFocus
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows == null ? (
            <ListSkeleton rows={4} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={FileStack}
              title={qDebounced.trim() ? "Nada coincide" : "Todavía no hay cotizaciones ganadas"}
              body={
                qDebounced.trim()
                  ? "Ninguna cotización ganada coincide con esa búsqueda."
                  : "Cuando se apruebe la primera cotización, aparece acá como plantilla."
              }
            />
          ) : (
            <ul className="space-y-2" role="listbox" aria-label="Plantillas">
              {rows.map((row) => {
                const activa = row.id === elegida
                const extra = row.servicios_total - row.servicios.length
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={activa}
                      onClick={() => setElegida(row.id)}
                      onDoubleClick={() => !enviando && onConfirm(row.id)}
                      className={cn(
                        "w-full rounded-xl px-4 py-3 text-left ring-1 transition-colors",
                        activa ? "bg-primary/5 ring-primary" : "ring-border hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-ui-medium">
                            {row.numero}
                            <span className="text-muted-foreground"> · {row.empresa_nombre ?? "Sin empresa"}</span>
                          </p>
                          {row.oportunidad_nombre ? (
                            <p className="truncate text-kicker text-muted-foreground">{row.oportunidad_nombre}</p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-ui tabular-nums">{formatMoney(row.subtotal_sin_iva)}</p>
                          <p className="text-kicker text-muted-foreground">{formatDateOnly(row.fecha)}</p>
                        </div>
                      </div>
                      {row.servicios.length > 0 ? (
                        <p className="mt-1 line-clamp-2 text-kicker">
                          {row.servicios.join(" · ")}
                          {extra > 0 ? ` · y ${extra} más` : ""}
                        </p>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={enviando} onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" disabled={!elegida || enviando} onClick={() => elegida && onConfirm(elegida)}>
            {enviando ? "Copiando…" : "Usar plantilla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
