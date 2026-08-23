import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function VistaToggle<T extends string>({
  value,
  onChange,
  opciones,
  className,
}: {
  value: T
  onChange: (next: T) => void
  opciones: readonly { value: T; label: string }[]
  className?: string
}) {
  return (
    <div className={cn("ml-auto flex flex-col gap-2", className)}>
      <Label>Vista</Label>
      <div className="flex gap-1">
        {opciones.map((opcion) => (
          <Button
            key={opcion.value}
            type="button"
            size="sm"
            variant={value === opcion.value ? "default" : "outline"}
            onClick={() => onChange(opcion.value)}
          >
            {opcion.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
