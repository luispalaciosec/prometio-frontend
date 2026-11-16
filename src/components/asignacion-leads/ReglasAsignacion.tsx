import { useState } from "react"
import { ArrowDown, ArrowUp, ListOrdered } from "lucide-react"
import { toast } from "sonner"

import { ReglaDialog } from "@/components/asignacion-leads/ReglaDialog"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createRegla, deleteRegla, reordenarReglas, updateRegla } from "@/lib/api/asignacion-leads"
import {
  TIPO_REGLA_LABELS,
  type PersonaAsignacion,
  type ReglaAsignacion,
  type ReglaAsignacionInput,
  type ValoresAsignacion,
} from "@/types/asignacion-leads"

/** Reglas en orden: gana la primera que coincide y tiene a alguien disponible. */
export function ReglasAsignacion({
  reglas,
  personas,
  valores,
  editable,
  onCambio,
}: {
  /** Solo administrativo edita; el supervisor ve la lista en solo lectura. */
  editable: boolean
  reglas: ReglaAsignacion[]
  personas: PersonaAsignacion[]
  valores: ValoresAsignacion | null
  onCambio: () => Promise<void>
}) {
  const [dialogo, setDialogo] = useState<{ regla: ReglaAsignacion | null; apertura: number } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const nombre = new Map(personas.map((p) => [p.perfil_id, p.nombre]))
  const disponible = new Map(personas.map((p) => [p.perfil_id, p.disponible]))

  async function ejecutar(accion: () => Promise<unknown>, error: string) {
    setGuardando(true)
    try {
      await accion()
      await onCambio()
      return true
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : error)
      return false
    } finally {
      setGuardando(false)
    }
  }

  async function guardar(input: ReglaAsignacionInput) {
    const regla = dialogo?.regla
    const ok = await ejecutar(
      () => (regla ? updateRegla(regla.id, input) : createRegla(input)),
      "No se pudo guardar la regla.",
    )
    if (ok) {
      setDialogo(null)
    }
  }

  function mover(index: number, delta: number) {
    const ids = reglas.map((r) => r.id)
    const [id] = ids.splice(index, 1)
    ids.splice(index + delta, 0, id)
    void ejecutar(() => reordenarReglas(ids), "No se pudo cambiar el orden.")
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-kicker text-muted-foreground">
          Si una regla tiene varias personas, rotan por turnos respetando el peso de cada una.
        </p>
        {editable ? (
          <Button
            type="button"
            disabled={guardando}
            onClick={() => setDialogo((prev) => ({ regla: null, apertura: (prev?.apertura ?? 0) + 1 }))}
          >
            Nueva regla
          </Button>
        ) : null}
      </div>
      {reglas.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="Sin reglas"
          body="Todos los leads se reparten con el método base. Creá una regla para mandar, por ejemplo, un producto o una provincia a alguien en particular."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-0">#</TableHead>
              <TableHead>Cuando</TableHead>
              <TableHead>Asignar a</TableHead>
              <TableHead>Activa</TableHead>
              <TableHead>Estado</TableHead>
              {editable ? (
                <TableHead className="text-right">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {reglas.map((regla, index) => {
              const nadieDisponible = !regla.destinos.some((id) => disponible.get(id))
              return (
                <TableRow key={regla.id}>
                  <TableCell className="tabular-nums text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="whitespace-normal">
                    <p className="text-ui-medium">{regla.valor}</p>
                    <p className="text-kicker text-muted-foreground">{TIPO_REGLA_LABELS[regla.tipo]}</p>
                  </TableCell>
                  <TableCell className="whitespace-normal text-ui">
                    {regla.destinos.map((id) => nombre.get(id) ?? "Usuario fuera del equipo").join(", ")}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      aria-label={`Regla «${regla.valor}» activa`}
                      checked={regla.activa}
                      disabled={!editable || guardando}
                      onCheckedChange={(value) =>
                        void ejecutar(() => updateRegla(regla.id, { activa: value === true }), "No se pudo cambiar la regla.")
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {!regla.activa ? (
                      <Badge variant="outline">Pausada</Badge>
                    ) : nadieDisponible ? (
                      <Badge variant="destructive" title="Ningún destino está disponible: la regla se salta">
                        Sin disponibles
                      </Badge>
                    ) : (
                      <Badge variant="success">En uso</Badge>
                    )}
                  </TableCell>
                  {editable ? (
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Subir regla"
                        disabled={guardando || index === 0}
                        onClick={() => mover(index, -1)}
                      >
                        <ArrowUp className="size-4" strokeWidth={1.75} aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Bajar regla"
                        disabled={guardando || index === reglas.length - 1}
                        onClick={() => mover(index, 1)}
                      >
                        <ArrowDown className="size-4" strokeWidth={1.75} aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={guardando}
                        onClick={() => setDialogo((prev) => ({ regla, apertura: (prev?.apertura ?? 0) + 1 }))}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={guardando}
                        onClick={() => {
                          if (window.confirm(`¿Borrar la regla «${regla.valor}»?`)) {
                            void ejecutar(() => deleteRegla(regla.id), "No se pudo borrar la regla.")
                          }
                        }}
                      >
                        Borrar
                      </Button>
                    </span>
                  </TableCell>
                  ) : null}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
      {dialogo ? (
        <ReglaDialog
          key={dialogo.apertura}
          open
          regla={dialogo.regla}
          personas={personas}
          valores={valores}
          guardando={guardando}
          onGuardar={(input) => void guardar(input)}
          onCerrar={() => setDialogo(null)}
        />
      ) : null}
    </div>
  )
}
