import { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { ExportarColumnas } from "@/components/exportar/ExportarColumnas"
import { ExportarFiltros } from "@/components/exportar/ExportarFiltros"
import { ExportarVistaPrevia } from "@/components/exportar/ExportarVistaPrevia"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { SearchComboboxOption } from "@/components/ui/search-combobox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError } from "@/lib/api-client"
import { listEmpresas } from "@/lib/api/empresa"
import {
  descargarExportacion,
  getOpcionesExportacion,
  getVistaPrevia,
  parametrosExportacion,
} from "@/lib/api/exportar"
import { etiquetaEmpresa, listOportunidadesLookup } from "@/lib/api/oportunidad"
import { listPerfilesElegiblesEjecutivo } from "@/lib/api/perfiles"
import { listServicios } from "@/lib/config-api"
import {
  guardarPreferencias,
  leerPreferencias,
  type PreferenciasExportacion,
} from "@/lib/exportar-preferencias"
import type {
  Direccion,
  FormatoArchivo,
  OpcionesExportacion,
  RecursoExportable,
  VistaPreviaExportacion,
} from "@/types/exportar"

const DEBOUNCE_MS = 400
const SIN_VALOR = "__ninguno"

/** Opciones de cada filtro `uuid` que ofrece el backend, con los listados que ya usa la app. */
const CARGAR_UUID: Record<string, () => Promise<SearchComboboxOption[]>> = {
  empresa_id: async () => (await listEmpresas()).map((row) => ({ value: row.id, label: row.nombre })),
  ejecutivo_id: async () =>
    (await listPerfilesElegiblesEjecutivo()).map((row) => ({ value: row.id, label: row.nombre_completo })),
  servicio_id: async () => (await listServicios()).map((row) => ({ value: row.id, label: row.nombre })),
  oportunidad_id: async () =>
    (await listOportunidadesLookup()).map((row) => ({
      value: row.id,
      label: row.nombre ? `${row.nombre} · ${etiquetaEmpresa(row.empresa_id)}` : etiquetaEmpresa(row.empresa_id),
    })),
}

function DireccionToggle({ valor, onCambio, disabled }: { valor: Direccion; onCambio: (valor: Direccion) => void; disabled?: boolean }) {
  const Icono = valor === "asc" ? ArrowUp : ArrowDown
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={() => onCambio(valor === "asc" ? "desc" : "asc")}
      aria-label={valor === "asc" ? "Ascendente: cambiar a descendente" : "Descendente: cambiar a ascendente"}
    >
      <Icono className="size-4" strokeWidth={1.75} aria-hidden />
      {valor === "asc" ? "Ascendente" : "Descendente"}
    </Button>
  )
}

