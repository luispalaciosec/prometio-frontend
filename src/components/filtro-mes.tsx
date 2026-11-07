import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatPeriodo, mesActualEcuador, sumarMeses } from "@/lib/contrato-recurrente"

const TODOS = "todos"
const MESES_ATRAS = 24
const MESES_ADELANTE = 6

/**
 * Mes `AAAA-MM` con flechas anterior/siguiente y la opción «Todos los meses» (`""`).
 * Un `<select>` en vez de `type="month"`: Safari de escritorio no tiene selector de mes nativo.
 */
export function FiltroMes({
  id,
  value,
  onChange,
  label = "Mes",
  ayuda,
}: {
  id: string
  value: string
  onChange: (mes: string) => void
  label?: string
  ayuda?: string
}) {
  const actual = mesActualEcuador()
  const opciones: string[] = []
  for (let n = MESES_ADELANTE; n >= -MESES_ATRAS; n -= 1) {
    opciones.push(sumarMeses(actual, n))
  }
  if (value && !opciones.includes(value)) {
    opciones.push(value)
    opciones.sort().reverse()
  }
  const base = value || actual

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mes anterior"
          onClick={() => onChange(sumarMeses(base, -1))}
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} aria-hidden />
        </Button>
        <Select value={value || TODOS} onValueChange={(next) => onChange(next === TODOS ? "" : next)}>
          <SelectTrigger id={id} className="min-w-44 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los meses</SelectItem>
            {opciones.map((mes) => (
              <SelectItem key={mes} value={mes}>
                {formatPeriodo(mes, true)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Mes siguiente"
          onClick={() => onChange(sumarMeses(base, 1))}
        >
          <ChevronRight className="size-4" strokeWidth={1.75} aria-hidden />
        </Button>
      </div>
      {ayuda ? <p className="text-kicker text-muted-foreground">{ayuda}</p> : null}
    </div>
  )
}
