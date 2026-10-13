import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { CalendarClock, CalendarRange, FileText, Repeat } from "lucide-react"
import { toast } from "sonner"

import { ContratoEditarDialog } from "@/components/contratos/ContratoEditarDialog"
import { ContratoLineasDialog } from "@/components/contratos/ContratoLineasDialog"
import { ContratoRenovarDialog } from "@/components/contratos/ContratoRenovarDialog"
import { ContratoVigenciaBadge } from "@/components/contratos/ContratoVigenciaBadge"
import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { PageHeader } from "@/components/page-header"
import { CotizacionEstadoBadge } from "@/components/pipeline/CotizacionEstadoBadge"
import { MarcarFacturadaDialog } from "@/components/pipeline/MarcarFacturadaDialog"
import { DetailSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  desactivarContrato,
  getContrato,
  reactivarContrato,
} from "@/lib/api/contrato-recurrente"
import { marcarFacturada } from "@/lib/api/cotizacion"
import { listCategoriasServicio, listServicios } from "@/lib/config-api"
import { formatPeriodo, textoDiasParaVencer } from "@/lib/contrato-recurrente"
import { rutaConstructorCotizacion } from "@/lib/cotizacion-rutas"
import { formatMoney } from "@/lib/costo-interno"
import { formatDateOnly } from "@/lib/datetime-local"
import { puedeVerEquipo } from "@/lib/pipeline-acceso"
import { useAuthStore } from "@/store/auth-store"
import type { CategoriaServicio } from "@/types/categoria-servicio"
import type { ContratoPeriodo, ContratoRecurrenteDetalle } from "@/types/contrato-recurrente"
import type { Servicio } from "@/types/servicio"

