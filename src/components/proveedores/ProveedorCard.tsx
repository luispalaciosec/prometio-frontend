import { EntityAvatar } from "@/components/entity-avatar"
import { CalificacionEstrellas } from "@/components/proveedores/CalificacionEstrellas"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Proveedor } from "@/types/proveedor"

export function ServicioTagChip({
  tag,
  selected,
  onSelect,
}: {
  tag: string
  selected: boolean
  onSelect: (tag: string) => void
}) {
  return (
    <Badge asChild variant="outline">
      <button
        type="button"
        className={cn("cursor-pointer hover:bg-muted", selected && "bg-muted")}
        aria-pressed={selected}
        onClick={() => onSelect(tag)}
      >
        {tag}
      </button>
    </Badge>
  )
}

export function ProveedorCard({
  proveedor,
  servicioFiltro,
  onOpen,
  onEliminar,
  onFiltrarServicio,
}: {
  proveedor: Proveedor
  servicioFiltro: string | null
  onOpen: () => void
  onEliminar: () => void
  onFiltrarServicio: (tag: string) => void
}) {
  const tags = proveedor.servicios ?? []

  return (
    <div className="rounded-xl p-4 ring-1 ring-border transition-shadow duration-150 hover:shadow-raised hover:ring-foreground/20">
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 text-left">
        <EntityAvatar name={proveedor.nombre} seed={proveedor.id} kind="empresa" size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-ui-medium">{proveedor.nombre}</p>
          {proveedor.activo === false ? <p className="text-kicker">Inactivo</p> : null}
          <p className="mt-1 truncate text-kicker">{proveedor.contacto_nombre ?? "Sin contacto"}</p>
          <p className="truncate text-kicker">{proveedor.ruc ?? "Sin RUC"}</p>
          <div className="mt-2">
            <CalificacionEstrellas
              value={proveedor.calificacion == null ? null : Math.round(proveedor.calificacion)}
            />
          </div>
        </div>
      </button>
      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <ServicioTagChip
              key={tag}
              tag={tag}
              selected={mismoServicio(servicioFiltro, tag)}
              onSelect={onFiltrarServicio}
            />
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onOpen}>
          Editar
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onEliminar}>
          Eliminar
        </Button>
      </div>
    </div>
  )
}

export function mismoServicio(actual: string | null, tag: string): boolean {
  return actual != null && actual.toLocaleLowerCase("es") === tag.toLocaleLowerCase("es")
}
