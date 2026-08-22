import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  desactivarContacto,
  getContacto,
  listEmpresasParaContacto,
  reactivarContacto,
  updateContacto,
} from "@/lib/api/contacto"
import { useAuthStore } from "@/store/auth-store"
import {
  ETAPAS_CICLO_VIDA,
  ETAPA_CICLO_LABELS,
  type Contacto,
  type EtapaCicloVida,
} from "@/types/contacto"

export function ContactoPage() {
  const { id } = useParams()
  const perfil = useAuthStore((state) => state.perfil)
  const esAdmin = perfil?.equipo === "administrativo"
  const [contacto, setContacto] = useState<Contacto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [empresas, setEmpresas] = useState<{ id: string; nombre: string }[]>([])
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [producto, setProducto] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [provincia, setProvincia] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [etapa, setEtapa] = useState<EtapaCicloVida>("contacto")
  const [elegible, setElegible] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  async function reload(contactoId: string) {
    setContacto(null)
    setError(null)
    try {
      const row = await getContacto(contactoId)
      aplicar(row)
    } catch (err) {
      setContacto(null)
      setError(err instanceof Error ? err.message : "No se pudo cargar el contacto.")
    }
  }

  function aplicar(row: Contacto) {
    setContacto(row)
    setNombre(row.nombre_completo)
    setEmail(row.email_trabajo ?? "")
    setTelefono(row.telefono_movil ?? "")
    setEmpresaId(row.empresa_id ?? "")
    setProducto(row.producto_interes ?? "")
    setCiudad(row.ciudad ?? "")
    setProvincia(row.provincia ?? "")
    setLinkedin(row.linkedin_url ?? "")
    setEtapa(row.etapa_ciclo_vida)
    setElegible(row.elegible_marketing)
    setError(null)
  }

  useEffect(() => {
    void listEmpresasParaContacto()
      .then(setEmpresas)
      .catch(() => setEmpresas([]))
  }, [])

  useEffect(() => {
    if (!id) {
      return
    }
    void reload(id)
  }, [id])

  async function guardar() {
    if (!id) {
      return
    }
    setGuardando(true)
    try {
      const row = await updateContacto(id, {
        nombre_completo: nombre,
        email_trabajo: email,
        telefono_movil: telefono,
        empresa_id: empresaId,
        producto_interes: producto,
        ciudad,
        provincia,
        linkedin_url: linkedin,
        etapa_ciclo_vida: etapa,
        elegible_marketing: elegible,
      })
      aplicar(row)
      toast.success("Contacto actualizado.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar.")
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarEtapa(next: EtapaCicloVida) {
    if (!id) {
      return
    }
    setEtapa(next)
    try {
      const row = await updateContacto(id, { etapa_ciclo_vida: next })
      aplicar(row)
      toast.success("Etapa actualizada.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar la etapa.")
      if (id) {
        await reload(id)
      }
    }
  }

  async function toggleActivo() {
    if (!id || !contacto) {
      return
    }
    setCambiandoEstado(true)
    try {
      const row = contacto.activo ? await desactivarContacto(id) : await reactivarContacto(id)
      aplicar(row)
      toast.success(row.activo ? "Contacto reactivado." : "Contacto desactivado.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo cambiar el estado.")
    } finally {
      setCambiandoEstado(false)
    }
  }

  if (error) {
    return (
      <div className="max-w-md space-y-3">
        <h1 className="font-heading text-2xl tracking-tight">No se pudo cargar</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button asChild variant="outline">
          <Link to="/contactos">Volver a contactos</Link>
        </Button>
      </div>
    )
  }

  if (!contacto) {
    return <p className="text-sm text-muted-foreground">Cargando contacto…</p>
  }

  return (
    <>
      <PageHeader
        title={contacto.nombre_completo}
        description={!contacto.activo ? "Inactivo" : undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={etapa} onValueChange={(value) => void cambiarEtapa(value as EtapaCicloVida)}>
              <SelectTrigger className="w-40" aria-label="Etapa del ciclo de vida">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ETAPAS_CICLO_VIDA.map((codigo) => (
                  <SelectItem key={codigo} value={codigo}>
                    {ETAPA_CICLO_LABELS[codigo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {esAdmin ? (
              <Button
                type="button"
                variant="outline"
                disabled={cambiandoEstado}
                onClick={() => void toggleActivo()}
              >
                {contacto.activo ? "Desactivar" : "Reactivar"}
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/contactos">Volver</Link>
            </Button>
          </div>
        }
      />
      <section className="mb-10 space-y-4">
        <h2 className="font-heading text-base tracking-tight">Datos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="det-nombre">Nombre completo</Label>
            <Input id="det-nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="det-email">Email de trabajo</Label>
            <Input
              id="det-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="det-tel">Teléfono móvil</Label>
            <Input id="det-tel" value={telefono} onChange={(event) => setTelefono(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="det-empresa">Empresa</Label>
            <Select
              value={empresaId || "none"}
              onValueChange={(value) => setEmpresaId(value === "none" ? "" : value)}
            >
              <SelectTrigger id="det-empresa">
                <SelectValue placeholder="Sin empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin empresa</SelectItem>
                {empresas.map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="det-prod">Producto de interés</Label>
            <Input
              id="det-prod"
              value={producto}
              onChange={(event) => setProducto(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="det-ciudad">Ciudad</Label>
            <Input id="det-ciudad" value={ciudad} onChange={(event) => setCiudad(event.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="det-prov">Provincia</Label>
            <Input
              id="det-prov"
              value={provincia}
              onChange={(event) => setProvincia(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="det-li">LinkedIn</Label>
            <Input id="det-li" value={linkedin} onChange={(event) => setLinkedin(event.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <Checkbox checked={elegible} onCheckedChange={(value) => setElegible(value === true)} />
            Elegible para marketing
          </label>
        </div>
        <Button type="button" disabled={guardando || nombre.trim() === ""} onClick={() => void guardar()}>
          Guardar
        </Button>
      </section>
      {contacto.fuente || contacto.utm_source ? (
        <section className="space-y-3">
          <h2 className="font-heading text-base tracking-tight">Origen</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Fuente" value={contacto.fuente} />
            <Field label="utm_source" value={contacto.utm_source} />
            <Field label="utm_medium" value={contacto.utm_medium} />
            <Field label="utm_campaign" value={contacto.utm_campaign} />
          </dl>
        </section>
      ) : null}
    </>
  )
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || "—"}</dd>
    </div>
  )
}
