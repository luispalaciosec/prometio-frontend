import { useEffect, useMemo, useRef, useState } from "react"
import { BarChart3 } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { TableSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api-client"
import {
  ADS_TRACKING_EVENTOS_PAGE_SIZE,
  createAdsTrackingConfig,
  getAdsTrackingConfig,
  getFormularioMeta,
  listAdsTrackingEventos,
  probarGa4Mp,
  probarMetaCapi,
  updateAdsTrackingConfig,
} from "@/lib/api/formulario-config"
import type {
  AdsTrackingEvento,
  OrganizacionAdsConfig,
  PlataformaAdsTracking,
} from "@/types/ads-tracking"
import type { FormularioMeta } from "@/types/formulario-meta"

const PLATAFORMA_LABELS: Record<PlataformaAdsTracking, string> = {
  meta: "Meta",
  ga4: "GA4",
}

function formatoFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) {
    return iso
  }
  return fecha.toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })
}

function vacio(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function EstadoCard({
  titulo,
  descripcion,
  activo,
  activoLabel,
  inactivoLabel,
}: {
  titulo: string
  descripcion: string
  activo: boolean | null
  activoLabel: string
  inactivoLabel: string
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-section">{titulo}</CardTitle>
        <CardDescription className="text-kicker">{descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        {activo == null ? (
          <span className="inline-block h-5 w-28 animate-pulse rounded-full bg-muted" aria-hidden />
        ) : activo ? (
          <Badge variant="success">{activoLabel}</Badge>
        ) : (
          <Badge variant="warning">{inactivoLabel}</Badge>
        )}
      </CardContent>
    </Card>
  )
}

export function MedicionTab() {
  const [meta, setMeta] = useState<FormularioMeta | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)

  const [configExists, setConfigExists] = useState<boolean | null>(null)
  const [metaPixelId, setMetaPixelId] = useState("")
  const [metaAccessToken, setMetaAccessToken] = useState("")
  const [metaAccessTokenConfigurado, setMetaAccessTokenConfigurado] = useState(false)
  const [metaTestEventCode, setMetaTestEventCode] = useState("")
  const [ga4MeasurementId, setGa4MeasurementId] = useState("")
  const [ga4ApiSecret, setGa4ApiSecret] = useState("")
  const [ga4ApiSecretConfigurado, setGa4ApiSecretConfigurado] = useState(false)
  const [cargandoConfig, setCargandoConfig] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [probandoMeta, setProbandoMeta] = useState(false)
  const [probandoGa4, setProbandoGa4] = useState(false)

  const [plataforma, setPlataforma] = useState("")
  const [exitoFiltro, setExitoFiltro] = useState("")
  const [filtrosAplicados, setFiltrosAplicados] = useState({ plataforma: "", exito: "" })
  const [offset, setOffset] = useState(0)
  const [eventos, setEventos] = useState<AdsTrackingEvento[] | null>(null)
  const [totalEventos, setTotalEventos] = useState(0)
  const filterSig = `${filtrosAplicados.plataforma}|${filtrosAplicados.exito}`
  const prevFilterSig = useRef(filterSig)

  function aplicarConfig(row: OrganizacionAdsConfig) {
    setConfigExists(true)
    setMetaPixelId(row.meta_pixel_id ?? "")
    setMetaAccessToken("")
    setMetaAccessTokenConfigurado(row.meta_access_token_configurado)
    setMetaTestEventCode(row.meta_test_event_code ?? "")
    setGa4MeasurementId(row.ga4_measurement_id ?? "")
    setGa4ApiSecret("")
    setGa4ApiSecretConfigurado(row.ga4_api_secret_configurado)
  }

  async function reloadMeta() {
    try {
      setMeta(await getFormularioMeta())
      setMetaError(null)
    } catch (error) {
      setMetaError(error instanceof Error ? error.message : "No se pudo cargar el estado.")
    }
  }

  async function reloadConfig() {
    setCargandoConfig(true)
    try {
      aplicarConfig(await getAdsTrackingConfig())
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setConfigExists(false)
        setMetaPixelId("")
        setMetaAccessToken("")
        setMetaAccessTokenConfigurado(false)
        setMetaTestEventCode("")
        setGa4MeasurementId("")
        setGa4ApiSecret("")
        setGa4ApiSecretConfigurado(false)
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar la configuración.")
      }
    } finally {
      setCargandoConfig(false)
    }
  }

  useEffect(() => {
    void reloadMeta()
    void reloadConfig()
  }, [])

  useEffect(() => {
    const filtrosCambiaron = prevFilterSig.current !== filterSig
    if (filtrosCambiaron) {
      prevFilterSig.current = filterSig
      setOffset(0)
    }
    const fetchOffset = filtrosCambiaron ? 0 : offset

    setEventos(null)
    void listAdsTrackingEventos({
      plataforma:
        filtrosAplicados.plataforma === "meta" || filtrosAplicados.plataforma === "ga4"
          ? filtrosAplicados.plataforma
          : undefined,
      exito:
        filtrosAplicados.exito === "true"
          ? true
          : filtrosAplicados.exito === "false"
            ? false
            : undefined,
      limit: ADS_TRACKING_EVENTOS_PAGE_SIZE,
      offset: fetchOffset,
    })
      .then((data) => {
        setTotalEventos(data.total)
        setEventos(data.resultados)
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar la actividad.")
        setEventos([])
        setTotalEventos(0)
      })
  }, [filterSig, offset])

  const resumenPagina = useMemo(() => {
    const lista = eventos ?? []
    return {
      exitosos: lista.filter((row) => row.exito).length,
      fallidos: lista.filter((row) => !row.exito).length,
    }
  }, [eventos])

  async function guardar() {
    const body: Record<string, string | null> = {
      meta_pixel_id: vacio(metaPixelId),
      meta_test_event_code: vacio(metaTestEventCode),
      ga4_measurement_id: vacio(ga4MeasurementId),
    }
    const token = vacio(metaAccessToken)
    const secret = vacio(ga4ApiSecret)
    if (token) {
      body.meta_access_token = token
    }
    if (secret) {
      body.ga4_api_secret = secret
    }

    setGuardando(true)
    try {
      const row = configExists
        ? await updateAdsTrackingConfig(body)
        : await createAdsTrackingConfig(body)
      aplicarConfig(row)
      setConfigExists(true)
      await reloadMeta()
      toast.success("Configuración de medición actualizada.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  async function probarMeta() {
    setProbandoMeta(true)
    try {
      const resultado = await probarMetaCapi()
      if (resultado.ok) {
        toast.success(resultado.detalle)
      } else {
        toast.error(resultado.detalle)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo probar Meta.")
    } finally {
      setProbandoMeta(false)
    }
  }

  async function probarGa4() {
    setProbandoGa4(true)
    try {
      const resultado = await probarGa4Mp()
      if (resultado.ok) {
        toast.success(resultado.detalle)
      } else {
        const extra =
          resultado.validation_messages.length > 0
            ? ` ${JSON.stringify(resultado.validation_messages).slice(0, 200)}`
            : ""
        toast.error(`${resultado.detalle}${extra}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo probar GA4.")
    } finally {
      setProbandoGa4(false)
    }
  }

  function aplicarFiltrosEventos() {
    setFiltrosAplicados({ plataforma, exito: exitoFiltro })
  }

  const paginaDesde = totalEventos === 0 ? 0 : offset + 1
  const paginaHasta = Math.min(offset + ADS_TRACKING_EVENTOS_PAGE_SIZE, totalEventos)
  const puedeAnterior = offset > 0
  const puedeSiguiente = offset + ADS_TRACKING_EVENTOS_PAGE_SIZE < totalEventos
  const hayFiltrosEventos = Boolean(filtrosAplicados.plataforma || filtrosAplicados.exito)

  const metaTokenPlaceholder = metaAccessTokenConfigurado
    ? "Configurado — dejá vacío para no cambiar"
    : "Pegá el access token de Meta"
  const ga4SecretPlaceholder = ga4ApiSecretConfigurado
    ? "Configurado — dejá vacío para no cambiar"
    : "Pegá el api secret de GA4"

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-section">Estado operativo</h2>
        {metaError ? (
          <p className="text-kicker text-destructive">{metaError}</p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-3">
          <EstadoCard
            titulo="hCaptcha"
            descripcion="Verificación server-side del POST /formulario."
            activo={metaError ? false : meta?.hcaptcha_secret_configurado ?? null}
            activoLabel="Activa"
            inactivoLabel="No configurada — POST rechaza 422"
          />
          <EstadoCard
            titulo="Meta CAPI"
            descripcion="Conversions API — servidor + Pixel navegador con event_id compartido."
            activo={metaError ? false : meta?.meta_configurado ?? null}
            activoLabel="Activa"
            inactivoLabel="Falta pixel o access token"
          />
          <EstadoCard
            titulo="GA4 (servidor)"
            descripcion="Measurement Protocol — generate_lead solo backend."
            activo={metaError ? false : meta?.ga4_configurado ?? null}
            activoLabel="Activa"
            inactivoLabel="Falta measurement ID o api secret"
          />
        </div>
        <div className="max-w-prose space-y-2 text-kicker text-muted-foreground">
          <p>
            <span className="text-ui-medium text-foreground">Meta:</span> el widget dispara{" "}
            <span className="font-mono text-micro">fbq(&apos;track&apos;, &apos;Lead&apos;, …, {"{ eventID }"})</span>{" "}
            tras un envío con <span className="font-mono text-micro">lead_creado: true</span>.
          </p>
          <p>
            <span className="text-ui-medium text-foreground">GA4:</span> el widget{" "}
            <span className="text-ui-medium text-foreground">no</span> dispara{" "}
            <span className="font-mono text-micro">generate_lead</span> — solo lee{" "}
            <span className="font-mono text-micro">client_id</span> y lo manda como{" "}
            <span className="font-mono text-micro">ga_client_id</span> en el POST.
          </p>
        </div>
      </section>

      <section className="max-w-2xl space-y-6">
        <h2 className="text-section">Configuración</h2>
        {cargandoConfig ? (
          <div className="space-y-4">
            <span className="inline-block h-9 w-full animate-pulse rounded-md bg-muted" />
            <span className="inline-block h-9 w-full animate-pulse rounded-md bg-muted" />
          </div>
        ) : (
          <>
            <div className="space-y-4 rounded-xl p-4 ring-1 ring-border">
              <h3 className="text-ui-medium">Meta Conversions API</h3>
              <div className="flex flex-col gap-2">
                <Label htmlFor="meta-pixel">Pixel ID</Label>
                <Input
                  id="meta-pixel"
                  value={metaPixelId}
                  onChange={(event) => setMetaPixelId(event.target.value)}
                  placeholder="1234567890"
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="meta-token">Access token</Label>
                <Input
                  id="meta-token"
                  type="password"
                  autoComplete="off"
                  value={metaAccessToken}
                  onChange={(event) => setMetaAccessToken(event.target.value)}
                  placeholder={metaTokenPlaceholder}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="meta-test">Test event code (opcional)</Label>
                <Input
                  id="meta-test"
                  value={metaTestEventCode}
                  onChange={(event) => setMetaTestEventCode(event.target.value)}
                  placeholder="TEST12345"
                  className="font-mono"
                />
              </div>
              <Button type="button" variant="outline" disabled={probandoMeta} onClick={() => void probarMeta()}>
                {probandoMeta ? "Probando…" : "Probar Meta"}
              </Button>
            </div>

            <div className="space-y-4 rounded-xl p-4 ring-1 ring-border">
              <h3 className="text-ui-medium">Google Analytics 4 (Measurement Protocol)</h3>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ga4-id">Measurement ID</Label>
                <Input
                  id="ga4-id"
                  value={ga4MeasurementId}
                  onChange={(event) => setGa4MeasurementId(event.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ga4-secret">API secret</Label>
                <Input
                  id="ga4-secret"
                  type="password"
                  autoComplete="off"
                  value={ga4ApiSecret}
                  onChange={(event) => setGa4ApiSecret(event.target.value)}
                  placeholder={ga4SecretPlaceholder}
                />
              </div>
              <Button type="button" variant="outline" disabled={probandoGa4} onClick={() => void probarGa4()}>
                {probandoGa4 ? "Probando…" : "Probar GA4"}
              </Button>
            </div>

            <Button type="button" disabled={guardando} onClick={() => void guardar()}>
              {guardando ? "Guardando…" : configExists ? "Guardar" : "Crear configuración"}
            </Button>
          </>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-section">Actividad reciente</h2>
          {eventos != null && totalEventos > 0 ? (
            <p className="text-kicker text-muted-foreground">
              En esta página: {resumenPagina.exitosos} exitosos · {resumenPagina.fallidos} fallidos
            </p>
          ) : null}
        </div>

        <form
          className="filter-bar"
          onSubmit={(event) => {
            event.preventDefault()
            aplicarFiltrosEventos()
          }}
        >
          <div className="filter-field">
            <Label htmlFor="evt-plataforma">Plataforma</Label>
            <Select value={plataforma || "all"} onValueChange={(value) => setPlataforma(value === "all" ? "" : value)}>
              <SelectTrigger id="evt-plataforma" className="h-9">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="meta">Meta</SelectItem>
                <SelectItem value="ga4">GA4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="filter-field">
            <Label htmlFor="evt-exito">Resultado</Label>
            <Select value={exitoFiltro || "all"} onValueChange={(value) => setExitoFiltro(value === "all" ? "" : value)}>
              <SelectTrigger id="evt-exito" className="h-9">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Exitosos</SelectItem>
                <SelectItem value="false">Fallidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="secondary" className="h-9 shrink-0">
            Aplicar
          </Button>
        </form>

        {eventos == null ? (
          <TableSkeleton />
        ) : eventos.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title={hayFiltrosEventos ? "Sin coincidencias" : "Sin eventos de medición"}
            body={
              hayFiltrosEventos
                ? "Ningún evento coincide con los filtros seleccionados."
                : "Aparecen cuando un lead real dispara Meta CAPI o GA4 MP desde el backend."
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-ui">{formatoFecha(row.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{PLATAFORMA_LABELS[row.plataforma]}</Badge>
                    </TableCell>
                    <TableCell className="text-ui-medium">
                      {row.contacto_nombre ? (
                        <Link
                          to={`/contactos/${row.contacto_id}`}
                          className="hover:underline underline-offset-4"
                        >
                          {row.contacto_nombre}
                        </Link>
                      ) : (
                        <span className="font-mono text-micro text-muted-foreground">{row.contacto_id.slice(0, 8)}…</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[8rem] truncate font-mono text-micro" title={row.event_id}>
                      {row.event_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.exito ? "success" : "destructive"}>
                        {row.exito ? "Éxito" : "Error"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-kicker text-muted-foreground" title={row.mensaje_error ?? undefined}>
                      {row.exito ? "—" : row.mensaje_error ?? "Error desconocido"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-kicker text-muted-foreground">
                {totalEventos === 0
                  ? "Sin resultados"
                  : `Mostrando ${paginaDesde}–${paginaHasta} de ${totalEventos}`}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!puedeAnterior}
                  onClick={() => setOffset((actual) => Math.max(0, actual - ADS_TRACKING_EVENTOS_PAGE_SIZE))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!puedeSiguiente}
                  onClick={() => setOffset((actual) => actual + ADS_TRACKING_EVENTOS_PAGE_SIZE)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
