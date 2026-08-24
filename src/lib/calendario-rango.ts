import { TIPO_ACTIVIDAD_LABELS, TIPOS_ACTIVIDAD, type TipoActividad } from "@/types/actividad"
import type { EventoCalendario, VistaCalendario } from "@/types/calendario"

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromIsoDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/** Lunes de la semana (es-EC). */
export function startOfWeekMonday(date: Date): Date {
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(date, diff)
}

export function endOfWeekSunday(date: Date): Date {
  return addDays(startOfWeekMonday(date), 6)
}

export function claveFecha(fecha: string): string {
  const match = fecha.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : toIsoDate(new Date(fecha))
}

export function esTipoActividad(value: string): value is TipoActividad {
  return (TIPOS_ACTIVIDAD as readonly string[]).includes(value)
}

export function tituloEvento(evento: EventoCalendario): string {
  if (evento.tipo === "actividad") {
    return esTipoActividad(evento.tipo_actividad)
      ? TIPO_ACTIVIDAD_LABELS[evento.tipo_actividad]
      : evento.tipo_actividad
  }
  if (evento.tipo === "cumpleanos") {
    return evento.nombre_completo
  }
  return evento.numero
}

export function rangoDeVista(vista: VistaCalendario, ancla: Date): { desde: string; hasta: string } {
  if (vista === "semana") {
    return { desde: toIsoDate(startOfWeekMonday(ancla)), hasta: toIsoDate(endOfWeekSunday(ancla)) }
  }
  if (vista === "agenda") {
    return { desde: toIsoDate(startOfMonth(ancla)), hasta: toIsoDate(endOfMonth(ancla)) }
  }
  const first = startOfMonth(ancla)
  const last = endOfMonth(ancla)
  return {
    desde: toIsoDate(startOfWeekMonday(first)),
    hasta: toIsoDate(endOfWeekSunday(last)),
  }
}

export function agruparPorDia(eventos: EventoCalendario[]): Map<string, EventoCalendario[]> {
  const map = new Map<string, EventoCalendario[]>()
  for (const evento of eventos) {
    const clave = claveFecha(evento.fecha)
    const bucket = map.get(clave)
    if (bucket) {
      bucket.push(evento)
    } else {
      map.set(clave, [evento])
    }
  }
  return map
}

export type CeldaCalendario = {
  iso: string
  dia: number
  inMonth: boolean
  hoy: boolean
  eventos: EventoCalendario[]
}

export function celdasRango(desde: Date, hasta: Date, anclaMes: Date, eventos: EventoCalendario[]): CeldaCalendario[] {
  const porDia = agruparPorDia(eventos)
  const hoy = toIsoDate(new Date())
  const celdas: CeldaCalendario[] = []
  for (let cursor = desde; cursor.getTime() <= hasta.getTime(); cursor = addDays(cursor, 1)) {
    const iso = toIsoDate(cursor)
    celdas.push({
      iso,
      dia: cursor.getDate(),
      inMonth: cursor.getMonth() === anclaMes.getMonth() && cursor.getFullYear() === anclaMes.getFullYear(),
      hoy: iso === hoy,
      eventos: porDia.get(iso) ?? [],
    })
  }
  return celdas
}

export function etiquetaPeriodo(vista: VistaCalendario, ancla: Date): string {
  if (vista === "semana") {
    const desde = startOfWeekMonday(ancla)
    const hasta = endOfWeekSunday(ancla)
    const fmt = (d: Date) => d.toLocaleDateString("es-EC", { day: "numeric", month: "short" })
    return `${fmt(desde)} – ${fmt(hasta)} ${ancla.getFullYear()}`
  }
  return ancla.toLocaleDateString("es-EC", { month: "long", year: "numeric" })
}

export function moverAncla(vista: VistaCalendario, ancla: Date, direccion: -1 | 1): Date {
  if (vista === "semana") {
    return addDays(ancla, direccion * 7)
  }
  return new Date(ancla.getFullYear(), ancla.getMonth() + direccion, 1)
}

export function destinoCalendario(evento: EventoCalendario): string | null {
  if (evento.tipo === "cumpleanos") {
    return `/contactos/${evento.contacto_id}`
  }
  if (evento.tipo === "actividad" || evento.tipo === "vencimiento_cotizacion") {
    return evento.oportunidad_id ? `/pipeline/${evento.oportunidad_id}` : null
  }
  return null
}

export function claveEvento(evento: EventoCalendario): string {
  if (evento.tipo === "actividad") {
    return evento.actividad_id
  }
  if (evento.tipo === "cumpleanos") {
    return evento.contacto_id
  }
  return evento.cotizacion_id
}
