/**
 * Fachada de la bandeja. Apunta al backend real (GET/POST /conversaciones).
 */
import { apiFetch } from "@/lib/api-client"
import type {
  ContactoConvertido,
  Conversacion,
  ConvertirConversacionInput,
  Mensaje,
} from "@/types/conversacion"

export function listConversaciones(): Promise<Conversacion[]> {
  return apiFetch("/conversaciones")
}

export function getConversacion(id: string): Promise<Conversacion> {
  return apiFetch(`/conversaciones/${id}`)
}

export function enviarMensaje(id: string, contenido: string): Promise<Mensaje> {
  return apiFetch(`/conversaciones/${id}/mensajes`, {
    method: "POST",
    body: JSON.stringify({ direccion: "saliente", contenido }),
  })
}

export function reclamarConversacion(id: string): Promise<Conversacion> {
  return apiFetch(`/conversaciones/${id}/reclamar`, { method: "POST" })
}

export function reasignarConversacion(id: string, nuevo_asignado_a: string): Promise<Conversacion> {
  return apiFetch(`/conversaciones/${id}/reasignar`, {
    method: "POST",
    body: JSON.stringify({ nuevo_asignado_a }),
  })
}

export function cerrarConversacion(id: string): Promise<Conversacion> {
  return apiFetch(`/conversaciones/${id}/cerrar`, { method: "POST" })
}

export function reabrirConversacion(id: string): Promise<Conversacion> {
  return apiFetch(`/conversaciones/${id}/reabrir`, { method: "POST" })
}

export function convertirConversacion(
  id: string,
  body: ConvertirConversacionInput,
): Promise<ContactoConvertido> {
  return apiFetch(`/conversaciones/${id}/convertir`, {
    method: "POST",
    body: JSON.stringify(body),
  })
}
