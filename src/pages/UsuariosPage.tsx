import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Users } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeleton"
import { ApiError } from "@/lib/api-client"
import {
  desactivarPerfil,
  getPerfilAdmin,
  invitarPerfil,
  listPerfilesAdmin,
  reactivarPerfil,
  updatePerfilAdmin,
} from "@/lib/api/perfil-admin"
import { formatDateTime } from "@/lib/datetime-local"
import { useAuthStore } from "@/store/auth-store"
import {
  EQUIPO_LABELS,
  ROL_VENTAS_LABELS,
  type Equipo,
  type PerfilDetalle,
  type PerfilListado,
  type RolVentas,
} from "@/types/perfil"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

type InvitarDraft = {
  email: string
  nombre_completo: string
  equipo: Equipo
  rol_ventas: RolVentas
}

type EditarDraft = {
  id: string
  email: string
  nombre_completo: string
  equipo: Equipo
  rol_ventas: RolVentas | null
  activo: boolean
  created_at: string
}

const emptyInvitar = (): InvitarDraft => ({
  email: "",
  nombre_completo: "",
  equipo: "ventas",
  rol_ventas: "vendedor",
})

function editarDe(row: PerfilDetalle): EditarDraft {
  return {
    id: row.id,
    email: row.email,
    nombre_completo: row.nombre_completo,
    equipo: row.equipo,
    rol_ventas: row.rol_ventas,
    activo: row.activo,
    created_at: row.created_at,
  }
}

