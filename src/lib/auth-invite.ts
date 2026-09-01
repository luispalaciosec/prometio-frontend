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
