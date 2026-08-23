import { useCallback, useEffect, useState } from "react"
import { Gauge, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton, TilesSkeleton } from "@/components/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getSeoCrawl,
  iniciarSeoCrawl,
  listSeoCoreWebVitals,
  listSeoCrawls,
  medirSeoCoreWebVitals,
} from "@/lib/api/seo"
import { formatDateTime } from "@/lib/datetime-local"
import {
  agruparCwvPorFuente,
  CWV_UMBRAL_CLASE,
  formatoCls,
  formatoMs,
  formatoMsComoSegundos,
  fuenteTieneDatos,
  umbralCls,
  umbralInp,
  umbralLcp,
  type CwvUmbral,
} from "@/lib/seo-metricas"
import { cn } from "@/lib/utils"
import type { SeoCoreWebVitals, SeoCrawl, SeoCrawlListItem, SeoPagina } from "@/types/seo"
import {
  SEO_CRAWL_ESTADO_LABELS,
  SEO_ESTRATEGIA_LABELS,
  SEO_FUENTE_LABELS,
} from "@/types/seo"

const POLL_MS = 3000

const ESTADO_BADGE: Record<SeoCrawl["estado"], "warning" | "success" | "destructive"> = {
  corriendo: "warning",
  completado: "success",
  fallido: "destructive",
}

function umbralClase(umbral: CwvUmbral) {
  return cn("text-ui-medium tabular-nums", CWV_UMBRAL_CLASE[umbral])
}

function hallazgoPagina(pagina: SeoPagina): string[] {
  const tags: string[] = []
  if (pagina.status_code == null || (pagina.status_code ?? 0) >= 400) {
    tags.push(pagina.error ? "error" : "HTTP")
  }
  if (!pagina.title) tags.push("sin title")
  if (!pagina.meta_description) tags.push("sin meta")
  if ((pagina.h1_count ?? 0) === 0) tags.push("sin H1")
  if (pagina.robots_noindex) tags.push("noindex")
  const rotos = pagina.enlaces_rotos?.length ?? 0
  if (rotos > 0) tags.push(`${rotos} rotos`)
  return tags
}

function CwvMetrica({
  label,
  valor,
  umbral,
  nota,
}: {
  label: string
  valor: string
  umbral: CwvUmbral
  nota?: string
}) {
  return (
    <div>
      <p className="text-micro">{label}</p>
      <p className={umbralClase(umbral)}>{valor}</p>
      {nota ? <p className="mt-0.5 text-micro">{nota}</p> : null}
    </div>
  )
}

function CwvTarjeta({ row, estrategia }: { row: SeoCoreWebVitals | null; estrategia: "mobile" | "desktop" }) {
  if (!row) {
    return (
      <article className="rounded-xl p-4 ring-1 ring-border">
        <p className="text-ui-medium">{SEO_ESTRATEGIA_LABELS[estrategia]}</p>
        <p className="mt-1 text-kicker">Sin medición en esta fuente.</p>
      </article>
    )
  }

  const lab = row.fuente === "laboratorio"

  return (
    <article className="rounded-xl p-4 ring-1 ring-border">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-ui-medium">{SEO_ESTRATEGIA_LABELS[row.estrategia]}</p>
        <p className="text-micro">{formatDateTime(row.created_at)}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <CwvMetrica label="LCP" valor={formatoMsComoSegundos(row.lcp_ms)} umbral={umbralLcp(row.lcp_ms)} />
        <CwvMetrica
          label="INP"
          valor={formatoMs(row.inp_ms)}
          umbral={umbralInp(row.inp_ms)}
          nota={lab ? "No se simula en laboratorio" : undefined}
        />
        <CwvMetrica label="CLS" valor={formatoCls(row.cls)} umbral={umbralCls(row.cls)} />
      </div>
    </article>
  )
}