export function UsuariosPage() {
  const perfilActual = useAuthStore((state) => state.perfil)
  const [rows, setRows] = useState<PerfilListado[] | null>(null)
  const [filtroEquipo, setFiltroEquipo] = useState<string>("all")
  const [invitarOpen, setInvitarOpen] = useState(false)
  const [invitar, setInvitar] = useState<InvitarDraft>(emptyInvitar)
  const [editarOpen, setEditarOpen] = useState(false)
  const [editar, setEditar] = useState<EditarDraft | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  async function reload() {
    setRows(
      await listPerfilesAdmin(filtroEquipo === "all" ? undefined : filtroEquipo),
    )
  }

  useEffect(() => {
    void reload().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los usuarios.")
      setRows([])
    })
  }, [filtroEquipo])

  const ordenados = useMemo(
    () =>
      rows
        ? [...rows].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo, "es"))
        : null,
    [rows],
  )

  async function abrirEditar(id: string) {
    setCargandoDetalle(true)
    try {
      const detalle = await getPerfilAdmin(id)
      setEditar(editarDe(detalle))
      setEditarOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el usuario.")
    } finally {
      setCargandoDetalle(false)
    }
  }

  async function enviarInvitacion() {
    if (!invitar.email.trim() || !invitar.nombre_completo.trim()) {
      toast.error("Email y nombre son obligatorios.")
      return
    }
    setGuardando(true)
    try {
      await invitarPerfil({
        email: invitar.email,
        nombre_completo: invitar.nombre_completo,
        equipo: invitar.equipo,
        rol_ventas: invitar.equipo === "ventas" ? invitar.rol_ventas : null,
      })
      toast.success("Invitación enviada.")
      setInvitarOpen(false)
      setInvitar(emptyInvitar())
      await reload()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.detail)
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo invitar.")
      }
    } finally {
      setGuardando(false)
    }
  }

  async function guardarEdicion() {
    if (!editar) {
      return
    }
    if (!editar.nombre_completo.trim()) {
      toast.error("El nombre es obligatorio.")
      return
    }
    setGuardando(true)
    try {
      await updatePerfilAdmin(editar.id, {
        nombre_completo: editar.nombre_completo.trim(),
        equipo: editar.equipo,
        rol_ventas: editar.equipo === "ventas" ? editar.rol_ventas ?? "vendedor" : null,
      })
      toast.success("Usuario actualizado.")
      setEditarOpen(false)
      setEditar(null)
      await reload()
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.detail)
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo guardar.")
      }
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(row: PerfilListado) {
    try {
      if (row.activo) {
        await desactivarPerfil(row.id)
        toast.success("Usuario desactivado.")
      } else {
        await reactivarPerfil(row.id)
        toast.success("Usuario reactivado.")
      }
      await reload()
      if (editar?.id === row.id) {
        const detalle = await getPerfilAdmin(row.id)
        setEditar(editarDe(detalle))
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.detail)
      } else {
        toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado.")
      }
    }
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Invitá personas nuevas y administrá equipo, rol y acceso. La invitación manda un mail de Supabase para crear contraseña."
        action={
          <Button
            onClick={() => {
              setInvitar(emptyInvitar())
              setInvitarOpen(true)
            }}
          >
            Invitar usuario
          </Button>
        }
      />

      <div className="filter-bar mb-4">
        <div className="filter-field sm:max-w-xs">
          <Label htmlFor="usuarios-equipo">Equipo</Label>
          <Select value={filtroEquipo} onValueChange={setFiltroEquipo}>
            <SelectTrigger id="usuarios-equipo">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="administrativo">Administrativo</SelectItem>
              <SelectItem value="ventas">Ventas</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {ordenados == null ? (
        <TableSkeleton />
      ) : ordenados.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin usuarios"
          body="Todavía no hay perfiles en este filtro."
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setInvitar(emptyInvitar())
                setInvitarOpen(true)
              }}
            >
              Invitar usuario
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Rol ventas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenados.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="text-ui-medium">{row.nombre_completo}</TableCell>
                <TableCell>{EQUIPO_LABELS[row.equipo]}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.rol_ventas ? ROL_VENTAS_LABELS[row.rol_ventas] : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={row.activo ? "success" : "warning"}>
                    {row.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cargandoDetalle}
                    onClick={() => void abrirEditar(row.id)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={row.id === perfilActual?.id && row.activo}
                    onClick={() => void toggleActivo(row)}
                  >
                    {row.activo ? "Desactivar" : "Reactivar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={invitarOpen} onOpenChange={setInvitarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar usuario</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invitar-email">Email</Label>
              <Input
                id="invitar-email"
                type="email"
                value={invitar.email}
                onChange={(event) =>
                  setInvitar((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invitar-nombre">Nombre completo</Label>
              <Input
                id="invitar-nombre"
                value={invitar.nombre_completo}
                onChange={(event) =>
                  setInvitar((prev) => ({ ...prev, nombre_completo: event.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invitar-equipo">Equipo</Label>
              <Select
                value={invitar.equipo}
                onValueChange={(value) =>
                  setInvitar((prev) => ({
                    ...prev,
                    equipo: value as Equipo,
                    rol_ventas: value === "ventas" ? prev.rol_ventas : "vendedor",
                  }))
                }
              >
                <SelectTrigger id="invitar-equipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="ventas">Ventas</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {invitar.equipo === "ventas" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="invitar-rol">Rol en ventas</Label>
                <Select
                  value={invitar.rol_ventas}
                  onValueChange={(value) =>
                    setInvitar((prev) => ({ ...prev, rol_ventas: value as RolVentas }))
                  }
                >
                  <SelectTrigger id="invitar-rol">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendedor">Vendedor</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvitarOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={guardando} onClick={() => void enviarInvitacion()}>
              Enviar invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editarOpen} onOpenChange={setEditarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {editar ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-kicker">Email</p>
                <p className="text-ui-medium">{editar.email}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-kicker">Alta</p>
                <p className="text-ui">{formatDateTime(editar.created_at)}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="editar-nombre">Nombre completo</Label>
                <Input
                  id="editar-nombre"
                  value={editar.nombre_completo}
                  onChange={(event) =>
                    setEditar((prev) =>
                      prev ? { ...prev, nombre_completo: event.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="editar-equipo">Equipo</Label>
                <Select
                  value={editar.equipo}
                  onValueChange={(value) =>
                    setEditar((prev) =>
                      prev
                        ? {
                            ...prev,
                            equipo: value as Equipo,
                            rol_ventas: value === "ventas" ? prev.rol_ventas ?? "vendedor" : null,
                          }
                        : prev,
                    )
                  }
                >
                  <SelectTrigger id="editar-equipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="ventas">Ventas</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editar.equipo === "ventas" ? (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="editar-rol">Rol en ventas</Label>
                  <Select
                    value={editar.rol_ventas ?? "vendedor"}
                    onValueChange={(value) =>
                      setEditar((prev) =>
                        prev ? { ...prev, rol_ventas: value as RolVentas } : prev,
                      )
                    }
                  >
                    <SelectTrigger id="editar-rol">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditarOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={guardando || !editar} onClick={() => void guardarEdicion()}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
