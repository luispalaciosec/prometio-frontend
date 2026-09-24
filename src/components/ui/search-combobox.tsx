import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  compareTextoLocale,
  coincideTexto,
  normalizarParaBusqueda,
} from "@/lib/lista-filtros"

export type SearchComboboxOption = {
  value: string
  label: string
}

function indicesCoincidencia(
  original: string,
  query: string,
): { start: number; end: number } | null {
  const needle = normalizarParaBusqueda(query.trim())
  if (!needle) {
    return null
  }
  let norm = ""
  const map: number[] = []
  for (let i = 0; i < original.length; i++) {
    const part = normalizarParaBusqueda(original[i] ?? "")
    for (let j = 0; j < part.length; j++) {
      norm += part[j]
      map.push(i)
    }
  }
  const idx = norm.indexOf(needle)
  if (idx === -1) {
    return null
  }
  return {
    start: map[idx] ?? 0,
    end: (map[idx + needle.length - 1] ?? 0) + 1,
  }
}

export function ResaltarCoincidencia({ texto, query }: { texto: string; query: string }) {
  const range = indicesCoincidencia(texto, query)
  if (!range) {
    return texto
  }
  const { start, end } = range
  return (
    <>
      {texto.slice(0, start)}
      <mark className="rounded-sm bg-primary/15 text-foreground">{texto.slice(start, end)}</mark>
      {texto.slice(end)}
    </>
  )
}

export function SearchCombobox({
  id,
  label,
  placeholder,
  value,
  onChange,
  options,
  pinnedOptions = [],
  disabled,
  emptyQueryMessage,
  onCreateNew,
  createNewLabel,
  showClearSelection = true,
  clearSelectionValue = "",
}: {
  id: string
  label?: ReactNode
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: SearchComboboxOption[]
  pinnedOptions?: SearchComboboxOption[]
  disabled?: boolean
  /** Mensaje cuando hay query y cero resultados (usar «…» con el término). */
  emptyQueryMessage?: (query: string) => string
  onCreateNew?: (query: string) => void
  createNewLabel?: (query: string) => string
  /** Si false, no se muestra chip con X (p. ej. valor por defecto equivalente a vacío). */
  showClearSelection?: boolean
  clearSelectionValue?: string
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => compareTextoLocale(a.label, b.label)),
    [options],
  )

  const selected = useMemo(() => {
    const all = [...pinnedOptions, ...sortedOptions]
    return all.find((row) => row.value === value) ?? null
  }, [pinnedOptions, sortedOptions, value])

  const hasSelection =
    showClearSelection && value !== clearSelectionValue && selected != null

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const filteredPinned = useMemo(() => {
    if (!query.trim()) {
      return pinnedOptions
    }
    return pinnedOptions.filter((row) => coincideTexto(query, row.label))
  }, [pinnedOptions, query])

  const filteredOptions = useMemo(
    () => sortedOptions.filter((row) => coincideTexto(query, row.label)),
    [sortedOptions, query],
  )

  const flatList = useMemo(
    () => [...filteredPinned, ...filteredOptions],
    [filteredPinned, filteredOptions],
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [query, open])

  useEffect(() => {
    if (!open) {
      return
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  const choose = useCallback(
    (next: string) => {
      onChange(next)
      setOpen(false)
      setQuery("")
    },
    [onChange],
  )

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      setOpen(false)
      setQuery("")
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      setActiveIndex((prev) => Math.min(prev + 1, Math.max(flatList.length - 1, 0)))
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      const row = flatList[activeIndex]
      if (row) {
        choose(row.value)
      }
    }
  }

  function abrir() {
    if (disabled) {
      return
    }
    setOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div ref={rootRef} className="relative flex flex-col gap-2">
      {label ? (
        <label htmlFor={id} className="text-kicker font-medium leading-none">
          {label}
        </label>
      ) : null}

      <div className="relative">
      {hasSelection && !open ? (
        <div
          className={cn(
            "flex h-9 min-h-9 items-center gap-2 rounded-lg border border-input bg-background px-3 shadow-raised",
            disabled && "opacity-50",
          )}
        >
          <button
            type="button"
            disabled={disabled}
            className="min-w-0 flex-1 truncate text-left text-ui text-foreground"
            onClick={abrir}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
          >
            {selected?.label}
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            disabled={disabled}
            aria-label="Quitar selección"
            onClick={() => onChange(clearSelectionValue)}
          >
            <X className="size-4" strokeWidth={1.75} />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.75}
            aria-hidden
          />
          <input
            ref={inputRef}
            id={id}
            type="search"
            role="combobox"
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={query}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              open && flatList[activeIndex]
                ? `${listId}-opt-${flatList[activeIndex]?.value}`
                : undefined
            }
            className={cn(
              "h-9 w-full rounded-lg border border-input bg-background py-1 pr-3 pl-9 text-ui shadow-raised outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50",
            )}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onKeyDown={onKeyDown}
          />
        </div>
      )}

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-raised"
        >
          {flatList.length === 0 ? (
            <li className="px-3 py-2 text-kicker text-muted-foreground" role="presentation">
              {emptyQueryMessage?.(query.trim()) ??
                (query.trim()
                  ? `Ninguno coincide con «${query.trim()}»`
                  : "Escribí para buscar")}
            </li>
          ) : (
            flatList.map((row, index) => {
              const pinned = index < filteredPinned.length
              return (
                <li
                  key={row.value}
                  id={`${listId}-opt-${row.value}`}
                  role="option"
                  aria-selected={value === row.value}
                  className={cn(
                    "cursor-pointer px-3 py-2.5 text-ui md:py-2",
                    index === activeIndex && "bg-muted",
                    pinned && "border-b border-border font-medium",
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(row.value)}
                >
                  <ResaltarCoincidencia texto={row.label} query={query} />
                </li>
              )
            })
          )}
          {flatList.length === 0 && query.trim() && onCreateNew ? (
            <li className="border-t border-border px-2 py-2" role="presentation">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-start text-kicker"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onCreateNew(query.trim())
                  setOpen(false)
                  setQuery("")
                }}
              >
                {createNewLabel?.(query.trim()) ?? `Crear «${query.trim()}»`}
              </Button>
            </li>
          ) : null}
        </ul>
      ) : null}
      </div>
    </div>
  )
}
