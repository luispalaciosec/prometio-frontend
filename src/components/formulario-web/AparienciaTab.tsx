import { ExternalLink } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

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
import { getOrganizacion, updateOrganizacion } from "@/lib/api/organizacion"
import { formularioDemoUrl } from "@/lib/formulario-web-urls"
import type { Organizacion, TipografiaFormulario } from "@/types/organizacion"

const TIPOGRAFIA_LABELS: Record<TipografiaFormulario, string> = {
  sistema: "Sistema (sans-serif del navegador)",
  inter: "Inter",
  poppins: "Poppins",
}

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

export function AparienciaTab() {
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [textoBoton, setTextoBoton] = useState("")
  const [textoExito, setTextoExito] = useState("")
  const [redirectUrl, setRedirectUrl] = useState("")
  const [radioBordes, setRadioBordes] = useState("8")
  const [tipografia, setTipografia] = useState<TipografiaFormulario>("sistema")

  function aplicar(org: Organizacion) {
    setTitulo(org.formulario_titulo ?? "")
    setTextoBoton(org.formulario_texto_boton)
    setTextoExito(org.formulario_texto_exito)
    setRedirectUrl(org.formulario_redirect_url ?? "")
    setRadioBordes(String(org.formulario_radio_bordes_px))
    setTipografia(org.formulario_tipografia)
  }

  useEffect(() => {
    void getOrganizacion()
      .then(aplicar)
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar la apariencia.")
      })
      .finally(() => setCargando(false))
  }, [])

  async function guardar() {
    const boton = textoBoton.trim()
    const exito = textoExito.trim()
    const radio = Number(radioBordes)
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
    if (redirect && !esUrlValida(redirect)) {
      toast.error("La URL de redirección debe ser http:// o https://.")
      return
    }

    setGuardando(true)
    try {
      const org = await updateOrganizacion({
        formulario_titulo: vacio(titulo),
        formulario_texto_boton: boton,
        formulario_texto_exito: exito,
        formulario_redirect_url: vacio(redirect),
        formulario_radio_bordes_px: radio,
        formulario_tipografia: tipografia,
      })
      aplicar(org)
      toast.success("Apariencia del formulario actualizada.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <DetailSkeleton />
  }

  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-3">
        <h2 className="text-section">Marca visual</h2>
        <p className="text-kicker">
          Logo y colores los define{" "}
          <Link to="/configuracion/marca" className="text-ui-medium underline-offset-4 hover:underline">
            Marca
          </Link>
          . El widget los consume vía{" "}
          <span className="font-mono text-micro">GET /formulario/marca</span>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-section">Textos</h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="form-titulo">Título (opcional)</Label>
            <Input
              id="form-titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Ej. Solicitá una cotización"
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
        <h2 className="text-section">Estilo</h2>
        <div className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="form-tipografia">Tipografía</Label>
            <Select value={tipografia} onValueChange={(value) => setTipografia(value as TipografiaFormulario)}>
              <SelectTrigger id="form-tipografia" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TIPOGRAFIA_LABELS) as TipografiaFormulario[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {TIPOGRAFIA_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-section">Post-envío</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="form-redirect">URL de redirección (opcional)</Label>
          <Input
            id="form-redirect"
            value={redirectUrl}
            onChange={(event) => setRedirectUrl(event.target.value)}
            placeholder="https://tusitio.com/gracias"
          />
          <p className="text-kicker text-muted-foreground">
            Si está configurada, el widget redirige ~400 ms después del mensaje de éxito.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={guardando} onClick={() => void guardar()}>
          {guardando ? "Guardando…" : "Guardar"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <a href={formularioDemoUrl()} target="_blank" rel="noreferrer">
            Ver en demo
            <ExternalLink className="ml-2 size-4" strokeWidth={1.75} />
          </a>
        </Button>
      </div>
    </div>
  )
}