export function ExportarDialog({
  recurso,
  open,
  onOpenChange,
  filtrosIniciales,
}: {
  recurso: RecursoExportable
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Filtros activos en la pantalla de origen. Los que el backend no ofrece se descartan. */
  filtrosIniciales: Record<string, string>
}) {
  const [opciones, setOpciones] = useState<OpcionesExportacion | null>(null)
  const [errorOpciones, setErrorOpciones] = useState<string | null>(null)
  const [filtros, setFiltros] = useState<Record<string, string>>({})
  const [preferencias, setPreferencias] = useState<PreferenciasExportacion | null>(null)
  const [opcionesUuid, setOpcionesUuid] = useState<Record<string, SearchComboboxOption[] | undefined>>({})
  const [vista, setVista] = useState<VistaPreviaExportacion | null>(null)
  const [cargandoVista, setCargandoVista] = useState(false)
  const [errorVista, setErrorVista] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)
  const [descargando, setDescargando] = useState<FormatoArchivo | null>(null)

  const entidad = opciones?.entidades[recurso] ?? null

  // Al abrir: opciones (cacheadas), filtros de la pantalla y última selección guardada.
  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    setErrorOpciones(null)
    setVista(null)
    setErrorVista(null)
    void getOpcionesExportacion()
      .then((data) => {
        if (cancelled) {
          return
        }
        const definicion = data.entidades[recurso]
        const permitidos = new Set(definicion.filtros.map((filtro) => filtro.nombre))
        setOpciones(data)
        setFiltros(
          Object.fromEntries(Object.entries(filtrosIniciales).filter(([nombre, valor]) => permitidos.has(nombre) && valor !== "")),
        )
        setPreferencias(leerPreferencias(recurso, definicion))
        for (const filtro of definicion.filtros) {
          const cargar = filtro.tipo === "uuid" ? CARGAR_UUID[filtro.nombre] : undefined
          if (cargar) {
            void cargar()
              .then((lista) => {
                if (!cancelled) {
                  setOpcionesUuid((prev) => ({ ...prev, [filtro.nombre]: lista }))
                }
              })
              .catch(() => {
                if (!cancelled) {
                  setOpcionesUuid((prev) => ({ ...prev, [filtro.nombre]: [] }))
                }
              })
          }
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorOpciones(error instanceof Error ? error.message : "No se pudieron cargar las opciones de exportación.")
        }
      })
    return () => {
      cancelled = true
    }
    // filtrosIniciales se toma solo al abrir: cambiarlo con el panel abierto no debe pisar lo editado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, recurso])

  const seleccion = useMemo(() => {
    if (!preferencias) {
      return null
    }
    return {
      filtros,
      columnas: preferencias.columnas.filter((columna) => columna.activa).map((columna) => columna.clave),
      ordenPor: preferencias.ordenPor,
      orden: preferencias.orden,
      agruparPor: preferencias.agruparPor,
      ordenGrupos: preferencias.ordenGrupos,
    }
  }, [filtros, preferencias])
  const qs = seleccion ? parametrosExportacion(seleccion).toString() : null

  useEffect(() => {
    if (preferencias) {
      guardarPreferencias(recurso, preferencias)
    }
  }, [recurso, preferencias])

  // Vista previa: debounce, y cada cambio cancela la petición anterior para que solo se pinte la última.
  useEffect(() => {
    if (!open || qs == null) {
      return
    }
    const controller = new AbortController()
    let reintentoId: number | undefined
    setCargandoVista(true)
    const debounceId = window.setTimeout(() => {
      void getVistaPrevia(recurso, new URLSearchParams(qs), controller.signal)
        .then((data) => {
          setVista(data)
          setErrorVista(null)
          setCargandoVista(false)
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return
          }
          if (error instanceof ApiError && error.status === 429) {
            // Sin molestar: se vuelve a pedir cuando el backend lo permite.
            reintentoId = window.setTimeout(() => setReintento((n) => n + 1), (error.retryAfter ?? 5) * 1000)
            return
          }
          setErrorVista(
            error instanceof ApiError ? error.detail : error instanceof Error ? error.message : "No se pudo armar la vista previa.",
          )
          setVista(null)
          setCargandoVista(false)
        })
    }, DEBOUNCE_MS)
    return () => {
      window.clearTimeout(debounceId)
      window.clearTimeout(reintentoId)
      controller.abort()
    }
  }, [open, recurso, qs, reintento])

  function actualizar(cambio: Partial<PreferenciasExportacion>) {
    setPreferencias((prev) => (prev ? { ...prev, ...cambio } : prev))
  }

  async function descargar(formato: FormatoArchivo) {
    if (!seleccion) {
      return
    }
    setDescargando(formato)
    try {
      await descargarExportacion(recurso, formato, parametrosExportacion(seleccion))
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) {
        toast.error(error.detail)
      } else if (error instanceof ApiError && error.status === 429) {
        toast.error(
          error.retryAfter
            ? `Esperá un momento y volvé a intentar (${error.retryAfter} s).`
            : "Esperá un momento y volvé a intentar.",
        )
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo descargar.")
      }
    } finally {
      setDescargando(null)
    }
  }

  const columnasActivas = preferencias?.columnas.filter((columna) => columna.activa) ?? []
  const sinDinero =
    entidad != null &&
    entidad.sumables.length > 0 &&
    !columnasActivas.some((columna) => entidad.sumables.includes(columna.clave))
  const vistaAlDia = vista != null && !cargandoVista && errorVista == null
  const sinFilas = vistaAlDia && vista.total_filas === 0
  const limites = vista?.limites ?? opciones?.limites
  const excedeXlsx = vistaAlDia && vista.excede.xlsx
  const excedePdf = vistaAlDia && vista.excede.pdf
  const bloqueado = !vistaAlDia || sinFilas || descargando != null
  const tituloGrupo = entidad?.agrupables.find((a) => a.clave === preferencias?.agruparPor)?.titulo ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="text-section">Exportar {entidad?.titulo.toLowerCase() ?? ""}</DialogTitle>
          <DialogDescription className="text-kicker">
            Arranca con los filtros de la pantalla. Lo que cambies se ve abajo antes de descargar.
          </DialogDescription>
        </DialogHeader>

        {errorOpciones ? (
          <p className="text-ui text-destructive">{errorOpciones}</p>
        ) : !entidad || !preferencias ? (
          <div className="flex items-center gap-2 py-10 text-kicker text-muted-foreground">
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
            Cargando opciones…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6">
              <section className="space-y-3">
                <h3 className="text-section">Filtros</h3>
                <ExportarFiltros
                  filtros={entidad.filtros}
                  valores={filtros}
                  onCambio={(nombre, valor) =>
                    setFiltros((prev) => {
                      const next = { ...prev, [nombre]: valor }
                      // Los fee que se cobran en un mes son de contratos activos: si «Activos» está sin filtro, se marca.
                      if (
                        nombre === "vigente_en" &&
                        valor &&
                        !prev.activo &&
                        entidad.filtros.some((filtro) => filtro.nombre === "activo")
                      ) {
                        next.activo = "true"
                      }
                      return next
                    })
                  }
                  opcionesUuid={opcionesUuid}
                />
              </section>

              <section className="space-y-3">
                <h3 className="text-section">Orden y agrupación</h3>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="exportar-orden-por">Ordenar por</Label>
                  <div className="flex gap-2">
                    <Select
                      value={preferencias.ordenPor || SIN_VALOR}
                      onValueChange={(value) => actualizar({ ordenPor: value === SIN_VALOR ? "" : value })}
                    >
                      <SelectTrigger id="exportar-orden-por" className="min-w-0 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SIN_VALOR}>Orden por defecto</SelectItem>
                        {columnasActivas.map((columna) => (
                          <SelectItem key={columna.clave} value={columna.clave}>
                            {entidad.columnas.find((c) => c.clave === columna.clave)?.titulo ?? columna.clave}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <DireccionToggle
                      valor={preferencias.orden}
                      onCambio={(orden) => actualizar({ orden })}
                      disabled={!preferencias.ordenPor}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="exportar-agrupar-por">Agrupar por</Label>
                  <div className="flex gap-2">
                    <Select
                      value={preferencias.agruparPor || SIN_VALOR}
                      onValueChange={(value) => actualizar({ agruparPor: value === SIN_VALOR ? "" : value })}
                    >
                      <SelectTrigger id="exportar-agrupar-por" className="min-w-0 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SIN_VALOR}>Sin agrupar</SelectItem>
                        {entidad.agrupables.map((agrupable) => (
                          <SelectItem key={agrupable.clave} value={agrupable.clave}>
                            {agrupable.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <DireccionToggle
                      valor={preferencias.ordenGrupos}
                      onCambio={(ordenGrupos) => actualizar({ ordenGrupos })}
                      disabled={!preferencias.agruparPor}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-section">Columnas</h3>
                <ExportarColumnas
                  columnas={preferencias.columnas}
                  definicion={entidad.columnas}
                  onCambio={(columnas) => {
                    const activas = new Set(columnas.filter((c) => c.activa).map((c) => c.clave))
                    // Ordenar por una columna que ya no sale no tiene sentido: vuelve al orden por defecto.
                    actualizar({
                      columnas,
                      ...(preferencias.ordenPor && !activas.has(preferencias.ordenPor) ? { ordenPor: "" } : {}),
                    })
                  }}
                />
                {sinDinero ? (
                  <p className="text-kicker text-warning">Sin columnas de dinero, el archivo sale sin totales.</p>
                ) : null}
              </section>
            </div>

            <ExportarVistaPrevia
              vista={vista}
              cargando={cargandoVista}
              error={errorVista}
              tituloGrupo={tituloGrupo}
            />
          </div>
        )}

        {entidad && preferencias ? (
          <DialogFooter className="sticky bottom-0 -mx-4 -mb-4 flex-col items-stretch gap-2 border-t border-border bg-popover px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
            {excedeXlsx && limites ? (
              <p className="text-kicker text-warning sm:mr-auto">
                Son más de {limites.xlsx.toLocaleString("es-EC")} filas: afiná los filtros para descargar.
              </p>
            ) : excedePdf && limites ? (
              <p className="text-kicker text-warning sm:mr-auto">
                Máximo {limites.pdf.toLocaleString("es-EC")} filas en PDF: descargá en Excel o afiná los filtros.
              </p>
            ) : null}
            <Button type="button" variant="outline" disabled={bloqueado || excedeXlsx || excedePdf} onClick={() => void descargar("pdf")}>
              {descargando === "pdf" ? (
                <>
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
                  Generando…
                </>
              ) : (
                "Descargar PDF"
              )}
            </Button>
            <Button type="button" disabled={bloqueado || excedeXlsx} onClick={() => void descargar("xlsx")}>
              {descargando === "xlsx" ? (
                <>
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.75} aria-hidden />
                  Generando…
                </>
              ) : (
                "Descargar Excel"
              )}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
