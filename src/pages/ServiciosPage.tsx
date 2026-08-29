import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listServicios } from "@/lib/config-api"
import { MODELO_COBRO_LABELS, SERVICIO_ESTADO_LABELS, type Servicio } from "@/types/servicio"

export function ServiciosPage() {
  const [rows, setRows] = useState<Servicio[] | null>(null)

  useEffect(() => {
    void listServicios().then(setRows)
  }, [])

  return (
    <>
      <PageHeader
        title="Servicios"
        description="Borradores, activos y archivados. Archivar saca el servicio del catálogo que usa el cotizador."
        action={
          <Button asChild>
            <Link to="/configuracion/servicios/nuevo">Nuevo servicio</Link>
          </Button>
        }
      />
      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin servicios"
          body="Todavía no hay servicios. El wizard guarda el primero como borrador."
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/configuracion/servicios/nuevo">Nuevo servicio</Link>
            </Button>
          }
        />
      ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Modelo de cobro</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-ui-medium">{row.nombre || "Sin nombre"}</TableCell>
                <TableCell>{row.categoria ?? "—"}</TableCell>
                <TableCell>{MODELO_COBRO_LABELS[row.modelo_cobro]}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.estado === "activo"
                        ? "success"
                        : row.estado === "archivado"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {SERVICIO_ESTADO_LABELS[row.estado]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/configuracion/servicios/${row.id}`}>Abrir</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      )}
    </>
  )
}
