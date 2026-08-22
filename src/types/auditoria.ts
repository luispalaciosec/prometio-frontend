export type AuditoriaResultado = "exito" | "fallo"

export type Auditoria = {
  id: string
  perfil_id: string
  perfil_nombre: string
  perfil_email: string | null
  accion: string
  entidad_tipo: string
  entidad_id: string
  resultado: AuditoriaResultado
  ip: string | null
  detalle: Record<string, unknown>
  created_at: string
}

export type ListAuditoriaQuery = {
  perfil_id?: string
  accion?: string
  entidad_tipo?: string
  desde?: string
  hasta?: string
}
