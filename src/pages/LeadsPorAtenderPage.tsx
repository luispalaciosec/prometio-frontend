import { Link, useNavigate } from "react-router-dom"
import { AlarmClock, Siren, TimerOff } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { LeadSlaBadge } from "@/components/leads/LeadSlaBadge"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useLeadsPendientes } from "@/hooks/use-leads-pendientes"
import { textoReloj } from "@/lib/atencion-lead"
import { formatDateTime } from "@/lib/datetime-local"
import { puedeVerEquipo } from "@/lib/pipeline-acceso"
import { useAuthStore } from "@/store/auth-store"
import type { LeadPendiente } from "@/types/atencion-lead"
import type { TipoActividad } from "@/types/actividad"

/** Abre la ficha con el alta de actividad lista. El reporte cierra el lead en el backend. */
function enlaceFicha(lead: LeadPendiente, tipo?: TipoActividad): string {
  const params = new URLSearchParams({ reportar: tipo ?? "actividad" })
  if (lead.oportunidad_id) {
    params.set("oportunidad", lead.oportunidad_id)
  }
  return `/contactos/${lead.contacto_id}?${params.toString()}`
}

export function LeadsPorAtenderPage() {
  const perfil = useAuthStore((state) => state.perfil)
  const navigate = useNavigate()
  const { leads, error } = useLeadsPendientes()
  const mostrarResponsable = perfil ? puedeVerEquipo(perfil) : false
  const vencidos = leads?.filter((lead) => lead.estado === "vencido").length ?? 0
  const escalados = leads?.filter((lead) => lead.estado === "escalado").length ?? 0

  return (
    <>
      <PageHeader
        title="Leads por atender"
        description="Quién espera un primer contacto. El reloj cuenta solo el horario laboral y se actualiza cada minuto."
      />
      {leads == null && error ? (
        <EmptyState
          icon={AlarmClock}
          title="No se pudieron cargar los leads"
          body="Revisá tu conexión. La lista se vuelve a pedir sola cada minuto."
        />
      ) : leads == null ? (
        <TableSkeleton rows={4} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              title="Por atender"
              value={leads.length}
              hint={leads.length === 0 ? "Nadie esperando" : "Sin primer contacto"}
              icon={AlarmClock}
              tone="bg-primary/15 text-primary"
            />
            <KpiCard
              title="Vencidos"
              value={vencidos}
              hint="Pasaron la meta de respuesta"
              icon={TimerOff}
              tone="bg-warning/15 text-warning"
            />
            <KpiCard
              title="Escalados"
              value={escalados}
              hint="Superaron el límite: le toca al supervisor"
              icon={Siren}
              tone="bg-destructive/15 text-destructive"
            />
          </div>
          {leads.length === 0 ? (
            <EmptyState
              icon={AlarmClock}
              title="Nadie esperando"
              body="Cuando entre un lead por el formulario web, aparece acá con su reloj."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Producto</TableHead>
                  {mostrarResponsable ? <TableHead>Responsable</TableHead> : null}
                  <TableHead>Ingresó</TableHead>
                  <TableHead title="Minutos hábiles: lunes a viernes, dentro del horario laboral">Reloj</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow
                    key={lead.actividad_id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/contactos/${lead.contacto_id}`)}
                  >
                    <TableCell className="whitespace-normal">
                      <p className="text-ui-medium">{lead.contacto_nombre || "Sin nombre"}</p>
                      <p className="text-kicker text-muted-foreground">
                        {lead.contacto_telefono ? (
                          <a
                            href={`tel:${lead.contacto_telefono}`}
                            className="underline-offset-4 hover:underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {lead.contacto_telefono}
                          </a>
                        ) : (
                          lead.contacto_email
                        )}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-normal text-ui">{lead.producto_interes || "—"}</TableCell>
                    {mostrarResponsable ? (
                      <TableCell className="text-muted-foreground">{lead.responsable_nombre || "—"}</TableCell>
                    ) : null}
                    <TableCell className="text-muted-foreground">{formatDateTime(lead.ingreso_en)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        <LeadSlaBadge estado={lead.estado} />
                        <span className="tabular-nums text-ui">{textoReloj(lead.minutos_restantes)}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                      <span className="inline-flex gap-1">
                        {lead.contacto_telefono ? (
                          <>
                            <Button asChild variant="ghost" size="sm">
                              <Link to={enlaceFicha(lead, "llamada")}>Llamar</Link>
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                              <Link to={enlaceFicha(lead, "whatsapp")}>WhatsApp</Link>
                            </Button>
                          </>
                        ) : null}
                        <Button asChild variant="outline" size="sm">
                          <Link to={enlaceFicha(lead)}>Registrar actividad</Link>
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </>
  )
}
