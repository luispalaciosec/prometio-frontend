import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { EmptyState } from "@/components/empty-state"
import { KpiCard } from "@/components/kpi-card"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { CircleAlert, CircleCheck, ListFilter, ScrollText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listAuditoria } from "@/lib/api/auditoria"
import { listPerfiles } from "@/lib/api/perfiles"
import type { Auditoria } from "@/types/auditoria"
import type { Perfil } from "@/types/perfil"

function aIso(value: string, finDelDia: boolean): string | undefined {
  if (!value) {
    return undefined
  }
  return finDelDia ? `${value}T23:59:59` : `${value}T00:00:00`
}

function formatoFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) {
    return iso
  }
  return fecha.toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" })
}

export function AuditoriaPage() {
  const [rows, setRows] = useState<Auditoria[] | null>(null)
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [perfilId, setPerfilId] = useState("")
  const [accion, setAccion] = useState("")
  const [entidadTipo, setEntidadTipo] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  async function reload() {
    try {
      setRows(
        await listAuditoria({
          perfil_id: perfilId || undefined,
          accion: accion || undefined,
          entidad_tipo: entidadTipo || undefined,
          desde: aIso(desde, false),
          hasta: aIso(hasta, true),
        }),
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la auditoría.")
      setRows([])
    }
  }

  useEffect(() => {
    void listPerfiles()
      .then(setPerfiles)
      .catch(() => setPerfiles([]))
    void reload()
  }, [])

  const resumen = useMemo(() => {
    const lista = rows ?? []
    return {
      total: lista.length,
      exitosos: lista.filter((row) => row.resultado === "exito").length,
      conError: lista.filter((row) => row.resultado === "fallo").length,
    }
  }, [rows])

  return (
    <>
      <PageHeader
        title="Auditoría"
        description="Registro de acciones. Los conteos son sobre el resultado ya filtrado."
      />
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault()
          void reload()
        }}
      >
        <div className="filter-field">
          <Label htmlFor="aud-perfil">Usuario</Label>
          <Select value={perfilId || "all"} onValueChange={(value) => setPerfilId(value === "all" ? "" : value)}>
            <SelectTrigger id="aud-perfil">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {perfiles.map((perfil) => (
                <SelectItem key={perfil.id} value={perfil.id}>
                  {perfil.nombre_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="filter-field">
          <Label htmlFor="aud-accion">Acción</Label>
          <Input
            id="aud-accion"
            value={accion}
            onChange={(event) => setAccion(event.target.value)}
            placeholder="oportunidad.desactivar"
          />
        </div>
        <div className="filter-field">
          <Label htmlFor="aud-entidad">Entidad</Label>
          <Input
            id="aud-entidad"
            value={entidadTipo}
            onChange={(event) => setEntidadTipo(event.target.value)}
            placeholder="oportunidad"
          />
        </div>
        <div className="filter-field">
          <Label htmlFor="aud-desde">Desde</Label>
          <Input id="aud-desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
        </div>
        <div className="filter-field">
          <Label htmlFor="aud-hasta">Hasta</Label>
          <Input id="aud-hasta" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
        </div>
        <div className="filter-field sm:w-auto">
          <Button type="submit" className="w-full sm:w-auto">
            Filtrar
          </Button>
        </div>
      </form>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <KpiCard
          title="Total filtrado"
          value={resumen.total}
          icon={ListFilter}
          tone="bg-primary/15 text-primary"
        />
        <KpiCard
          title="Exitosos"
          value={resumen.exitosos}
          icon={CircleCheck}
          tone="bg-success/15 text-success"
        />
        <KpiCard
          title="Con error"
          value={resumen.conError}
          icon={CircleAlert}
          tone="bg-destructive/15 text-destructive"
        />
      </div>
      {rows == null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Sin eventos"
          body="Ningún registro de auditoría pasa esos filtros."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatoFecha(row.created_at)}
                </TableCell>
                <TableCell>
                  <p className="text-ui-medium">{row.perfil_nombre}</p>
                  {row.perfil_email ? (
                    <p className="text-kicker">{row.perfil_email}</p>
                  ) : null}
                </TableCell>
                <TableCell className="font-mono text-xs">{row.accion}</TableCell>
                <TableCell className="text-sm">
                  {row.entidad_tipo}
                  <span className="ml-1 font-mono text-xs text-muted-foreground">
                    {row.entidad_id.slice(0, 8)}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {row.ip ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={row.resultado === "exito" ? "success" : "destructive"}>
                    {row.resultado === "exito" ? "Éxito" : "Error"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}

