import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAsignacionLeads, reasignarLead } from "@/lib/api/asignacion-leads"
import { motivoNoDisponible } from "@/lib/asignacion-leads"
import type { PersonaAsignacion } from "@/types/asignacion-leads"
import type { LeadPendiente } from "@/types/atencion-lead"

/**
 * Reasigna un lead pendiente a cualquier persona activa de Ventas o Administrativo (lo valida también el backend).
 * A mano no importa «Recibe leads», la pausa ni el tope: eso solo rige el reparto automático.
 * No reinicia el reloj de respuesta. El padre lo monta por apertura, así arranca limpio.
 */
export function ReasignarLeadDialog({
  lead,
  onListo,
  onCerrar,
}: {
  lead: LeadPendiente
  onListo: () => void
  onCerrar: () => void
}) {
  const [personas, setPersonas] = useState<PersonaAsignacion[] | null>(null)
  const [destino, setDestino] = useState("")
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let cancelled = false
    void getAsignacionLeads()
      .then((datos) => {
        if (!cancelled) {
          setPersonas(datos.personas)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudo cargar a quién reasignar.")
          setPersonas([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const candidatos = (personas ?? []).filter((p) => p.perfil_id !== lead.responsable_id)

  async function confirmar() {
    setEnviando(true)
    try {
      const resultado = await reasignarLead(lead.actividad_id, destino)
      toast.success(`Lead reasignado a ${resultado.responsable_nombre ?? "la persona elegida"}.`)
      onListo()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo reasignar.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : onCerrar())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-section">Reasignar lead</DialogTitle>
          <DialogDescription className="text-kicker">
            {lead.contacto_nombre || "Este lead"} pasa a otra persona. El reloj de respuesta sigue contando desde que
            entró.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reasignar-destino">Nuevo responsable</Label>
          <Select value={destino} onValueChange={setDestino} disabled={personas == null || enviando}>
            <SelectTrigger id="reasignar-destino" className="w-full">
              <SelectValue placeholder={personas == null ? "Cargando…" : "Elegí una persona"} />
            </SelectTrigger>
            <SelectContent>
              {candidatos.map((persona) => {
                const puede = persona.activo
                const motivo = motivoNoDisponible(persona)
                return (
                  <SelectItem key={persona.perfil_id} value={persona.perfil_id} disabled={!puede}>
                    {persona.nombre}
                    {motivo ? ` · ${motivo}` : ""}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <p className="text-kicker text-muted-foreground">
            Cualquier persona activa de Ventas o Administrativo. A mano no importa si recibe leads automáticamente, si
            está en pausa o en su tope.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" disabled={!destino || enviando} onClick={() => void confirmar()}>
            {enviando ? "Reasignando…" : "Reasignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
