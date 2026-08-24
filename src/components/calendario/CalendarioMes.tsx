import { CalendarioEventoChip } from "@/components/calendario/CalendarioEventoFila"
import { cn } from "@/lib/utils"
import { claveEvento, type CeldaCalendario } from "@/lib/calendario-rango"

const MAX_VISIBLE = 3
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

export function CalendarioMes({ celdas }: { celdas: CeldaCalendario[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[40rem]">
        <div className="mb-1 grid grid-cols-7 gap-px">
          {DIAS.map((dia) => (
            <p key={dia} className="px-1 text-micro">
              {dia}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-border ring-1 ring-border">
          {celdas.map((celda) => {
            const extra = celda.eventos.length - MAX_VISIBLE
            return (
              <div
                key={celda.iso}
                className={cn(
                  "min-h-28 bg-background p-1.5",
                  !celda.inMonth && "bg-muted/40",
                  celda.hoy && "ring-1 ring-inset ring-highlight",
                )}
              >
                <p className={cn("text-kicker", celda.hoy && "text-foreground")}>{celda.dia}</p>
                <div className="mt-1 space-y-0.5">
                  {celda.eventos.slice(0, MAX_VISIBLE).map((evento) => (
                    <CalendarioEventoChip key={claveEvento(evento)} evento={evento} />
                  ))}
                  {extra > 0 ? <p className="px-1 text-micro">+{extra}</p> : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
