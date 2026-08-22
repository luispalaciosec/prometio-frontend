import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { ContactoAltaDialog } from "@/components/contactos/ContactoAltaDialog"
import { EtapaCicloBadge } from "@/components/contactos/EtapaCicloBadge"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createContacto, listContactos, listEmpresasParaContacto } from "@/lib/api/contacto"
import { useAuthStore } from "@/store/auth-store"
import {
  ETAPAS_CICLO_VIDA,
  ETAPA_CICLO_LABELS,
  type Contacto,
  type ContactoCreate,
  type EtapaCicloVida,
} from "@/types/contacto"

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
  const [altaOpen, setAltaOpen] = useState(false)
  const [enviando, setEnviando] = useState(false)

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
      <div className="mb-4 flex flex-wrap items-end gap-4">
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
          <label className="flex items-center gap-2 pb-2 text-sm">
            <Checkbox
              checked={incluirInactivos}
              onCheckedChange={(value) => setIncluirInactivos(value === true)}
            />
            Mostrar inactivos
          </label>
        ) : null}
      </div>
      {rows == null ? (
        <p className="text-sm text-muted-foreground">Cargando contactos…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay contactos con esos filtros.</p>
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
                <TableCell className="font-medium">
                  {row.nombre_completo}
                  {!row.activo ? (
                    <span className="ml-2 text-xs text-muted-foreground">inactivo</span>
                  ) : null}
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
