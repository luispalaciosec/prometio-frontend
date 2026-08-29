import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { TableSkeleton, TilesSkeleton } from "@/components/skeleton"
import { EmpresaAltaDialog } from "@/components/empresas/EmpresaAltaDialog"
import { EmpresaCard } from "@/components/empresas/EmpresaCard"
import { EntityAvatar } from "@/components/entity-avatar"
import { LinkedInLink } from "@/components/linkedin-link"
import { PageHeader } from "@/components/page-header"
import { VistaToggle } from "@/components/vista-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { createEmpresa, listEmpresas } from "@/lib/api/empresa"
import { coincideTexto } from "@/lib/lista-filtros"
import {
  guardarVistaLocal,
  leerVistaLocal,
  VISTA_LISTA_CUADRICULA,
  type VistaListaCuadricula,
} from "@/lib/vista-preferida"
import { puedeEnriquecer, type Empresa, type EmpresaCreate } from "@/types/empresa"
import { Building2 } from "lucide-react"

const VISTA_KEY = "prometio-empresas-vista"

export function EmpresasPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Empresa[] | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [vista, setVista] = useState<VistaListaCuadricula>(() =>
    leerVistaLocal(VISTA_KEY, VISTA_LISTA_CUADRICULA, "lista"),
  )
  const [altaOpen, setAltaOpen] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [incluirInactivos, setIncluirInactivos] = useState(false)

  function cambiarVista(next: VistaListaCuadricula) {
    setVista(next)
    guardarVistaLocal(VISTA_KEY, next)
  }

  async function reload() {
    try {
      setRows(await listEmpresas({ incluir_inactivos: incluirInactivos }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las empresas.")
      setRows([])
    }
  }

  useEffect(() => {
    void reload()
  }, [incluirInactivos])

  const filtradas = useMemo(() => {
    if (!rows) {
      return []
    }
    return rows.filter((row) => coincideTexto(busqueda, row.nombre, row.web ?? "", row.ruc ?? ""))
  }, [rows, busqueda])

  async function crear(input: EmpresaCreate) {
    setEnviando(true)
    try {
      const created = await createEmpresa(input)
      setAltaOpen(false)
      toast.success("Empresa creada.")
      navigate(`/empresas/${created.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Empresas"
        action={
          <Button type="button" onClick={() => setAltaOpen(true)}>
            Nueva empresa
          </Button>
        }
      />
      <div className="filter-bar">
        <div className="filter-field sm:min-w-56 sm:max-w-sm sm:flex-1">
          <Label htmlFor="empresa-busqueda">Buscar</Label>
          <Input
            id="empresa-busqueda"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Nombre, web o RUC"
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-ui">
          <Checkbox
            checked={incluirInactivos}
            onCheckedChange={(value) => setIncluirInactivos(value === true)}
          />
          Mostrar inactivas
        </label>
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
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={rows.length === 0 ? "Sin empresas" : "Nada coincide"}
          body={
            rows.length === 0
              ? incluirInactivos
                ? "Ninguna empresa pasa esos filtros."
                : "Todavía no hay empresas. Creá la primera para asociar contactos."
              : "Ninguna empresa pasa esa búsqueda."
          }
          action={
            rows.length === 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setAltaOpen(true)}>
                Nueva empresa
              </Button>
            ) : null
          }
        />
      ) : vista === "cuadricula" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((row) => (
            <EmpresaCard
              key={row.id}
              empresa={row}
              onOpen={() => navigate(`/empresas/${row.id}`)}
            />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Web</TableHead>
              <TableHead>RUC</TableHead>
              <TableHead>Enriquecida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => navigate(`/empresas/${row.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <EntityAvatar
                      name={row.nombre}
                      seed={row.id}
                      kind="empresa"
                      size="sm"
                      src={row.logo_url}
                    />
                    <span className="text-ui-medium">{row.nombre}</span>
                    <LinkedInLink href={row.linkedin_url} compact />
                    {row.activo === false ? (
                      <span className="text-kicker">inactiva</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{row.web ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{row.ruc ?? "—"}</TableCell>
                <TableCell>
                  {puedeEnriquecer(row) ? (
                    <Badge variant="outline">No</Badge>
                  ) : (
                    <Badge variant="success">Sí</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <EmpresaAltaDialog
        open={altaOpen}
        enviando={enviando}
        onConfirm={(input) => void crear(input)}
        onCancel={() => setAltaOpen(false)}
      />
    </>
  )
}
