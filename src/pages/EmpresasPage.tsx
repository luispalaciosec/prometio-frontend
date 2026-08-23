import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { TableSkeleton } from "@/components/skeleton"
import { EmpresaAltaDialog } from "@/components/empresas/EmpresaAltaDialog"
import { EntityAvatar } from "@/components/entity-avatar"
import { LinkedInLink } from "@/components/linkedin-link"
import { PageHeader } from "@/components/page-header"
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
import { createEmpresa, listEmpresas } from "@/lib/api/empresa"
import { coincideTexto } from "@/lib/lista-filtros"
import { puedeEnriquecer, type Empresa, type EmpresaCreate } from "@/types/empresa"
import { Building2 } from "lucide-react"

export function EmpresasPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Empresa[] | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [altaOpen, setAltaOpen] = useState(false)
  const [enviando, setEnviando] = useState(false)

  async function reload() {
    try {
      setRows(await listEmpresas())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar las empresas.")
      setRows([])
    }
  }

  useEffect(() => {
    void reload()
  }, [])

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
      <div className="mb-6 flex max-w-sm flex-col gap-2">
        <Label htmlFor="empresa-busqueda">Buscar</Label>
        <Input
          id="empresa-busqueda"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Nombre, web o RUC"
        />
      </div>
      {rows == null ? (
        <TableSkeleton />
      ) : filtradas.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={rows.length === 0 ? "Sin empresas" : "Nada coincide"}
          body={
            rows.length === 0
              ? "Todavía no hay empresas. Creá la primera para asociar contactos."
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
