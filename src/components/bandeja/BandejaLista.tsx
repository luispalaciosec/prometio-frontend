import { CANAL_LABELS, type CanalConversacion, type Conversacion } from "@/types/conversacion"
import { cn } from "@/lib/utils"

function ultimoMensaje(conversacion: Conversacion): string {
  const ordenados = [...conversacion.mensajes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
  const ultimo = ordenados.at(-1)?.contenido?.trim()
  return ultimo && ultimo.length > 0 ? ultimo : "Sin mensajes"
}

function etiquetaCanal(canal: string): string {
  return CANAL_LABELS[canal as CanalConversacion] ?? canal
}

export function BandejaLista({
  conversaciones,
  seleccionId,
  nombresAsignados,
  onSelect,
}: {
  conversaciones: Conversacion[]
  seleccionId: string | null
  nombresAsignados: Map<string, string>
  onSelect: (id: string) => void
}) {
  if (conversaciones.length === 0) {
    return (
      <p className="px-3 py-6 text-sm text-muted-foreground">
        No hay conversaciones en este alcance.
      </p>
    )
  }

  return (
    <ul className="flex flex-col">
      {conversaciones.map((row) => {
        const activa = row.id === seleccionId
        return (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onSelect(row.id)}
              className={cn(
                "w-full border-b border-border px-3 py-3 text-left transition-colors duration-150",
                activa
                  ? "bg-sidebar-accent/10 shadow-[inset_2px_0_0_0_var(--highlight)]"
                  : "hover:bg-muted/50",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {row.remitente_nombre ?? row.remitente_identificador ?? "Sin nombre"}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[0.7rem]",
                    row.estado === "cerrada" ? "text-muted-foreground" : "text-primary",
                  )}
                >
                  {row.estado}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{etiquetaCanal(row.canal)}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{ultimoMensaje(row)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.asignado_a
                  ? nombresAsignados.get(row.asignado_a) ?? "Asignada"
                  : "Sin asignar"}
              </p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
