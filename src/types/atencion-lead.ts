export type EstadoSla = "a_tiempo" | "vencido" | "escalado"

export type LeadPendiente = {
  actividad_id: string
  contacto_id: string
  oportunidad_id: string | null
  contacto_nombre: string | null
  contacto_email: string | null
  contacto_telefono: string | null
  producto_interes: string | null
  responsable_id: string
  responsable_nombre: string | null
  ingreso_en: string
  /** Minutos hábiles (lun-vie, horario laboral de Ecuador) desde que entró. */
  minutos_habiles: number
  sla_minutos: number
  /** Negativo = ya se pasó de la meta. */
  minutos_restantes: number
  estado: EstadoSla
}

export type ResumenVendedorSla = {
  responsable_id: string | null
  responsable_nombre: string | null
  recibidos: number
  atendidos: number
  pendientes: number
  pendientes_vencidos: number
  atendidos_a_tiempo: number
  /** null si todavía no hay ningún lead atendido en el rango: se muestra «—», no 0. */
  pct_a_tiempo: number | null
  minutos_mediana_primer_contacto: number | null
}

export type ResumenSla = {
  desde: string
  hasta: string
  sla_minutos: number
  horario: string
  total: ResumenVendedorSla
  por_vendedor: ResumenVendedorSla[]
}
