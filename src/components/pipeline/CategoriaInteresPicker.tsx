import { cn } from "@/lib/utils"
import type { CategoriaServicio } from "@/types/categoria-servicio"

export function CategoriaInteresPicker({
  categorias,
  value,
  onChange,
  disabled,
}: {
  categorias: CategoriaServicio[]
  value: string | null
  onChange: (id: string | null) => void
  disabled?: boolean
}) {
  if (categorias.length === 0) {
    return (
      <p className="text-kicker text-muted-foreground">
        No hay categorías de servicio. Un admin las define en Configuración → Categorías.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "rounded-full border px-3 py-1.5 text-kicker transition-colors",
          value == null
            ? "border-primary bg-primary/10 font-medium text-primary"
            : "border-border bg-background text-muted-foreground hover:border-primary/30",
        )}
        onClick={() => onChange(null)}
      >
        Sin clasificar
      </button>
      {categorias.map((row) => {
        const activo = value === row.id
        return (
          <button
            key={row.id}
            type="button"
            disabled={disabled}
            className={cn(
              "rounded-full border px-3 py-1.5 text-kicker transition-colors",
              activo
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border bg-background text-muted-foreground hover:border-primary/30",
            )}
            onClick={() => onChange(row.id)}
          >
            {row.nombre}
          </button>
        )
      })}
    </div>
  )
}
