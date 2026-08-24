import { CalendarioEventoChip } from "@/components/calendario/CalendarioEventoFila"
import { formatDateOnly } from "@/lib/datetime-local"
import { claveEvento, type CeldaCalendario } from "@/lib/calendario-rango"
import { cn } from "@/lib/utils"

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

export function CalendarioSemana({ celdas }: { celdas: CeldaCalendario[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[52rem] grid-cols-7 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border">
        {celdas.map((celda, index) => (
          <div
            key={celda.iso}
            className={cn("min-h-48 bg-background p-2", celda.hoy && "ring-1 ring-inset ring-highlight")}
          >
            <p className="text-micro">{DIAS[index]}</p>
            <p className={cn("text-ui-medium", celda.hoy && "text-primary")}>{formatDateOnly(celda.iso)}</p>
            <div className="mt-2 space-y-1">
              {celda.eventos.length === 0 ? (
                <p className="text-kicker">—</p>
              ) : (
                celda.eventos.map((evento) => (
                  <CalendarioEventoChip key={claveEvento(evento)} evento={evento} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
