import { useState, type KeyboardEvent } from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function normalizar(raw: string): string {
  return raw.trim()
}

export function ServiciosTagsInput({
  value,
  sugerencias,
  onChange,
}: {
  value: string[]
  sugerencias: string[]
  onChange: (next: string[]) => void
}) {
  const [texto, setTexto] = useState("")
  const usados = new Set(value.map((item) => item.toLocaleLowerCase("es")))
  const disponibles = sugerencias.filter((item) => !usados.has(item.toLocaleLowerCase("es")))

  function agregar(raw: string) {
    const tag = normalizar(raw)
    if (!tag || usados.has(tag.toLocaleLowerCase("es"))) {
      setTexto("")
      return
    }
    onChange([...value, tag])
    setTexto("")
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return
    }
    event.preventDefault()
    agregar(texto)
  }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge key={tag} variant="outline" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Quitar ${tag}`}
                onClick={() => onChange(value.filter((item) => item !== tag))}
              >
                <X className="size-3" strokeWidth={1.75} aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          id="proveedor-servicios"
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nombre del tag"
        />
        <Button type="button" variant="outline" onClick={() => agregar(texto)}>
          Agregar
        </Button>
      </div>
      {disponibles.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {disponibles.map((tag) => (
            <Button
              key={tag}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-kicker"
              onClick={() => agregar(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
