import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { SearchCombobox } from "@/components/ui/search-combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { etiquetaEquipo, motivoNoDisponible } from "@/lib/asignacion-leads"
import {
  TIPO_REGLA_LABELS,
  TIPOS_REGLA,
  type PersonaAsignacion,
  type ReglaAsignacion,
  type ReglaAsignacionInput,
  type TipoRegla,
  type ValoresAsignacion,
} from "@/types/asignacion-leads"

const VALORES_DE: Record<TipoRegla, keyof ValoresAsignacion> = {
  producto: "productos",
  provincia: "provincias",
  campana: "campanas",
  origen: "origenes",
}

const AYUDA: Record<TipoRegla, string> = {
  producto: "El producto que el lead eligió en el formulario.",
  provincia: "La provincia que escribió el lead. Se compara sin mayúsculas ni tildes.",
  campana: "El utm_campaign con el que llegó. Se muestran las campañas de los últimos 90 días.",
  origen: "El utm_source con el que llegó (p. ej. facebook, google). Se muestran los de los últimos 90 días.",
}

/** Alta o edición de una regla. El padre la monta con `key` por apertura, así arranca limpia. */
export function ReglaDialog({
  open,
  regla,
  personas,
  valores,
  guardando,
  onGuardar,
  onCerrar,
}: {
  open: boolean
  regla: ReglaAsignacion | null
  personas: PersonaAsignacion[]
  valores: ValoresAsignacion | null
  guardando: boolean
  onGuardar: (input: ReglaAsignacionInput) => void
  onCerrar: () => void
}) {
  const [tipo, setTipo] = useState<TipoRegla>(regla?.tipo ?? "producto")
  const [valor, setValor] = useState(regla?.valor ?? "")
  const [destinos, setDestinos] = useState<string[]>(regla?.destinos ?? [])
  const [activa, setActiva] = useState(regla?.activa ?? true)

  const conocidos = valores?.[VALORES_DE[tipo]] ?? []
  const opciones = [...new Set(valor && !conocidos.includes(valor) ? [valor, ...conocidos] : conocidos)].map((v) => ({
    value: v,
    label: v,
  }))
  const puedeGuardar = valor.trim() !== "" && destinos.length > 0 && !guardando

  function alternarDestino(id: string, marcado: boolean) {
    setDestinos((prev) => (marcado ? [...prev, id] : prev.filter((d) => d !== id)))
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onCerrar())}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-section">{regla ? "Editar regla" : "Nueva regla"}</DialogTitle>
          <DialogDescription className="text-kicker">
            Si un lead coincide, va a una de estas personas (por turnos entre ellas, según su peso). Si ninguna está
            disponible, se prueba la regla siguiente.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (puedeGuardar) {
              onGuardar({ tipo, valor, destinos, activa })
            }
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="regla-tipo">Cuando el lead tiene…</Label>
            <Select
              value={tipo}
              onValueChange={(value) => {
                setTipo(value as TipoRegla)
                setValor("")
              }}
            >
              <SelectTrigger id="regla-tipo" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_REGLA.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TIPO_REGLA_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <SearchCombobox
              id="regla-valor"
              label="Igual a"
              placeholder={conocidos.length > 0 ? "Elegí o escribí un valor" : "Escribí el valor"}
              value={valor}
              onChange={setValor}
              options={opciones}
              onCreateNew={(query) => setValor(query.trim())}
              createNewLabel={(query) => `Usar «${query.trim()}»`}
            />
            <p className="text-kicker text-muted-foreground">{AYUDA[tipo]}</p>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-kicker">Asignar a</legend>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {personas.map((persona) => {
                const id = `regla-destino-${persona.perfil_id}`
                const motivo = motivoNoDisponible(persona)
                return (
                  <li key={persona.perfil_id} className="flex items-center gap-3 px-3 py-2">
                    <Checkbox
                      id={id}
                      checked={destinos.includes(persona.perfil_id)}
                      onCheckedChange={(value) => alternarDestino(persona.perfil_id, value === true)}
                    />
                    <label htmlFor={id} className="min-w-0 flex-1">
                      <span className="block truncate text-ui">{persona.nombre}</span>
                      <span className="block text-kicker text-muted-foreground">
                        {etiquetaEquipo(persona)}
                        {motivo ? ` · ${motivo}` : ""}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>
          <label className="flex items-center gap-2 text-ui">
            <Checkbox checked={activa} onCheckedChange={(value) => setActiva(value === true)} />
            Regla activa
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!puedeGuardar}>
              {regla ? "Guardar" : "Crear regla"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
