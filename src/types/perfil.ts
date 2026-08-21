export type Equipo = "administrativo" | "ventas" | "marketing"

export type RolVentas = "vendedor" | "supervisor"

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
