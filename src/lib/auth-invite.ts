import type { Session } from "@supabase/supabase-js"

import { supabase } from "@/lib/supabase"

const RUTA_INVITACION = "/auth/invitacion"

export function hashAuthParams(): URLSearchParams {
  if (typeof window === "undefined") {
    return new URLSearchParams()
  }
  return new URLSearchParams(window.location.hash.replace(/^#/, ""))
}

export function esHashInvitacion(params = hashAuthParams()): boolean {
  return params.get("type") === "invite" && Boolean(params.get("access_token"))
}

export function esRutaInvitacion(pathname = window.location.pathname): boolean {
  return pathname.replace(/\/$/, "") === RUTA_INVITACION
}

/** Antes de montar React: preserva el hash y evita que ProtectedRoute mande a /login. */
export function canonicalizarRutaInvitacion(): void {
  if (typeof window === "undefined") {
    return
  }
  if (!esHashInvitacion()) {
    return
  }
  if (esRutaInvitacion()) {
    return
  }
  window.location.replace(`${RUTA_INVITACION}${window.location.hash}`)
}

/**
 * Invites de Supabase llegan en implicit grant (#access_token), pero el cliente
 * usa PKCE para Google OAuth y supabase-js rechaza ese hash en _initialize().
 * Canjeamos manualmente con setSession().
 */
export async function establecerSesionDesdeHashInvitacion(): Promise<Session | null> {
  const params = hashAuthParams()
  if (!esHashInvitacion(params)) {
    return null
  }

  const access_token = params.get("access_token")
  const refresh_token = params.get("refresh_token")
  if (!access_token || !refresh_token) {
    return null
  }

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })
  if (error || !data.session) {
    return null
  }

  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}`,
  )

  return data.session
}

export function debeEsperarProcesamientoAuth(): boolean {
  if (typeof window === "undefined") {
    return false
  }
  const path = window.location.pathname.replace(/\/$/, "") || "/"
  if (path === "/auth/callback" && new URLSearchParams(window.location.search).has("code")) {
    return true
  }
  if (path === RUTA_INVITACION && esHashInvitacion()) {
    return true
  }
  return false
}

export { RUTA_INVITACION }
