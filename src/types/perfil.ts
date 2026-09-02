export type Equipo = "administrativo" | "ventas" | "marketing" | "proveedores"

export type RolVentas = "vendedor" | "supervisor"

export const EQUIPO_LABELS: Record<Equipo, string> = {
  administrativo: "Administrativo",
  ventas: "Ventas",
  marketing: "Marketing",
  proveedores: "Analista de proveedores",
}

export const ROL_VENTAS_LABELS: Record<RolVentas, string> = {
  vendedor: "Vendedor",
  supervisor: "Supervisor",
}

export type TemaPreferido = "light" | "dark"

export type Perfil = {
  id: string
  organizacion_id: string
  nombre_completo: string
  email: string
  equipo: Equipo
  rol_ventas: RolVentas | null
  tema_preferido: TemaPreferido
  activo: boolean
  created_at: string
}

/** GET /perfiles — listado de equipo (sin email). */
export type PerfilListado = {
  id: string
  nombre_completo: string
  equipo: Equipo
  rol_ventas: RolVentas | null
  activo: boolean
}

/** GET /perfiles/{id} — detalle admin. */
export type PerfilDetalle = PerfilListado & {
  email: string
  created_at: string
}

export type InvitarPerfilInput = {
  email: string
  nombre_completo: string
  equipo: Equipo
  rol_ventas?: RolVentas | null
}

export type PerfilAdminUpdate = {
  nombre_completo?: string
  equipo?: Equipo
  rol_ventas?: RolVentas | null
}
