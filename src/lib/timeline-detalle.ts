/** Lectura defensiva de `detalle`: el backend no garantiza llaves ni orden. */
import { formatMoney } from "@/lib/costo-interno"
import { TIPOS_ACTIVIDAD, type TipoActividad } from "@/types/actividad"
import { CANAL_LABELS, type CanalConversacion } from "@/types/conversacion"
import type { TimelineEvento } from "@/types/timeline"

export function textoDetalle(detalle: Record<string, unknown>, key: string): string | null {
  const value = detalle[key]
  return typeof value === "string" && value.trim() !== "" ? value : null
}

function numeroDetalle(detalle: Record<string, unknown>, key: string): number | null {
  const value = detalle[key]
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function esTipoActividad(value: string | null): value is TipoActividad {
  return value != null && (TIPOS_ACTIVIDAD as readonly string[]).includes(value)
}

function esCanal(value: string | null): value is CanalConversacion {
  return value != null && value in CANAL_LABELS
}

export function resumenDetalle(row: TimelineEvento): string | null {
  const partes: string[] = []
  const empresa = textoDetalle(row.detalle, "empresa_nombre")
  const contacto = textoDetalle(row.detalle, "contacto_nombre")
  const numero = textoDetalle(row.detalle, "numero")
  const canal = textoDetalle(row.detalle, "canal")
  const tipo = textoDetalle(row.detalle, "tipo_actividad")
  const valor = numeroDetalle(row.detalle, "valor")
  const total = numeroDetalle(row.detalle, "total")
  const producto = textoDetalle(row.detalle, "producto_interes")

  if (empresa) {
    partes.push(empresa)
  }
  if (contacto) {
    partes.push(contacto)
  }
  if (numero) {
    partes.push(numero)
  }
  // El canal `formulario_web` ya lo dice la etiqueta del evento.
  if (canal && row.tipo_evento !== "formulario_web_enviado") {
    partes.push(esCanal(canal) ? CANAL_LABELS[canal] : canal)
  }
  if (producto) {
    partes.push(producto)
  }
  if (tipo && !esTipoActividad(tipo)) {
    partes.push(tipo)
  }
  if (valor != null) {
    partes.push(formatMoney(valor))
  }
  if (total != null) {
    partes.push(formatMoney(total))
  }
  return partes.length > 0 ? partes.join(" · ") : null
}
