import { FiltroMes } from "@/components/filtro-mes"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchCombobox, type SearchComboboxOption } from "@/components/ui/search-combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FiltroExportacion } from "@/types/exportar"

/**
 * Filtros `texto` que en realidad son un mes `AAAA-MM`: se dibujan con el selector de mes.
 * El backend los declara como texto; la etiqueta propia aclara qué fecha miran.
 */
const FILTROS_MES: Record<string, { label: string; ayuda: string }> = {
  vigente_en: {
    label: "Fee que se cobran en…",
    ayuda: "Contratos vigentes en algún día de ese mes. Es distinto de «Termina desde / hasta», que filtra por fecha de vencimiento.",
  },
}

/** Radix Select no admite "" como valor: este centinela representa «sin filtro». */
const TODOS = "__todos"

/**
 * Formulario dibujado desde `GET /exportar/opciones`: ningún filtro está escrito a mano.
 * Los `uuid` usan el buscador de la app con las opciones que cargó el panel (`opcionesUuid`).
 */
export function ExportarFiltros({
  filtros,
  valores,
  onCambio,
  opcionesUuid,
}: {
  filtros: FiltroExportacion[]
  valores: Record<string, string>
  onCambio: (nombre: string, valor: string) => void
  opcionesUuid: Record<string, SearchComboboxOption[] | undefined>
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {filtros.map((filtro) => {
        const id = `exportar-filtro-${filtro.nombre}`
        const valor = valores[filtro.nombre] ?? ""

        const mes = FILTROS_MES[filtro.nombre]
        if (mes) {
          return (
            <div key={filtro.nombre} className="sm:col-span-2">
              <FiltroMes
                id={id}
                label={mes.label}
                ayuda={mes.ayuda}
                value={valor}
                onChange={(value) => onCambio(filtro.nombre, value)}
              />
            </div>
          )
        }

        if (filtro.tipo === "uuid") {
          return (
            <div key={filtro.nombre} className="flex flex-col gap-2 sm:col-span-2">
              <SearchCombobox
                id={id}
                label={filtro.titulo}
                placeholder={opcionesUuid[filtro.nombre] ? "Todos" : "Cargando…"}
                value={valor}
                onChange={(value) => onCambio(filtro.nombre, value)}
                options={opcionesUuid[filtro.nombre] ?? []}
                disabled={!opcionesUuid[filtro.nombre]}
              />
            </div>
          )
        }

        if (filtro.tipo === "booleano" || filtro.tipo === "enum") {
          const opciones =
            filtro.tipo === "booleano"
              ? [
                  { valor: "true", etiqueta: "Sí" },
                  { valor: "false", etiqueta: "No" },
                ]
              : (filtro.opciones ?? [])
          return (
            <div key={filtro.nombre} className="flex flex-col gap-2">
              <Label htmlFor={id}>{filtro.titulo}</Label>
              <Select value={valor || TODOS} onValueChange={(value) => onCambio(filtro.nombre, value === TODOS ? "" : value)}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>{filtro.tipo === "booleano" ? "Sin filtro" : "Todos"}</SelectItem>
                  {opciones.map((opcion) => (
                    <SelectItem key={opcion.valor} value={opcion.valor}>
                      {opcion.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }

        return (
          <div key={filtro.nombre} className={filtro.tipo === "texto" ? "flex flex-col gap-2 sm:col-span-2" : "flex flex-col gap-2"}>
            <Label htmlFor={id}>{filtro.titulo}</Label>
            <Input
              id={id}
              type={filtro.tipo === "numero" ? "number" : filtro.tipo === "fecha" ? "date" : "text"}
              inputMode={filtro.tipo === "numero" ? "decimal" : undefined}
              min={filtro.tipo === "numero" ? 0 : undefined}
              value={valor}
              onChange={(event) => onCambio(filtro.nombre, event.target.value)}
            />
          </div>
        )
      })}
    </div>
  )
}
