import { Calendar } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { CalendarioEventoFila } from "@/components/calendario/CalendarioEventoFila"
import { formatDateOnly } from "@/lib/datetime-local"
import { claveEvento, type CeldaCalendario } from "@/lib/calendario-rango"

export function CalendarioAgenda({ celdas }: { celdas: CeldaCalendario[] }) {
  const conEventos = celdas.filter((celda) => celda.eventos.length > 0)
  if (conEventos.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="Nada en este período"
        body="Cuando haya actividades, cumpleaños o vencimientos de cotización, aparecen acá."
      />
    )
  }
  return (
    <div className="space-y-6">
      {conEventos.map((celda) => (
        <section key={celda.iso} className="space-y-2">
          <h2 className="text-section">{formatDateOnly(celda.iso)}</h2>
          <ul className="space-y-2">
            {celda.eventos.map((evento) => (
              <li key={claveEvento(evento)}>
                <CalendarioEventoFila evento={evento} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
