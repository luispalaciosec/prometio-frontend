import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { TableSkeleton, TilesSkeleton } from "@/components/skeleton"
import { ContactoAltaDialog } from "@/components/contactos/ContactoAltaDialog"
import { ContactoCard } from "@/components/contactos/ContactoCard"
import { EtapaCicloBadge } from "@/components/contactos/EtapaCicloBadge"
import { EntityAvatar } from "@/components/entity-avatar"
import { LinkedInLink } from "@/components/linkedin-link"
import { PageHeader } from "@/components/page-header"
import { VistaToggle } from "@/components/vista-toggle"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createContacto, listContactos, listEmpresasParaContacto } from "@/lib/api/contacto"
import {
  guardarVistaLocal,
  leerVistaLocal,
  VISTA_LISTA_CUADRICULA,
  type VistaListaCuadricula,
} from "@/lib/vista-preferida"
import { useAuthStore } from "@/store/auth-store"
import { Users } from "lucide-react"
import {
  ETAPAS_CICLO_VIDA,
  ETAPA_CICLO_LABELS,
  type Contacto,
  type ContactoCreate,
  type EtapaCicloVida,
} from "@/types/contacto"

const VISTA_KEY = "prometio-contactos-vista"

export function ContactosPage() {
  const navigate = useNavigate()
  const perfil = useAuthStore((state) => state.perfil)
  const esAdmin = perfil?.equipo === "administrativo"
  const [rows, setRows] = useState<Contacto[] | null>(null)
  const [empresas, setEmpresas] = useState<{ id: string; nombre: string }[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [qDebounced, setQDebounced] = useState("")
  const [etapa, setEtapa] = useState<EtapaCicloVida | null>(null)
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const [vista, setVista] = useState<VistaListaCuadricula>(() =>
    leerVistaLocal(VISTA_KEY, VISTA_LISTA_CUADRICULA, "lista"),
  )
  const [altaOpen, setAltaOpen] = useState(false)
  const [enviando, setEnviando] = useState(false)

  function cambiarVista(next: VistaListaCuadricula) {
    setVista(next)
    guardarVistaLocal(VISTA_KEY, next)
  }

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(busqueda), 300)
    return () => window.clearTimeout(t)
  }, [busqueda])

  useEffect(() => {
    void listEmpresasParaContacto()
      .then(setEmpresas)
      .catch(() => setEmpresas([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await listContactos({
          q: qDebounced,
          etapa_ciclo_vida: etapa ?? undefined,
          incluir_inactivos: esAdmin && incluirInactivos,
        })
        if (!cancelled) {
          setRows(data)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "No se pudieron cargar los contactos.")
          setRows([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [qDebounced, etapa, esAdmin, incluirInactivos])

  const empresaNombre = new Map(empresas.map((row) => [row.id, row.nombre]))

  async function crear(input: ContactoCreate) {
    setEnviando(true)
    try {
      const created = await createContacto(input)
      setAltaOpen(false)
      toast.success("Contacto creado.")
      navigate(`/contactos/${created.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Contactos"
        action={
          <Button type="button" onClick={() => setAltaOpen(true)}>
            Nuevo contacto
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex min-w-56 flex-1 flex-col gap-2">
          <Label htmlFor="contacto-busqueda">Buscar</Label>
          <Input
            id="contacto-busqueda"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Nombre, email o teléfono"
          />
        </div>
        <div className="flex min-w-44 flex-col gap-2">
          <Label htmlFor="contacto-etapa">Etapa</Label>
          <Select
            value={etapa ?? "all"}
            onValueChange={(value) => setEtapa(value === "all" ? null : (value as EtapaCicloVida))}
          >
            <SelectTrigger id="contacto-etapa" className="w-44">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {ETAPAS_CICLO_VIDA.map((codigo) => (
                <SelectItem key={codigo} value={codigo}>
                  {ETAPA_CICLO_LABELS[codigo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {esAdmin ? (
          <label className="flex items-center gap-2 pb-2 text-ui">
            <Checkbox
              checked={incluirInactivos}
              onCheckedChange={(value) => setIncluirInactivos(value === true)}
            />
            Mostrar inactivos
          </label>
        ) : null}
        <VistaToggle
          value={vista}
          onChange={cambiarVista}
          opciones={[
            { value: "lista", label: "Lista" },
            { value: "cuadricula", label: "Cuadrícula" },
          ]}
        />
      </div>
      {rows == null ? (
        vista === "cuadricula" ? (
          <TilesSkeleton count={6} className="lg:grid-cols-3" />
        ) : (
          <TableSkeleton />
        )
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={qDebounced || etapa || incluirInactivos ? "Nada coincide" : "Sin contactos"}
          body={
            qDebounced || etapa || incluirInactivos
              ? "Ningún contacto pasa esos filtros. Probá limpiar búsqueda o etapa."
              : "Creá el primero para que el CRM deje de estar vacío."
          }
          action={
            !qDebounced && !etapa ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setAltaOpen(true)}>
                Nuevo contacto
              </Button>
            ) : null
          }
        />
      ) : vista === "cuadricula" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <ContactoCard
              key={row.id}
              contacto={row}
              empresaNombre={row.empresa_id ? (empresaNombre.get(row.empresa_id) ?? null) : null}
              onOpen={() => navigate(`/contactos/${row.id}`)}
            />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Etapa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => navigate(`/contactos/${row.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <EntityAvatar
                      name={row.nombre_completo}
                      seed={row.id}
                      size="sm"
                      src={row.foto_url}
                    />
                    <span className="text-ui-medium">{row.nombre_completo}</span>
                    <LinkedInLink href={row.linkedin_url} compact />
                    {!row.activo ? (
                      <span className="text-kicker">inactivo</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.email_trabajo ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{row.telefono_movil ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.empresa_id ? (empresaNombre.get(row.empresa_id) ?? "—") : "—"}
                </TableCell>
                <TableCell>
                  <EtapaCicloBadge etapa={row.etapa_ciclo_vida} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ContactoAltaDialog
        open={altaOpen}
        enviando={enviando}
        empresas={empresas}
        onConfirm={(input) => void crear(input)}
        onCancel={() => setAltaOpen(false)}
      />
    </>
  )
}
