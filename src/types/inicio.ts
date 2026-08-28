import type { Actividad } from "./actividad"
import type { Alerta } from "./alerta"
import type { CotizacionConLineas } from "./cotizacion"
import type { MetasComerciales } from "./dashboard"

export type Inicio = {
  generado_en: string
  dias_ventana: number
  actividades_proximas: Actividad[]
  cotizaciones_por_vencer: CotizacionConLineas[]
  alertas: Alerta[]
  metas: MetasComerciales
}