export function ContratoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const perfil = useAuthStore((state) => state.perfil)
  const [contrato, setContrato] = useState<ContratoRecurrenteDetalle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [categorias, setCategorias] = useState<CategoriaServicio[]>([])
  const [editando, setEditando] = useState(false)
  const [editandoLineas, setEditandoLineas] = useState(false)
  const [renovando, setRenovando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [facturando, setFacturando] = useState<ContratoPeriodo | null>(null)
  const [enviandoFactura, setEnviandoFactura] = useState(false)

  const reload = useCallback(async (contratoId: string) => {
    try {
      setContrato(await getContrato(contratoId))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el contrato.")
    }
  }, [])

  useEffect(() => {
    if (!id) {
      return
    }
    setContrato(null)
    void reload(id)
  }, [id, reload])

  useEffect(() => {
    let cancelled = false
    void Promise.all([listServicios(), listCategoriasServicio()])
      .then(([serviciosRows, categoriasRows]) => {
        if (!cancelled) {
          setServicios(serviciosRows)
          setCategorias(categoriasRows)
        }
      })
      .catch(() => {
        /* sin catálogo, las líneas muestran solo la descripción */
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function cambiarEstado() {
    if (!contrato) {
      return
    }
    setCambiandoEstado(true)
    try {
      const next = contrato.activo
        ? await desactivarContrato(contrato.id)
        : await reactivarContrato(contrato.id)
      setContrato(next)
      toast.success(next.activo ? "Contrato reactivado." : "Contrato desactivado.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado.")
    } finally {
      setCambiandoEstado(false)
    }
  }

  async function confirmarFacturada(numeroFactura: string) {
    if (!contrato || !facturando) {
      return
    }
    setEnviandoFactura(true)
    try {
      await marcarFacturada(facturando.cotizacion_id, numeroFactura)
      setFacturando(null)
      toast.success(`${facturando.numero} marcada facturada.`)
      await reload(contrato.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo marcar facturada.")
    } finally {
      setEnviandoFactura(false)
    }
  }

  if (error) {
    return (
      <div className="max-w-md space-y-3">
        <h1 className="text-page">No se pudo cargar</h1>
        <p className="text-kicker">{error}</p>
        <Button asChild variant="outline">
          <Link to="/contratos">Volver a contratos</Link>
        </Button>
      </div>
    )
  }

  if (!contrato) {
    return <DetailSkeleton />
  }

  function tituloLinea(servicioId: string | null, categoriaId: string | null): string {
    if (servicioId) {
      return servicios.find((row) => row.id === servicioId)?.nombre ?? "Servicio de catálogo"
    }
    const categoria = categorias.find((row) => row.id === categoriaId)?.nombre
    return categoria ? `A medida · ${categoria}` : "A medida"
  }

  const supervisa = perfil ? puedeVerEquipo(perfil) : false
  const periodos = [...contrato.periodos].sort((a, b) => b.periodo.localeCompare(a.periodo))

  return (
    <>
      <PageHeader
        title={contrato.nombre}
        description={
          <>
            <ContratoVigenciaBadge vigencia={contrato.vigencia} />
            {contrato.activo ? null : <Badge variant="outline">Desactivado</Badge>}
            <Link
              to={`/empresas/${contrato.empresa_id}`}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {contrato.empresa_nombre ?? "Empresa"}
            </Link>
            <span aria-hidden>·</span>
            <Link
              to={`/contactos/${contrato.contacto_id}`}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              {contrato.contacto_nombre ?? "Contacto"}
            </Link>
            <span aria-hidden>·</span>
            <Link
              to={`/pipeline/${contrato.oportunidad_id}`}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Oportunidad
            </Link>
          </>
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setEditando(true)}>
              Editar
            </Button>
            {supervisa ? (
              <Button
                type="button"
                variant="outline"
                disabled={cambiandoEstado}
                onClick={() => void cambiarEstado()}
              >
                {contrato.activo ? "Desactivar" : "Reactivar"}
              </Button>
            ) : null}
            {contrato.activo ? (
              <Button type="button" onClick={() => setRenovando(true)}>
                Renovar
              </Button>
            ) : null}
          </div>
        }
      />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            title="Subtotal mensual"
            value={formatMoney(contrato.monto_mensual_total)}
            hint="Sin IVA"
            icon={Repeat}
            tone="bg-primary/15 text-primary"
          />
          <KpiCard
            title="Vigencia"
            value={formatDateOnly(contrato.fecha_fin)}
            hint={`Desde el ${formatDateOnly(contrato.fecha_inicio)}`}
            icon={CalendarRange}
            tone="bg-highlight/15 text-highlight"
          />
          <KpiCard
            title="Renovación"
            value={
              contrato.vigencia === "por_iniciar"
                ? "Por iniciar"
                : textoDiasParaVencer(contrato.dias_para_vencer)
            }
            icon={CalendarClock}
            tone={
              contrato.vigencia === "vencido"
                ? "bg-destructive/15 text-destructive"
                : contrato.vigencia === "por_renovar"
                  ? "bg-warning/15 text-warning"
                  : "bg-success/15 text-success"
            }
          />
        </div>

        <section className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-section">Líneas</h2>
              <p className="mt-1 text-kicker">Lo que entra en la cotización de cada mes.</p>
            </div>
            {contrato.activo ? (
              <Button type="button" size="sm" variant="outline" onClick={() => setEditandoLineas(true)}>
                Editar líneas
              </Button>
            ) : null}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Subtotal mensual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contrato.lineas.map((linea) => (
                <TableRow key={linea.id}>
                  <TableCell className="text-ui-medium">
                    {tituloLinea(linea.servicio_id, linea.categoria_servicio_id)}
                  </TableCell>
                  <TableCell className="whitespace-normal text-muted-foreground">
                    {linea.descripcion}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(linea.monto_mensual)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-section">Meses</h2>
            <p className="mt-1 text-kicker">Una cotización por mes, creada con «Generar mes». Nace en «Por facturar».</p>
          </div>
          {periodos.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Todavía sin meses generados"
              body="Cuando se genere el primer mes de vigencia, su cotización aparece acá."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Cotización</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead>Factura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodos.map((periodo) => (
                  <TableRow
                    key={periodo.cotizacion_id}
                    className="cursor-pointer"
                    onClick={() => navigate(rutaConstructorCotizacion(periodo.cotizacion_id))}
                  >
                    <TableCell className="text-ui-medium first-letter:uppercase">
                      {formatPeriodo(periodo.periodo, true)}
                    </TableCell>
                    <TableCell className="text-ui">{periodo.numero}</TableCell>
                    <TableCell>
                      <CotizacionEstadoBadge estado={periodo.estado} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatMoney(periodo.subtotal)}</TableCell>
                    <TableCell>
                      {periodo.numero_factura ? (
                        <span className="text-ui tabular-nums">{periodo.numero_factura}</span>
                      ) : periodo.estado === "aprobada" || periodo.estado === "por_facturar" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation()
                            setFacturando(periodo)
                          }}
                        >
                          Marcar facturada
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        {contrato.notas ? (
          <section className="space-y-2">
            <h2 className="text-section">Notas</h2>
            <p className="whitespace-pre-line text-ui text-muted-foreground">{contrato.notas}</p>
          </section>
        ) : null}
      </div>

      <ContratoEditarDialog
        contrato={editando ? contrato : null}
        onCancel={() => setEditando(false)}
        onGuardado={(next) => {
          setEditando(false)
          setContrato(next)
        }}
      />
      <ContratoLineasDialog
        contrato={editandoLineas ? contrato : null}
        servicios={servicios}
        categorias={categorias}
        onCancel={() => setEditandoLineas(false)}
        onGuardado={(next) => {
          setEditandoLineas(false)
          setContrato(next)
        }}
      />
      <ContratoRenovarDialog
        contrato={renovando ? contrato : null}
        servicios={servicios}
        categorias={categorias}
        onCancel={() => setRenovando(false)}
        onRenovado={(next) => {
          setRenovando(false)
          setContrato(next)
        }}
      />
      <MarcarFacturadaDialog
        open={facturando != null}
        cotizacionNumero={facturando?.numero ?? null}
        enviando={enviandoFactura}
        onConfirm={(numero) => void confirmarFacturada(numero)}
        onCancel={() => setFacturando(null)}
      />
    </>
  )
}
