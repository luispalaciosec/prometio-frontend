import type { TipoActividad } from "@/types/actividad"

export const TIPOS_EVENTO_CALENDARIO = ["actividad", "cumpleanos", "vencimiento_cotizacion"] as const

export type TipoEventoCalendario = (typeof TIPOS_EVENTO_CALENDARIO)[number]

export type EventoActividad = {
  tipo: "actividad"
  fecha: string
  actividad_id: string
  tipo_actividad: TipoActividad | string
  reportada: boolean
  oportunidad_id: string | null
}

export type EventoCumpleanos = {
  tipo: "cumpleanos"
  fecha: string
  contacto_id: string
  nombre_completo: string
}

export type EventoVencimientoCotizacion = {
  tipo: "vencimiento_cotizacion"
  fecha: string
  cotizacion_id: string
  numero: string
  total: number
  oportunidad_id: string | null
}

export type EventoCalendario = EventoActividad | EventoCumpleanos | EventoVencimientoCotizacion

export type CalendarioResponse = {
  desde: string
  hasta: string
  eventos: EventoCalendario[]
}

export type VistaCalendario = "mes" | "semana" | "agenda"
