import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { simularAsignacion } from "@/lib/api/asignacion-leads"
import type { SimulacionAsignacion, ValoresAsignacion, ViaAsignacion } from "@/types/asignacion-leads"

const VIA: Record<ViaAsignacion, string> = {
  regla: "Por una regla",
  metodo_base: "Por el método base",
  respaldo: "Al responsable de respaldo",
  sin_asignar: "Sin asignar",
}

const CAMPOS = [
  { clave: "producto", label: "Producto de interés", valores: "productos" },
  { clave: "provincia", label: "Provincia", valores: "provincias" },
  { clave: "utm_source", label: "Origen (utm_source)", valores: "origenes" },
  { clave: "utm_campaign", label: "Campaña (utm_campaign)", valores: "campanas" },
] as const

/** Pregunta al backend a quién iría un lead con estos datos. No mueve los turnos ni crea nada. */
export function SimuladorAsignacion({ valores }: { valores: ValoresAsignacion | null }) {
  const [datos, setDatos] = useState<Record<string, string>>({})
  const [resultado, setResultado] = useState<SimulacionAsignacion | null>(null)
  const [probando, setProbando] = useState(false)

  async function probar(event: FormEvent) {
    event.preventDefault()
    setProbando(true)
    try {
      setResultado(await simularAsignacion(datos))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo simular.")
    } finally {
      setProbando(false)
    }
  }

  return (
    <form onSubmit={(event) => void probar(event)} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CAMPOS.map((campo) => (
          <div key={campo.clave} className="flex flex-col gap-2">
            <Label htmlFor={`simular-${campo.clave}`}>{campo.label}</Label>
            <Input
              id={`simular-${campo.clave}`}
              list={`simular-${campo.clave}-opciones`}
              value={datos[campo.clave] ?? ""}
              placeholder="Vacío = el lead no lo trae"
              onChange={(event) => setDatos((prev) => ({ ...prev, [campo.clave]: event.target.value }))}
            />
            <datalist id={`simular-${campo.clave}-opciones`}>
              {(valores?.[campo.valores] ?? []).map((valor) => (
                <option key={valor} value={valor} />
              ))}
            </datalist>
          </div>
        ))}
      </div>
      <Button type="submit" variant="outline" disabled={probando}>
        {probando ? "Probando…" : "Probar"}
      </Button>
      {resultado ? (
        <div className="surface-muted space-y-1 rounded-xl p-4" aria-live="polite">
          <p className="text-kicker">{VIA[resultado.via]}</p>
          <p className="text-section">{resultado.nombre ?? "Nadie: quedaría sin asignar"}</p>
          <p className="text-ui text-muted-foreground">{resultado.explicacion}</p>
        </div>
      ) : null}
    </form>
  )
}
