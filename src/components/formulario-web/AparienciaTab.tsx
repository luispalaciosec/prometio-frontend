import { ExternalLink } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { BrandSurface } from "@/components/brand-surface"
import { DetailSkeleton } from "@/components/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  TEMA_FORMULARIO_LABELS,
  TIPOGRAFIA_FORMULARIO_LABELS,
  fontFamilyFormulario,
} from "@/lib/formulario-apariencia"
import { getOrganizacion, updateOrganizacion } from "@/lib/api/organizacion"
import { applyOrganizationBrandTheme } from "@/lib/theme"
import { formularioDemoUrl } from "@/lib/formulario-web-urls"
import { cn } from "@/lib/utils"
import type { Organizacion, TemaFormulario, TipografiaFormulario } from "@/types/organizacion"

function vacio(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function esUrlValida(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function VistaPreviaWidget({
  org,
  titulo,
  subtitulo,
  textoBoton,
  radioBordes,
  tipografia,
  tema,
}: {
  org: Organizacion
  titulo: string
  subtitulo: string
  textoBoton: string
  radioBordes: number
  tipografia: TipografiaFormulario
  tema: TemaFormulario
}) {
  const font = fontFamilyFormulario(tipografia)
  const oscuro = tema === "oscuro"
  const fondoCard =
    oscuro && org.color_cuaternario ? org.color_cuaternario : oscuro ? "#0a0a0a" : undefined

  return (
    <div
      className={cn(
        "rounded-xl p-4",
        oscuro ? "bg-[#050505]" : "bg-muted/50",
      )}
    >
      <p className="mb-3 text-micro text-muted-foreground">
        Vista previa — {TEMA_FORMULARIO_LABELS[tema].split("—")[0]?.trim()}
      </p>
      <BrandSurface
        className={cn(
          "mx-auto w-full space-y-3 border p-5 shadow-raised",
          oscuro ? "border-zinc-700 text-zinc-100" : "surface-card",
        )}
        style={{
          maxWidth: `${Math.min(48, Math.max(16, org.formulario_ancho_max_rem ?? 26))}rem`,
          borderRadius: `${radioBordes}px`,
          fontFamily: font,
          ...(fondoCard ? { backgroundColor: fondoCard } : {}),
        }}
      >
        {titulo.trim() ? (
          <p
            className="text-section font-semibold tracking-tight"
            style={{ color: org.color_terciario ?? org.color_primario ?? undefined }}
          >
            {titulo.trim()}
          </p>
        ) : null}
        {subtitulo.trim() ? (
          <p className={cn("text-kicker", oscuro ? "text-zinc-400" : "text-muted-foreground")}>
            {subtitulo.trim()}
          </p>
        ) : null}
        <div className="space-y-2">
          <Label className={cn("text-kicker", oscuro && "text-zinc-200")}>Nombre completo</Label>
          <Input
            disabled
            placeholder="María López"
            className={cn(
              "h-9",
              oscuro && "border-zinc-600 bg-black text-zinc-100 placeholder:text-zinc-500",
            )}
            style={{ borderRadius: `${radioBordes}px` }}
          />
        </div>
        <Button
          type="button"
          disabled={!textoBoton.trim()}
          className="h-9 w-full"
          style={{ borderRadius: `${radioBordes}px` }}
        >
          {textoBoton.trim() || "Enviar"}
        </Button>
      </BrandSurface>
    </div>
  )
}

export function AparienciaTab() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [org, setOrg] = useState<Organizacion | null>(null)
  const [titulo, setTitulo] = useState("")
  const [subtitulo, setSubtitulo] = useState("")
  const [textoBoton, setTextoBoton] = useState("")
  const [textoExito, setTextoExito] = useState("")
  const [redirectUrl, setRedirectUrl] = useState("")
  const [radioBordes, setRadioBordes] = useState("8")
  const [anchoMax, setAnchoMax] = useState("26")
  const [tipografia, setTipografia] = useState<TipografiaFormulario>("sistema")
  const [tema, setTema] = useState<TemaFormulario>("claro")

  function aplicar(next: Organizacion) {
    setOrg(next)
    setTitulo(next.formulario_titulo ?? "")
    setSubtitulo(next.formulario_subtitulo ?? "")
    setTextoBoton(next.formulario_texto_boton)
    setTextoExito(next.formulario_texto_exito)
    setRedirectUrl(next.formulario_redirect_url ?? "")
    setRadioBordes(String(next.formulario_radio_bordes_px))
    setAnchoMax(String(next.formulario_ancho_max_rem ?? 26))
    setTipografia(next.formulario_tipografia)
    setTema(next.formulario_tema ?? "claro")
    applyOrganizationBrandTheme({
      primary: next.color_primario ?? undefined,
      secondary: next.color_secundario ?? undefined,
      tertiary: next.color_terciario ?? undefined,
      quaternary: next.color_cuaternario ?? undefined,
    })
  }

  useEffect(() => {
    void getOrganizacion()
      .then(aplicar)
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar el look & feel.")
      })
      .finally(() => setCargando(false))
  }, [])

  const radioNum = useMemo(() => {
    const n = Number(radioBordes)
    return Number.isFinite(n) ? Math.min(32, Math.max(0, n)) : 8
  }, [radioBordes])

  async function guardar() {
    const boton = textoBoton.trim()
    const exito = textoExito.trim()
    const radio = Number(radioBordes)
    const ancho = Number(anchoMax)
    const redirect = redirectUrl.trim()

    if (!boton) {
      toast.error("El texto del botón es obligatorio.")
      return
    }
    if (!exito) {
      toast.error("El mensaje de éxito es obligatorio.")
      return
    }
    if (!Number.isFinite(radio) || radio < 0 || radio > 32) {
      toast.error("El radio de bordes debe estar entre 0 y 32 px.")
      return
    }
    if (!Number.isFinite(ancho) || ancho < 16 || ancho > 48) {
      toast.error("El ancho máximo debe estar entre 16 y 48 rem.")
      return
    }
    if (redirect && !esUrlValida(redirect)) {
      toast.error("La URL de redirección debe ser http:// o https://.")
      return
    }

    setGuardando(true)
    try {
      const actualizada = await updateOrganizacion({
        formulario_titulo: vacio(titulo),
        formulario_subtitulo: vacio(subtitulo),
        formulario_texto_boton: boton,
        formulario_texto_exito: exito,
        formulario_redirect_url: vacio(redirect),
        formulario_radio_bordes_px: radio,
        formulario_ancho_max_rem: ancho,
        formulario_tipografia: tipografia,
        formulario_tema: tema,
      })
      aplicar(actualizada)
      toast.success("Look & feel del formulario guardado.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  if (cargando || !org) {
    return <DetailSkeleton />
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
      <div className="max-w-2xl space-y-8">
        <section className="space-y-3">
          <h2 className="text-section">Look & feel</h2>
          <p className="text-kicker text-muted-foreground">
            Colores y logos en{" "}
            <Link to="/configuracion/marca" className="text-ui-medium underline-offset-4 hover:underline">
              Marca
            </Link>
            . Acá definís tema, tipografía, textos y medidas del widget embebido (
            <span className="font-mono text-micro">GET /formulario/marca</span>).
          </p>
        </section>

        <section className="space-y-4">
          <h3 className="text-section">Tema del widget</h3>
          <div className="flex flex-col gap-2">
            <Label htmlFor="form-tema">Presentación</Label>
            <Select value={tema} onValueChange={(value) => setTema(value as TemaFormulario)}>
              <SelectTrigger id="form-tema" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TEMA_FORMULARIO_LABELS) as TemaFormulario[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {TEMA_FORMULARIO_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-kicker text-muted-foreground">
              Usá tema oscuro en landings como Conversemos o Postula: fondo dark, inputs negros y acentos en
              cyan de marca. El snippet puede forzar con{" "}
              <span className="font-mono text-micro">tema="oscuro"</span>.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-section">Textos</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="form-titulo">Título (opcional)</Label>
              <Input
                id="form-titulo"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="Ej. Postula aquí · Conversemos"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="form-subtitulo">Subtítulo (opcional)</Label>
              <Textarea
                id="form-subtitulo"
                rows={2}
                value={subtitulo}
                onChange={(event) => setSubtitulo(event.target.value)}
                placeholder="Ej. Los campos con * son obligatorios."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="form-boton">Texto del botón</Label>
              <Input
                id="form-boton"
                value={textoBoton}
                onChange={(event) => setTextoBoton(event.target.value)}
                placeholder="Enviar"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="form-exito">Mensaje de éxito</Label>
              <Input
                id="form-exito"
                value={textoExito}
                onChange={(event) => setTextoExito(event.target.value)}
                placeholder="¡Gracias! Te contactaremos pronto."
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-section">Tipografía y forma</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="form-tipografia">Tipografía</Label>
              <Select
                value={tipografia}
                onValueChange={(value) => setTipografia(value as TipografiaFormulario)}
              >
                <SelectTrigger id="form-tipografia" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPOGRAFIA_FORMULARIO_LABELS) as TipografiaFormulario[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {TIPOGRAFIA_FORMULARIO_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="form-radio">Radio de bordes (px)</Label>
              <Input
                id="form-radio"
                type="number"
                min={0}
                max={32}
                value={radioBordes}
                onChange={(event) => setRadioBordes(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="form-ancho">Ancho máximo (rem)</Label>
              <Input
                id="form-ancho"
                type="number"
                min={16}
                max={48}
                value={anchoMax}
                onChange={(event) => setAnchoMax(event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-section">Post-envío</h3>
          <div className="flex flex-col gap-2">
            <Label htmlFor="form-redirect">URL de redirección (opcional)</Label>
            <Input
              id="form-redirect"
              value={redirectUrl}
              onChange={(event) => setRedirectUrl(event.target.value)}
              placeholder="https://tusitio.com/gracias"
            />
            <p className="text-kicker text-muted-foreground">
              Tras el mensaje de éxito, redirige ~400 ms si está configurada.
            </p>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" disabled={guardando} onClick={() => void guardar()}>
            {guardando ? "Guardando…" : "Guardar look & feel"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <a href={formularioDemoUrl()} target="_blank" rel="noreferrer">
              Ver en demo
              <ExternalLink className="ml-2 size-4" strokeWidth={1.75} />
            </a>
          </Button>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4">
        <h3 className="text-section">Vista previa en vivo</h3>
        <VistaPreviaWidget
          org={org}
          titulo={titulo}
          subtitulo={subtitulo}
          textoBoton={textoBoton}
          radioBordes={radioNum}
          tipografia={tipografia}
          tema={tema}
        />
        <p className="text-kicker text-muted-foreground">
          Los colores del botón y acentos vienen de Marca → primario y terciario. En tema oscuro, el fondo
          usa el color cuaternario si está definido.
        </p>
      </aside>
    </div>
  )
}