export function SeoPage() {
  const [url, setUrl] = useState("")
  const [crawls, setCrawls] = useState<SeoCrawlListItem[]>([])
  const [crawl, setCrawl] = useState<SeoCrawl | null>(null)
  const [cwv, setCwv] = useState<SeoCoreWebVitals[]>([])
  const [cargando, setCargando] = useState(true)
  const [corriendoCrawl, setCorriendoCrawl] = useState(false)
  const [midiendoCwv, setMidiendoCwv] = useState(false)

  const cargarDetalle = useCallback(async (id: string) => {
    const detalle = await getSeoCrawl(id)
    setCrawl(detalle)
    return detalle
  }, [])

  const reload = useCallback(async () => {
    const [lista, vitals] = await Promise.all([listSeoCrawls(), listSeoCoreWebVitals()])
    setCrawls(lista)
    setCwv(vitals)
    if (lista[0]) {
      await cargarDetalle(lista[0].id)
    } else {
      setCrawl(null)
    }
  }, [cargarDetalle])

  useEffect(() => {
    let cancelado = false
    async function inicial() {
      setCargando(true)
      try {
        await reload()
      } catch (error) {
        if (!cancelado) {
          toast.error(error instanceof Error ? error.message : "No se pudo cargar SEO.")
        }
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    void inicial()
    return () => {
      cancelado = true
    }
  }, [reload])

  useEffect(() => {
    if (crawl?.estado !== "corriendo") return
    const timer = window.setInterval(() => {
      void cargarDetalle(crawl.id)
        .then((detalle) => {
          if (detalle.estado === "completado") {
            toast.success("Crawl completado.")
            void listSeoCrawls().then(setCrawls)
          } else if (detalle.estado === "fallido") {
            toast.error(detalle.error ?? "El crawl falló.")
            void listSeoCrawls().then(setCrawls)
          }
        })
        .catch((error: unknown) => {
          toast.error(error instanceof Error ? error.message : "No se pudo actualizar el crawl.")
        })
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [crawl?.id, crawl?.estado, cargarDetalle])

  async function onCrawl() {
    setCorriendoCrawl(true)
    try {
      const iniciado = await iniciarSeoCrawl(url)
      setCrawl(iniciado)
      setCrawls((prev) => [iniciado, ...prev])
      toast.success("Crawl en curso. El resultado no está listo todavía.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo iniciar el crawl.")
    } finally {
      setCorriendoCrawl(false)
    }
  }

  async function onCwv() {
    setMidiendoCwv(true)
    try {
      const filas = await medirSeoCoreWebVitals(url)
      setCwv((prev) => [...filas, ...prev])
      toast.success("Core Web Vitals actualizado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falló PageSpeed Insights.")
    } finally {
      setMidiendoCwv(false)
    }
  }

  const agrupado = agruparCwvPorFuente(cwv)
  const hayCampo = fuenteTieneDatos(agrupado.campo)
  const hayLab = fuenteTieneDatos(agrupado.laboratorio)
  const resumen = crawl?.resumen
  const paginas = crawl?.paginas ?? []
  const crawlEnCurso = corriendoCrawl || crawl?.estado === "corriendo"

  return (
    <>
      <PageHeader
        title="SEO"
        description="Crawl técnico y Core Web Vitals del sitio de la agencia. Campo y laboratorio no se mezclan."
      />

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label htmlFor="seo-url">URL (opcional)</Label>
          <Input
            id="seo-url"
            type="url"
            inputMode="url"
            placeholder="Sitio de la organización"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <p className="text-micro">Vacío = se usa el sitio configurado en la organización.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" disabled={crawlEnCurso} onClick={() => void onCrawl()}>
            {crawlEnCurso ? <Loader2 className="size-4 animate-spin" /> : null}
            {crawlEnCurso ? "Crawl en curso…" : "Correr crawl"}
          </Button>
          <Button type="button" variant="outline" disabled={midiendoCwv} onClick={() => void onCwv()}>
            {midiendoCwv ? <Loader2 className="size-4 animate-spin" /> : null}
            {midiendoCwv ? "Consultando PageSpeed…" : "Medir Core Web Vitals"}
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-section">Crawl</h2>
          {crawl ? (
            <Badge variant={ESTADO_BADGE[crawl.estado]}>{SEO_CRAWL_ESTADO_LABELS[crawl.estado]}</Badge>
          ) : null}
        </div>

        {cargando && !crawl ? (
          <TilesSkeleton count={4} />
        ) : !crawl ? (
          <EmptyState
            icon={Search}
            title="Todavía no hay un crawl"
            body="Corré uno sobre el sitio de la agencia. Corre en segundo plano; esta pantalla se actualiza sola."
          />
        ) : (
          <>
            <p className="text-kicker">
              {crawl.sitio_url}
              {crawl.estado === "corriendo"
                ? " · En segundo plano. El resultado no está listo al disparar el crawl."
                : ` · ${formatDateTime(crawl.completado_en ?? crawl.created_at)}`}
            </p>
            {crawl.estado === "fallido" && crawl.error ? (
              <p className="text-ui text-destructive">{crawl.error}</p>
            ) : null}
            {resumen ? (
              <div className="grid gap-3 sm:grid-cols-4">
                {(
                  [
                    ["Páginas", resumen.total_paginas],
                    ["Con error", resumen.con_error],
                    ["Sin title", resumen.sin_title],
                    ["Sin meta", resumen.sin_meta_description],
                    ["Sin H1", resumen.sin_h1],
                    ["Rotos confirmados", resumen.enlaces_rotos_confirmados],
                    ["Posiblemente bloqueados", resumen.enlaces_posiblemente_bloqueados],
                    ["No verificables", resumen.enlaces_no_verificables],
                  ] as const
                ).map(([label, value]) => (
                  <article key={label} className="rounded-xl p-3 ring-1 ring-border">
                    <p className="text-micro">{label}</p>
                    <p className="mt-1 text-ui-medium tabular-nums">{value}</p>
                  </article>
                ))}
              </div>
            ) : crawl.estado === "corriendo" ? (
              <TilesSkeleton count={4} />
            ) : null}

            {paginas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>status</TableHead>
                    <TableHead>title</TableHead>
                    <TableHead>H1</TableHead>
                    <TableHead>hallazgos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginas.map((pagina) => {
                    const tags = hallazgoPagina(pagina)
                    return (
                      <TableRow key={pagina.url}>
                        <TableCell className="max-w-[280px] truncate font-mono text-micro" title={pagina.url}>
                          {pagina.url}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {pagina.status_code ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={pagina.title ?? undefined}>
                          {pagina.title || "—"}
                        </TableCell>
                        <TableCell className="max-w-[160px] truncate" title={pagina.h1_texto ?? undefined}>
                          {pagina.h1_texto || "—"}
                        </TableCell>
                        <TableCell>
                          {tags.length === 0 ? (
                            <span className="text-kicker">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : crawl.estado === "completado" ? (
              <EmptyState icon={Search} title="Sin páginas" body="El crawl terminó sin páginas para mostrar." />
            ) : null}

            {crawls.length > 1 ? (
              <p className="text-micro">
                {crawls.length} crawls en historial. Se muestra el más reciente.
              </p>
            ) : null}
          </>
        )}
      </section>

      <section className="mt-10 space-y-6">
        <h2 className="text-section">Core Web Vitals</h2>
        {cargando && cwv.length === 0 ? (
          <TableSkeleton rows={4} />
        ) : !hayCampo && !hayLab ? (
          <EmptyState
            icon={Gauge}
            title="Todavía no hay mediciones"
            body="PageSpeed responde en el momento (puede tardar). Si falla, vas a ver el error acá — no se inventa un número."
          />
        ) : (
          <>
            {hayCampo ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-ui-medium">{SEO_FUENTE_LABELS.campo}</h3>
                  <Badge variant="success">campo</Badge>
                </div>
                <p className="text-kicker">
                  Chrome UX Report: usuarios reales, últimos 28 días. No es una simulación.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CwvTarjeta row={agrupado.campo.mobile} estrategia="mobile" />
                  <CwvTarjeta row={agrupado.campo.desktop} estrategia="desktop" />
                </div>
              </div>
            ) : null}
            {hayLab ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-ui-medium">{SEO_FUENTE_LABELS.laboratorio}</h3>
                  <Badge variant="outline">laboratorio</Badge>
                </div>
                <p className="text-kicker">
                  Simulación de Lighthouse. No mide usuarios reales. INP no aplica: es una métrica de
                  interacción, no simulable.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CwvTarjeta row={agrupado.laboratorio.mobile} estrategia="mobile" />
                  <CwvTarjeta row={agrupado.laboratorio.desktop} estrategia="desktop" />
                </div>
              </div>
            ) : null}
          </>
        )}
      </section>
    </>
  )
}
