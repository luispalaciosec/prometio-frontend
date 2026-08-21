import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { EmpresaAltaDialog } from "@/components/empresas/EmpresaAltaDialog"
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
      <div className="mb-4 flex max-w-sm flex-col gap-2">
        <Label htmlFor="empresa-busqueda">Buscar</Label>
        <Input
          id="empresa-busqueda"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Nombre, web o RUC"
        />
      </div>
      {rows == null ? (
        <p className="text-sm text-muted-foreground">Cargando empresas…</p>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {rows.length === 0
            ? "No hay empresas todavía."
            : "Ninguna empresa coincide con la búsqueda."}
        </p>
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
                <TableCell className="font-medium">{row.nombre}</TableCell>
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
