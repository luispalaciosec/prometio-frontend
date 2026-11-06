import { FileSpreadsheet, Loader2 } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatMoney } from "@/lib/costo-interno"
import type { VistaPreviaExportacion } from "@/types/exportar"

function sumas(valores: Record<string, number>, titulos: Map<string, string>): string {
  return Object.entries(valores)
    .map(([clave, valor]) => `${titulos.get(clave) ?? clave} ${formatMoney(valor)}`)
    .join(" · ")
}

export function ExportarVistaPrevia({
  vista,
  cargando,
  error,
  tituloGrupo,
}: {
  vista: VistaPreviaExportacion | null
  cargando: boolean
  error: string | null
  /** Título de la agrupación elegida («Etapa»), para leer cada grupo. */
  tituloGrupo: string | null
}) {
  const titulos = new Map((vista?.columnas ?? []).map((columna) => [columna.clave, columna.titulo]))
  const restantes = vista ? vista.total_filas - vista.filas.length : 0

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-section">Vista previa</h3>
        {cargando ? <Loader2 className="size-4 animate-spin text-muted-foreground" strokeWidth={1.75} aria-label="Actualizando" /> : null}
      </div>
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-ui text-destructive">{error}</p>
      ) : null}
      {vista == null ? (
        error ? null : <p className="text-kicker text-muted-foreground">Preparando la vista previa…</p>
      ) : (
        <div className={cargando ? "space-y-4 opacity-60 transition-opacity" : "space-y-4 transition-opacity"}>
          <div>
            <p className="text-page tabular-nums">
              {vista.total_filas.toLocaleString("es-EC")} {vista.total_filas === 1 ? "registro" : "registros"}
            </p>
            {vista.filtros_aplicados ? <p className="mt-1 text-kicker text-muted-foreground">{vista.filtros_aplicados}</p> : null}
          </div>
          {vista.total_filas === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="No hay registros con estos filtros"
              body="Cambiá o quitá algún filtro para tener algo que descargar."
            />
          ) : (
            <>
              {vista.resumen.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {vista.resumen.map((ficha) => (
                    <div key={ficha.etiqueta} className="surface-muted rounded-xl p-3">
                      <p className="text-kicker">{ficha.etiqueta}</p>
                      <p className="mt-1 text-ui-medium tabular-nums">{ficha.valor}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {vista.grupos ? (
                <ul className="space-y-1">
                  {vista.grupos.map((grupo) => (
                    <li key={grupo.valor} className="text-ui">
                      <span className="text-ui-medium">
                        {tituloGrupo ? `${tituloGrupo} ${grupo.valor}` : grupo.valor}
                      </span>
                      <span className="text-muted-foreground">
                        {" — "}
                        {grupo.cantidad} {grupo.cantidad === 1 ? "registro" : "registros"}
                        {grupo.subtotales && Object.keys(grupo.subtotales).length > 0
                          ? ` — Subtotal ${sumas(grupo.subtotales, titulos)}`
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {vista.totales && Object.keys(vista.totales).length > 0 ? (
                <p className="text-ui-medium tabular-nums">Total: {sumas(vista.totales, titulos)}</p>
              ) : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    {vista.columnas.map((columna) => (
                      <TableHead
                        key={columna.clave}
                        className={columna.tipo === "texto" || columna.tipo === "fecha" || columna.tipo === "booleano" ? undefined : "text-right"}
                      >
                        {columna.titulo}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vista.filas.map((fila, index) => (
                    <TableRow key={index}>
                      {fila.map((celda, columna) => {
                        const tipo = vista.columnas[columna]?.tipo
                        return (
                          <TableCell
                            key={columna}
                            className={
                              columna === 0
                                ? "text-ui-medium"
                                : tipo === "texto" || tipo === "fecha" || tipo === "booleano"
                                  ? "text-ui"
                                  : "text-right tabular-nums text-ui"
                            }
                          >
                            {celda}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {vista.hay_mas_filas && restantes > 0 ? (
                <p className="text-kicker text-muted-foreground">…y {restantes.toLocaleString("es-EC")} más</p>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}
