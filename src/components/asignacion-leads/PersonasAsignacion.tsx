import { useState } from "react"
import { Users } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { updatePerfilAdmin } from "@/lib/api/perfil-admin"
import { etiquetaEquipo, motivoNoDisponible } from "@/lib/asignacion-leads"
import type { PersonaAsignacion } from "@/types/asignacion-leads"
import type { PerfilAdminUpdate } from "@/types/perfil"

const PESOS = Array.from({ length: 10 }, (_, i) => i + 1)

/** Una fila por persona de Ventas o Administrativo. Cada cambio se guarda al momento y recarga la disponibilidad. */
export function PersonasAsignacion({
  personas,
  editable,
  onCambio,
}: {
  personas: PersonaAsignacion[]
  /** Solo administrativo edita; el supervisor ve la tabla en solo lectura. */
  editable: boolean
  onCambio: () => Promise<void>
}) {
  const [guardando, setGuardando] = useState<string | null>(null)

  async function guardar(persona: PersonaAsignacion, patch: PerfilAdminUpdate) {
    setGuardando(persona.perfil_id)
    try {
      await updatePerfilAdmin(persona.perfil_id, patch)
      await onCambio()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.")
    } finally {
      setGuardando(null)
    }
  }

  if (personas.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nadie puede recibir leads"
        body="Solo los equipos de Ventas y Administrativo reciben leads. Invitá usuarios desde Usuarios."
      />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Persona</TableHead>
          <TableHead>Recibe leads</TableHead>
          <TableHead title="Hasta esa fecha inclusive no recibe leads (vacaciones, licencia)">Pausado hasta</TableHead>
          <TableHead title="En los turnos recibe esta cantidad de leads por vuelta">Peso</TableHead>
          <TableHead title="Máximo de leads sin atender a la vez. Vacío = sin tope">Tope</TableHead>
          <TableHead className="text-right">Pendientes</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {personas.map((persona) => {
          const ocupado = guardando === persona.perfil_id
          const bloqueado = !editable || ocupado || !persona.activo
          const motivo = motivoNoDisponible(persona)
          return (
            <TableRow key={persona.perfil_id} className={persona.activo ? undefined : "opacity-60"}>
              <TableCell className="whitespace-normal">
                <p className="text-ui-medium">{persona.nombre}</p>
                <p className="text-kicker text-muted-foreground">{etiquetaEquipo(persona)}</p>
              </TableCell>
              <TableCell>
                <Checkbox
                  aria-label={`${persona.nombre} recibe leads`}
                  checked={persona.recibe_leads}
                  disabled={bloqueado}
                  onCheckedChange={(value) => void guardar(persona, { recibe_leads: value === true })}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="date"
                  aria-label={`${persona.nombre}: pausado hasta`}
                  className="w-40"
                  defaultValue={persona.leads_pausado_hasta ?? ""}
                  key={`pausa-${persona.leads_pausado_hasta ?? ""}`}
                  disabled={bloqueado || !persona.recibe_leads}
                  onBlur={(event) => {
                    const valor = event.target.value || null
                    if (valor !== persona.leads_pausado_hasta) {
                      void guardar(persona, { leads_pausado_hasta: valor })
                    }
                  }}
                />
              </TableCell>
              <TableCell>
                <Select
                  value={String(persona.peso_reparto)}
                  disabled={bloqueado || !persona.recibe_leads}
                  onValueChange={(value) => void guardar(persona, { peso_reparto: Number(value) })}
                >
                  <SelectTrigger aria-label={`${persona.nombre}: peso`} className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PESOS.map((peso) => (
                      <SelectItem key={peso} value={String(peso)}>
                        {peso}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  placeholder="Sin tope"
                  aria-label={`${persona.nombre}: tope de pendientes`}
                  className="w-28"
                  defaultValue={persona.tope_pendientes ?? ""}
                  key={`tope-${persona.tope_pendientes ?? ""}`}
                  disabled={bloqueado || !persona.recibe_leads}
                  onBlur={(event) => {
                    const raw = event.target.value.trim()
                    const valor = raw === "" ? null : Number(raw)
                    if (valor != null && (!Number.isInteger(valor) || valor < 1)) {
                      toast.error("El tope tiene que ser un número entero desde 1, o vacío para no tener tope.")
                      event.target.value = persona.tope_pendientes == null ? "" : String(persona.tope_pendientes)
                      return
                    }
                    if (valor !== persona.tope_pendientes) {
                      void guardar(persona, { tope_pendientes: valor })
                    }
                  }}
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">{persona.pendientes_actuales}</TableCell>
              <TableCell>
                {motivo ? <Badge variant="outline">{motivo}</Badge> : <Badge variant="success">Disponible</Badge>}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
