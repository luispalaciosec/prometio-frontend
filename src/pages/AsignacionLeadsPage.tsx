import { useCallback, useEffect, useState, type ReactNode } from "react"
import { ListOrdered, Share2, UserCheck, Users } from "lucide-react"
import { toast } from "sonner"

import { PersonasAsignacion } from "@/components/asignacion-leads/PersonasAsignacion"
import { ReglasAsignacion } from "@/components/asignacion-leads/ReglasAsignacion"
import { SimuladorAsignacion } from "@/components/asignacion-leads/SimuladorAsignacion"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { PageHeader } from "@/components/page-header"
import { DetailSkeleton } from "@/components/skeleton"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAsignacionLeads, getValoresAsignacion, updateAsignacionLeads } from "@/lib/api/asignacion-leads"
import { useAuthStore } from "@/store/auth-store"
import {
  METODO_BASE_LABELS,
  METODOS_BASE,
  type AsignacionLeads,
  type MetodoBase,
  type ValoresAsignacion,
} from "@/types/asignacion-leads"

const SIN_RESPALDO = "__ninguno"

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <section className="space-y-4 surface-card p-4 sm:p-5">
      <div>
        <h2 className="text-section">{titulo}</h2>
        <p className="mt-1 text-kicker">{descripcion}</p>
      </div>
      {children}
    </section>
  )
}

export function AsignacionLeadsPage() {
  const perfil = useAuthStore((state) => state.perfil)
  // El supervisor de ventas la ve en solo lectura; editar y simular son del administrativo (el backend responde 403).
  const editable = perfil?.equipo === "administrativo"
  const [datos, setDatos] = useState<AsignacionLeads | null>(null)
  const [valores, setValores] = useState<ValoresAsignacion | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardandoBase, setGuardandoBase] = useState(false)

  const recargar = useCallback(async () => {
    try {
      setDatos(await getAsignacionLeads())
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cargar la asignación de leads.")
    }
  }, [])

  useEffect(() => {
    void recargar()
    void getValoresAsignacion()
      .then(setValores)
      .catch(() => setValores(null))
  }, [recargar])

  async function guardarBase(patch: { metodo_base?: MetodoBase; respaldo_perfil_id?: string | null }) {
    setGuardandoBase(true)
    try {
      setDatos(await updateAsignacionLeads(patch))
      toast.success("Guardado.")
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "No se pudo guardar.")
    } finally {
      setGuardandoBase(false)
    }
  }

  const disponibles = datos?.personas.filter((p) => p.disponible) ?? []
  const pendientes = datos?.personas.reduce((suma, p) => suma + p.pendientes_actuales, 0) ?? 0
  const reglasActivas = datos?.reglas.filter((r) => r.activa).length ?? 0
  const respaldo = datos?.personas.find((p) => p.perfil_id === datos.respaldo_perfil_id) ?? null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asignación de leads"
        description="Quién recibe los leads del formulario y con qué reglas. Gana la primera regla que coincide y tiene a alguien disponible; si ninguna, se reparte con el método base."
      />
      {error ? (
        <EmptyState icon={Share2} title="No se pudo cargar" body={error} />
      ) : datos == null ? (
        <DetailSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title="Disponibles"
              value={`${disponibles.length} de ${datos.personas.length}`}
              hint="Activos, reciben leads, sin pausa y bajo su tope"
              icon={UserCheck}
              tone={disponibles.length > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}
            />
            <KpiCard
              title="Leads pendientes"
              value={pendientes}
              hint="Sin primer contacto, de todo el equipo"
              icon={Users}
              tone="bg-primary/15 text-primary"
            />
            <KpiCard
              title="Reglas activas"
              value={`${reglasActivas} de ${datos.reglas.length}`}
              hint="Se prueban en orden"
              icon={ListOrdered}
              tone="bg-highlight/15 text-highlight"
            />
          </div>

          {disponibles.length === 0 ? (
            respaldo?.activo ? (
              <p className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-ui text-foreground" role="status">
                Nadie está disponible: los leads nuevos van al respaldo, {respaldo.nombre}.
              </p>
            ) : (
              <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-ui text-foreground" role="alert">
                <strong>Los leads nuevos quedarán sin asignar.</strong> Nadie está disponible y no hay respaldo: encendé
                «Recibe leads» en al menos una persona o elegí un respaldo.
              </p>
            )
          ) : null}

          <Seccion
            titulo="Método base y respaldo"
            descripcion="Qué pasa con un lead que no coincide con ninguna regla, y quién lo recibe si no hay nadie disponible."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="asignacion-metodo">Método base</Label>
                <Select
                  value={datos.metodo_base}
                  disabled={!editable || guardandoBase}
                  onValueChange={(value) => void guardarBase({ metodo_base: value as MetodoBase })}
                >
                  <SelectTrigger id="asignacion-metodo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METODOS_BASE.map((metodo) => (
                      <SelectItem key={metodo} value={metodo}>
                        {METODO_BASE_LABELS[metodo]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-kicker text-muted-foreground">
                  Por turnos: uno a cada uno, según su peso. Por carga: al que tiene menos oportunidades abiertas.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="asignacion-respaldo">Responsable de respaldo</Label>
                <Select
                  value={datos.respaldo_perfil_id ?? SIN_RESPALDO}
                  disabled={!editable || guardandoBase}
                  onValueChange={(value) =>
                    void guardarBase({ respaldo_perfil_id: value === SIN_RESPALDO ? null : value })
                  }
                >
                  <SelectTrigger id="asignacion-respaldo" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SIN_RESPALDO}>Sin respaldo</SelectItem>
                    {datos.personas
                      .filter((p) => p.activo || p.perfil_id === datos.respaldo_perfil_id)
                      .map((persona) => (
                        <SelectItem key={persona.perfil_id} value={persona.perfil_id}>
                          {persona.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-kicker text-muted-foreground">
                  Recibe el lead cuando nadie está disponible, aunque esté en su tope. Sin respaldo, el lead queda sin
                  asignar y se avisa por correo.
                </p>
              </div>
            </div>
          </Seccion>

          <Seccion
            titulo="Quién recibe leads"
            descripcion="Vendedores y administrativos. Los cambios se guardan al momento. Desactivar a alguien reparte sus leads pendientes entre los disponibles."
          >
            <PersonasAsignacion personas={datos.personas} editable={editable} onCambio={recargar} />
          </Seccion>

          <Seccion
            titulo="Reglas"
            descripcion="Por producto, provincia, campaña u origen. Se prueban de arriba hacia abajo; cambiá el orden con las flechas."
          >
            <ReglasAsignacion
              reglas={datos.reglas}
              personas={datos.personas}
              valores={valores}
              editable={editable}
              onCambio={recargar}
            />
          </Seccion>

          {editable ? (
            <Seccion
              titulo="Probar"
              descripcion="A quién le tocaría un lead con estos datos. No reparte nada ni mueve los turnos."
            >
              <SimuladorAsignacion valores={valores} />
            </Seccion>
          ) : (
            <p className="text-kicker text-muted-foreground">
              Estás en modo lectura: los cambios y el panel «Probar» son del equipo administrativo.
            </p>
          )}
        </>
      )}
    </div>
  )
}
