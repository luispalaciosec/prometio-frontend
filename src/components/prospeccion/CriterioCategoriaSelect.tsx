import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CategoriaServicio } from "@/types/categoria-servicio"

export function CriterioCategoriaSelect({
  id,
  categorias,
  value,
  disabled,
  onChange,
}: {
  id: string
  categorias: CategoriaServicio[]
  value: string | null
  disabled?: boolean
  onChange: (categoriaId: string | null) => void
}) {
  return (
    <Select
      value={value ?? "none"}
      disabled={disabled}
      onValueChange={(next) => onChange(next === "none" ? null : next)}
    >
      <SelectTrigger id={id} className="h-9">
        <SelectValue placeholder="Sin categoría" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Sin categoría</SelectItem>
        {categorias.map((row) => (
          <SelectItem key={row.id} value={row.id}>
            {row.nombre}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
